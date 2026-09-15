import type { DashboardKey } from "@/types";

interface ProjectPatternProps {
  variant: DashboardKey;
  className?: string;
}

const NETWORK_NODES: [number, number][] = [
  [55, 60],
  [190, 35],
  [335, 70],
  [95, 170],
  [255, 195],
  [175, 115],
  [330, 225],
  [40, 240],
];

const NETWORK_EDGES: [number, number][] = [
  [0, 5],
  [1, 5],
  [2, 5],
  [5, 3],
  [5, 4],
  [3, 7],
  [4, 6],
  [1, 2],
];

/** Abstract, non-photographic cover art per project - scan lines + detection boxes for the
 * computer-vision project, a connected-node network for the civic-tech project. */
export function ProjectPattern({ variant, className }: ProjectPatternProps) {
  if (variant === "lumpy") {
    return (
      <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="400" height="300" fill="var(--color-ink-900)" />
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={i * 34 + 20}
            x2="400"
            y2={i * 34 + 20}
            stroke="var(--color-scope-dim)"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
        <rect x="58" y="66" width="76" height="64" fill="none" stroke="var(--color-scope)" strokeWidth="2" />
        <text x="58" y="60" fill="var(--color-scope)" fontSize="11" fontFamily="var(--font-mono)">
          0.91
        </text>
        <rect x="232" y="148" width="98" height="78" fill="none" stroke="var(--color-scope)" strokeWidth="2" />
        <text x="232" y="142" fill="var(--color-scope)" fontSize="11" fontFamily="var(--font-mono)">
          0.87
        </text>
        <circle cx="96" cy="98" r="2" fill="var(--color-scope)" />
        <circle cx="281" cy="187" r="2" fill="var(--color-scope)" />
      </svg>
    );
  }

  if (variant === "janseva") {
    return (
      <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="400" height="300" fill="var(--color-ink-900)" />
        {NETWORK_EDGES.map(([a, b], i) => {
          const [x1, y1] = NETWORK_NODES[a];
          const [x2, y2] = NETWORK_NODES[b];
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-signal-dim)" strokeWidth="1.5" />;
        })}
        {NETWORK_NODES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 5 ? 6 : 4} fill="var(--color-signal)" opacity={i === 5 ? 1 : 0.85} />
        ))}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="300" fill="var(--color-ink-900)" />
      <rect x="40" y="40" width="320" height="220" fill="none" stroke="var(--color-bone-faint)" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}
