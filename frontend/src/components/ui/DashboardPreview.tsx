import { Lock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardKey } from "@/types";

function LumpyPreview() {
  return (
    <div className="grid h-full min-h-72 grid-cols-[29%_1fr] overflow-hidden rounded-[1.15rem] bg-[#f7f7fb] font-sans text-[9px] text-[#6b7280] sm:text-[11px]">
      <aside className="flex flex-col bg-[#14132b] p-3 text-white/65 sm:p-4">
        <p className="font-semibold tracking-wide text-white">LumpyDetect</p>
        <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.13em] text-white/35 sm:text-[8px]">AI · v3.2</p>
        <div className="mt-6 space-y-3 text-[8px] sm:text-[10px]">
          <p className="rounded-md bg-[#6953f4] px-2 py-1.5 text-white">New scan</p>
          <p>My cattle</p>
          <p>Scan history</p>
          <p>Reports</p>
        </div>
        <p className="mt-auto text-[7px] leading-relaxed text-white/35 sm:text-[8px]">Portfolio demo<br />Sample data only</p>
      </aside>
      <div className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div><p className="font-semibold text-[#14132b]">Herd overview</p><p className="mt-1 text-[8px] sm:text-[9px]">Field detection, ready when you are</p></div>
          <span className="rounded-full bg-[#edeaff] px-2 py-1 font-mono text-[7px] text-[#5440de] sm:text-[8px]">MODEL READY</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["1 cattle", "1 scan", "0 alerts"].map((stat) => <p key={stat} className="rounded-lg border border-[#ececf3] bg-white p-2 font-medium text-[#14132b] shadow-sm">{stat}</p>)}
        </div>
        <div className="mt-3 rounded-xl border border-[#ececf3] bg-white p-3 shadow-sm">
          <p className="font-semibold text-[#14132b]">Scan your cattle</p>
          <p className="mt-1 text-[8px] sm:text-[9px]">Upload a field photo for a YOLO-based detection.</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#14132b] px-3 py-2 text-[8px] text-white sm:text-[9px]"><Play className="h-3 w-3 fill-current" /> Open scanner</div>
        </div>
      </div>
    </div>
  );
}

function JanSevaPreview() {
  return (
    <div className="grid h-full min-h-72 grid-cols-[29%_1fr] overflow-hidden rounded-[1.15rem] bg-[#f7f7f7] font-sans text-[9px] text-black/60 sm:text-[11px]">
      <aside className="flex flex-col bg-gradient-to-b from-[#202020] via-[#0d0d0d] to-black p-3 text-white/65 sm:p-4">
        <p className="font-semibold tracking-wide text-white">JanSeva</p>
        <p className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.13em] text-white/35 sm:text-[8px]">Citizen portal</p>
        <div className="mt-6 space-y-3 text-[8px] sm:text-[10px]">
          <p className="rounded-md bg-[#e32626] px-2 py-1.5 text-white">Dashboard</p>
          <p>Browse schemes</p>
          <p>Applications</p>
          <p>AI assistant</p>
        </div>
        <p className="mt-auto text-[7px] leading-relaxed text-white/35 sm:text-[8px]">Portfolio demo<br />Sample data only</p>
      </aside>
      <div className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div><p className="font-semibold text-[#101010]">Citizen services</p><p className="mt-1 text-[8px] sm:text-[9px]">Welcome back, Ramesh</p></div>
          <span className="rounded-full bg-red-50 px-2 py-1 font-mono text-[7px] text-[#c71515] sm:text-[8px]">LIVE PORTAL</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {["Applications · 1", "Certificates · 1", "Issues · 0", "Schemes · 4"].map((stat) => <p key={stat} className="rounded-lg border border-black/10 bg-white p-2 font-medium text-[#101010] shadow-sm">{stat}</p>)}
        </div>
        <div className="mt-3 rounded-xl bg-[#101010] p-3 text-white">
          <p className="font-semibold">Ask the AI assistant</p>
          <p className="mt-1 text-[8px] text-white/55 sm:text-[9px]">Multilingual help for local services.</p>
          <div className="mt-3 flex items-center gap-2 text-[8px] text-[#ff9c9c] sm:text-[9px]"><Play className="h-3 w-3 fill-current" /> Open dashboard</div>
        </div>
      </div>
    </div>
  );
}

function GenericPreview() {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-[1.15rem] bg-ink-900 p-6 text-center font-display text-sm text-bone-dim">
      Interactive project details
    </div>
  );
}

/**
 * Lightweight, static dashboard cover for Work cards. It is deliberately a
 * preview rather than a second live app: opening it navigates to the project
 * page, where the full interactive demo mounts only when the visitor asks.
 */
export function DashboardPreview({ dashboardKey, className }: { dashboardKey: DashboardKey; className?: string }) {
  const Preview = dashboardKey === "lumpy" ? LumpyPreview : dashboardKey === "janseva" ? JanSevaPreview : GenericPreview;
  return (
    <div className={cn("relative h-full overflow-hidden rounded-[1.35rem] border border-bone/10 bg-ink-950 p-2 shadow-2xl", className)}>
      <div className="pointer-events-none absolute inset-x-6 -bottom-4 h-10 rounded-[100%] bg-black/60 blur-xl" />
      <div className="relative"><Preview /></div>
      <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-950/80 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.1em] text-bone backdrop-blur">
        <Lock className="h-2.5 w-2.5" /> Demo preview
      </span>
    </div>
  );
}
