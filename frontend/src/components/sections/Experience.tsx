import { BrainCircuit, Database, MapPin, ScanSearch } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TiltCard } from "@/components/ui/TiltCard";
import type { Experience as ExperienceEntry } from "@/types";

const HIGHLIGHT_ICONS = [Database, BrainCircuit, ScanSearch];

function contributionPoints(highlights: string[]): string[] {
  // Handles existing records that may have been stored as a single multiline
  // value before the admin editor switched to one point per line.
  return highlights
    .flatMap((item) => item.split(/\r?\n/))
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

/** Current industry experience, available even while the optional API is offline. */
export function Experience({ experiences }: { experiences?: ExperienceEntry[] }) {
  const reduced = useReducedMotion();
  if (!experiences?.length) return null;

  return (
    <section id="experience" className="border-t border-ink-700 px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="font-display text-sm text-scope">Experience</p>
        <div className="mt-7 flex flex-col gap-5">
          {experiences.map((experience, experienceIndex) => {
            const dateLabel = experience.current ? "Current" : [experience.start_date, experience.end_date].filter(Boolean).join(" — ");
            const points = contributionPoints(experience.highlights);

            return (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: reduced ? 0 : 0.5, delay: experienceIndex * 0.06 }}
              >
                <motion.div
                  animate={reduced ? undefined : { y: [0, -5, 0] }}
                  transition={reduced ? undefined : { duration: 6.2, repeat: Infinity, ease: "easeInOut", delay: experienceIndex * 0.3 }}
                >
                  <TiltCard strength={6} glare>
                    <article className="glass-panel overflow-hidden rounded-[1.75rem] p-7 transition-[border-color,box-shadow] hover:border-scope/50 hover:shadow-scope-glow sm:p-10">
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="font-display text-2xl text-bone sm:text-3xl">{experience.role}</h2>
                            {dateLabel && (
                              <span className="rounded-full border border-scope/30 bg-scope/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-scope-bright">
                                {dateLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 font-body text-lg text-bone-dim">{experience.company}</p>
                        </div>
                        {experience.location && (
                          <p className="flex items-center gap-1.5 font-mono text-xs text-bone-faint">
                            <MapPin className="h-3.5 w-3.5 text-signal" /> {experience.location}
                          </p>
                        )}
                      </div>

                      {experience.description && <p className="mt-7 max-w-3xl font-body text-lg leading-relaxed text-bone-dim">{experience.description}</p>}

                      {points.length > 0 && (
                        <div className="mt-8 border-t border-bone/10 pt-6">
                          <p className="font-display text-[0.65rem] tracking-[0.15em] text-scope">KEY CONTRIBUTIONS</p>
                          <ul className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {points.map((point, index) => {
                              const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];
                              return (
                                <li key={`${point}-${index}`} className="flex items-start gap-2.5 font-body text-sm leading-relaxed text-bone-dim">
                                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-scope/30 bg-scope/10 text-scope-bright">
                                    <Icon className="h-3 w-3" aria-hidden="true" />
                                  </span>
                                  <span>{point}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </article>
                  </TiltCard>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
