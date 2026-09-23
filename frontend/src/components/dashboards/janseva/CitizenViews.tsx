import { useState } from "react";
import { Award, ClipboardList, FileText, Plus, Send } from "lucide-react";
import { useJanSevaDemo } from "./DemoContext";
import { EmptyState, JsButton, JsCard, Modal, StatCard, StatusPill, relativeTime } from "./ui";
import type { CertificateType, IssueCategory } from "./mockData";

export function CitizenDashboard() {
  const { applications, certificates, issues, citizenName } = useJanSevaDemo();
  const mine = applications.filter((a) => a.citizenName === citizenName);
  const myCerts = certificates.filter((c) => c.citizenName === citizenName);
  const myIssues = issues.filter((i) => i.raisedBy === citizenName);
  const pendingCount = mine.filter((a) => a.status === "pending" || a.status === "under_review").length;

  return (
    <div className="space-y-6">
      <div className="js-hero relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="js-hero-grid" />
        <div className="relative">
          <span className="js-live-pill"><span /> LIVE PORTAL</span>
          <p className="js-display mt-4 text-2xl font-semibold text-white sm:text-3xl">Welcome, {citizenName.split(" ")[0]}</p>
          <p className="mt-1 max-w-md text-sm text-white/60">Everything you've applied for, reported, or requested from the Panchayat office, in one place.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Applications" value={String(mine.length)} sub={`${pendingCount} pending`} />
        <StatCard label="Certificates" value={String(myCerts.length)} />
        <StatCard label="Issues raised" value={String(myIssues.length)} />
        <StatCard label="Resolved issues" value={String(myIssues.filter((i) => i.status === "resolved").length)} />
      </div>
      <JsCard tilt={false}>
        <p className="js-display mb-3 font-semibold text-[var(--js-ink)]">Recent activity</p>
        <div className="space-y-2">
          {mine.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 text-sm">
              <span className="text-[var(--js-ink)]">Applied to <b>{a.schemeName}</b></span>
              <StatusPill status={a.status} />
            </div>
          ))}
          {mine.length === 0 && <p className="text-sm text-[var(--js-ink-soft)]">No applications yet - browse schemes to get started.</p>}
        </div>
      </JsCard>
    </div>
  );
}

export function BrowseSchemes() {
  const { schemes, applications, citizenName, applyToScheme } = useJanSevaDemo();
  const appliedIds = new Set(applications.filter((a) => a.citizenName === citizenName).map((a) => a.schemeId));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {schemes.map((s) => {
        const applied = appliedIds.has(s.id);
        return (
          <JsCard key={s.id} className="flex flex-col">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="js-display font-semibold text-[var(--js-ink)]">{s.name}</p>
              {!s.active && <StatusPill status="rejected" label="Closed" />}
            </div>
            <p className="text-xs uppercase tracking-wide text-[var(--js-ink-soft)]">{s.department}</p>
            <p className="mt-2 flex-1 text-sm text-[var(--js-ink-soft)]">{s.description}</p>
            <div className="mt-3 space-y-1 text-xs text-[var(--js-ink-soft)]">
              <p><b className="text-[var(--js-ink)]">Eligibility:</b> {s.eligibility}</p>
              <p><b className="text-[var(--js-ink)]">Benefit:</b> {s.benefit}</p>
            </div>
            <JsButton
              variant={applied ? "ghost" : "primary"}
              disabled={applied || !s.active}
              onClick={() => applyToScheme(s.id)}
              className="mt-4 w-full"
            >
              {applied ? "Already applied" : s.active ? "Apply now" : "Not accepting applications"}
            </JsButton>
          </JsCard>
        );
      })}
    </div>
  );
}

export function MyApplications() {
  const { applications, citizenName } = useJanSevaDemo();
  const mine = applications.filter((a) => a.citizenName === citizenName);

  if (mine.length === 0) return <EmptyState title="No applications yet" body="Anything you apply for under Browse Schemes will show up here with its status." />;

  return (
    <div className="space-y-2">
      {mine.map((a) => (
        <JsCard key={a.id} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 shrink-0 text-[var(--js-red)]" />
            <div>
              <p className="font-medium text-[var(--js-ink)]">{a.schemeName}</p>
              <p className="text-xs text-[var(--js-ink-soft)]">Submitted {relativeTime(a.submittedAt)}{a.remarks ? ` · ${a.remarks}` : ""}</p>
            </div>
          </div>
          <StatusPill status={a.status} />
        </JsCard>
      ))}
    </div>
  );
}

const CERT_TYPES: CertificateType[] = ["Income Certificate", "Residence Certificate", "Caste Certificate", "Birth Certificate"];

export function MyCertificates() {
  const { certificates, citizenName, requestCertificate } = useJanSevaDemo();
  const mine = certificates.filter((c) => c.citizenName === citizenName);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="js-display font-semibold text-[var(--js-ink)]">My Certificates</p>
        <JsButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Request certificate</JsButton>
      </div>
      {mine.length === 0 ? (
        <EmptyState title="No certificates requested" body="Request an income, residence, caste, or birth certificate any time." />
      ) : (
        <div className="space-y-2">
          {mine.map((c) => (
            <JsCard key={c.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 shrink-0 text-[var(--js-red)]" />
                <div>
                  <p className="font-medium text-[var(--js-ink)]">{c.type}</p>
                  <p className="text-xs text-[var(--js-ink-soft)]">
                    {c.status === "issued" ? `Issued ${relativeTime(c.issuedOn ?? c.requestedAt)} · No. ${c.certificateNo}` : `Requested ${relativeTime(c.requestedAt)}`}
                  </p>
                </div>
              </div>
              <StatusPill status={c.status} />
            </JsCard>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Request a certificate">
        <div className="space-y-2">
          {CERT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => {
                requestCertificate(t);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-black/10 px-4 py-3 text-left text-sm hover:border-[var(--js-red)]/40 hover:bg-red-50/40"
            >
              <FileText className="h-4 w-4 text-[var(--js-red)]" /> {t}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

const ISSUE_CATEGORIES: IssueCategory[] = ["Water Supply", "Roads", "Electricity", "Sanitation", "Streetlights"];

export function CitizenIssues() {
  const { issues, citizenName, raiseIssue } = useJanSevaDemo();
  const mine = issues.filter((i) => i.raisedBy === citizenName);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory>("Water Supply");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!title.trim()) {
      // Without this the button simply did nothing on an empty title, which
      // reads as a broken control rather than a missing field.
      setError("Give the issue a short title so ward staff can identify it.");
      return;
    }
    raiseIssue(title.trim(), category, description.trim() || "Reported via citizen portal.");
    setTitle("");
    setDescription("");
    setError("");
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="js-display font-semibold text-[var(--js-ink)]">Local Issues</p>
        <JsButton onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Raise an issue</JsButton>
      </div>
      {mine.length === 0 ? (
        <EmptyState title="Nothing reported yet" body="Spotted a civic issue nearby? Report it and ward staff will be notified." />
      ) : (
        <div className="space-y-2">
          {mine.map((i) => (
            <JsCard key={i.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--js-ink)]">{i.title}</p>
                  <p className="text-xs text-[var(--js-ink-soft)]">{i.category} · {i.ward} · {relativeTime(i.raisedAt)}</p>
                </div>
                <StatusPill status={i.status} />
              </div>
            </JsCard>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Raise a local issue">
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            placeholder="Short title"
            aria-label="Issue title"
            aria-invalid={!!error}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--js-red)] ${error ? "border-[var(--js-red)]" : "border-black/15"}`}
          />
          {error && <p className="text-xs font-medium text-[var(--js-red)]">{error}</p>}
          <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)} aria-label="Issue category" className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm">
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue (optional)" rows={3} aria-label="Issue description" className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--js-red)]" />
          <JsButton onClick={submit} className="w-full"><Send className="h-4 w-4" /> Submit report</JsButton>
        </div>
      </Modal>
    </div>
  );
}
