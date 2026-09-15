import { useRef, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. Kept small so text stays readable mid-tilt. */
  strength?: number;
  glare?: boolean;
}

/**
 * Wraps children in a card that tilts toward the pointer in 3D and springs
 * back to flat on leave. Used sparingly - on the elements that are actually
 * meant to feel like physical objects (project tiles, credential cards),
 * not on every hoverable thing on the page.
 */
export function TiltCard({ children, className, strength = 8, glare = true }: TiltCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springConfig = { stiffness: 260, damping: 24, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [strength, -strength]), springConfig);
  const rotateY = useSpring(useTransform(px, [0, 1], [-strength, strength]), springConfig);
  const glareX = useTransform(px, [0, 1], [0, 100]);
  const glareY = useTransform(py, [0, 1], [0, 100]);
  // Computed unconditionally (rules of hooks) even when `glare` is false;
  // the div that consumes it is what's actually conditional below.
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]: number[]) => `radial-gradient(340px circle at ${gx}% ${gy}%, rgba(237,233,223,0.09), transparent 65%)`,
  );

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div className="tilt-perspective">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={reduced ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("group relative will-change-transform", className)}
      >
        {children}
        {glare && !reduced && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: glareBackground }}
          />
        )}
      </motion.div>
    </div>
  );
}
