import { useState } from "react";
import { Tag, Calendar, FileDown, Filter, Plus } from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import { ScanTool } from "./ScanTool";
import { EmptyState, LpButton, LpCard, StatCard, StatusPill, relativeTime } from "./ui";
import type { CaseStatus } from "./mockData";

export function FarmerOverview() {
  const { cattle, cases, currentFarmerId, currentFarmerName } = useLumpyDemo();
  const myCattle = cattle.filter((c) => c.farmerId === currentFarmerId);
  const myCases = cases.filter((c) => c.farmerId === currentFarmerId);
  const activeAlerts = myCases.filter((c) => c.verdict === "positive" && c.status !== "closed").length;
  const lastScan = myCases[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="lp-display text-xl font-semibold text-[var(--lp-ink)]">Welcome back, {currentFarmerName.split(" ")[0]}</p>
        <p className="text-sm text-[var(--lp-subink)]">Here's how your herd is doing.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Cattle registered" value={String(myCattle.length)} />
        <StatCard label="Scans this month" value={String(myCases.length)} />
        <StatCard label="Active alerts" value={String(activeAlerts)} tone={activeAlerts > 0 ? "bad" : "ok"} />
        <StatCard label="Last scan" value={lastScan ? relativeTime(lastScan.capturedAt) : "—"} />
      </div>
      <ScanTool variant="farmer" />
    </div>
  );
}

export function MyCattle() {
  const { cattle, cases, currentFarmerId } = useLumpyDemo();
  const myCattle = cattle.filter((c) => c.farmerId === currentFarmerId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">My Cattle · {myCattle.length}</p>
        <LpButton variant="secondary">
          <Plus className="h-4 w-4" /> Register animal
        </LpButton>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {myCattle.map((c) => {
          const lastCase = cases.find((k) => k.cattleId === c.id);
          return (
            <LpCard key={c.id} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--lp-accent-50)] text-[var(--lp-accent-600)]">
                <Tag className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[var(--lp-ink)]">{c.name} <span className="font-normal text-[var(--lp-subink)]">· {c.tag}</span></p>
                <p className="text-xs text-[var(--lp-subink)]">{c.breed} · {c.ageMonths} months</p>
                {lastCase && <p className="mt-0.5 text-xs text-[var(--lp-subink)]">Last scan {relativeTime(lastCase.capturedAt)}</p>}
              </div>
              <StatusPill status={c.status} />
            </LpCard>
          );
        })}
      </div>
    </div>
  );
}

export function ScanHistory() {
  const { cases, currentFarmerId } = useLumpyDemo();
  const [filter, setFilter] = useState<"all" | CaseStatus>("all");
  const myCases = cases.filter((c) => c.farmerId === currentFarmerId).filter((c) => filter === "all" || c.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">Scan history</p>
        <div className="flex items-center gap-2 text-xs text-[var(--lp-subink)]">
          <Filter className="h-3.5 w-3.5" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | CaseStatus)} className="rounded-lg border border-[var(--lp-hairline)] bg-white px-2 py-1.5 text-xs">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_review">In review</option>
            <option value="confirmed">Confirmed</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      {myCases.length === 0 ? (
        <EmptyState title="No scans yet" body="Run your first scan from New Scan to see it appear here." />
      ) : (
        <div className="space-y-2">
          {myCases.map((c) => (
            <LpCard key={c.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--lp-ink)]">{c.cattleName}</p>
                <p className="flex items-center gap-1 text-xs text-[var(--lp-subink)]">
                  <Calendar className="h-3 w-3" /> {new Date(c.capturedAt).toLocaleDateString()} · {(c.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={c.verdict} />
                <StatusPill status={c.status} />
              </div>
            </LpCard>
          ))}
        </div>
      )}
    </div>
  );
}

export function Reports() {
  const { cases, currentFarmerId, currentFarmerName } = useLumpyDemo();
  const myCases = cases.filter((c) => c.farmerId === currentFarmerId && c.verdict === "positive");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">Health reports</p>
        <LpButton variant="ghost" onClick={() => window.print()}>
          <FileDown className="h-4 w-4" /> Print / export
        </LpButton>
      </div>
      {myCases.length === 0 ? (
        <EmptyState title="Nothing to report" body="Reports are generated automatically whenever a scan flags a possible case." />
      ) : (
        <div className="space-y-3">
          {myCases.map((c) => (
            <LpCard key={c.id}>
              <div className="mb-3 flex items-center justify-between border-b border-[var(--lp-hairline)] pb-3">
                <p className="lp-display font-semibold text-[var(--lp-ink)]">LSD Field Report · {c.id}</p>
                <StatusPill status={c.status} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-xs text-[var(--lp-subink)]">Animal</dt><dd className="text-[var(--lp-ink)]">{c.cattleName}</dd></div>
                <div><dt className="text-xs text-[var(--lp-subink)]">Owner</dt><dd className="text-[var(--lp-ink)]">{currentFarmerName}</dd></div>
                <div><dt className="text-xs text-[var(--lp-subink)]">Location</dt><dd className="text-[var(--lp-ink)]">{c.village}, {c.district}</dd></div>
                <div><dt className="text-xs text-[var(--lp-subink)]">Date</dt><dd className="text-[var(--lp-ink)]">{new Date(c.capturedAt).toLocaleDateString()}</dd></div>
                <div><dt className="text-xs text-[var(--lp-subink)]">Confidence</dt><dd className="text-[var(--lp-ink)]">{(c.confidence * 100).toFixed(1)}%</dd></div>
                <div><dt className="text-xs text-[var(--lp-subink)]">Severity</dt><dd className="capitalize text-[var(--lp-ink)]">{c.severity ?? "—"}</dd></div>
              </dl>
              {c.notes.length > 0 && (
                <p className="mt-3 border-t border-[var(--lp-hairline)] pt-3 text-sm text-[var(--lp-subink)]">
                  <span className="font-medium text-[var(--lp-ink)]">Vet note:</span> {c.notes[c.notes.length - 1].text}
                </p>
              )}
            </LpCard>
          ))}
        </div>
      )}
    </div>
  );
}
