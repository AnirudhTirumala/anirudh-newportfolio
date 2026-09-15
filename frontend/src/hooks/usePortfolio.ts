import { useQuery } from "@tanstack/react-query";
import { getPortfolio, getProject, getProjects } from "@/api/endpoints";
import { FALLBACK_PORTFOLIO, FALLBACK_PROJECTS, findFallbackProject } from "@/data/fallback";
import type { Portfolio, Project } from "@/types";

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
    queryKey: ["portfolio"],
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
    staleTime: 60_000,
  });
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      try {
        return await getProjects();
      } catch {
        return FALLBACK_PROJECTS;
      }
    },
    initialData: FALLBACK_PROJECTS,
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
  });
}

export function useProject(slug: string | undefined) {
  return useQuery<Project | undefined>({
    queryKey: ["project", slug],
    queryFn: async () => {
      if (!slug) return undefined;
      try {
        return await getProject(slug);
      } catch {
        return findFallbackProject(slug);
      }
    },
    initialData: () => (slug ? findFallbackProject(slug) : undefined),
    initialDataUpdatedAt: 0,
    enabled: Boolean(slug),
  });
}
