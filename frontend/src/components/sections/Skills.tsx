import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Binary,
  Boxes,
  BrainCircuit,
  ChevronDown,
  Code2,
  Database,
  LayoutTemplate,
  Server,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TiltCard } from "@/components/ui/TiltCard";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { HeadingChip, SectionHeading } from "@/components/ui/SectionHeading";
import { FALLBACK_SKILL_CATEGORIES } from "@/data/fallback";
import { cn } from "@/lib/utils";
import type { Project, Skill, SkillCategory } from "@/types";

type Accent = "scope" | "signal";

/** Where a project chip points, and which accent that project carries. The
 *  site reads amber as the civic work and pale blue as the vision work, so a
 *  chip linking to either one should be lit in its own colour rather than in
 *  a single house accent. */
interface LinkedProject {
  slug: string;
  accent: Accent;
}

/**
 * Category names are the owner's to edit and new ones can appear from Admin,
 * so the icon is matched on keywords with a neutral fallback rather than
 * looked up by exact name - a renamed or added category still gets a mark
 * instead of an empty chip. Order matters: the narrower terms are tested
 * first, since "Generative AI" would otherwise answer to the AI test.
 */
function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (/generative|llm|prompt|agent/.test(n)) return Sparkles;
  if (/machine learning|deep|vision|neural|\bml\b|\bai\b/.test(n)) return BrainCircuit;
  if (/backend|api|server|infra/.test(n)) return Server;
  if (/frontend|interface|\bui\b|\bux\b|web/.test(n)) return LayoutTemplate;
  if (/database|storage|\bsql\b/.test(n)) return Database;
  if (/tool|devops|workflow/.test(n)) return Wrench;
  if (/program|language|code|coding/.test(n)) return Code2;
  if (/fundamental|computer science|theory|concept|practice/.test(n)) return Binary;
  return Boxes;
}

/**
 * Which accent a project trail leans toward, or null when it points only at
 * things that are not featured projects - coursework, the internship - or
 * does not exist yet. A tie stays on scope, the instrument's default, so the
 * amber is spent only where the civic work genuinely dominates.
 */
function trailAccent(usage: string[], linked: Map<string, LinkedProject>): Accent | null {
  let scope = 0;
  let signal = 0;
  for (const entry of usage) {
    const accent = linked.get(entry)?.accent;
    if (accent === "signal") signal += 1;
    else if (accent === "scope") scope += 1;
  }
  if (scope === 0 && signal === 0) return null;
  return signal > scope ? "signal" : "scope";
}

/** The one place the fallback decision is applied, so the count in the card
 *  footer and the trail behind a row can never disagree. */
function resolveUsage(skill: Skill, usageDataMissing: boolean, fallback: Map<string, string[]>): string[] {
  return usageDataMissing ? fallback.get(skill.name) ?? [] : skill.used_in;
}

/**
 * One skill, with its project trail behind a disclosure.
 *
 * Every trail used to be expanded at all times. With eight categories and
 * forty-odd skills that made this the tallest section on the page by a wide
 * margin - about four screens against two-thirds of one for Experience - and
 * turned a list meant to be skimmed into a wall of repeated "WHERE I USED IT"
 * labels. The count stays visible so the section still reads as
 * project-tested at a glance; the project names themselves are one click away.
 */
function SkillRow({
  name,
  usage,
  accent,
  linked,
}: {
  name: string;
  usage: string[];
  /** The category's accent, used for the count so a card's readouts agree. */
  accent: Accent;
  linked: Map<string, LinkedProject>;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `skill-${useId()}`;
  const hasUsage = usage.length > 0;

  return (
    <li className="border-b border-bone/[0.08] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "group/row flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors",
          accent === "signal" ? "hover:text-signal" : "hover:text-scope",
        )}
      >
        <span
          className={cn(
            "font-body text-[15px] text-bone transition-colors",
            accent === "signal" ? "group-hover/row:text-signal-bright" : "group-hover/row:text-scope-bright",
          )}
        >
          {name}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {/* The count is set as a lit numeral against a faint unit label, the
              way a panel prints a reading - it used to be one flat grey string
              that read as a caption. */}
          <span className="inline-flex items-center gap-1 rounded-[0.25rem] border border-bone/[0.09] bg-ink-950/50 px-1.5 py-0.5 font-mono text-[0.55rem] tracking-[0.1em] text-bone-faint">
            {hasUsage ? (
              <>
                <span className={accent === "signal" ? "text-signal" : "text-scope"}>{usage.length}</span>
                PROJECT{usage.length > 1 ? "S" : ""}
              </>
            ) : (
              "BUILDING NEXT"
            )}
          </span>
          {hasUsage && (
            <ChevronDown
              className={cn("h-3 w-3 text-bone-faint transition-transform duration-300", open && "rotate-180")}
            />
          )}
        </span>
      </button>

      {hasUsage && open && (
        <div id={panelId} className="flex flex-wrap gap-1.5 pb-3">
          {usage.map((entry) => {
            const project = linked.get(entry);
            return project ? (
              <Link
                key={entry}
                to={`/projects/${project.slug}`}
                className={cn(
                  "group/use inline-flex items-center gap-1 rounded-full border px-2 py-1 font-display text-[0.58rem] tracking-[0.06em] transition-all hover:-translate-y-0.5",
                  project.accent === "signal"
                    ? "border-signal/30 bg-signal/10 text-signal-bright hover:border-signal/60 hover:bg-signal/20"
                    : "border-scope/25 bg-scope/10 text-scope-bright hover:border-scope/60 hover:bg-scope/20",
                )}
              >
                {entry}
                <ArrowUpRight className="h-2.5 w-2.5 transition-transform group-hover/use:translate-x-0.5 group-hover/use:-translate-y-0.5" />
              </Link>
            ) : (
              <Badge key={entry} tone="neutral" className="text-[0.6rem]">
                {entry}
              </Badge>
            );
          })}
        </div>
      )}
    </li>
  );
}

export function Skills({ categories, projects }: { categories?: SkillCategory[]; projects?: Project[] }) {
  // `used_in` holds project titles - resolve any that match a real project so
  // they render as a link rather than plain text, and carry that project's
  // accent along so the chips and the card tints agree.
  const linked = useMemo(() => {
    const map = new Map<string, LinkedProject>();
    for (const project of projects ?? []) {
      map.set(project.title, { slug: project.slug, accent: project.dashboard_key === "janseva" ? "signal" : "scope" });
    }
    return map;
  }, [projects]);

  // Older portfolio databases predate the `used_in` column and answer with an
  // empty list for every single skill. Standing in the bundled project trail
  // keeps those deployments readable - but it has to stay a whole-payload
  // decision. Keyed off one empty list, a trail the owner deliberately
  // cleared in Admin was silently replaced by the seeded project names again,
  // with no way to express "this skill has no project trail".
  const usageDataMissing = useMemo(
    () => (categories ?? []).every((category) => category.skills.every((skill) => skill.used_in.length === 0)),
    [categories],
  );

  const fallbackUsageBySkill = useMemo(
    () =>
      new Map(
        FALLBACK_SKILL_CATEGORIES.flatMap((category) => category.skills.map((skill) => [skill.name, skill.used_in] as const)),
      ),
    [],
  );

  /** Everything the cards and the closing rail need, worked out once: a card
   *  is tinted by the work its own tools feed, and the rail sums the same
   *  numbers the cards print. */
  const panels = useMemo(() => {
    return (categories ?? []).map((category) => {
      const rows = category.skills.map((skill) => {
        const usage = resolveUsage(skill, usageDataMissing, fallbackUsageBySkill);
        return { skill, usage, accent: trailAccent(usage, linked) };
      });
      return {
        category,
        rows,
        accent: trailAccent(rows.flatMap((row) => row.usage), linked) ?? ("scope" as Accent),
        // Counted as "reaches a project page", not "has a trail at all", so
        // the number agrees with the lit ticks beside it - a trail that only
        // says "Coursework" has nothing to open.
        linkedCount: rows.filter((row) => row.accent !== null).length,
      };
    });
  }, [categories, usageDataMissing, fallbackUsageBySkill, linked]);

  const totals = useMemo(
    () => ({
      categories: panels.length,
      tools: panels.reduce((sum, panel) => sum + panel.rows.length, 0),
      linked: panels.reduce((sum, panel) => sum + panel.linkedCount, 0),
    }),
    [panels],
  );

  if (!categories || categories.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-ink-700/60 px-6 py-28 sm:px-10">
      {/* Fine density and no plotted marks: this section runs much taller than
          it is wide, and the field's viewBox is scaled to cover, so anything
          drawn at normal size would arrive two and a half times too large. */}
      <InstrumentField className="opacity-[0.4]" marks={false} />
      <div className="pointer-events-none absolute -right-48 top-0 h-[32rem] w-[32rem] bloom [--bloom:color-mix(in_srgb,var(--color-scope)_8.0%,transparent)]" />
      <div className="pointer-events-none absolute -left-40 bottom-10 h-[26rem] w-[26rem] bloom [--bloom:color-mix(in_srgb,var(--color-signal)_6.4%,transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          index="04"
          label="Capabilities"
          title="The toolkit, traced back to the work."
          description="Tools with a visible trail to the projects where I put them to work."
          aside={<HeadingChip accent="signal">PROJECT-TESTED</HeadingChip>}
        />

        <div className="mt-14 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {panels.map(({ category, rows, accent, linkedCount }, i) => {
            const Icon = categoryIcon(category.name);
            // The tilt and the idle float these cards used to carry are gone.
            // Eight small panels bobbing out of phase read as decoration, and
            // every row inside one is a button, so the click target was
            // drifting under the pointer on its way down.
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                // Along the diagonal rather than by column, so the grid
                // assembles as one composition instead of four columns racing.
                transition={{ duration: 0.5, delay: ((i % 4) + Math.floor(i / 4)) * 0.06, ease: "easeOut" }}
                className="h-full"
              >
                {/* Deliberately a gentle tilt. Every row in this card is a
                    button, so the panel has to feel like an object you can
                    push without the thing you are aiming at sliding out from
                    under the pointer - at this strength the furthest row moves
                    about two pixels. Only the hovered card tilts. */}
                <TiltCard strength={3.5} glare wrapperClassName="h-full" className="h-full">
                <div
                className={cn(
                  "group relative h-full overflow-hidden rounded-[1.35rem] border border-bone/[0.08] bg-ink-900/75 p-5 transition-colors duration-300",
                  accent === "signal" ? "hover:border-signal/40" : "hover:border-scope/40",
                )}
              >
                {/* The same corner bloom the About tiles use, so a hovered
                    card lights from its own corner rather than only outlining. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                    accent === "signal" ? "bg-signal/20" : "bg-scope/20",
                  )}
                />

                <div className="relative flex items-start justify-between gap-3 border-b border-bone/10 pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                        accent === "signal"
                          ? "border-signal/30 bg-signal/10 text-signal-bright"
                          : "border-scope/30 bg-scope/10 text-scope-bright",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="min-w-0 font-display text-[0.98rem] leading-tight tracking-[-0.01em] text-bone">{category.name}</h3>
                  </div>
                  <span className="shrink-0 font-mono text-[0.6rem] tracking-[0.14em] text-bone-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <ul className="relative mt-1.5">
                  {rows.map(({ skill, usage }) => (
                    <SkillRow key={skill.id} name={skill.name} usage={usage} accent={accent} linked={linked} />
                  ))}
                </ul>

                {/* A tick per tool, lit in the accent of the work it feeds and
                    left dark where there is no trail yet. It gives every card
                    a different reading along its foot, which is what stops the
                    grid looking like eight copies of one rectangle. */}
                <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-bone/10 pt-3">
                  <span aria-hidden="true" className="flex items-center gap-[3px]">
                    {rows.map(({ skill, usage, accent: rowAccent }) => (
                      <span
                        key={skill.id}
                        className={cn(
                          "h-2.5 w-[3px] rounded-[1px]",
                          rowAccent === "signal"
                            ? "bg-signal/75"
                            : rowAccent === "scope"
                              ? "bg-scope/60"
                              : usage.length > 0
                                ? "bg-bone/30"
                                : "bg-bone/10",
                        )}
                      />
                    ))}
                  </span>
                  <span className="shrink-0 font-mono text-[0.55rem] tracking-[0.14em] text-bone-faint">
                    {linkedCount}/{rows.length} LINKED
                  </span>
                </div>
                </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* A closing rail under the grid. The cards end on ragged bottoms
            because their categories are genuinely different sizes; this gives
            the composition a baseline to sit on, and prints the totals the
            cards only imply. */}
        <div className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-4 rounded-2xl border border-bone/[0.08] bg-ink-900/65 px-6 py-5">
          {[
            { value: totals.categories, label: "CATEGORIES" },
            { value: totals.tools, label: "TOOLS" },
            { value: totals.linked, label: "LINKED TO A PROJECT" },
          ].map(({ value, label }) => (
            <span key={label} className="flex items-baseline gap-2.5">
              {/* Plain column rules rather than accented ones: the rail is a
                  total, and the two accents are spent on the cards, where they
                  say which body of work a tool belongs to. */}
              <span aria-hidden="true" className="h-3.5 w-px translate-y-[0.15rem] bg-bone/20" />
              <span className="font-display text-xl leading-none text-bone">{String(value).padStart(2, "0")}</span>
              <span className="font-mono text-[0.6rem] tracking-[0.16em] text-bone-faint">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
