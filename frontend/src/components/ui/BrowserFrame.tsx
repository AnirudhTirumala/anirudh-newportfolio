import { useRef, type MouseEvent, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The browser-chrome mockup that hosts each project's live interactive
 * dashboard demo. Presented as a floating panel rather than a flat
 * screenshot: it drifts gently on its own, tilts in 3D to follow the
 * cursor on hover, and casts a soft contact shadow that shifts with the
 * tilt so the whole thing reads as an object hovering just above the page.
 *
 * The dashboard demos rendered inside `children` were audited to make sure
 * nothing about them depends on this wrapper NOT having a transform - see
 * the RoleSwitcher components, which listen for outside clicks directly
 * instead of relying on a viewport-relative `position: fixed` overlay, so
 * they keep working correctly no matter how this frame is tilted or moved.
 */
export function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 140, damping: 18, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [3.5, -3.5]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-3.5, 3.5]), spring);
  const shadowX = useSpring(useTransform(px, [0, 1], [16, -16]), spring);
  const shadowShift = useSpring(useTransform(py, [0, 1], [6, -6]), spring);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (reduced || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div className="tilt-perspective">
      <motion.div
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={reduced ? undefined : { y: [0, -12, 0] }}
        transition={reduced ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={reduced ? undefined : { rotateX, rotateY }}
        className="relative"
      >
        {/* Ambient contact "shadow" beneath the panel. Shifts opposite the
            tilt so it sells the sense of the panel lifting toward you. */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="absolute inset-x-8 -bottom-6 h-14 rounded-[100%] bg-black/50 blur-2xl sm:-bottom-10 sm:h-20"
            style={{ x: shadowX, y: shadowShift }}
          />
        )}
        <div className="relative overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-ink-700 bg-ink-900 px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
            </div>
            <div className="flex flex-1 items-center gap-1.5 rounded-md bg-ink-950 px-3 py-1 font-mono text-[0.7rem] text-bone-faint">
              <Lock className="h-3 w-3" /> {url}
            </div>
          </div>
          <div className="bg-ink-950 p-2 sm:p-4">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
