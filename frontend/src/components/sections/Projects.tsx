import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, ExternalLink, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DashboardPreview } from "@/components/ui/DashboardPreview";
import { TiltCard } from "@/components/ui/TiltCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { safeExternalUrl } from "@/lib/urls";
import type { Project } from "@/types";

const PROJECT_HIGHLIGHTS: Record<string, string[]> = {
  "janseva-connect": ["Multilingual AI assistant for citizen questions", "Secure role-based services for citizens and staff", "Responsive React dashboard backed by REST APIs"],
  "lumpy-skin-disease-detection": ["YOLO-based image detection for cattle health", "Field-photo scanning with clear demo results", "Dedicated views for farmers, veterinarians and admins"],
};

function projectHighlights(project: Project): string[] {
  const known = PROJECT_HIGHLIGHTS[project.slug];
  if (known) return known;

  // New projects created from Admin still get useful card points without
  // requiring a separate field. Prefer full-description sentences, then
  // fall back to a concise tech-led summary.
  const sentences = project.description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
  return sentences.length > 0 ? sentences : project.tech_stack.slice(0, 3).map((tech) => `Built with ${tech}`);
}

export function Projects({ projects }: { projects?: Project[] }) {
  const reduced = useReducedMotion();
  if (!projects || projects.length === 0) return null;

  return (
    <section id="work" className="border-t border-ink-700 px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-sm text-scope">Selected Work</p>
        <p className="mt-2 max-w-xl font-body text-base text-bone-dim">Project context on the left, dashboard preview on the right. Open a preview to try the in-portfolio demo.</p>

        <div className="mt-12 flex flex-col gap-10">
          {projects.map((project, index) => {
            const accent = project.dashboard_key === "janseva" ? "signal" : "scope";
            const liveUrl = safeExternalUrl(project.live_url);
            const highlights = projectHighlights(project);

            return (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
              >
                <motion.div
                  animate={reduced ? undefined : { y: [0, -8, 0] }}
                  transition={reduced ? undefined : { duration: 6 + index * 0.55, repeat: Infinity, ease: "easeInOut" }}
                >
                  <TiltCard strength={4.5} glare>
                    <div className="glass-panel grid overflow-hidden rounded-[1.8rem] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      <div className="flex flex-col p-7 sm:p-9">
                        {project.cover_note && <p className="font-mono text-xs text-bone-faint">{project.cover_note}</p>}
                        <h3 className="mt-3 font-display text-2xl text-bone sm:text-3xl">
                          <Link to={`/projects/${project.slug}`} className="transition-colors hover:text-scope focus:outline-none focus-visible:text-scope">
                            {project.title}
                          </Link>
                        </h3>
                        <p className="mt-4 font-body text-base leading-relaxed text-bone-dim">{project.summary}</p>

                        {highlights.length > 0 && (
                          <ul className="mt-6 space-y-2.5">
                            {highlights.map((highlight) => (
                              <li key={highlight} className="flex gap-2.5 font-body text-sm leading-relaxed text-bone-dim">
                                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${accent === "signal" ? "bg-signal" : "bg-scope"}`} aria-hidden="true" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-7 flex flex-wrap gap-2">
                          {project.tech_stack.map((tech) => (
                            <Badge key={tech} tone={accent}>{tech}</Badge>
                          ))}
                        </div>

                        <div className="mt-8">
                          <Link
                            to={`/projects/${project.slug}`}
                            className="group inline-flex items-center gap-2 rounded-full bg-scope px-4 py-2.5 font-display text-xs tracking-[0.1em] text-ink-950 transition-transform hover:-translate-y-0.5 hover:bg-scope-bright focus:outline-none focus-visible:ring-2 focus-visible:ring-scope"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> OPEN INTERACTIVE DEMO
                          </Link>
                          {liveUrl && (
                            <div className="mt-4">
                              <p className="flex items-center gap-2 font-body text-sm text-bone-dim">
                                <Sparkles className="h-3.5 w-3.5 shrink-0 text-signal" aria-hidden="true" />
                                For the best experience, open the live project.
                              </p>
                              <a
                                href={liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="group mt-3 inline-flex items-center gap-2 rounded-full border border-scope/45 bg-scope/10 px-4 py-2.5 font-display text-xs tracking-[0.1em] text-scope-bright transition-all hover:-translate-y-0.5 hover:border-scope hover:bg-scope/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-scope"
                              >
                                OPEN LIVE PROJECT <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/projects/${project.slug}`}
                        aria-label={`Open the ${project.title} interactive demo`}
                        className="group/preview relative block min-h-[21rem] overflow-hidden border-t border-bone/10 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-scope md:min-h-0 md:border-l md:border-t-0 sm:p-6"
                      >
                        <DashboardPreview dashboardKey={project.dashboard_key} className="transition-transform duration-500 ease-out group-hover/preview:scale-[1.025]" />
                        <span className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-ink-950/70 via-transparent to-transparent p-7 opacity-0 transition-opacity duration-300 group-hover/preview:opacity-100">
                          <span className="inline-flex items-center gap-2 rounded-full bg-ink-950/85 px-4 py-2 font-display text-xs tracking-[0.1em] text-bone backdrop-blur-sm">
                            TRY THE DEMO <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </span>
                      </Link>
                    </div>
                  </TiltCard>
                </motion.div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
