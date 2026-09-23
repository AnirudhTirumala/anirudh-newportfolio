import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, MapPin, Search, Send, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useLumpyDemo } from "./DemoContext";
import { ScanTool } from "./ScanTool";
import { EmptyState, LpButton, LpCard, Modal, StatCard, StatusPill, relativeTime } from "./ui";
import { CASE_STATUS_OPTIONS, type CaseStatus } from "./mockData";

export function DoctorOverview() {
  const { cases } = useLumpyDemo();
  const pending = cases.filter((c) => c.verdict === "positive" && (c.status === "pending" || c.status === "in_review"));
  const confirmedToday = cases.filter((c) => c.status === "confirmed").length;
  const severe = cases.filter((c) => c.severity === "severe" && c.status !== "closed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Awaiting review" value={String(pending.length)} tone={pending.length > 0 ? "warn" : "ok"} />
        <StatCard label="Confirmed cases" value={String(confirmedToday)} tone="bad" />
        <StatCard label="Severe cases" value={String(severe)} tone="bad" />
        <StatCard label="Avg. confidence" value={`${Math.round((cases.reduce((a, c) => a + c.confidence, 0) / Math.max(1, cases.length)) * 100)}%`} />
      </div>
      <LpCard>
        <p className="lp-display mb-3 font-semibold text-[var(--lp-ink)]">Needs your attention</p>
        {pending.length === 0 ? (
          <EmptyState title="Queue is clear" body="No scans are waiting on a review right now." />
        ) : (
          <div className="space-y-2">
            {pending.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--lp-hairline)] px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--lp-ink)]">{c.cattleName} · {c.farmerName}</p>
                  <p className="text-xs text-[var(--lp-subink)]">{c.village} · {relativeTime(c.capturedAt)}</p>
                </div>
                <StatusPill status={c.status} />
              </div>
            ))}
          </div>
        )}
      </LpCard>
    </div>
  );
}

const STATUS_TABS: { key: "all" | CaseStatus; label: string }[] = [{ key: "all", label: "All" }, ...CASE_STATUS_OPTIONS];

export function CaseQueue() {
  const { cases, updateCaseStatus, addCaseNote } = useLumpyDemo();
  const [tab, setTab] = useState<"all" | CaseStatus>("pending");
  const [query, setQuery] = useState("");
  // Only the id is held: keeping the case object itself froze the dialog on
  // the row as it was when it was clicked, so a note saved from inside it
  // never joined the list above the input until the case was reopened.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const selected = selectedId ? cases.find((c) => c.id === selectedId) ?? null : null;

  const filtered = useMemo(
    () =>
      cases
        .filter((c) => c.verdict === "positive")
        .filter((c) => tab === "all" || c.status === tab)
        .filter((c) => `${c.cattleName} ${c.farmerName} ${c.village}`.toLowerCase().includes(query.toLowerCase())),
    [cases, tab, query],
  );

  function act(status: CaseStatus) {
    if (!selected) return;
    updateCaseStatus(selected.id, status, "Dr. Kavitha Nair");
  }

  function saveNote() {
    if (!selected || !note.trim()) return;
    addCaseNote(selected.id, "Dr. Kavitha Nair", note.trim());
    setNote("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === t.key ? "bg-[var(--lp-accent-500)] text-white" : "bg-white text-[var(--lp-subink)] border border-[var(--lp-hairline)]"}`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-[var(--lp-hairline)] bg-white px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--lp-subink)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cases..."
            aria-label="Search cases"
            className="w-32 text-xs outline-none sm:w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No cases here" body="Try a different filter or check back after the next scan comes in." />
      ) : (
        <LpCard className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-[var(--lp-hairline)] text-left text-xs uppercase tracking-wide text-[var(--lp-subink)]">
                <th className="px-4 py-3 font-medium">Animal</th>
                <th className="px-4 py-3 font-medium">Farmer</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer border-b border-[var(--lp-hairline)] last:border-0 hover:bg-gray-50">
                  {/* The row click is a convenience for the mouse; the animal
                      name is a real control so the review dialog - the only
                      place a case can be actioned - is reachable by keyboard. */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(c.id);
                      }}
                      className="rounded text-left font-medium text-[var(--lp-ink)] hover:underline"
                    >
                      {c.cattleName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--lp-subink)]">{c.farmerName}</td>
                  <td className="px-4 py-3 text-[var(--lp-subink)]">{(c.confidence * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3 text-[var(--lp-subink)]">{relativeTime(c.capturedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LpCard>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title={selected ? `${selected.cattleName} · ${selected.id}` : ""} wide>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--lp-subink)]">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {selected.farmerName}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selected.village}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(selected.capturedAt).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selected.status} />
              {selected.severity && <StatusPill status={selected.severity} />}
              <span className="lp-mono text-xs text-[var(--lp-subink)]">{(selected.confidence * 100).toFixed(1)}% model confidence</span>
            </div>
            {selected.severity === "severe" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--lp-bad)]">
                <AlertTriangle className="h-4 w-4" /> High severity — recommend prioritizing this case.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <LpButton variant="secondary" onClick={() => act("in_review")}>Mark in review</LpButton>
              <LpButton onClick={() => act("confirmed")}>Confirm case</LpButton>
              <LpButton variant="danger" onClick={() => act("flagged")}>Flag for follow-up</LpButton>
              <LpButton variant="ghost" onClick={() => act("closed")}>Close case</LpButton>
            </div>
            <div className="border-t border-[var(--lp-hairline)] pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--lp-subink)]">Clinical notes</p>
              <div className="mb-2 space-y-2">
                {selected.notes.length === 0 && <p className="text-sm text-[var(--lp-subink)]">No notes on this case yet.</p>}
                {selected.notes.map((n, i) => (
                  <p key={i} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-[var(--lp-ink)]">
                    <span className="font-medium">{n.author}:</span> {n.text}
                  </p>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveNote();
                    }
                  }}
                  placeholder="Add a clinical note..."
                  aria-label="Add a clinical note"
                  className="flex-1 rounded-lg border border-[var(--lp-hairline)] px-3 py-2 text-sm outline-none focus:border-[var(--lp-accent-400)]"
                />
                <LpButton onClick={saveNote} disabled={!note.trim()}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Save note</span>
                </LpButton>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function PatientRecords() {
  const { cattle, cases } = useLumpyDemo();
  const grouped = useMemo(() => {
    const map = new Map<string, { farmerName: string; village: string; animals: number; cases: number; lastSeen?: string }>();
    cattle.forEach((c) => {
      const entry = map.get(c.farmerId) ?? { farmerName: c.farmerName, village: c.village, animals: 0, cases: 0 };
      entry.animals += 1;
      map.set(c.farmerId, entry);
    });
    cases.forEach((c) => {
      const entry = map.get(c.farmerId);
      if (entry) {
        entry.cases += 1;
        if (!entry.lastSeen || c.capturedAt > entry.lastSeen) entry.lastSeen = c.capturedAt;
      }
    });
    return Array.from(map.values());
  }, [cattle, cases]);

  return (
    <LpCard className="overflow-x-auto p-0">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-[var(--lp-hairline)] text-left text-xs uppercase tracking-wide text-[var(--lp-subink)]">
            <th className="px-4 py-3 font-medium">Farmer</th>
            <th className="px-4 py-3 font-medium">Village</th>
            <th className="px-4 py-3 font-medium">Animals</th>
            <th className="px-4 py-3 font-medium">Scans on file</th>
            <th className="px-4 py-3 font-medium">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((g, i) => (
            <tr key={i} className="border-b border-[var(--lp-hairline)] last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-[var(--lp-ink)]">{g.farmerName}</td>
              <td className="px-4 py-3 text-[var(--lp-subink)]">{g.village}</td>
              <td className="px-4 py-3 text-[var(--lp-subink)]">{g.animals}</td>
              <td className="px-4 py-3 text-[var(--lp-subink)]">{g.cases}</td>
              <td className="px-4 py-3 text-[var(--lp-subink)]">{g.lastSeen ? relativeTime(g.lastSeen) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </LpCard>
  );
}

export function DoctorScanTab() {
  return <ScanTool variant="clinical" />;
}

export function LumpyAnalytics() {
  const { cases } = useLumpyDemo();

  const byDay = useMemo(() => {
    const days: { label: string; scans: number; positive: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const dayCases = cases.filter((c) => new Date(c.capturedAt).toDateString() === d.toDateString());
      days.push({ label, scans: dayCases.length, positive: dayCases.filter((c) => c.verdict === "positive").length });
    }
    return days;
  }, [cases]);

  const byVillage = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => {
      if (c.verdict === "positive") map.set(c.village, (map.get(c.village) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([village, count]) => ({ village, count })).sort((a, b) => b.count - a.count);
  }, [cases]);

  return (
    <div className="space-y-4">
      <LpCard>
        <p className="lp-display mb-4 font-semibold text-[var(--lp-ink)]">Scans over the last 7 days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lp-hairline)" />
              <XAxis dataKey="label" stroke="var(--lp-subink)" fontSize={12} />
              <YAxis stroke="var(--lp-subink)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--lp-hairline)" }} />
              <Line type="monotone" dataKey="scans" stroke="var(--lp-accent-500)" strokeWidth={2} name="Total scans" />
              <Line type="monotone" dataKey="positive" stroke="var(--lp-bad)" strokeWidth={2} name="Positive" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </LpCard>
      <LpCard>
        <p className="lp-display mb-4 font-semibold text-[var(--lp-ink)]">Positive cases by village</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byVillage}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lp-hairline)" />
              <XAxis dataKey="village" stroke="var(--lp-subink)" fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="var(--lp-subink)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--lp-hairline)" }} />
              <Bar dataKey="count" fill="var(--lp-accent-500)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </LpCard>
    </div>
  );
}
