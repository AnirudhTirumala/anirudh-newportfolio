import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  FileText,
  MessageCircle,
  Map,
  Bell,
  Settings,
  ClipboardCheck,
  Camera,
  Users,
  BarChart3,
  Cpu,
  ChevronDown,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useLumpyDemo } from "./DemoContext";
import type { LumpyRole } from "./mockData";

export interface LumpyTab {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const LUMPY_TABS: Record<LumpyRole, LumpyTab[]> = {
  farmer: [
    { key: "dashboard", label: "New Scan", icon: LayoutDashboard },
    { key: "my-cattle", label: "My Cattle", icon: ClipboardList },
    { key: "scan-history", label: "Scan History", icon: Clock },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "chat", label: "Ask a Vet", icon: MessageCircle },
    { key: "outbreak-map", label: "Outbreak Map", icon: Map },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "settings", label: "Settings", icon: Settings },
  ],
  doctor: [
    { key: "dashboard", label: "Overview", icon: LayoutDashboard },
    { key: "case-queue", label: "Case Queue", icon: ClipboardCheck },
    { key: "scan", label: "AI Scan", icon: Camera },
    { key: "patients", label: "Patient Records", icon: Users },
    { key: "chat", label: "Farmer Chat", icon: MessageCircle },
    { key: "outbreak-map", label: "Outbreak Map", icon: Map },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { key: "dashboard", label: "Overview", icon: LayoutDashboard },
    { key: "users", label: "Users", icon: Users },
    { key: "scan", label: "AI Scan", icon: Camera },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "outbreak-map", label: "Outbreak Map", icon: Map },
    { key: "model-registry", label: "Model Registry", icon: Cpu },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "settings", label: "Settings", icon: Settings },
  ],
};

const ROLE_META: Record<LumpyRole, { label: string; icon: typeof Stethoscope; blurb: string }> = {
  farmer: { label: "Farmer", icon: Sprout, blurb: "Ravi Kumar · Kakinada Rural" },
  doctor: { label: "Veterinarian", icon: Stethoscope, blurb: "Dr. Kavitha Nair · District AH Office" },
  admin: { label: "Platform Admin", icon: ShieldCheck, blurb: "Ops & model management" },
};

/** Closes an open menu when the user clicks outside `ref` or presses
 * Escape. This replaces an older "invisible full-screen div" trick for
 * catching outside clicks, which quietly breaks the moment any ancestor
 * gets a CSS transform (common with entrance/hover animation libraries):
 * a transform turns that ancestor into the positioning context for
 * `position: fixed` descendants, so the "full screen" catcher stops
 * covering the actual full screen. Listening on the document sidesteps
 * that entirely, and Escape-to-close is a nice accessibility win too. */
function useDismiss<T extends HTMLElement>(active: boolean, onDismiss: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return;
    function handlePointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss();
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
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
  const { role, setRole } = useLumpyDemo();
  const [open, setOpen] = useState(false);
  const Meta = ROLE_META[role];
  const menuRef = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-[var(--lp-hairline)] bg-[var(--lp-paper)] px-3 py-2 text-left shadow-[var(--lp-shadow-card)]"
      >
        <Meta.icon className="h-4 w-4 text-[var(--lp-accent-600)]" />
        <span className="text-sm font-medium text-[var(--lp-ink)]">{Meta.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--lp-subink)]" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--lp-hairline)] bg-[var(--lp-paper)] py-1 shadow-[var(--lp-shadow-card-lg)]">
          <p className="px-3 pb-1 pt-2 text-[0.65rem] uppercase tracking-[0.15em] text-[var(--lp-subink)]">Preview as</p>
          {(Object.keys(ROLE_META) as LumpyRole[]).map((r) => {
            const M = ROLE_META[r];
            return (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-gray-50 ${r === role ? "bg-[var(--lp-accent-50)]" : ""}`}
              >
                <M.icon className="h-4 w-4 shrink-0 text-[var(--lp-accent-600)]" />
                <span>
                  <span className="block font-medium text-[var(--lp-ink)]">{M.label}</span>
                  <span className="block text-xs text-[var(--lp-subink)]">{M.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LumpyShell({
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
  const { role, notifications } = useLumpyDemo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tabs = LUMPY_TABS[role];
  const unread = notifications.filter((n) => !n.read).length;

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lp-accent-500)] text-white">
          <Camera className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="lp-display text-sm font-bold leading-tight text-white">LumpyDetect AI</p>
          <p className="lp-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/40">v3.2 · production</p>
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
                active ? "bg-[var(--lp-accent-500)] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
              {tab.key === "notifications" && unread > 0 && (
                <span className="ml-auto rounded-full bg-[var(--lp-bad)] px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">{unread}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="mx-3 mb-4 mt-2 rounded-xl bg-white/5 p-3">
        <p className="text-xs text-white/50">Interactive demo · sample data only, nothing here touches a real herd.</p>
      </div>
    </>
  );

  return (
    <div className="lumpy-app flex h-[min(880px,85vh)] w-full overflow-hidden rounded-2xl border border-[var(--lp-hairline)] lp-scrollbar">
      <aside className="hidden w-64 shrink-0 flex-col bg-[var(--lp-navy)] md:flex">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-72 flex-col bg-[var(--lp-navy)] flex">{sidebarContent}</div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--lp-hairline)] bg-[var(--lp-paper)]/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-lg p-1.5 text-[var(--lp-ink)] hover:bg-gray-100 md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="lp-display truncate text-base font-semibold text-[var(--lp-ink)] sm:text-lg">{title}</h2>
              <p className="hidden truncate text-xs text-[var(--lp-subink)] sm:block">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onTabChange("notifications")}
              className="relative rounded-full border border-[var(--lp-hairline)] p-2 text-[var(--lp-ink)] hover:bg-gray-50"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--lp-bad)]" />}
            </button>
            <RoleSwitcher />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-[var(--lp-canvas)] p-4 lp-scrollbar sm:p-6">{children}</main>
      </div>

      {mobileOpen && (
        <button className="fixed right-4 top-4 z-50 rounded-full bg-white p-2 shadow-lg md:hidden" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
