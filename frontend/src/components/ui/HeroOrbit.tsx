import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { TiltCard } from "@/components/ui/TiltCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * A small tactile scene for the open space beside the hero name. It uses
 * layered CSS rather than a second WebGL canvas so it remains crisp, light,
 * and usable even when the main background falls back from WebGL.
 */
export function HeroOrbit() {
  const reduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.86, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto hidden w-full max-w-[15.5rem] [perspective:1400px] lg:block"
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -14, 0], rotateX: [0, 3.2, 0], rotateY: [-2.5, 2.5, -2.5] }}
        transition={reduced ? undefined : { duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <TiltCard strength={6} glare>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-pressed={expanded}
            aria-label="Toggle creative systems card"
            className="glass-panel group relative flex aspect-square w-full cursor-pointer overflow-hidden rounded-[2rem] p-5 text-left transition-[border-color,box-shadow] duration-300 hover:border-scope/60 hover:shadow-scope-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-scope"
          >
            <span className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-scope/35 blur-2xl animate-drift" />
            <span className="absolute -bottom-14 -left-10 h-36 w-36 rounded-full bg-signal/25 blur-2xl animate-drift [animation-delay:-4s]" />

            <span className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-scope/30 animate-orbit" />
            <span className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bone/20 animate-orbit-reverse" />
            <span className="absolute left-1/2 top-[calc(50%-4.5rem)] h-3 w-3 -translate-x-1/2 rounded-full bg-signal shadow-[0_0_22px_6px_rgba(255,118,77,0.35)]" />
            <span className="absolute left-[calc(50%+4.25rem)] top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-scope-bright shadow-[0_0_18px_5px_rgba(199,228,255,0.3)]" />
            <span className="absolute bottom-[calc(50%-4.5rem)] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-bone shadow-[0_0_14px_4px_rgba(235,235,235,0.25)]" />

            <span className="relative z-10 flex w-full flex-col justify-between">
              <span className="flex items-center justify-between font-display text-xs tracking-[0.16em] text-bone-dim">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-signal" /> CREATIVE AI</span>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
              <span>
                <span className="block font-display text-2xl leading-none text-bone">Building ideas</span>
                <span className="mt-1 block font-body text-sm text-bone-dim">that move in the real world.</span>
              </span>
            </span>

            {expanded && (
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-5 bottom-5 z-20 rounded-xl border border-bone/15 bg-ink-1000/80 px-3 py-2 font-body text-xs text-bone-dim"
              >
                Vision · language · full-stack systems
              </motion.span>
            )}
          </button>
        </TiltCard>
      </motion.div>

      <motion.span
        aria-hidden="true"
        animate={reduced ? undefined : { y: [0, 8, 0], x: [0, 4, 0] }}
        transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
        className="glass-panel absolute -bottom-5 -left-7 rounded-full px-3 py-1.5 font-display text-[0.65rem] tracking-[0.14em] text-scope-bright"
      >
        TAP THE ORBIT
      </motion.span>
    </motion.div>
  );
}
