import { useEffect, useState, type FormEvent } from "react";
import { Tag, Calendar, FileDown, Filter, Plus } from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import { ScanTool } from "./ScanTool";
import { EmptyState, LpButton, LpCard, LumpyPortal, Modal, StatCard, StatusPill, relativeTime } from "./ui";
import { BREEDS, CASE_STATUS_OPTIONS, type CaseStatus, type ScanCase } from "./mockData";

const FIELD_CLASS = "w-full rounded-lg border border-[var(--lp-hairline)] px-3 py-2 text-sm outline-none focus:border-[var(--lp-accent-400)]";

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

/** Always mounted fresh by its caller, so the form starts empty on every open
 * without needing a reset pass when the dialog closes. */
function RegisterAnimalDialog({ onClose }: { onClose: () => void }) {
  const { addCattle } = useLumpyDemo();
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [breed, setBreed] = useState(BREEDS[0]);
  const [ageMonths, setAgeMonths] = useState("24");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give the animal a name so you can pick it out later.");
      return;
    }
    const age = Number(ageMonths);
    if (!Number.isFinite(age) || age < 1 || age > 360) {
      setError("Enter an age in months, somewhere between 1 and 360.");
      return;
    }
    addCattle({ name, tag, breed, ageMonths: Math.round(age) });
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Register an animal">
      <form className="space-y-3" onSubmit={submit}>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ganga" className={FIELD_CLASS} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Ear tag (optional)</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="AP-EG-4300" className={FIELD_CLASS} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Breed</span>
            <select value={breed} onChange={(e) => setBreed(e.target.value)} className={FIELD_CLASS}>
              {BREEDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Age (months)</span>
            <input value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} inputMode="numeric" className={FIELD_CLASS} />
          </label>
        </div>
        {error && <p className="text-xs text-[var(--lp-bad)]">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <LpButton variant="ghost" onClick={onClose}>Cancel</LpButton>
          <LpButton type="submit"><Plus className="h-4 w-4" /> Register</LpButton>
        </div>
      </form>
    </Modal>
  );
}

export function MyCattle() {
  const { cattle, cases, currentFarmerId } = useLumpyDemo();
  const [registering, setRegistering] = useState(false);
  const myCattle = cattle.filter((c) => c.farmerId === currentFarmerId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">My Cattle · {myCattle.length}</p>
        <LpButton variant="secondary" onClick={() => setRegistering(true)}>
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
      {registering && <RegisterAnimalDialog onClose={() => setRegistering(false)} />}
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
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | CaseStatus)}
            aria-label="Filter scans by status"
            className="rounded-lg border border-[var(--lp-hairline)] bg-white px-2 py-1.5 text-xs"
          >
            <option value="all">All</option>
            {CASE_STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
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

function ReportCard({ scan, ownerName }: { scan: ScanCase; ownerName: string }) {
  return (
    <LpCard>
      <div className="mb-3 flex items-center justify-between border-b border-[var(--lp-hairline)] pb-3">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">LSD Field Report · {scan.id}</p>
        <StatusPill status={scan.status} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-[var(--lp-subink)]">Animal</dt><dd className="text-[var(--lp-ink)]">{scan.cattleName}</dd></div>
        <div><dt className="text-xs text-[var(--lp-subink)]">Owner</dt><dd className="text-[var(--lp-ink)]">{ownerName}</dd></div>
        <div><dt className="text-xs text-[var(--lp-subink)]">Location</dt><dd className="text-[var(--lp-ink)]">{scan.village}, {scan.district}</dd></div>
        <div><dt className="text-xs text-[var(--lp-subink)]">Date</dt><dd className="text-[var(--lp-ink)]">{new Date(scan.capturedAt).toLocaleDateString()}</dd></div>
        <div><dt className="text-xs text-[var(--lp-subink)]">Confidence</dt><dd className="text-[var(--lp-ink)]">{(scan.confidence * 100).toFixed(1)}%</dd></div>
        <div><dt className="text-xs text-[var(--lp-subink)]">Severity</dt><dd className="capitalize text-[var(--lp-ink)]">{scan.severity ?? "—"}</dd></div>
      </dl>
      {scan.notes.length > 0 && (
        <p className="mt-3 border-t border-[var(--lp-hairline)] pt-3 text-sm text-[var(--lp-subink)]">
          <span className="font-medium text-[var(--lp-ink)]">Vet note:</span> {scan.notes[scan.notes.length - 1].text}
        </p>
      )}
    </LpCard>
  );
}

export function Reports() {
  const { cases, currentFarmerId, currentFarmerName } = useLumpyDemo();
  const [printing, setPrinting] = useState(false);
  const myCases = cases.filter((c) => c.farmerId === currentFarmerId && c.verdict === "positive");

  // On screen the reports live inside a fixed-height scrolling pane on a dark
  // page, so printing them where they sit gives the whole portfolio with one
  // clipped screenful of report in it. A standalone copy is portalled to the
  // document root instead, and the print stylesheet drops everything but that
  // copy while the dialog is up.
  useEffect(() => {
    if (!printing) return;
    document.body.classList.add("lumpy-printing");
    // One frame so the portalled sheet is painted before print() blocks.
    const frame = window.requestAnimationFrame(() => {
      try {
        window.print();
      } finally {
        setPrinting(false);
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.classList.remove("lumpy-printing");
    };
  }, [printing]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">Health reports</p>
        <LpButton variant="ghost" onClick={() => setPrinting(true)} disabled={printing || myCases.length === 0}>
          <FileDown className="h-4 w-4" /> Print / export
        </LpButton>
      </div>
      {myCases.length === 0 ? (
        <EmptyState title="Nothing to report" body="Reports are generated automatically whenever a scan flags a possible case." />
      ) : (
        <div className="space-y-3">
          {myCases.map((c) => (
            <ReportCard key={c.id} scan={c} ownerName={currentFarmerName} />
          ))}
        </div>
      )}
      {printing && (
        <LumpyPortal>
          <div className="lumpy-print-sheet p-8">
            <p className="lp-display text-xl font-semibold text-[var(--lp-ink)]">LSD field reports · {currentFarmerName}</p>
            <p className="mb-6 mt-1 text-sm text-[var(--lp-subink)]">
              LumpyDetect AI · generated {new Date().toLocaleDateString()} · {myCases.length} case{myCases.length === 1 ? "" : "s"}
            </p>
            <div className="space-y-4">
              {myCases.map((c) => (
                <ReportCard key={c.id} scan={c} ownerName={currentFarmerName} />
              ))}
            </div>
          </div>
        </LumpyPortal>
      )}
    </div>
  );
}
