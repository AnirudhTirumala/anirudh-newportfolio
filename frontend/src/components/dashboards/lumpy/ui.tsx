import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Mounts overlay UI at the document root instead of where it sits in the tree.
 *
 * Every Lumpy view renders inside the portfolio's BrowserFrame mockup, which
 * keeps a transform on the panel so it can drift and tilt. A transformed
 * ancestor becomes the containing block for `position: fixed`, so an overlay
 * left in place is positioned against that panel and then clipped away by the
 * frame's and the app shell's `overflow: hidden` - the case dialog used to
 * open entirely below the fold with no reachable backdrop. Going out through
 * <body> is the only way these overlays can cover the real viewport. The
 * wrapper carries `lumpy-portal` because the demo's theme variables are
 * scoped to the app shell and would not resolve outside it. */
export function LumpyPortal({ children }: { children: ReactNode }) {
  return createPortal(<div className="lumpy-portal">{children}</div>, document.body);
}

export function LpCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--lp-hairline)] bg-[var(--lp-paper)] p-5 shadow-[var(--lp-shadow-card)] ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "accent" | "warn" | "bad" | "ok";
}) {
  const toneClass: Record<string, string> = {
    default: "text-[var(--lp-ink)]",
    accent: "text-[var(--lp-accent-600)]",
    warn: "text-[var(--lp-warn)]",
    bad: "text-[var(--lp-bad)]",
    ok: "text-[var(--lp-ok)]",
  };
  return (
    <LpCard>
      <p className="lp-mono text-[0.65rem] uppercase tracking-[0.15em] text-[var(--lp-subink)]">{label}</p>
      <p className={`lp-display mt-2 text-3xl font-semibold ${toneClass[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--lp-subink)]">{sub}</p>}
    </LpCard>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-[var(--lp-warn)]",
  in_review: "bg-[var(--lp-accent-50)] text-[var(--lp-accent-600)]",
  confirmed: "bg-red-50 text-[var(--lp-bad)]",
  flagged: "bg-red-50 text-[var(--lp-bad)]",
  closed: "bg-emerald-50 text-[var(--lp-ok)]",
  approved: "bg-emerald-50 text-[var(--lp-ok)]",
  suspended: "bg-red-50 text-[var(--lp-bad)]",
  healthy: "bg-emerald-50 text-[var(--lp-ok)]",
  monitoring: "bg-amber-50 text-[var(--lp-warn)]",
  under_treatment: "bg-red-50 text-[var(--lp-bad)]",
  production: "bg-emerald-50 text-[var(--lp-ok)]",
  staging: "bg-[var(--lp-accent-50)] text-[var(--lp-accent-600)]",
  archived: "bg-gray-100 text-[var(--lp-subink)]",
  positive: "bg-red-50 text-[var(--lp-bad)]",
  negative: "bg-emerald-50 text-[var(--lp-ok)]",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-[var(--lp-subink)]";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: "accent" | "ok" | "warn" | "bad" }) {
  const toneClass: Record<string, string> = {
    accent: "bg-[var(--lp-accent-500)]",
    ok: "bg-[var(--lp-ok)]",
    warn: "bg-[var(--lp-warn)]",
    bad: "bg-[var(--lp-bad)]",
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--lp-hairline)]">
      <div className={`h-full rounded-full ${toneClass[tone]}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function LpButton({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-[var(--lp-accent-500)] text-white hover:bg-[var(--lp-accent-600)] shadow-[var(--lp-shadow-accent-glow)]",
    secondary: "bg-[var(--lp-navy)] text-white hover:bg-[var(--lp-navy-700)]",
    ghost: "bg-transparent text-[var(--lp-ink)] border border-[var(--lp-hairline)] hover:bg-gray-50",
    danger: "bg-[var(--lp-bad)] text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // The dialog is portalled to the end of <body>, far from the control that
  // opened it, so the keyboard has to be moved in on open and handed back to
  // that control on close or the user is left tabbing through the whole page.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => opener?.focus?.();
  }, [open]);

  if (!open) return null;

  return (
    <LumpyPortal>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--lp-navy)]/50 p-4 backdrop-blur-sm" onClick={onClose}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={`max-h-[85vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-y-auto rounded-2xl bg-[var(--lp-paper)] p-6 shadow-[var(--lp-shadow-card-lg)] lp-scrollbar`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="lp-display text-lg font-semibold text-[var(--lp-ink)]">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-[var(--lp-subink)] hover:bg-gray-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </LumpyPortal>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--lp-hairline)] px-6 py-16 text-center">
      <p className="lp-display text-base font-semibold text-[var(--lp-ink)]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--lp-subink)]">{body}</p>
    </div>
  );
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
