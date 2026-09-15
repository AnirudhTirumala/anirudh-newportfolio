import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "scope" | "signal" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-ink-600 text-bone-dim",
  scope: "border-scope-dim text-scope bg-scope/10",
  signal: "border-signal-dim text-signal bg-signal/10",
  danger: "border-danger/40 text-danger bg-danger/10",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-xs leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
