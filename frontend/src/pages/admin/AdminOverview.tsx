import { Link } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLumpyStats } from "@/hooks/useLumpyDashboard";
import { useServiceRequests } from "@/hooks/useJanSevaDashboard";
import { apiErrorMessage } from "@/api/client";
import { LoadError, Spinner } from "@/components/ui/Feedback";
import type { DashboardKey } from "@/types";

interface OverviewCard {
  label: string;
  value: number | string;
  /** Left undefined for a card that has nowhere useful to go yet, so it
   * renders as plain text rather than promising a drill-down. */
  to?: string;
}

const CARD_CLASSES = "border border-ink-700 p-5";

export default function AdminOverview() {
  const { data, isError, error, isPlaceholderData, isFetching, refetch } = usePortfolio();
  const { data: lumpyStats } = useLumpyStats();
  const { data: requests } = useServiceRequests();

  // `usePortfolio` always hands back something renderable - the content
  // bundled into the build stands in whenever the API has not answered. On
  // this screen that is a liability rather than a feature: the one page meant
  // to confirm "my save landed" would report the bundled counts as if they
  // were live. Only a real payload is allowed to produce a number here.
  const live = isError || isPlaceholderData ? null : data;

  function demoProjectPath(key: DashboardKey): string | undefined {
    const slug = live?.projects.find((project) => project.dashboard_key === key)?.slug;
    return slug ? `/projects/${slug}` : undefined;
  }

  const cards: OverviewCard[] = [
    { label: "Projects", value: live?.projects.length ?? "—", to: "/admin/projects" },
    { label: "Experience entries", value: live?.experiences.length ?? "—", to: "/admin/experience" },
    { label: "Skill categories", value: live?.skill_categories.length ?? "—", to: "/admin/skills" },
    { label: "Education entries", value: live?.education.length ?? "—", to: "/admin/credentials" },
    { label: "Certificates", value: live?.certificates.length ?? "—", to: "/admin/credentials" },
    { label: "Lumpy scans logged", value: lumpyStats?.total_scans ?? "—", to: demoProjectPath("lumpy") },
    { label: "JanSeva requests", value: requests?.length ?? "—", to: demoProjectPath("janseva") },
  ];

  return (
    <div>
      <p className="font-display text-sm text-scope">Overview</p>
      <h1 className="mt-2 font-display text-3xl text-bone">Welcome back</h1>
      <p className="mt-2 max-w-xl text-sm text-bone-dim">
        Everything here edits the live site directly — changes show up as soon as you save.
      </p>

      {isError ? (
        <div className="mt-10">
          <LoadError message={apiErrorMessage(error)} onRetry={() => refetch()} isRetrying={isFetching} />
        </div>
      ) : (
        <>
          {isPlaceholderData && (
            <p className="mt-6 flex items-center gap-2 font-mono text-xs text-bone-faint">
              <Spinner className="h-3.5 w-3.5" /> Loading your current content…
            </p>
          )}

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {cards.map((card) =>
              card.to ? (
                <Link key={card.label} to={card.to} className={`${CARD_CLASSES} transition-colors hover:border-scope/60`}>
                  <p className="font-display text-2xl text-bone">{card.value}</p>
                  <p className="mt-1 text-xs text-bone-faint">{card.label}</p>
                </Link>
              ) : (
                <div key={card.label} className={CARD_CLASSES}>
                  <p className="font-display text-2xl text-bone">{card.value}</p>
                  <p className="mt-1 text-xs text-bone-faint">{card.label}</p>
                </div>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
