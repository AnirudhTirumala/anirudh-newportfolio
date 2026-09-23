import { cn } from "@/lib/utils";

/**
 * The site's shared background graphic.
 *
 * The palette and the copy both lean on an "instrument panel" idea, but that
 * only ever existed as soft glows and blur - there was no drawn detail
 * anywhere, so every section read as plain black with text on it. This adds
 * the missing precision layer: a measurement grid, edge calibration ticks,
 * plotted marks with crosshairs, and a slow scan sweep, in the same visual
 * language as the bounding boxes the vision work actually produces.
 *
 * Everything here is sized in CSS pixels rather than drawn into a fixed SVG
 * viewBox. An earlier version used `preserveAspectRatio="slice"` over a
 * 1200x800 box, which meant a section twice as tall as it was wide magnified
 * the whole graphic about 2.4x - grid squares the size of paragraphs and
 * "bounding boxes" two hundred pixels across. Pixel sizing keeps one section
 * looking like the next whatever its proportions.
 *
 * The grid itself is NOT drawn here. One `BendingGrid` is mounted for the whole
 * page in `SiteLayout` instead: a grid per section meant seven canvases and
 * nearly twelve megapixels of compositor layer, where one viewport-sized canvas
 * covers the same ground for a fraction of the cost and reads as one continuous
 * surface rather than seven that happen to line up.
 *
 * Hidden from assistive technology, and `html[data-motion="reduced"]` already
 * stops every animation globally, so the marks simply sit still for anyone
 * who asks for that.
 */
export function InstrumentField({
  className,
  accent = "scope",
  marks = true,
  sweep = true,
}: {
  className?: string;
  accent?: "scope" | "signal";
  marks?: boolean;
  sweep?: boolean;
}) {
  const line = accent === "signal" ? "var(--color-signal)" : "var(--color-scope)";

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* Calibration ticks down both edges - the detail that makes the grid
          read as an instrument rather than as graph paper. */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-around py-10">
        {TICKS.map((major, i) => (
          <span key={i} className="block h-px" style={{ width: major ? 22 : 11, background: line, opacity: major ? 0.7 : 0.4 }} />
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 flex flex-col items-end justify-around py-10">
        {TICKS.map((major, i) => (
          <span key={i} className="block h-px" style={{ width: major ? 22 : 11, background: line, opacity: major ? 0.7 : 0.4 }} />
        ))}
      </div>

      {marks &&
        MARKS.map((mark, i) => (
          <span
            key={i}
            // A 96px mark is a quarter of a phone's width and stops reading as
            // a plotted detection - it reads as a stray box over the content.
            className="absolute hidden animate-pulse-soft sm:block"
            style={{
              left: `${mark.x}%`,
              top: `${mark.y}%`,
              width: mark.w,
              height: mark.h,
              border: `1px solid ${line}`,
              opacity: mark.o,
              animationDelay: `${i * 0.9}s`,
            }}
          >
            {/* Crosshairs on the vertical and horizontal centres, the way a
                detector marks the centroid of a box it is confident about. */}
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{ background: line, opacity: 0.55 }} />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2" style={{ background: line, opacity: 0.55 }} />
          </span>
        ))}

      {sweep && (
        <span
          className="absolute inset-x-0 top-0 h-px animate-field-sweep"
          style={{ background: `linear-gradient(to right, transparent, ${line}, transparent)`, opacity: 0.55 }}
        />
      )}
    </div>
  );
}

/** true marks a major tick. */
const TICKS = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];

/** Positions are percentages so the composition holds at any section size,
 *  and they are fixed rather than random so every visitor sees the same page. */
const MARKS = [
  { x: 9, y: 12, w: 86, h: 58, o: 0.5 },
  { x: 79, y: 24, w: 62, h: 62, o: 0.4 },
  { x: 18, y: 74, w: 54, h: 40, o: 0.34 },
  { x: 69, y: 80, w: 96, h: 54, o: 0.44 },
];
