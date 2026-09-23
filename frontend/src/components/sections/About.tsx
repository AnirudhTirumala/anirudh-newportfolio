import { BrainCircuit, Code2, Eye, ScanSearch, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TiltCard } from "@/components/ui/TiltCard";
import { InstrumentField } from "@/components/ui/InstrumentField";
import { SectionHeading, HeadingChip } from "@/components/ui/SectionHeading";
import type { Profile } from "@/types";

/** The three things the work actually consists of. These were previously
 *  hidden behind a click on the decorative card, which meant the clearest
 *  statement of what he does was the one thing a visitor had to find. */
const CAPABILITIES = [
  {
    icon: ScanSearch,
    label: "Vision",
    body: "Annotating, training and evaluating detection models until they hold up on real field photos.",
    accent: "scope" as const,
  },
  {
    icon: Sparkles,
    label: "Generative AI",
    body: "LLM workflows, retrieval and synthetic data generation, wired into products rather than notebooks.",
    accent: "signal" as const,
  },
  {
    icon: Code2,
    label: "Products",
    body: "The unglamorous half: reliable APIs, real interfaces, and the deployment that makes a model useful.",
    accent: "scope" as const,
  },
];

function splitIntoFragments(bio: string): string[] {
  return bio
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function About({ profile }: { profile?: Profile }) {
  const reduced = useReducedMotion();
  const bio =
    profile?.bio ||
    "I'm an AI engineer who builds applied machine learning systems end to end, from computer vision to generative AI.";
  const fragments = splitIntoFragments(bio);

  return (
    <section id="about" className="relative scroll-mt-24 overflow-hidden border-t border-ink-700/60 px-6 py-28 sm:px-10">
      <InstrumentField className="opacity-[0.55]" />
      <div className="pointer-events-none absolute -right-40 top-1/3 h-[30rem] w-[30rem] bloom [--bloom:color-mix(in_srgb,var(--color-scope)_9.6%,transparent)]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[26rem] w-[26rem] bloom [--bloom:color-mix(in_srgb,var(--color-signal)_7.2%,transparent)]" />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading
          index="01"
          label="About"
          title="Built end to end, not just trained."
          aside={<HeadingChip>APPLIED AI</HeadingChip>}
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.4fr)] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Each sentence is its own paragraph. Previously they ran
                together with an icon dropped between them, which read as
                punctuation errors rather than as rhythm. */}
            <div className="space-y-5">
              {fragments.map((fragment, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "font-body text-2xl leading-[1.45] text-bone sm:text-[1.75rem]"
                      : "max-w-2xl font-body text-lg leading-relaxed text-bone-dim"
                  }
                >
                  {fragment}
                </p>
              ))}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {CAPABILITIES.map(({ icon: Icon, label, body, accent }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                  className="group relative h-full rounded-2xl"
                >
                  <TiltCard strength={6} glare wrapperClassName="h-full" className="h-full">
                  <div className="relative h-full overflow-hidden rounded-2xl border border-bone/[0.08] bg-ink-900/75 p-5 transition-colors duration-300 group-hover:border-scope/40">
                  <span
                    className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100 ${
                      accent === "signal" ? "bg-signal/20" : "bg-scope/20"
                    } opacity-60`}
                  />
                  <span
                    className={`relative grid h-9 w-9 place-items-center rounded-xl border ${
                      accent === "signal"
                        ? "border-signal/30 bg-signal/10 text-signal-bright"
                        : "border-scope/30 bg-scope/10 text-scope-bright"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="relative mt-4 font-display text-sm tracking-[0.02em] text-bone">{label}</p>
                  <p className="relative mt-1.5 font-body text-[0.9rem] leading-relaxed text-bone-dim">{body}</p>
                  </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3 font-mono text-[0.68rem] tracking-[0.16em] text-bone-faint">
              <span className="h-px w-10 bg-scope/60" /> BUILT WITH CURIOSITY
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative hidden [perspective:1400px] lg:block"
          >
            <motion.div
              animate={reduced ? undefined : { y: [0, -16, 0], rotateX: [0, -3, 0], rotateY: [-2.4, 2.4, -2.4] }}
              transition={reduced ? undefined : { duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
              className="mx-auto w-full max-w-[18rem]"
            >
              <TiltCard strength={7} glare>
                <div
                  aria-hidden
                  className="glass-panel relative flex aspect-[4/5] w-full overflow-hidden rounded-[2rem] p-5 text-left"
                >
                  <span className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-scope/30 blur-3xl" />
                  <span className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-signal/20 blur-3xl" />
                  <span className="absolute left-1/2 top-[46%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-scope/25 animate-orbit" />
                  <span className="absolute left-1/2 top-[46%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal/35 animate-orbit-reverse" />
                  <span className="absolute left-1/2 top-[46%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-bone/20 bg-ink-950/70 text-scope-bright shadow-scope-glow">
                    <BrainCircuit className="h-8 w-8" />
                  </span>
                  <span className="absolute left-[16%] top-[30%] grid h-8 w-8 place-items-center rounded-full border border-scope/30 bg-ink-950/70 text-scope-bright">
                    <Eye className="h-4 w-4" />
                  </span>
                  <span className="absolute right-[15%] top-[57%] grid h-8 w-8 place-items-center rounded-full border border-signal/35 bg-ink-950/70 text-signal-bright">
                    <ScanSearch className="h-4 w-4" />
                  </span>

                  <span className="relative z-10 flex h-full w-full flex-col justify-between">
                    <span className="flex items-center justify-between font-mono text-[0.62rem] tracking-[0.14em] text-bone-dim">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-signal" /> APPLIED AI
                      </span>
                      <span className="text-scope-bright">LIVE</span>
                    </span>
                    <span className="mt-auto">
                      <span className="block font-display text-2xl leading-none text-bone">Systems that</span>
                      <span className="mt-1 block font-display text-2xl leading-none text-scope-bright">create impact.</span>
                      <span className="mt-3 block font-mono text-[0.62rem] tracking-[0.1em] text-bone-faint">MOVE TO TILT</span>
                    </span>
                  </span>
                </div>
              </TiltCard>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
