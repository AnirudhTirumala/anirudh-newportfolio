import { useCallback, useEffect, useRef } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPortfolio, getPortfolioRevision } from "@/api/endpoints";
import { FALLBACK_PORTFOLIO } from "@/data/fallback";
import { subscribeToPortfolioChanges } from "@/lib/portfolioSync";
import type { Portfolio } from "@/types";

export const PORTFOLIO_QUERY_KEY = ["portfolio"] as const;
const REVISION_CHECK_INTERVAL_MS = 20_000;

/**
 * This site is meant to work two ways: with its FastAPI backend live (so the
 * admin panel can edit real content), and as a plain static export with no
 * backend at all. Rather than surface a "couldn't reach the API" screen in
 * the second case, every public read here falls back to the bundled content
 * in `data/fallback.ts`. The admin editors under `pages/admin/*` deliberately
 * do NOT use these - they call the API layer directly, so a real failure
 * there still surfaces as a real error to the signed-in owner.
 */

/**
 * Every observer of this query key MUST be built from this one object.
 *
 * React Query keeps a single set of options per query, and the last observer
 * to render wins. A second `useQuery(PORTFOLIO_QUERY_KEY)` declared with a
 * partial option set therefore silently overwrites the real one - which is
 * exactly what used to happen here: a cache-sync component observed this key
 * with `{ enabled: false }` and no `queryFn`, wiping the fetcher off the
 * shared query. Every `invalidateQueries(["portfolio"])` after an admin save
 * then failed with "No queryFn was passed as an option", so saved edits never
 * reached the public page and the production build never fetched at all.
 */
export const portfolioQueryOptions = queryOptions<Portfolio>({
  queryKey: PORTFOLIO_QUERY_KEY,
  // Deliberately lets a failure reject instead of resolving with the bundled
  // content. Returning the fallback here wrote it into the cache, so a single
  // failed background refetch replaced real, already-loaded content with the
  // bundled seed text - and marked it fresh for the next five minutes. The
  // fallback is now applied at read time in `usePortfolio` instead, which
  // leaves the last good payload in the cache and makes `isError` meaningful.
  queryFn: getPortfolio,
  // `placeholderData` (not `initialData`) is the right tool here: it renders
  // the bundled portfolio instantly without ever being written to the cache,
  // so the query is still considered to have no data and fetches on mount.
  // The previous `initialData` + `initialDataUpdatedAt: 0` pairing seeded the
  // cache with fallback content, which could satisfy `staleTime` and leave a
  // visitor looking at bundled text while the live API sat there unqueried.
  placeholderData: FALLBACK_PORTFOLIO,
  // Content only moves when the owner saves something, and both of those
  // paths (same-tab broadcast, cross-tab revision check) invalidate this key
  // explicitly. A long stale time just avoids duplicate aggregate requests
  // from the shared layout and the page rendering together.
  staleTime: 5 * 60_000,
});

export function usePortfolio() {
  const query = useQuery(portfolioQueryOptions);

  return {
    ...query,
    // Always renderable: the bundled content stands in whenever there is no
    // live payload yet (or the API is unreachable), which is what makes the
    // backend-less static deployment work.
    data: query.data ?? FALLBACK_PORTFOLIO,
    /** True while the visitor is looking at bundled content rather than
     * anything the API returned. */
    isUsingFallback: query.data === undefined,
  };
}

/**
 * Applies an admin save to this tab immediately.
 *
 * Mounted at the application root rather than inside the public layout, so it
 * is listening while the owner is in `/admin` too. Without it, saving on
 * `/admin` and then clicking back to the site showed the pre-save content:
 * the cached aggregate was still inside its `staleTime` window, so mounting
 * the public page did not refetch.
 */
export function PortfolioChangeListener() {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeToPortfolioChanges(() => {
        void queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      }),
    [queryClient],
  );

  return null;
}

/**
 * Keeps an already-open public tab current without repeatedly downloading the
 * aggregate portfolio. Visitors validate only the tiny revision endpoint while
 * the tab is visible, and fetch the full payload only when that marker has
 * actually moved.
 */
export function PortfolioCacheSync() {
  const queryClient = useQueryClient();
  const revisionRef = useRef<string | null>(null);

  const refreshIfChanged = useCallback(async () => {
    if (document.visibilityState !== "visible") return;

    try {
      const { revision } = await getPortfolioRevision();
      const previousRevision = revisionRef.current;
      revisionRef.current = revision;
      // The first successful check only establishes a baseline. Anything
      // after that which differs means the owner saved something.
      if (previousRevision && previousRevision !== revision) {
        await queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY });
      }
    } catch {
      // The page is still usable from the bundled fallback while Render wakes.
      // The next visible-tab check retries rather than creating a retry loop.
    }
  }, [queryClient]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshIfChanged();
    };
    // Establish the baseline right away instead of waiting a full interval,
    // so the first real change is caught one tick after it happens.
    void refreshIfChanged();
    const interval = window.setInterval(() => void refreshIfChanged(), REVISION_CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshIfChanged]);

  return null;
}
