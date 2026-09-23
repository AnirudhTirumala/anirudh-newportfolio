import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** The element JanSeva overlays (dialogs, the mobile nav drawer) render into.
 * It has to be the demo's own root rather than the viewport: the dashboard is
 * mounted inside BrowserFrame, whose wrapper carries `perspective: 1400px` and
 * whose panel is tilted with a transform, and per CSS Transforms 2 either of
 * those makes that element - not the viewport - the containing block for
 * `position: fixed` descendants. A viewport-style overlay therefore resolved
 * against the tilted frame and landed off-screen, so the dialog buttons looked
 * dead. Scoping overlays to the demo panel also matches the browser-mockup
 * framing: the dialog belongs to the app in the window, not to the portfolio. */
const JsOverlayHostCtx = createContext<HTMLElement | null>(null);

export function JsOverlayHost({ host, children }: { host: HTMLElement | null; children: ReactNode }) {
  return <JsOverlayHostCtx.Provider value={host}>{children}</JsOverlayHostCtx.Provider>;
}

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

/** `label` exists for the places that borrow a workflow colour to mean
 * something else - a linked Aadhaar, a closed scheme - where printing the raw
 * status keyword would tell the reader a household or a scheme was "Rejected". */
export function StatusPill({ status, label }: { status: string; label?: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-black/5 text-[var(--js-ink)]";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${cls}`}>{label ?? status.replace(/_/g, " ")}</span>
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const host = useContext(JsOverlayHostCtx);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Callers pass a fresh arrow for `onClose` on every render, so the listener
  // effect reads it through a ref. Depending on it directly would tear down and
  // re-run the effect constantly, and its cleanup restores focus - which would
  // yank focus back to the opener while the dialog is still on screen.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const restoreTo = document.activeElement as HTMLElement | null;
    cardRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;
      // The overlay only covers the demo panel, so an untrapped Tab walks
      // straight out of the dialog and into the portfolio page behind it.
      const stops = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) {
        event.preventDefault();
        cardRef.current.focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreTo?.focus();
    };
  }, [open]);

  if (!open) return null;

  const overlay = (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`js-scrollbar max-h-full w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-y-auto rounded-2xl bg-[var(--js-paper)] p-6 shadow-2xl outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 id={titleId} className="js-display text-lg font-semibold text-[var(--js-ink)]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-[var(--js-ink-soft)] hover:bg-black/5" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return host ? createPortal(overlay, host) : overlay;
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
