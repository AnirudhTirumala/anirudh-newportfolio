import { useMemo, useState } from "react";
import { Award, Check, ClipboardList, Search, Users, X as XIcon } from "lucide-react";
import { useJanSevaDemo } from "./DemoContext";
import { EmptyState, JsButton, JsCard, Modal, StatCard, StatusPill, relativeTime } from "./ui";
import type { Application, ApplicationStatus, IssueStatus } from "./mockData";

export function StaffDashboard({ role }: { role: "staff" | "admin" }) {
  const { applications, issues, certificates, members } = useJanSevaDemo();
  const pendingApps = applications.filter((a) => a.status === "pending" || a.status === "under_review").length;
  const openIssues = issues.filter((i) => i.status !== "resolved").length;
  const pendingCerts = certificates.filter((c) => c.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="js-hero relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="js-hero-grid" />
        <div className="relative">
          <span className="js-live-pill"><span /> {role === "admin" ? "MANDAL OVERVIEW" : "OFFICE DESK"}</span>
          <p className="js-display mt-4 text-2xl font-semibold text-white sm:text-3xl">
            {role === "admin" ? "Panchayat operations, at a glance" : "Today's front-office queue"}
          </p>
          <p className="mt-1 max-w-md text-sm text-white/60">
            {pendingApps + openIssues + pendingCerts} items are waiting on action across applications, issues, and certificates.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending applications" value={String(pendingApps)} danger={pendingApps > 0} />
        <StatCard label="Open issues" value={String(openIssues)} danger={openIssues > 0} />
        <StatCard label="Certificates to issue" value={String(pendingCerts)} danger={pendingCerts > 0} />
        <StatCard label="Registered members" value={String(members.length)} />
      </div>
    </div>
  );
}

const APP_STATUS_TABS: { key: "all" | ApplicationStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "under_review", label: "Under review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export function ApplicationsQueue() {
  const { applications, reviewApplication } = useJanSevaDemo();
  const [tab, setTab] = useState<"all" | ApplicationStatus>("pending");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [remarks, setRemarks] = useState("");

  const filtered = useMemo(
    () =>
      applications
        .filter((a) => tab === "all" || a.status === tab)
        .filter((a) => `${a.citizenName} ${a.schemeName}`.toLowerCase().includes(query.toLowerCase())),
    [applications, tab, query],
  );

  function act(status: ApplicationStatus) {
    if (!selected) return;
    reviewApplication(selected.id, status, remarks);
    setSelected((prev) => (prev ? { ...prev, status } : prev));
    setRemarks("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {APP_STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === t.key ? "bg-gradient-to-br from-[#f04747] to-[#c71515] text-white" : "border border-black/10 bg-white text-[var(--js-ink-soft)]"}`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-[var(--js-ink-soft)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-32 text-xs outline-none sm:w-48" />
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" body="Try a different filter." />
      ) : (
        <JsCard tilt={false} className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[var(--js-ink-soft)]">
                <th className="px-4 py-3 font-medium">Citizen</th>
                <th className="px-4 py-3 font-medium">Scheme</th>
                <th className="px-4 py-3 font-medium">Ward</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer border-b border-black/10 last:border-0 hover:bg-black/[0.03]">
                  <td className="px-4 py-3 font-medium text-[var(--js-ink)]">{a.citizenName}</td>
                  <td className="px-4 py-3 text-[var(--js-ink-soft)]">{a.schemeName}</td>
                  <td className="px-4 py-3 text-[var(--js-ink-soft)]">{a.ward}</td>
                  <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-4 py-3 text-[var(--js-ink-soft)]">{relativeTime(a.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </JsCard>
      )}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.schemeName}` : ""}>
        {selected && (
          <div className="space-y-4">
            <div className="text-sm text-[var(--js-ink-soft)]">
              <p><b className="text-[var(--js-ink)]">Applicant:</b> {selected.citizenName}</p>
              <p><b className="text-[var(--js-ink)]">Ward:</b> {selected.ward}</p>
              <p><b className="text-[var(--js-ink)]">Submitted:</b> {new Date(selected.submittedAt).toLocaleDateString()}</p>
            </div>
            <StatusPill status={selected.status} />
            {selected.remarks && <p className="rounded-lg bg-black/5 px-3 py-2 text-sm text-[var(--js-ink)]">{selected.remarks}</p>}
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks (optional)"
              rows={2}
              className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-[var(--js-red)]"
            />
            <div className="flex flex-wrap gap-2">
              <JsButton variant="dark" onClick={() => act("under_review")}>Mark under review</JsButton>
              <JsButton onClick={() => act("approved")}><Check className="h-4 w-4" /> Approve</JsButton>
              <JsButton variant="ghost" onClick={() => act("rejected")}><XIcon className="h-4 w-4" /> Reject</JsButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export function CertificatesManage() {
  const { certificates, issueCertificate } = useJanSevaDemo();

  return (
    <div className="space-y-2">
      {certificates.map((c) => (
        <JsCard key={c.id} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 shrink-0 text-[var(--js-red)]" />
            <div>
              <p className="font-medium text-[var(--js-ink)]">{c.type} · {c.citizenName}</p>
              <p className="text-xs text-[var(--js-ink-soft)]">
                {c.status === "issued" ? `Issued · No. ${c.certificateNo}` : `Requested ${relativeTime(c.requestedAt)}`}
              </p>
            </div>
          </div>
          {c.status === "pending" ? (
            <JsButton onClick={() => issueCertificate(c.id)}>Issue</JsButton>
          ) : (
            <StatusPill status={c.status} />
          )}
        </JsCard>
      ))}
    </div>
  );
}

const ISSUE_STATUS_TABS: { key: "all" | IssueStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
];

export function IssuesManage() {
  const { issues, updateIssueStatus } = useJanSevaDemo();
  const [tab, setTab] = useState<"all" | IssueStatus>("open");
  const filtered = issues.filter((i) => tab === "all" || i.status === tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {ISSUE_STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${tab === t.key ? "bg-gradient-to-br from-[#f04747] to-[#c71515] text-white" : "border border-black/10 bg-white text-[var(--js-ink-soft)]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Nothing here" body="No issues match this filter." />
      ) : (
        <div className="space-y-2">
          {filtered.map((i) => (
            <JsCard key={i.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-[var(--js-ink)]">{i.title}</p>
                <p className="text-xs text-[var(--js-ink-soft)]">{i.category} · {i.ward} · reported by {i.raisedBy} · {relativeTime(i.raisedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={i.status} />
                {i.status !== "resolved" && (
                  <JsButton
                    variant={i.status === "open" ? "dark" : "primary"}
                    onClick={() => updateIssueStatus(i.id, i.status === "open" ? "in_progress" : "resolved")}
                  >
                    {i.status === "open" ? "Start work" : "Mark resolved"}
                  </JsButton>
                )}
              </div>
            </JsCard>
          ))}
        </div>
      )}
    </div>
  );
}

export function MembersDirectory() {
  const { members } = useJanSevaDemo();
  const [query, setQuery] = useState("");
  const filtered = members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 sm:w-72">
        <Search className="h-3.5 w-3.5 text-[var(--js-ink-soft)]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members..." className="w-full text-xs outline-none" />
      </div>
      <JsCard tilt={false} className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-[var(--js-ink-soft)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Ward</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Family size</th>
              <th className="px-4 py-3 font-medium">Aadhaar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-black/10 last:border-0 hover:bg-black/[0.03]">
                <td className="flex items-center gap-2 px-4 py-3 font-medium text-[var(--js-ink)]"><Users className="h-3.5 w-3.5 text-[var(--js-ink-soft)]" /> {m.name}</td>
                <td className="px-4 py-3 text-[var(--js-ink-soft)]">{m.ward}</td>
                <td className="px-4 py-3 text-[var(--js-ink-soft)]">{m.phone}</td>
                <td className="px-4 py-3 text-[var(--js-ink-soft)]">{m.category}</td>
                <td className="px-4 py-3 text-[var(--js-ink-soft)]">{m.familySize}</td>
                <td className="px-4 py-3">{m.aadhaarLinked ? <StatusPill status="approved" /> : <StatusPill status="rejected" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </JsCard>
    </div>
  );
}

export function SchemesManage() {
  const { schemes, applications } = useJanSevaDemo();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {schemes.map((s) => {
        const count = applications.filter((a) => a.schemeId === s.id).length;
        return (
          <JsCard key={s.id}>
            <div className="mb-1 flex items-center justify-between">
              <p className="js-display font-semibold text-[var(--js-ink)]">{s.name}</p>
              <StatusPill status={s.active ? "approved" : "rejected"} />
            </div>
            <p className="text-xs uppercase tracking-wide text-[var(--js-ink-soft)]">{s.department}</p>
            <p className="mt-2 text-sm text-[var(--js-ink-soft)]">{s.description}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--js-ink-soft)]">
              <ClipboardList className="h-3.5 w-3.5" /> {count} applications on file · {s.applicants} total since launch
            </p>
          </JsCard>
        );
      })}
    </div>
  );
}
