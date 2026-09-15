import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import { LpCard } from "./ui";
import { VILLAGES } from "./mockData";

// Fixed, roughly-plausible relative positions for the district's villages on
// a stylized (not geographically accurate) map canvas.
const VILLAGE_POSITIONS: Record<string, [number, number]> = {
  Peddapuram: [30, 35],
  Samalkot: [55, 55],
  Pithapuram: [72, 40],
  Tuni: [85, 20],
  Prathipadu: [22, 60],
  "Kakinada Rural": [60, 75],
  Jaggampeta: [40, 20],
  Gollaprolu: [78, 62],
};

export function OutbreakMap() {
  const { cases } = useLumpyDemo();
  const [active, setActive] = useState<string | null>(null);

  const stats = useMemo(() => {
    const byVillage = new Map<string, { positive: number; total: number }>();
    VILLAGES.forEach((v) => byVillage.set(v, { positive: 0, total: 0 }));
    cases.forEach((c) => {
      const entry = byVillage.get(c.village) ?? { positive: 0, total: 0 };
      entry.total += 1;
      if (c.verdict === "positive" && c.status !== "closed") entry.positive += 1;
      byVillage.set(c.village, entry);
    });
    return byVillage;
  }, [cases]);

  const maxPositive = Math.max(1, ...Array.from(stats.values()).map((s) => s.positive));

  return (
    <LpCard className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--lp-hairline)] p-4">
        <div>
          <p className="lp-display font-semibold text-[var(--lp-ink)]">Outbreak map · East Godavari</p>
          <p className="text-xs text-[var(--lp-subink)]">Active positive cases by village (last 14 days)</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--lp-subink)]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--lp-ok)]" /> low</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--lp-warn)]" /> med</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--lp-bad)]" /> high</span>
        </div>
      </div>
      <div className="grid gap-0 md:grid-cols-[1fr_220px]">
        <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#EAF3E6,#F7F7FB)] md:aspect-auto md:h-[380px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#DADFD5" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            <path d="M0,55 Q25,45 50,58 T100,50" fill="none" stroke="#B7C9AE" strokeWidth="0.6" opacity="0.6" />
          </svg>
          {Array.from(stats.entries()).map(([village, s]) => {
            const [x, y] = VILLAGE_POSITIONS[village] ?? [50, 50];
            const size = 10 + (s.positive / maxPositive) * 16;
            const color = s.positive === 0 ? "var(--lp-ok)" : s.positive / maxPositive > 0.66 ? "var(--lp-bad)" : "var(--lp-warn)";
            return (
              <button
                key={village}
                onClick={() => setActive(village)}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span
                  className="rounded-full opacity-80 ring-2 ring-white transition-transform hover:scale-110"
                  style={{ width: size, height: size, backgroundColor: color }}
                />
                {active === village && (
                  <span className="lp-mono mt-1 rounded bg-[var(--lp-navy)] px-2 py-1 text-[0.6rem] text-white shadow-lg">
                    {village}: {s.positive} active
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="max-h-[380px] overflow-y-auto lp-scrollbar divide-y divide-[var(--lp-hairline)]">
          {Array.from(stats.entries())
            .sort((a, b) => b[1].positive - a[1].positive)
            .map(([village, s]) => (
              <button
                key={village}
                onClick={() => setActive(village)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-gray-50 ${active === village ? "bg-[var(--lp-accent-50)]" : ""}`}
              >
                <span className="flex items-center gap-2 text-[var(--lp-ink)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--lp-subink)]" /> {village}
                </span>
                <span className="lp-mono text-xs text-[var(--lp-subink)]">{s.positive} active</span>
              </button>
            ))}
        </div>
      </div>
    </LpCard>
  );
}
