import { Suspense, lazy } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ExternalLink, Github } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Badge } from "@/components/ui/Badge";
import { PageSpinner } from "@/components/ui/Feedback";
import { BrowserFrame } from "@/components/ui/BrowserFrame";
import { DASHBOARD_URLS } from "@/data/dashboardMeta";
import { cn } from "@/lib/utils";
import { safeExternalUrl } from "@/lib/urls";

// The dashboard bundles are intentionally deferred: visitors who only view
// the portfolio home page should not download two full demo applications.
const LumpyDashboard = lazy(() => import("@/components/dashboards/LumpyDashboard").then((module) => ({ default: module.LumpyDashboard })));
const JanSevaDashboard = lazy(() => import("@/components/dashboards/JanSevaDashboard").then((module) => ({ default: module.JanSevaDashboard })));

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  // SiteLayout already reads the aggregate portfolio for the shared navbar
  // and footer. Reuse that cached project instead of making a second request.
  const { data: portfolio, isLoading, isFetching, isUsingFallback, refetch } = usePortfolio();
  const project = portfolio.projects.find((entry) => entry.slug === slug);

  if (isLoading) return <PageSpinner />;

  if (!project) {
    // While the API is unreachable this list is the bundled fallback, which
    // cannot contain a project the owner added since - so a missing slug
    // means "not loaded", not "does not exist". Treating the two as one
    // turned every project page into a 404 for the length of an outage.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        {isUsingFallback ? (
          <>
            <p className="font-display text-xl text-bone">Couldn't load this project</p>
            <p className="max-w-sm font-body text-sm text-bone-dim">
              The server didn't respond. The project may well be there — try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-4 py-2 font-display text-sm text-bone transition-colors hover:border-scope hover:text-scope disabled:opacity-50"
            >
              {isFetching ? "Retrying…" : "Try again"}
            </button>
          </>
        ) : (
          <p className="font-display text-xl text-bone">Project not found</p>
        )}
        <Link to="/" className="text-sm text-scope hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const accent = project.dashboard_key === "janseva" ? "signal" : "scope";
  const Dashboard = project.dashboard_key === "lumpy" ? LumpyDashboard : project.dashboard_key === "janseva" ? JanSevaDashboard : null;
  const githubUrl = safeExternalUrl(project.github_url);
  const liveUrl = safeExternalUrl(project.live_url);

  return (
    <article className="px-6 pb-28 pt-36 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/#work" className="font-mono text-xs text-bone-faint hover:text-bone-dim">
          ← Back to work
        </Link>

        {project.cover_note && (
          <p className={cn("mt-6 font-mono text-xs", accent === "signal" ? "text-signal" : "text-scope")}>
            {project.cover_note}
          </p>
        )}
        <h1 className="mt-3 font-display text-4xl text-bone sm:text-5xl">{project.title}</h1>
        <p className="mt-6 max-w-2xl font-body text-lg text-bone-dim">{project.description || project.summary}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {project.tech_stack.map((tech) => (
            <Badge key={tech} tone={accent}>
              {tech}
            </Badge>
          ))}
        </div>

        {/* The live link lives here rather than beside the demo: it used to
            render only inside the dashboard block, so a project with no
            bundled demo - which is every project created from Admin - showed
            no live link at all however carefully its Live URL was filled in. */}
        {(liveUrl || githubUrl) && (
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-scope/50 bg-scope/10 px-4 py-2 font-display text-sm text-scope transition-all hover:-translate-y-0.5 hover:border-scope hover:bg-scope/20 hover:text-scope-bright"
              >
                Open live project <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-bone-dim hover:text-bone"
              >
                <Github className="h-4 w-4" /> Source
              </a>
            )}
          </div>
        )}
      </div>

      {Dashboard && (
        <div className="mx-auto mt-16 max-w-6xl border-t border-ink-700 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-display text-sm text-bone-dim">Try it in this portfolio</p>
              <h2 className="mt-2 font-display text-2xl text-bone">Interactive dashboard demo</h2>
            </div>
            <div className="flex max-w-sm flex-col items-end gap-2 text-right">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bone-faint">
                Interactive demo · sample data
              </p>
              {liveUrl && (
                <p className="font-body text-xs text-bone-faint">
                  For the best experience, use the live project linked at the top.
                </p>
              )}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mt-10"
          >
            <BrowserFrame url={DASHBOARD_URLS[project.dashboard_key] ?? "app.example.com"}>
              <Suspense
                fallback={
                  <div className="grid min-h-96 place-items-center bg-ink-900 font-mono text-xs uppercase tracking-[0.14em] text-bone-faint" aria-busy="true">
                    Loading interactive demo…
                  </div>
                }
              >
                <Dashboard />
              </Suspense>
            </BrowserFrame>
          </motion.div>
        </div>
      )}
    </article>
  );
}
