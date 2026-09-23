import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Award,
  AlertTriangle,
  Users,
  MessageCircle,
  Bot,
  ChevronDown,
  Menu,
  X,
  Landmark,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useJanSevaDemo } from "./DemoContext";
import { JsOverlayHost } from "./ui";
import { CURRENT_CITIZEN_NAME, type JanSevaRole } from "./mockData";

export interface JsTab {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const JS_TABS: Record<JanSevaRole, JsTab[]> = {
  citizen: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "schemes", label: "Browse Schemes", icon: FileText },
    { key: "applications", label: "My Applications", icon: ClipboardList },
    { key: "certificates", label: "My Certificates", icon: Award },
    { key: "issues", label: "Local Issues", icon: AlertTriangle },
    { key: "chat", label: "Chat with Office", icon: MessageCircle },
    { key: "assistant", label: "AI Assistant", icon: Bot },
  ],
  staff: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "schemes", label: "Schemes", icon: FileText },
    { key: "applications", label: "Applications", icon: ClipboardList },
    { key: "certificates", label: "Certificates", icon: Award },
    { key: "issues", label: "Local Issues", icon: AlertTriangle },
    { key: "members", label: "Members", icon: Users },
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "assistant", label: "AI Assistant", icon: Bot },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "schemes", label: "Schemes", icon: FileText },
    { key: "applications", label: "Applications", icon: ClipboardList },
    { key: "certificates", label: "Certificates", icon: Award },
    { key: "issues", label: "Local Issues", icon: AlertTriangle },
    { key: "members", label: "Members", icon: Users },
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "assistant", label: "AI Assistant", icon: Bot },
  ],
};

const ROLE_META: Record<JanSevaRole, { label: string; icon: typeof Landmark; blurb: string }> = {
  citizen: { label: "Citizen", icon: UserRound, blurb: `${CURRENT_CITIZEN_NAME} · Ward 3` },
  staff: { label: "Panchayat Staff", icon: Landmark, blurb: "Front office · Peddapuram GP" },
  admin: { label: "Admin", icon: ShieldCheck, blurb: "Mandal-level access" },
};

/** Closes an open menu when the user clicks outside `ref` or presses
 * Escape. This replaces an older "invisible full-screen div" trick for
 * catching outside clicks, which quietly breaks the moment any ancestor
 * gets a CSS transform (common with entrance/hover animation libraries):
 * a transform turns that ancestor into the positioning context for
 * `position: fixed` descendants, so the "full screen" catcher stops
 * covering the actual full screen. Listening on the document sidesteps
 * that entirely, and Escape-to-close is a nice accessibility win too.
 *
 * `onDismiss` is told how the menu was dismissed, because a keyboard user who
 * pressed Escape needs focus put back on the trigger, while someone who
 * clicked elsewhere has already moved focus themselves. */
function useDismiss<T extends HTMLElement>(active: boolean, onDismiss: (reason: "escape" | "outside") => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss("outside");
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss("escape");
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [active, onDismiss]);
  return ref;
}

function RoleSwitcher() {
  const { role, setRole } = useJanSevaDemo();
  const [open, setOpen] = useState(false);
  const Meta = ROLE_META[role];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useDismiss<HTMLDivElement>(open, (reason) => {
    setOpen(false);
    if (reason === "escape") triggerRef.current?.focus();
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-left"
      >
        <Meta.icon className="h-4 w-4 text-[var(--js-red)]" />
        <span className="text-sm font-medium text-[var(--js-ink)]">{Meta.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--js-ink-soft)]" />
      </button>
      {open && (
        <div role="menu" aria-label="Preview as" className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-xl">
          <p className="px-3 pb-1 pt-2 text-[0.65rem] uppercase tracking-[0.15em] text-[var(--js-ink-soft)]">Preview as</p>
          {(Object.keys(ROLE_META) as JanSevaRole[]).map((r) => {
            const M = ROLE_META[r];
            return (
              <button
                key={r}
                type="button"
                role="menuitem"
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-black/5 ${r === role ? "bg-red-50" : ""}`}
              >
                <M.icon className="h-4 w-4 shrink-0 text-[var(--js-red)]" />
                <span>
                  <span className="block font-medium text-[var(--js-ink)]">{M.label}</span>
                  <span className="block text-xs text-[var(--js-ink-soft)]">{M.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function JanSevaShell({
  activeTab,
  onTabChange,
  title,
  subtitle,
  children,
}: {
  activeTab: string;
  onTabChange: (key: string) => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { role } = useJanSevaDemo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);
  const tabs = JS_TABS[role];

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#f04747] to-[#c71515] text-white">
          <Landmark className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="js-display text-sm font-bold leading-tight text-white">JanSeva Connect</p>
          <p className="js-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/40">Gram Panchayat Portal</p>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-0.5 px-3">
        {tabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => {
                onTabChange(tab.key);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                active ? "bg-gradient-to-br from-[#ef4141] to-[#bd1414] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="mx-3 mb-4 mt-2 rounded-xl bg-white/5 p-3">
        <p className="text-xs text-white/50">Interactive demo · sample data only, nothing here is a real government record.</p>
      </div>
    </>
  );

  return (
    <div ref={setOverlayHost} className="js-app relative flex h-[min(880px,85vh)] w-full overflow-hidden rounded-2xl border border-black/10 js-scrollbar">
      <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-[#202020] via-[#0d0d0d] to-black md:flex">{sidebarContent}</aside>

      {/* Absolute, not fixed: this drawer covers the demo app, and `fixed` here
          resolved against the tilted BrowserFrame rather than the viewport,
          which pushed the drawer header and its close button above the top of
          the panel where the frame's overflow-hidden clipped them away. */}
      {mobileOpen && (
        <div className="absolute inset-0 z-40 flex md:hidden">
          <div className="js-scrollbar flex w-72 max-w-[85%] flex-col overflow-y-auto bg-gradient-to-b from-[#202020] via-[#0d0d0d] to-black">{sidebarContent}</div>
          <div className="relative flex-1 bg-black/40" onClick={() => setMobileOpen(false)}>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-white p-2 shadow-lg"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-black/10 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-1.5 text-[var(--js-ink)] hover:bg-black/5 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="js-display truncate text-base font-semibold text-[var(--js-ink)] sm:text-lg">{title}</h2>
              <p className="hidden truncate text-xs text-[var(--js-ink-soft)] sm:block">{subtitle}</p>
            </div>
          </div>
          <RoleSwitcher />
        </header>
        <main className="flex-1 overflow-y-auto bg-[var(--js-bg)] p-4 js-scrollbar sm:p-6">
          <JsOverlayHost host={overlayHost}>{children}</JsOverlayHost>
        </main>
      </div>
    </div>
  );
}
