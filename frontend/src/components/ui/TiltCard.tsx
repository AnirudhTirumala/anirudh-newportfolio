import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /**
   * Applied to the outer perspective wrapper rather than the tilting card.
   * That wrapper is an ordinary auto-height block, so a card inside a grid
   * could never stretch to its row: an `h-full` on `className` resolved
   * against the wrapper and did nothing. Pass `wrapperClassName="h-full"`
   * (with `className="h-full"` too) for an equal-height grid of cards.
   */
  wrapperClassName?: string;
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
export function TiltCard({ children, className, wrapperClassName, strength = 8, glare = true }: TiltCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
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

  function handleEnter() {
    if (!reduced) setActive(true);
  }

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
    setActive(false);
  }

  return (
    <div className={cn("tilt-perspective", wrapperClassName)}>
      <motion.div
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={reduced ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        // `will-change` is a promise to the browser that costs a permanent
        // compositor layer, and the page now has twenty-seven of these cards.
        // Holding all of them on the GPU for a transform that only happens
        // under the pointer was memory and compositing work for nothing, so
        // the hint is raised on enter and dropped again on leave.
        className={cn("group relative", active && "will-change-transform", className)}
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
