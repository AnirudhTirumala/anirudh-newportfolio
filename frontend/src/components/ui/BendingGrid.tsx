import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * One pointer listener for every grid on the page.
 *
 * There is a grid per section, and each one attaching its own `pointermove`
 * handler meant seven layout-reading callbacks firing on every mouse move.
 * They all want the same two numbers, so the position is tracked once here and
 * the grids read it when they draw.
 */
const cursor = { x: -9999, y: -9999, seen: false };
let cursorListenerCount = 0;

function handleWindowPointerMove(event: PointerEvent) {
  cursor.x = event.clientX;
  cursor.y = event.clientY;
  cursor.seen = true;
}

function retainCursorTracking(): () => void {
  if (cursorListenerCount === 0) {
    window.addEventListener("pointermove", handleWindowPointerMove, { passive: true });
  }
  cursorListenerCount += 1;
  return () => {
    cursorListenerCount -= 1;
    if (cursorListenerCount === 0) {
      window.removeEventListener("pointermove", handleWindowPointerMove);
    }
  };
}

/**
 * The measurement grid, drawn to a canvas so it can bend around the pointer.
 *
 * As a pair of CSS repeating-gradients the grid was perfectly straight and
 * completely inert. Drawing it here costs one canvas per section but makes the
 * lines a surface the visitor can push into: each vertex is displaced away
 * from the cursor with a smooth falloff, so the grid swells locally the way a
 * lens distorts what is behind it, then relaxes when the pointer leaves.
 *
 * Cost is kept honest by only running a frame loop while it is needed. The
 * loop starts on pointer movement over the section and stops once the bulge
 * has finished relaxing, so an idle page does no work at all.
 */
export function BendingGrid({
  className,
  accent = "scope",
  step = 64,
  /** How far, in pixels, the pointer pushes the lines at the centre of its reach. */
  strength = 26,
  /** Radius of the pointer's influence, in pixels. */
  radius = 190,
  reduced = false,
}: {
  className?: string;
  accent?: "scope" | "signal";
  step?: number;
  strength?: number;
  radius?: number;
  reduced?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // Pointer state lives in refs: it changes every mousemove, and nothing in
  // the DOM renders it, so putting it in state would re-render for nothing.
  const pointer = useRef({ x: -9999, y: -9999, strength: 0 });
  const target = useRef({ x: -9999, y: -9999, strength: 0 });
  const frame = useRef(0);
  const running = useRef(false);
  const syncTargetRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // A 1px hairline gains nothing from a high device ratio, and this canvas
    // covers the whole viewport, so the pixel count is what matters most.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;

    const style = getComputedStyle(host);
    const stroke =
      style.getPropertyValue(accent === "signal" ? "--color-signal" : "--color-scope").trim() || "#c7e4ff";

    const resize = () => {
      width = Math.max(1, Math.round(window.innerWidth));
      height = Math.max(1, Math.round(window.innerHeight));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    /** Push a point away from the pointer, with a smooth falloff to nothing
     *  at `radius`. Squaring the falloff keeps the very centre rounded rather
     *  than coming to a point. */
    const displace = (x: number, y: number): [number, number] => {
      const { x: px, y: py, strength: s } = pointer.current;
      if (s <= 0.001) return [x, y];
      const dx = x - px;
      const dy = y - py;
      const distance = Math.hypot(dx, dy);
      if (distance > radius || distance < 0.0001) return [x, y];
      const falloff = (1 - distance / radius) ** 2;
      const push = falloff * strength * s;
      return [x + (dx / distance) * push, y + (dy / distance) * push];
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;

      // Fade the grid toward the middle of the section, where it would
      // otherwise compete with body copy, and let it read at the edges.
      const fade = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.1,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72,
      );
      fade.addColorStop(0, "rgba(255,255,255,0.05)");
      fade.addColorStop(0.5, "rgba(255,255,255,0.16)");
      fade.addColorStop(1, "rgba(255,255,255,0.4)");
      ctx.globalAlpha = 1;

      // Sampling every ~16px along each line is enough for the bend to read as
      // a curve rather than a hinge, without drawing a point per pixel.
      const sample = 16;

      const strokeLine = (points: [number, number][]) => {
        ctx.beginPath();
        points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      };

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke;

      // The canvas is fixed to the viewport, so the lines are offset by the
      // scroll position. Without this the grid would ride along with the
      // screen and read as an overlay rather than as part of the page.
      const offset = window.scrollY % step;
      ctx.globalAlpha = 0.28;

      for (let x = 0; x <= width; x += step) {
        const points: [number, number][] = [];
        for (let y = 0; y <= height + sample; y += sample) points.push(displace(x, Math.min(y, height)));
        strokeLine(points);
      }
      for (let y = -offset; y <= height; y += step) {
        const points: [number, number][] = [];
        for (let x = 0; x <= width + sample; x += sample) points.push(displace(Math.min(x, width), y));
        strokeLine(points);
      }
      ctx.restore();

      // Apply the centre fade by punching the gradient over the finished grid.
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.globalAlpha = 1;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    let lastScroll = window.scrollY;
    const tick = () => {
      syncTargetRef.current?.();
      const p = pointer.current;
      const t = target.current;
      // Chase the pointer rather than snapping to it, so the bulge has some
      // weight and keeps moving for a moment after the cursor stops.
      p.x += (t.x - p.x) * 0.18;
      p.y += (t.y - p.y) * 0.18;
      p.strength += (t.strength - p.strength) * 0.09;
      draw();

      const settled =
        Math.abs(t.strength - p.strength) < 0.005 &&
        Math.abs(t.x - p.x) < 0.5 &&
        Math.abs(t.y - p.y) < 0.5 &&
        window.scrollY === lastScroll;
      lastScroll = window.scrollY;
      if (settled) {
        running.current = false;
        p.strength = 0;
        draw();
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running.current || reduced) return;
      running.current = true;
      frame.current = requestAnimationFrame(tick);
    };

    /** Read the shared cursor. The canvas is fixed to the viewport, so the
     *  cursor's client coordinates are already the canvas coordinates - no
     *  layout read needed at all. */
    const syncTarget = () => {
      if (!cursor.seen) return;
      if (pointer.current.strength === 0) {
        // Arriving: put the bulge under the cursor rather than sliding it in
        // from wherever the pointer was last seen.
        pointer.current.x = cursor.x;
        pointer.current.y = cursor.y;
      }
      target.current.x = cursor.x;
      target.current.y = cursor.y;
      target.current.strength = 1;
    };
    syncTargetRef.current = syncTarget;

    resize();

    const releaseCursor = retainCursorTracking();
    const onMove = () => start();
    // Scrolling shifts the grid's offset, so it has to be redrawn - but only
    // one frame's worth, and only for a canvas that is now viewport-sized.
    const onScroll = () => start();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      releaseCursor();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame.current);
      running.current = false;
    };
  }, [accent, step, strength, radius, reduced]);

  return (
    <div ref={hostRef} aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
