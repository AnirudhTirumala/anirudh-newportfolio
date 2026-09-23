import { MapPin } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { TiltCard } from "@/components/ui/TiltCard";
import { SectionHeading, HeadingChip } from "@/components/ui/SectionHeading";
import type { Experience as ExperienceEntry } from "@/types";

function contributionPoints(highlights: string[]): string[] {
  // Handles existing records that may have been stored as a single multiline
  // value before the admin editor switched to one point per line.
  return highlights
    .flatMap((item) => item.split(/\r?\n/))
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

/** The period as it reads along the rail. A current role is open-ended, so it
 *  resolves to "Present" instead of discarding the start date the owner
 *  entered - and to "Present" alone while no dates have been filled in yet. */
function periodLabel(entry: ExperienceEntry): string {
  if (entry.current) return [entry.start_date, "Present"].filter(Boolean).join(" — ");
  return [entry.start_date, entry.end_date].filter(Boolean).join(" — ");
}

/** Current industry experience, available even while the optional API is offline. */
export function Experience({ experiences }: { experiences?: ExperienceEntry[] }) {
  const reduced = useReducedMotion();
  if (!experiences?.length) return null;

  const hasCurrentRole = experiences.some((entry) => entry.current);

  return (
    <section
      id="experience"
      className="relative scroll-mt-24 overflow-hidden border-t border-ink-700/60 px-6 py-28 sm:px-10"
    >
      <InstrumentField className="opacity-[0.45]" />
      <div className="pointer-events-none absolute -left-44 top-1/4 h-[28rem] w-[28rem] bloom [--bloom:color-mix(in_srgb,var(--color-scope)_8.8%,transparent)]" />
      <div className="pointer-events-none absolute -right-36 bottom-4 h-[22rem] w-[22rem] bloom [--bloom:color-mix(in_srgb,var(--color-signal)_4.8%,transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          index="02"
          label="Experience"
          title="Where the work gets done."
          description="The roles in order, with what each one actually produced."
          aside={hasCurrentRole ? <HeadingChip>ACTIVE ROLE</HeadingChip> : undefined}
        />

        {/* A timeline rather than a stack of cards: one role reads as a point
            on a record, and every role added later extends the same rail
            instead of adding another floating slab. */}
        <ol className="mt-14">
          {experiences.map((experience, experienceIndex) => {
            const period = periodLabel(experience);
            const points = contributionPoints(experience.highlights);
            const isFirst = experienceIndex === 0;
            const isLast = experienceIndex === experiences.length - 1;

            return (
              <li key={experience.id} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: reduced ? 0 : 0.55,
                    delay: reduced ? 0 : experienceIndex * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 lg:grid-cols-[9rem_1.5rem_minmax(0,1fr)] lg:gap-x-6"
                >
                  {/* The period sits beside the rail on wide screens and above
                      the role on narrow ones, so the date is never the thing
                      that forces a horizontal scroll. It is lit for a current
                      role, which saves repeating "current" as a word. */}
                  <div className="hidden pt-1.5 text-right lg:block">
                    {period && (
                      <p
                        className={cn(
                          "font-mono text-[0.68rem] tracking-[0.16em]",
                          experience.current ? "text-scope" : "text-bone-dim",
                        )}
                      >
                        {period}
                      </p>
                    )}
                  </div>

                  <div aria-hidden className="relative">
                    <span
                      className={cn(
                        "absolute left-1/2 top-0 h-[0.55rem] w-px -translate-x-1/2",
                        isFirst ? "bg-gradient-to-b from-transparent to-scope/25" : "bg-scope/20",
                      )}
                    />
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 top-5 w-px -translate-x-1/2",
                        // The rail ends in a fade rather than stopping dead,
                        // so a single entry still reads as a point on a record
                        // instead of a line that was cut off.
                        isLast ? "bg-gradient-to-b from-scope/30 via-scope/12 to-transparent" : "bg-scope/20",
                      )}
                    />
                    {/* The current role gets a lit node with a ring around it;
                        past roles get a hollow one, so the timeline says which
                        entry is live without repeating the word anywhere. */}
                    <span className="absolute left-1/2 top-0.5 grid h-6 w-6 -translate-x-1/2 place-items-center">
                      {experience.current && (
                        <span className="absolute inset-0 rounded-full border border-scope/35 animate-pulse-soft" />
                      )}
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          experience.current
                            ? "bg-scope shadow-scope-glow"
                            : "border border-scope-dim bg-ink-900",
                        )}
                      />
                    </span>
                  </div>

                  <div className={cn("min-w-0", !isLast && "pb-16")}>
                    {period && (
                      <p
                        className={cn(
                          "mb-2 font-mono text-[0.68rem] tracking-[0.16em] lg:hidden",
                          experience.current ? "text-scope" : "text-bone-dim",
                        )}
                      >
                        {period}
                      </p>
                    )}

                    <div className="grid gap-x-10 gap-y-7 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-start">
                      <div className="min-w-0">
                        <h3 className="font-display text-2xl leading-[1.1] tracking-[-0.02em] text-bone sm:text-[1.9rem]">
                          {experience.role}
                        </h3>
                        <p className="mt-2 font-body text-lg leading-snug text-bone-dim">{experience.company}</p>
                        {experience.location && (
                          <p className="mt-3 flex items-center gap-1.5 font-mono text-[0.66rem] tracking-[0.12em] text-bone-faint">
                            <MapPin className="h-3.5 w-3.5 text-scope-deep" aria-hidden="true" />
                            {experience.location}
                          </p>
                        )}
                        {experience.description && (
                          <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-bone-dim">
                            {experience.description}
                          </p>
                        )}
                      </div>

                      {points.length > 0 && (
                        // Numbered rows on hairlines read as a log of what was
                        // done. The previous three-column grid gave every point
                        // the same weight as a caption and none of the weight
                        // of evidence.
                        <TiltCard strength={3.5} glare>
                        <div className="overflow-hidden rounded-2xl border border-bone/[0.08] bg-ink-900/75">
                          <div className="flex items-center gap-3 border-b border-bone/[0.07] px-5 py-3">
                            <span className="font-mono text-[0.62rem] tracking-[0.18em] text-scope">
                              KEY CONTRIBUTIONS
                            </span>
                            <span className="h-px flex-1 bg-bone/[0.08]" />
                            <span className="font-mono text-[0.62rem] tracking-[0.14em] text-bone-faint">
                              {String(points.length).padStart(2, "0")}
                            </span>
                          </div>
                          <ul>
                            {points.map((point, index) => (
                              <li
                                key={`${point}-${index}`}
                                className="group/point relative flex gap-4 border-t border-bone/[0.05] px-5 py-4 transition-colors duration-300 first:border-t-0 hover:bg-scope/[0.035]"
                              >
                                <span className="absolute inset-y-0 left-0 w-px bg-transparent transition-colors duration-300 group-hover/point:bg-scope/50" />
                                <span className="mt-[0.15rem] shrink-0 font-mono text-[0.66rem] tracking-[0.12em] text-scope-dim transition-colors duration-300 group-hover/point:text-scope">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="font-body text-[0.97rem] leading-relaxed text-bone-dim transition-colors duration-300 group-hover/point:text-bone">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        </TiltCard>
                      )}
                    </div>
                  </div>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
