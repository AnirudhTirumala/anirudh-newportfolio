import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function JsCard({ children, className = "", tilt = true }: { children: ReactNode; className?: string; tilt?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--js-hairline)] bg-[var(--js-paper)] p-5 shadow-[0_13px_27px_rgba(0,0,0,0.06)] ${tilt ? "js-metric" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, danger }: { label: string; value: string; sub?: string; danger?: boolean }) {
  return (
    <JsCard>
      <p className="js-mono text-[0.65rem] uppercase tracking-[0.15em] text-[var(--js-ink-soft)]">{label}</p>
      <p className={`js-display mt-2 text-3xl font-semibold ${danger ? "text-[var(--js-red)]" : "text-[var(--js-ink)]"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--js-ink-soft)]">{sub}</p>}
    </JsCard>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-black/5 text-[var(--js-ink)]",
  under_review: "bg-black/5 text-[var(--js-ink)]",
  approved: "bg-red-50 text-[var(--js-red)]",
  issued: "bg-red-50 text-[var(--js-red)]",
  rejected: "bg-black text-white",
  open: "bg-black/5 text-[var(--js-ink)]",
  in_progress: "bg-red-50 text-[var(--js-red)]",
  resolved: "bg-black text-white",
};

export function StatusPill({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-black/5 text-[var(--js-ink)]";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>{status.replace(/_/g, " ")}</span>
  );
}

export function JsButton({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "dark" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: "bg-gradient-to-br from-[#f04747] to-[#c71515] text-white shadow-[0_10px_20px_rgba(180,20,20,0.22)] hover:brightness-105",
    dark: "bg-gradient-to-br from-[#2a2a2a] to-black text-white hover:brightness-125",
    ghost: "border border-black/15 text-[var(--js-ink)] hover:bg-black/5",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`max-h-[85vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-y-auto rounded-2xl bg-[var(--js-paper)] p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="js-display text-lg font-semibold text-[var(--js-ink)]">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-[var(--js-ink-soft)] hover:bg-black/5" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--js-hairline)] px-6 py-16 text-center">
      <p className="js-display text-base font-semibold text-[var(--js-ink)]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--js-ink-soft)]">{body}</p>
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
