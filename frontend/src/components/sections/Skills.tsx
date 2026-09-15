import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { Badge } from "@/components/ui/Badge";
import { FALLBACK_SKILL_CATEGORIES } from "@/data/fallback";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { Project, SkillCategory } from "@/types";

export function Skills({ categories, projects }: { categories?: SkillCategory[]; projects?: Project[] }) {
  const reduced = useReducedMotion();

  // `used_in` holds project titles - resolve any that match a real,
  // featured project so they render as a link rather than plain text.
  const slugByTitle = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects ?? []) map.set(project.title, project.slug);
    return map;
  }, [projects]);

  // Older portfolio databases can predate the `used_in` column. Preserve the
  // known project trail for those records instead of replacing it with an
  // unhelpful empty state while the admin content is being updated.
  const fallbackUsageBySkill = useMemo(
    () =>
      new Map(
        FALLBACK_SKILL_CATEGORIES.flatMap((category) => category.skills.map((skill) => [skill.name, skill.used_in] as const)),
      ),
    [],
  );

  if (!categories || categories.length === 0) return null;

  return (
    <section className="section-aura relative overflow-hidden border-t border-ink-700 px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-sm text-scope">Capabilities</p>
            <p className="mt-2 max-w-md font-body text-base text-bone-dim">Tools with a visible trail to the projects where I put them to work.</p>
          </div>
          <span className="flex items-center gap-2 font-display text-xs tracking-[0.14em] text-bone-faint">
            <span className="h-2 w-2 rounded-full bg-signal animate-pulse-soft" /> PROJECT-TESTED
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.07, ease: "easeOut" }}
            >
              {/* Separate inner element for the idle float loop so it never
                  fights the outer scroll-reveal over the same `y` value -
                  each animates its own transform on its own node. */}
              <motion.div
                animate={reduced ? undefined : { y: [0, -7, 0] }}
                transition={
                  reduced ? undefined : { duration: 5.5 + (i % 4) * 0.5, repeat: Infinity, ease: "easeInOut", delay: (i % 4) * 0.35 }
                }
              >
                <TiltCard strength={4} glare>
                  <div className="glass-panel h-full rounded-[1.35rem] p-5 transition-[border-color,box-shadow] duration-300 hover:border-scope/55 hover:shadow-scope-glow">
                    <div className="flex items-start justify-between gap-3 border-b border-bone/10 pb-4">
                      <h3 className="font-display text-base text-bone">{category.name}</h3>
                      <Sparkles className="h-4 w-4 shrink-0 text-signal" />
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {category.skills.map((skill) => {
                        const usage = skill.used_in.length > 0 ? skill.used_in : fallbackUsageBySkill.get(skill.name) ?? [];
                        return (
                        <li key={skill.id} className="border-b border-bone/[0.08] py-3 last:border-b-0">
                          <p className="font-body text-[15px] text-bone">{skill.name}</p>
                          <p className="mt-1.5 font-display text-[0.55rem] tracking-[0.12em] text-bone-faint">WHERE I USED IT</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {usage.length === 0 ? (
                              <span className="font-display text-[0.6rem] tracking-[0.11em] text-bone-faint">BUILDING NEXT</span>
                            ) : (
                              usage.map((entry) => {
                                const slug = slugByTitle.get(entry);
                                return slug ? (
                                  <Link
                                    key={entry}
                                    to={`/projects/${slug}`}
                                    className="group/use inline-flex items-center gap-1 rounded-full border border-scope/25 bg-scope/10 px-2 py-1 font-display text-[0.58rem] tracking-[0.06em] text-scope-bright transition-all hover:-translate-y-0.5 hover:border-scope/60 hover:bg-scope/20"
                                  >
                                    {entry}<ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover/use:translate-x-0.5 group-hover/use:-translate-y-0.5" />
                                  </Link>
                                ) : (
                                  <Badge key={entry} tone="neutral" className="text-[0.6rem]">
                                    {entry}
                                  </Badge>
                                );
                              })
                            )}
                          </div>
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                </TiltCard>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
