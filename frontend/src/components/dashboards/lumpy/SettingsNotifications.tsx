import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, Info, Save } from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import { EmptyState, LpButton, LpCard, relativeTime } from "./ui";
import { ROLE_LABELS } from "./roleLabels";
import type { LumpyRole } from "./mockData";

const TONE_ICON: Record<string, typeof Info> = { info: Info, warn: AlertTriangle, bad: AlertTriangle, ok: CheckCircle2 };
const TONE_COLOR: Record<string, string> = {
  info: "text-[var(--lp-info)] bg-blue-50",
  warn: "text-[var(--lp-warn)] bg-amber-50",
  bad: "text-[var(--lp-bad)] bg-red-50",
  ok: "text-[var(--lp-ok)] bg-emerald-50",
};

export function LumpyNotifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useLumpyDemo();

  if (notifications.length === 0) {
    return <EmptyState title="You're all caught up" body="New scans, reviews and outbreak alerts will show up here." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="lp-display font-semibold text-[var(--lp-ink)]">Notifications</p>
        <button onClick={markAllNotificationsRead} className="text-xs font-medium text-[var(--lp-accent-600)] hover:underline">
          Mark all as read
        </button>
      </div>
      {notifications.map((n) => {
        const Icon = TONE_ICON[n.tone] ?? Bell;
        return (
          <button key={n.id} onClick={() => markNotificationRead(n.id)} className="block w-full text-left">
            <LpCard className={`flex items-start gap-3 ${n.read ? "opacity-60" : ""}`}>
              <span className={`rounded-full p-2 ${TONE_COLOR[n.tone]}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--lp-ink)]">{n.title}</span>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--lp-accent-500)]" />}
                </span>
                <span className="mt-0.5 block text-sm text-[var(--lp-subink)]">{n.body}</span>
                <span className="lp-mono mt-1 block text-[0.65rem] uppercase tracking-wide text-[var(--lp-subink)]">{relativeTime(n.time)}</span>
              </span>
            </LpCard>
          </button>
        );
      })}
    </div>
  );
}

export function LumpySettings({ role }: { role: LumpyRole }) {
  const [name, setName] = useState(role === "farmer" ? "Ravi Kumar" : role === "doctor" ? "Dr. Kavitha Nair" : "Platform Admin");
  const [phone, setPhone] = useState("+91 90000 00000");
  const [alerts, setAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(role === "farmer");
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <LpCard>
        <p className="lp-display mb-4 font-semibold text-[var(--lp-ink)]">Profile</p>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-[var(--lp-hairline)] px-3 py-2 text-sm outline-none focus:border-[var(--lp-accent-400)]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-[var(--lp-hairline)] px-3 py-2 text-sm outline-none focus:border-[var(--lp-accent-400)]" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-[var(--lp-subink)]">Role</span>
            <input value={ROLE_LABELS[role]} disabled className="w-full rounded-lg border border-[var(--lp-hairline)] bg-gray-50 px-3 py-2 text-sm text-[var(--lp-subink)]" />
          </label>
        </div>
      </LpCard>
      <LpCard>
        <p className="lp-display mb-4 font-semibold text-[var(--lp-ink)]">Alerts</p>
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm text-[var(--lp-ink)]">
            In-app outbreak alerts
            <input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} className="h-4 w-4 accent-[var(--lp-accent-500)]" />
          </label>
          <label className="flex items-center justify-between text-sm text-[var(--lp-ink)]">
            SMS notifications
            <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="h-4 w-4 accent-[var(--lp-accent-500)]" />
          </label>
        </div>
      </LpCard>
      <LpButton onClick={save} className="w-full">
        <Save className="h-4 w-4" /> {saved ? "Saved" : "Save changes"}
      </LpButton>
    </div>
  );
}
