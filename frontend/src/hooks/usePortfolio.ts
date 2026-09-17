import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPortfolio, getPortfolioRevision } from "@/api/endpoints";
import { FALLBACK_PORTFOLIO } from "@/data/fallback";
import { subscribeToPortfolioChanges } from "@/lib/portfolioSync";
import type { Portfolio } from "@/types";

export const PORTFOLIO_QUERY_KEY = ["portfolio"] as const;
const REVISION_CHECK_INTERVAL_MS = 60_000;

/**
 * This site is meant to work two ways: with its FastAPI backend live (so the
 * admin panel can edit real content), and as a plain static export with no
 * backend at all. Rather than surface a "couldn't reach the API" screen in
 * the second case, every public read here falls back to the bundled content
 * in `data/fallback.ts`. The admin editors under `pages/admin/*` deliberately
 * do NOT use these - they call the API layer directly, so a real failure
 * there still surfaces as a real error to the signed-in owner.
 */

export function usePortfolio() {
  return useQuery<Portfolio>({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: async () => {
      try {
        return await getPortfolio();
      } catch {
        return FALLBACK_PORTFOLIO;
      }
    },
    // Render the bundled portfolio immediately, then refresh it quietly in
    // the background when an API is available. This avoids a blank spinner
    // during a slow mobile connection or a waking server.
    initialData: FALLBACK_PORTFOLIO,
    initialDataUpdatedAt: 0,
    // Full data is refreshed only after a content-change signal or a changed
    // lightweight revision. Keeping it fresh across route changes avoids
    // duplicate aggregate requests from the shared layout and page.
    staleTime: 5 * 60_000,
  });
}

/**
 * Keeps content current without repeatedly downloading the aggregate
 * portfolio. Admin writes broadcast immediately to same-origin tabs; other
 * open visitors validate only the tiny revision endpoint once per visible
 * minute and fetch the aggregate only when it has actually changed.
 */
export function PortfolioCacheSync() {
  const queryClient = useQueryClient();
  const { data: portfolio } = useQuery<Portfolio>({
    queryKey: PORTFOLIO_QUERY_KEY,
    enabled: false,
  });
  const revisionRef = useRef<string | null>(null);

  useEffect(() => {
    if (portfolio?.profile.updated_at) revisionRef.current = portfolio.profile.updated_at;
  }, [portfolio?.profile.updated_at]);

  const refreshIfChanged = useCallback(async () => {
    if (document.visibilityState !== "visible") return;

    try {
      const { revision } = await getPortfolioRevision();
      const previousRevision = revisionRef.current;
      revisionRef.current = revision;
      if (previousRevision && previousRevision !== revision) {
        await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      }
    } catch {
      // The page is still usable from the bundled fallback while Render wakes.
      // The next visible-tab check retries rather than creating a retry loop.
    }
  }, [queryClient]);

  useEffect(() => subscribeToPortfolioChanges(() => {
    void queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
  }), [queryClient]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshIfChanged();
    };
    const interval = window.setInterval(() => void refreshIfChanged(), REVISION_CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshIfChanged]);

  return null;
}
