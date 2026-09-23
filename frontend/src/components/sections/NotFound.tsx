import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Compass } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { featuredProjects } from "@/components/sections/Projects";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The site's only reachable 404. `vercel.json` rewrites every path to
 * `index.html`, so a mistyped or stale URL never hits the host's own error
 * page - it arrives here, and without this route the visitor would be left
 * looking at an empty dark document with no way back.
 */
export function NotFound() {
  const reduced = useReducedMotion();
  // Reads the cache the layout already filled, so this costs no request -
  // and it keeps the second CTA from pointing at a Work section that is not
  // going to render.
  const { data } = usePortfolio();
  const hasProjects = featuredProjects(data.projects).length > 0;

  return (
    <section className="section-aura relative flex min-h-screen items-center overflow-hidden px-6 py-28 sm:px-10">
      <div className="relative mx-auto w-full max-w-2xl">
        <motion.div
          animate={reduced ? undefined : { y: [0, -9, 0] }}
          transition={reduced ? undefined : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <TiltCard strength={4} glare>
            <div className="glass-panel rounded-[1.75rem] p-7 sm:p-10">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-scope">
                <Compass className="h-3.5 w-3.5" /> 404
              </p>
              <h1 className="mt-4 font-display text-4xl text-bone sm:text-5xl">This page doesn't exist.</h1>
              <p className="mt-5 max-w-lg font-body text-lg leading-relaxed text-bone-dim">
                The link may be out of date, or the address has a typo in it. Everything on this site is reachable
                from the home page.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/"
                  className="rounded-full bg-scope px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-ink-950 transition-colors duration-300 hover:bg-scope-bright focus:outline-none focus-visible:ring-2 focus-visible:ring-scope"
                >
                  Back to home
                </Link>
                {hasProjects && (
                  <Link
                    to="/#work"
                    className="rounded-full border border-ink-600 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-bone-dim transition-colors duration-300 hover:border-bone-dim hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-scope"
                  >
                    See the work
                  </Link>
                )}
              </div>
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
}
