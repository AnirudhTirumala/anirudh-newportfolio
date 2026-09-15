import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, Download } from "lucide-react";
import { Marquee } from "@/components/ui/Marquee";
import { HeroOrbit } from "@/components/ui/HeroOrbit";
import { TiltCard } from "@/components/ui/TiltCard";
import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { safeExternalUrl } from "@/lib/urls";
import type { Profile } from "@/types";

const DetectionField = lazy(() => import("@/components/three/DetectionField").then((m) => ({ default: m.DetectionField })));

const TICKER_ITEMS = [
  "PYTHON",
  "PYTORCH",
  "COMPUTER VISION",
  "YOLO",
  "LLMS",
  "LANGCHAIN",
  "FASTAPI",
  "REACT",
  "TYPESCRIPT",
];

export function Hero({ profile }: { profile?: Profile }) {
  const reduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
  const name = profile?.name || "Anirudh Tirumala";
  const title = profile?.title || "AI Engineer";
  const tagline = profile?.tagline || "I build systems that see, understand, and respond.";
  const resumeUrl = safeExternalUrl(profile?.resume_url);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <section id="top" className="relative flex min-h-screen flex-col justify-end overflow-hidden pt-32">
      {/* Full-bleed reactive mechanical field, built from original geometry
          and light streaks instead of a copied image asset. */}
      <div className="absolute inset-0 -z-10">
        {isDesktop && !reduced && (
          <CanvasErrorBoundary>
            <Suspense fallback={null}>
              <DetectionField className="h-full w-full opacity-90" />
            </Suspense>
          </CanvasErrorBoundary>
        )}
        <div className="absolute inset-0 bg-ascend-metal opacity-80" />
        <div className="absolute -left-[22%] top-[32%] h-px w-[92%] bg-gradient-to-r from-transparent via-scope/90 to-transparent blur-[1px] animate-light-sweep" />
        <div className="absolute -right-[18%] bottom-[28%] h-px w-[72%] rotate-[14deg] bg-gradient-to-r from-transparent via-signal/75 to-transparent blur-[1px] animate-light-sweep [animation-delay:-4s]" />
        <div className="absolute -right-32 top-12 h-96 w-96 rounded-full bg-scope/10 blur-[120px] animate-drift" />
        <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-signal/[0.06] blur-[100px] animate-drift [animation-delay:-5s]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/42 to-ink-950/58" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-transparent to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
        <div className="grid items-end gap-7 lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:gap-10 xl:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="[perspective:1500px]"
          >
            <motion.div
              animate={reduced ? undefined : { y: [0, -10, 0], rotateX: [0, 1.5, 0], rotateY: [-1.5, 1.5, -1.5] }}
              transition={reduced ? undefined : { duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <TiltCard strength={5.5} glare>
                <div className="relative" style={{ transformStyle: "preserve-3d" }}>
                  <div style={{ transform: "translateZ(24px)" }}>
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="font-mono text-sm text-scope"
                    >
                      {title} — {profile?.location || "Kakinada, India"}
                    </motion.p>
                  </div>

                  <h1 className="mt-4 font-display font-semibold leading-[0.89] tracking-[-0.055em] text-bone" style={{ transform: "translateZ(32px)" }}>
                    {name.split(" ").map((word, i) => (
                      <span key={i} className="block overflow-hidden">
                        <motion.span
                          initial={{ y: "110%" }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                          className="block text-[15vw] sm:text-[9vw] lg:text-[clamp(4.8rem,7.3vw,7.5rem)]"
                        >
                          {word}
                        </motion.span>
                      </span>
                    ))}
                  </h1>

                  <div style={{ transform: "translateZ(20px)" }}>
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                      className="mt-6 max-w-lg font-body text-lg text-bone-dim sm:text-xl"
                    >
                      {tagline}
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.65 }}
                    className="mt-8 flex flex-wrap gap-4"
                    style={{ transform: "translateZ(28px)" }}
                  >
                    <motion.a
                      href="#work"
                      whileHover={reduced ? undefined : { y: -5, rotate: -2, scale: 1.04 }}
                      className="rounded-full bg-scope px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-950 transition-colors duration-300 hover:bg-scope-bright"
                    >
                      View the work
                    </motion.a>
                    <motion.a
                      href="#about"
                      whileHover={reduced ? undefined : { y: -5, rotate: 2, scale: 1.04 }}
                      className="rounded-full border border-ink-600 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-bone-dim transition-colors duration-300 hover:border-bone-dim hover:text-bone"
                    >
                      About me
                    </motion.a>
                    {resumeUrl && (
                      <motion.a
                        href={resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={reduced ? undefined : { y: -5, rotate: -1.5, scale: 1.04 }}
                        className="glass-panel flex items-center gap-2 rounded-full px-5 py-3 font-display text-sm text-bone transition-all duration-300 hover:border-scope/60 hover:text-scope-bright"
                      >
                        <Download className="h-4 w-4" /> Resume
                      </motion.a>
                    )}
                  </motion.div>
                </div>
              </TiltCard>
            </motion.div>
          </motion.div>
          <HeroOrbit />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }} className="mt-16">
        <Marquee items={TICKER_ITEMS} />
      </motion.div>

      <a
        href="#about"
        className="absolute bottom-28 right-6 hidden items-center gap-2 font-mono text-xs text-bone-faint transition-colors hover:text-bone-dim sm:right-10 sm:flex"
      >
        scroll <ArrowDown className="h-3 w-3 animate-pulse-soft" />
      </a>
    </section>
  );
}
