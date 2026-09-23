import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, ExternalLink, Play, Sparkles } from "lucide-react";
import { DashboardPreview } from "@/components/ui/DashboardPreview";
import { TiltCard } from "@/components/ui/TiltCard";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { HeadingChip, SectionHeading } from "@/components/ui/SectionHeading";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { safeExternalUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

type Accent = "scope" | "signal";

const PROJECT_HIGHLIGHTS: Record<string, string[]> = {
  "janseva-connect": ["Multilingual AI assistant for citizen questions", "Secure role-based services for citizens and staff", "Responsive React dashboard backed by REST APIs"],
  "lumpy-skin-disease-detection": ["YOLO-based image detection for cattle health", "Field-photo scanning with clear demo results", "Dedicated views for farmers, veterinarians and admins"],
};

function projectHighlights(project: Project): string[] {
  // The saved description always wins. It used to lose to the table above for
  // the two seeded slugs, so rewriting either project's description in Admin
  // changed nothing on its card and read exactly like a failed save.
  const sentences = project.description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
  if (sentences.length > 0) return sentences;

  // Nothing written yet: keep the known points for the seeded projects, and
  // give anything else a concise tech-led summary rather than a blank card.
  return PROJECT_HIGHLIGHTS[project.slug] ?? project.tech_stack.slice(0, 3).map((tech) => `Built with ${tech}`);
}

/**
 * The home page lists only what the owner marked as featured. The navbar and
 * the hero CTA need the same answer so they never advertise a "Work" section
 * that this component is about to decline to render.
 */
export function featuredProjects(projects?: Project[]): Project[] {
  return (projects ?? []).filter((project) => project.featured);
}

/**
 * How far each part of a card stands off its own back plate, inside the card's
 * local 3D space.
 *
 * These are not decoration. The card turns under the pointer, and a layer's
 * distance is exactly what decides how far it swings against the layer behind
 * it - so the ladder runs shallow through the reading matter and deep at the
 * preview, and the screen parts company with the write-up the moment the card
 * moves. A card that only tilted as one rigid plate would still be a picture
 * of a card.
 *
 * Every value is roughly halved below `md`. Perspective magnifies a layer the
 * further forward it stands, and on a phone the card already runs to within a
 * thumb's width of both screen edges with no pointer to tilt it: depth there
 * buys no parallax and only pushes a layer's own corners past the panel it is
 * supposed to belong to.
 */
const LAYER = {
  header: "[transform:translateZ(4px)] md:[transform:translateZ(10px)]",
  title: "[transform:translateZ(12px)] md:[transform:translateZ(26px)]",
  lede: "[transform:translateZ(8px)] md:[transform:translateZ(17px)]",
  notes: "[transform:translateZ(5px)] md:[transform:translateZ(11px)]",
  stack: "[transform:translateZ(9px)] md:[transform:translateZ(19px)]",
  actions:
    "transition-transform duration-500 ease-out [transform:translateZ(15px)] md:[transform:translateZ(30px)] md:group-hover:[transform:translateZ(38px)]",
  /** The screen itself, and the deepest thing on the card by a clear margin. */
  preview:
    "transition-transform duration-500 ease-out [transform:translateZ(24px)] md:[transform:translateZ(38px)] md:group-hover:[transform:translateZ(46px)]",
  /** The detection box, standing off the screen it is drawn around. */
  frame:
    "transition-transform duration-500 ease-out [transform:translateZ(11px)] group-hover/preview:[transform:translateZ(18px)_scale(0.985)]",
} as const;

/**
 * The bounding box the vision model actually draws, borrowed as a frame for
 * the preview.
 *
 * Four corner marks rather than a closed rectangle: a full border would only
 * read as a second card edge around a card that already has one, while the
 * corners read as a box locked onto the screen inside them. They stand a
 * further step forward of the screen, so the card's tilt slides them across it
 * the way a reticle slides across the thing it is tracking, and they tighten
 * inward on hover, which is the one moment the visitor is aiming at it.
 */
function PreviewFrame({ accent }: { accent: Accent }) {
  const edge = accent === "signal" ? "border-signal/60" : "border-scope/60";
  return (
    <span aria-hidden="true" className={cn("pointer-events-none absolute -inset-2 sm:-inset-3", LAYER.frame)}>
      <span className={cn("absolute left-0 top-0 h-5 w-5 border-l border-t", edge)} />
      <span className={cn("absolute right-0 top-0 h-5 w-5 border-r border-t", edge)} />
      <span className={cn("absolute bottom-0 left-0 h-5 w-5 border-b border-l", edge)} />
      <span className={cn("absolute bottom-0 right-0 h-5 w-5 border-b border-r", edge)} />
    </span>
  );
}

/**
 * The lit edge of the screen's own thickness.
 *
 * It is a slightly oversized plate parked a little way *behind* the preview,
 * so head-on it hides almost entirely behind it and all you see is a hairline.
 * The instant the card turns, the two planes stop agreeing and the plate
 * emerges along whichever edge is swinging away - which is precisely what the
 * side of a real panel does when it catches the light. Nothing here reacts to
 * the pointer; the effect is produced by the geometry alone, which is why it
 * also plays during the card's idle drift.
 */
function PreviewBezel({ accent }: { accent: Accent }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -inset-[5px] rounded-[1.5rem] [transform:translateZ(-14px)]",
        accent === "signal"
          ? "bg-[linear-gradient(135deg,rgba(255,181,158,0.55),rgba(255,118,77,0.18)_45%,rgba(0,0,0,0)_78%)]"
          : "bg-[linear-gradient(135deg,rgba(241,248,255,0.6),rgba(199,228,255,0.2)_45%,rgba(0,0,0,0)_78%)]",
      )}
    />
  );
}

/**
 * A single band of light travelling across the glass on hover. Transform and
 * opacity only, and clipped to the screen, so it costs a composited layer and
 * nothing per frame.
 */
function PreviewSheen() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.35rem]">
      <span className="absolute -inset-y-[45%] left-0 w-1/4 -translate-x-[220%] rotate-[18deg] bg-gradient-to-r from-transparent via-bone-bright/20 to-transparent transition-transform duration-[1200ms] ease-out group-hover/preview:translate-x-[460%]" />
    </span>
  );
}

/**
 * A ruled edge down the seam between the write-up and the preview. Minor ticks
 * every 9px with a longer one every 45px, drawn as two stacked gradients so it
 * costs one element rather than forty. It is what turns the divider between
 * the two halves of the card into a measured edge, and it sits a hair off the
 * back plate so it reads as machined into the panel rather than printed on it.
 */
function CalibrationEdge({ accent }: { accent: Accent }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-8 left-0 w-2.5 [transform:translateZ(6px)]",
        accent === "signal" ? "text-signal/40" : "text-scope/40",
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 9px), repeating-linear-gradient(to bottom, currentColor 0 1px, transparent 1px 45px)",
        backgroundSize: "4px 100%, 10px 100%",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}

export function Projects({ projects }: { projects?: Project[] }) {
  const reduced = useReducedMotion();
  const featured = featuredProjects(projects);
  if (featured.length === 0) return null;

  return (
    <section id="work" className="relative scroll-mt-24 overflow-hidden border-t border-ink-700/60 px-6 py-28 sm:px-10">
      {/* The section is far taller than it is wide, so the field runs at fine
          density - at normal density its grid would be scaled up to squares
          the size of a paragraph. Its plotted marks are off for the same
          reason; the bounding boxes here are drawn around the previews, where
          they mean something. */}
      <InstrumentField className="opacity-[0.45]" marks={false} />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[32rem] w-[32rem] bloom [--bloom:color-mix(in_srgb,var(--color-scope)_8.8%,transparent)]" />
      <div className="pointer-events-none absolute -right-40 bottom-1/4 h-[28rem] w-[28rem] bloom [--bloom:color-mix(in_srgb,var(--color-signal)_7.2%,transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          index="03"
          label="Selected Work"
          title="Built to be opened, not just described."
          description="Each project shows its context alongside the dashboard it produced. Open a preview to try the in-portfolio demo."
          aside={<HeadingChip>{String(featured.length).padStart(2, "0")} FEATURED</HeadingChip>}
        />

        <div className="mt-14 flex flex-col gap-12">
          {featured.map((project, index) => {
            const accent: Accent = project.dashboard_key === "janseva" ? "signal" : "scope";
            const liveUrl = safeExternalUrl(project.live_url);
            const highlights = projectHighlights(project);
            // Only the two bundled dashboards have a demo to open. A project
            // added from Admin defaults to none, and promising it a demo made
            // its card advertise something its page cannot show.
            const hasDemo = project.dashboard_key !== "none";
            const ordinal = String(index + 1).padStart(2, "0");

            return (
              <motion.article
                key={project.id}
                // The card arrives as an object taking up a position rather
                // than as a picture fading up: it is further away, pitched
                // back, and swings level as it comes forward. The perspective
                // has to be stated here because this element is above the one
                // TiltCard establishes.
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 46, rotateX: 9, scale: 0.965 }}
                whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: reduced ? 0.4 : 0.85, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={reduced ? undefined : { transformPerspective: 1600 }}
              >
                <motion.div
                  // A slow roll as well as a rise. Left on the vertical alone
                  // the card bobbed like a sprite; turning a degree either way
                  // is what keeps the layers inside it sliding against each
                  // other, so the preview catches its lit edge even when
                  // nobody is pointing at the card.
                  animate={reduced ? undefined : { y: [0, -9, 0], rotateX: [0, 0.7, 0], rotateY: [-0.9, 0.9, -0.9] }}
                  transition={reduced ? undefined : { duration: 8.5 + index * 0.9, repeat: Infinity, ease: "easeInOut" }}
                  style={reduced ? undefined : { transformPerspective: 1800, transformStyle: "preserve-3d" }}
                >
                  <TiltCard strength={6} glare>
                    {/* The card is a stack of plates standing in one space, not
                        a single painted panel. Its glass ground is a separate
                        layer below because any `overflow` on this element would
                        force the whole subtree flat and collapse the ladder. */}
                    <div className="relative transform-3d">
                      <span aria-hidden="true" className="glass-panel pointer-events-none absolute inset-0 overflow-hidden rounded-[1.8rem]">
                        {/* One lit edge along the top, in the project's own
                            accent. It is the quickest way to tell the vision
                            work and the civic work apart while scrolling past. */}
                        <span
                          className={cn(
                            "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                            accent === "signal" ? "via-signal/70" : "via-scope/70",
                          )}
                        />
                      </span>

                      <div className="relative grid transform-3d rounded-[1.8rem] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div className="relative flex transform-3d flex-col p-7 sm:p-9">
                          {/* The ordinal, a drawn rule and the cover note share
                              one line, so the card opens on a measured header
                              instead of a stray line of mono text. */}
                          <div className={cn("flex items-center gap-3", LAYER.header)}>
                            <span
                              className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-[0.55rem] border font-mono text-[0.68rem] tracking-[0.04em]",
                                accent === "signal"
                                  ? "border-signal/35 bg-signal/10 text-signal-bright"
                                  : "border-scope/35 bg-scope/10 text-scope-bright",
                              )}
                            >
                              {ordinal}
                            </span>
                            <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-gradient-to-r from-bone/20 to-transparent" />
                            {project.cover_note && (
                              <p className="max-w-[58%] text-right font-mono text-[0.68rem] leading-snug text-bone-faint">{project.cover_note}</p>
                            )}
                          </div>

                          <h3
                            className={cn(
                              "mt-6 font-display text-[1.8rem] font-semibold leading-[1.05] tracking-[-0.025em] text-bone sm:text-[2.2rem]",
                              LAYER.title,
                            )}
                          >
                            <Link
                              to={`/projects/${project.slug}`}
                              className={cn(
                                "transition-colors focus:outline-none",
                                accent === "signal"
                                  ? "hover:text-signal-bright focus-visible:text-signal-bright"
                                  : "hover:text-scope focus-visible:text-scope",
                              )}
                            >
                              {project.title}
                            </Link>
                          </h3>
                          <p className={cn("mt-4 max-w-prose font-body text-[1.05rem] leading-relaxed text-bone-dim", LAYER.lede)}>
                            {project.summary}
                          </p>

                          {highlights.length > 0 && (
                            <ul className={cn("mt-7 space-y-3", LAYER.notes)}>
                              {highlights.map((highlight) => (
                                <li key={highlight} className="flex gap-3.5 font-body text-[0.95rem] leading-relaxed text-bone-dim">
                                  {/* A short rule instead of a bullet: the list
                                      reads as ruled-off findings rather than as
                                      marketing checkmarks. */}
                                  <span className={cn("mt-2.5 h-px w-4 shrink-0", accent === "signal" ? "bg-signal/70" : "bg-scope/70")} aria-hidden="true" />
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Squared-off mono plates with a lit tick, rather than
                              rounded pills - the stack reads as the instrument's
                              legend for what this thing is made of. */}
                          <div className={cn("mt-7 flex flex-wrap gap-1.5", LAYER.stack)}>
                            {project.tech_stack.map((tech) => (
                              <span
                                key={tech}
                                className="inline-flex items-center gap-1.5 rounded-[0.3rem] border border-bone/10 bg-ink-950/50 py-1 pl-1.5 pr-2 font-mono text-[0.68rem] leading-none text-bone-dim"
                              >
                                <span className={cn("h-2.5 w-px shrink-0", accent === "signal" ? "bg-signal/80" : "bg-scope/80")} aria-hidden="true" />
                                {tech}
                              </span>
                            ))}
                          </div>

                          {/* Pushed to the foot of the column so the calls to
                              action line up with the bottom of the preview when
                              the preview is the taller of the two. They also
                              stand furthest forward of anything in this column,
                              so the thing the visitor is meant to press is the
                              nearest thing on the card. */}
                          <div className={cn("mt-auto pt-9", LAYER.actions)}>
                            <Link
                              to={`/projects/${project.slug}`}
                              className={cn(
                                "group inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-xs tracking-[0.1em] text-ink-950 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2",
                                accent === "signal"
                                  ? "bg-signal hover:bg-signal-bright focus-visible:ring-signal"
                                  : "bg-scope hover:bg-scope-bright focus-visible:ring-scope",
                              )}
                            >
                              <Play className="h-3.5 w-3.5 fill-current" /> {hasDemo ? "OPEN INTERACTIVE DEMO" : "OPEN PROJECT"}
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
                                  className={cn(
                                    "group mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 font-display text-xs tracking-[0.1em] transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2",
                                    accent === "signal"
                                      ? "border-signal/45 bg-signal/10 text-signal-bright hover:border-signal hover:bg-signal/20 focus-visible:ring-signal"
                                      : "border-scope/45 bg-scope/10 text-scope-bright hover:border-scope hover:bg-scope/20 focus-visible:ring-scope",
                                  )}
                                >
                                  OPEN LIVE PROJECT <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <Link
                          to={`/projects/${project.slug}`}
                          aria-label={hasDemo ? `Open the ${project.title} interactive demo` : `Open the ${project.title} project page`}
                          // Centred rather than top-aligned: the write-up beside
                          // it is the taller half, and the preview used to sit at
                          // the top of the cell with a screen's worth of empty
                          // black under it. Mounted in the middle it reads as a
                          // panel bay with the screen set into it.
                          className="group/preview relative flex min-h-[21rem] transform-3d items-center border-t border-bone/10 px-4 py-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-scope md:min-h-0 md:border-l md:border-t-0 sm:px-6"
                        >
                          {/* A wash in the project's accent behind the screen, so
                              the preview looks lit rather than pasted on. It is
                              clipped by its own wrapper because the cell around
                              it can no longer hide overflow without flattening
                              everything inside it. */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 overflow-hidden rounded-bl-[1.8rem] rounded-br-[1.8rem] md:rounded-bl-none md:rounded-tr-[1.8rem]"
                          >
                            <span
                              className={cn(
                                "absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full blur-[90px]",
                                accent === "signal" ? "bg-signal/20" : "bg-scope/20",
                              )}
                            />
                          </span>

                          <div className={cn("relative w-full transform-3d", LAYER.preview)}>
                            {/* Dropped back onto the card's own face, so the
                                screen's shadow stays behind while the screen
                                itself travels - the one cue that makes a plate
                                read as floating rather than printed. */}
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-5 -bottom-7 h-20 rounded-[100%] bg-ink-1000/80 blur-2xl [transform:translateZ(-30px)]"
                            />
                            <PreviewBezel accent={accent} />
                            <DashboardPreview
                              dashboardKey={project.dashboard_key}
                              accent={accent}
                              className="transition-transform duration-500 ease-out group-hover/preview:scale-[1.025]"
                            />
                            <PreviewSheen />
                            <PreviewFrame accent={accent} />
                            <span className="absolute inset-0 flex items-end justify-between rounded-[1.35rem] bg-gradient-to-t from-ink-950/70 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover/preview:opacity-100">
                              <span className="inline-flex items-center gap-2 rounded-[0.5rem] border border-bone/15 bg-ink-950/85 px-4 py-2 font-mono text-[0.68rem] tracking-[0.12em] text-bone">
                                {hasDemo ? "TRY THE DEMO" : "VIEW PROJECT"} <ArrowUpRight className="h-4 w-4" />
                              </span>
                            </span>
                          </div>
                          <CalibrationEdge accent={accent} />
                        </Link>
                      </div>
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
