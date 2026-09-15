import { useState } from "react";
import { BrainCircuit, Code2, Eye, ScanSearch, Sparkles, Users } from "lucide-react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TiltCard } from "@/components/ui/TiltCard";
import type { Profile } from "@/types";

const ACCENT_ICONS = [Eye, Sparkles, Users, Code2];

function splitIntoFragments(bio: string): string[] {
  return bio
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function About({ profile }: { profile?: Profile }) {
  const reduced = useReducedMotion();
  const [systemsOpen, setSystemsOpen] = useState(false);
  const bio =
    profile?.bio ||
    "I'm an AI engineer who builds applied machine learning systems end to end, from computer vision to generative AI.";
  const fragments = splitIntoFragments(bio);

  return (
    <section id="about" className="section-aura relative overflow-hidden px-6 py-28 sm:px-10">
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        whileInView={reduced ? { opacity: 0.05 } : { opacity: 0.05, y: [0, -16, 0], rotate: [0, 3, 0] }}
        viewport={{ once: true }}
        transition={
          reduced
            ? { duration: 1 }
            : { opacity: { duration: 1 }, y: { duration: 9, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" } }
        }
        className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 lg:block"
      >
        <Eye className="h-72 w-72 text-scope" strokeWidth={0.5} />
      </motion.div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(15.5rem,0.42fr)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="relative hidden [perspective:1400px] lg:block"
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -16, 0], rotateX: [0, -3, 0], rotateY: [-2.4, 2.4, -2.4] }}
            transition={reduced ? undefined : { duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
            className="mx-auto w-full max-w-[18rem]"
          >
            <TiltCard strength={7} glare>
              <button
                type="button"
                onClick={() => setSystemsOpen((open) => !open)}
                aria-pressed={systemsOpen}
                aria-label="Toggle applied AI systems details"
                className="glass-panel relative flex aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[2rem] p-5 text-left transition-[border-color,box-shadow] hover:border-scope/70 hover:shadow-scope-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-scope"
              >
                <span className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-scope/30 blur-3xl" />
                <span className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-signal/20 blur-3xl" />
                <span className="absolute left-1/2 top-[46%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-scope/25 animate-orbit" />
                <span className="absolute left-1/2 top-[46%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-signal/35 animate-orbit-reverse" />
                <span className="absolute left-1/2 top-[46%] grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-bone/20 bg-ink-950/70 text-scope-bright shadow-scope-glow backdrop-blur-md">
                  <BrainCircuit className="h-8 w-8" />
                </span>
                <span className="absolute left-[16%] top-[30%] grid h-8 w-8 place-items-center rounded-full border border-scope/30 bg-ink-950/70 text-scope-bright"><Eye className="h-4 w-4" /></span>
                <span className="absolute right-[15%] top-[57%] grid h-8 w-8 place-items-center rounded-full border border-signal/35 bg-ink-950/70 text-signal-bright"><ScanSearch className="h-4 w-4" /></span>

                <span className="relative z-10 flex h-full w-full flex-col justify-between">
                  <span className="flex items-center justify-between font-display text-[0.62rem] tracking-[0.14em] text-bone-dim">
                    <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-signal" /> APPLIED AI</span>
                    <span className="text-scope-bright">EXPLORE</span>
                  </span>
                  <span className="mt-auto">
                    <span className="block font-display text-2xl leading-none text-bone">Systems that</span>
                    <span className="mt-1 block font-display text-2xl leading-none text-scope-bright">create impact.</span>
                    <span className="mt-3 block font-body text-xs text-bone-dim">Move to tilt · click to explore the stack</span>
                  </span>
                  <span className="mt-4 grid grid-cols-3 gap-2">
                    <span className="rounded-lg border border-bone/10 bg-ink-950/45 px-2 py-2 font-display text-[0.55rem] tracking-[0.08em] text-bone-dim">VISION</span>
                    <span className="rounded-lg border border-bone/10 bg-ink-950/45 px-2 py-2 font-display text-[0.55rem] tracking-[0.08em] text-bone-dim">GENAI</span>
                    <span className="rounded-lg border border-bone/10 bg-ink-950/45 px-2 py-2 font-display text-[0.55rem] tracking-[0.08em] text-bone-dim">APPS</span>
                  </span>
                </span>

                {systemsOpen && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-4 z-20 flex flex-col justify-between rounded-2xl border border-scope/30 bg-ink-1000/95 p-4 text-left shadow-2xl backdrop-blur-xl"
                  >
                    <span>
                      <span className="font-display text-[0.62rem] tracking-[0.14em] text-scope">SYSTEM MAP</span>
                      <span className="mt-3 block font-body text-sm leading-relaxed text-bone-dim"><strong className="font-medium text-bone">Vision</strong> — annotate, train and evaluate detection models.</span>
                      <span className="mt-3 block font-body text-sm leading-relaxed text-bone-dim"><strong className="font-medium text-bone">Generative AI</strong> — LLM workflows and synthetic data.</span>
                      <span className="mt-3 block font-body text-sm leading-relaxed text-bone-dim"><strong className="font-medium text-bone">Products</strong> — reliable APIs and human-centred interfaces.</span>
                    </span>
                    <span className="font-display text-[0.58rem] tracking-[0.12em] text-signal-bright">CLICK TO CLOSE</span>
                  </motion.span>
                )}
              </button>
            </TiltCard>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="[perspective:1400px]"
        >
          <p className="font-display text-sm text-scope">About</p>
          <motion.div
            animate={reduced ? undefined : { y: [0, -8, 0], rotateX: [0, 1.5, 0], rotateY: [-1.4, 1.4, -1.4] }}
            transition={reduced ? undefined : { duration: 6.7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <TiltCard strength={4.5} glare>
              <div className="glass-panel mt-5 rounded-[1.75rem] p-7 transition-[border-color,box-shadow] hover:border-scope/45 hover:shadow-scope-glow sm:p-9">
                <p className="font-body text-2xl leading-relaxed text-bone sm:text-3xl sm:leading-relaxed">
                  {fragments.map((fragment, i) => {
                    const Icon = ACCENT_ICONS[i % ACCENT_ICONS.length];
                    const isLast = i === fragments.length - 1;
                    return (
                      <span key={i}>
                        {fragment}
                        {!isLast && (
                          <span className="mx-3 inline-flex align-middle text-scope/70">
                            <Icon className="inline h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                        {!isLast && " "}
                      </span>
                    );
                  })}
                </p>
                <div className="mt-7 flex items-center gap-3 font-display text-xs tracking-[0.14em] text-bone-faint">
                  <span className="h-px w-8 bg-scope/60" /> BUILT WITH CURIOSITY
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
