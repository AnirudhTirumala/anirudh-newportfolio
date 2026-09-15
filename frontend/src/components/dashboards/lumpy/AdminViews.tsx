import { useState } from "react";
import { Check, Cpu, ShieldCheck, Stethoscope, UserCheck, UserX, Users } from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import { LpButton, LpCard, ProgressBar, StatCard, StatusPill } from "./ui";
import type { PlatformUser } from "./mockData";

export function AdminOverview() {
  const { cattle, cases, users, models } = useLumpyDemo();
  const farmers = users.filter((u) => u.role === "farmer");
  const doctors = users.filter((u) => u.role === "doctor");
  const positiveRate = cases.length ? Math.round((cases.filter((c) => c.verdict === "positive").length / cases.length) * 100) : 0;
  const productionModel = models.find((m) => m.status === "production");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Registered farmers" value={String(farmers.length)} />
        <StatCard label="Verified vets" value={String(doctors.filter((d) => d.status === "approved").length)} />
        <StatCard label="Total scans" value={String(cases.length)} />
        <StatCard label="Positive rate" value={`${positiveRate}%`} tone={positiveRate > 40 ? "bad" : "ok"} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <LpCard>
          <p className="lp-display mb-1 font-semibold text-[var(--lp-ink)]">Production model</p>
          {productionModel ? (
            <>
              <p className="lp-mono text-sm text-[var(--lp-accent-600)]">{productionModel.version}</p>
              <div className="mt-3 space-y-2 text-sm text-[var(--lp-subink)]">
                <div className="flex items-center justify-between"><span>mAP@50</span><span className="font-medium text-[var(--lp-ink)]">{(productionModel.map50 * 100).toFixed(1)}%</span></div>
                <ProgressBar value={productionModel.map50 * 100} tone="ok" />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--lp-subink)]">No model currently in production.</p>
          )}
        </LpCard>
        <LpCard>
          <p className="lp-display mb-3 font-semibold text-[var(--lp-ink)]">Pending approvals</p>
          <div className="space-y-2">
            {users.filter((u) => u.status === "pending").length === 0 && <p className="text-sm text-[var(--lp-subink)]">Nothing waiting on you.</p>}
            {users.filter((u) => u.status === "pending").map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border border-[var(--lp-hairline)] px-3 py-2 text-sm">
                <span className="text-[var(--lp-ink)]">{u.name}</span>
                <StatusPill status={u.status} />
              </div>
            ))}
          </div>
        </LpCard>
      </div>
      <LpCard>
        <p className="lp-display mb-3 font-semibold text-[var(--lp-ink)]">Herd registered · {cattle.length} animals</p>
        <div className="flex flex-wrap gap-2">
          {["healthy", "monitoring", "under_treatment"].map((status) => (
            <span key={status} className="flex items-center gap-2 rounded-full border border-[var(--lp-hairline)] px-3 py-1.5 text-xs">
              <StatusPill status={status} /> {cattle.filter((c) => c.status === status).length}
            </span>
          ))}
        </div>
      </LpCard>
    </div>
  );
}

export function UserManagement() {
  const { users, setUserStatus } = useLumpyDemo();
  const [roleFilter, setRoleFilter] = useState<"all" | "farmer" | "doctor">("all");
  const filtered = users.filter((u) => roleFilter === "all" || u.role === roleFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "farmer", "doctor"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium capitalize ${roleFilter === r ? "bg-[var(--lp-accent-500)] text-white" : "bg-white text-[var(--lp-subink)] border border-[var(--lp-hairline)]"}`}
          >
            {r === "doctor" ? <Stethoscope className="h-3 w-3" /> : r === "farmer" ? <Users className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {r === "all" ? "All users" : `${r}s`}
          </button>
        ))}
      </div>
      <LpCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[var(--lp-hairline)] text-left text-xs uppercase tracking-wide text-[var(--lp-subink)]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Detail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: PlatformUser) => (
              <tr key={u.id} className="border-b border-[var(--lp-hairline)] last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-[var(--lp-ink)]">{u.name}</td>
                <td className="px-4 py-3 capitalize text-[var(--lp-subink)]">{u.role}</td>
                <td className="px-4 py-3 text-[var(--lp-subink)]">{u.place} · {u.meta}</td>
                <td className="px-4 py-3"><StatusPill status={u.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {u.status !== "approved" && (
                      <button onClick={() => setUserStatus(u.id, "approved")} className="rounded-lg p-1.5 text-[var(--lp-ok)] hover:bg-emerald-50" title="Approve">
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
                    {u.status !== "suspended" && (
                      <button onClick={() => setUserStatus(u.id, "suspended")} className="rounded-lg p-1.5 text-[var(--lp-bad)] hover:bg-red-50" title="Suspend">
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LpCard>
    </div>
  );
}

export function ModelRegistry() {
  const { models, promoteModel, archiveModel } = useLumpyDemo();

  return (
    <div className="space-y-3">
      {models.map((m) => (
        <LpCard key={m.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[var(--lp-accent-600)]" />
              <p className="lp-mono font-medium text-[var(--lp-ink)]">{m.version}</p>
              <StatusPill status={m.status} />
            </div>
            <p className="mt-1 text-xs text-[var(--lp-subink)]">{m.notes}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-[var(--lp-subink)]">
              <span>mAP@50 <b className="text-[var(--lp-ink)]">{(m.map50 * 100).toFixed(1)}%</b></span>
              <span>Precision <b className="text-[var(--lp-ink)]">{(m.precision * 100).toFixed(1)}%</b></span>
              <span>Recall <b className="text-[var(--lp-ink)]">{(m.recall * 100).toFixed(1)}%</b></span>
              <span>{m.datasetImages.toLocaleString()} training images</span>
            </div>
          </div>
          <div className="flex gap-2">
            {m.status !== "production" && (
              <LpButton variant="secondary" onClick={() => promoteModel(m.id)}>
                <Check className="h-4 w-4" /> Promote
              </LpButton>
            )}
            {m.status === "staging" && (
              <LpButton variant="ghost" onClick={() => archiveModel(m.id)}>
                Archive
              </LpButton>
            )}
          </div>
        </LpCard>
      ))}
    </div>
  );
}
