import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CornerFrameProps {
  children: ReactNode;
  color?: "scope" | "signal" | "bone";
  className?: string;
  /** Show the frame only on hover/focus of the parent (add `group` to the parent). */
  onGroupHover?: boolean;
}

const colorMap = {
  scope: "border-scope",
  signal: "border-signal",
  bone: "border-bone",
};

/** A viewfinder-style corner-bracket frame, like a detection box, around whatever it wraps. */
export function CornerFrame({ children, color = "scope", className, onGroupHover = false }: CornerFrameProps) {
  const visibility = onGroupHover
    ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
    : "";
  const borderColor = colorMap[color];

  return (
    <div className={cn("relative", className)}>
      {children}
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute -top-1.5 -left-1.5 h-5 w-5 border-t-2 border-l-2", borderColor, visibility)}
      />
      <span
        aria-hidden="true"
        className={cn("pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 border-t-2 border-r-2", borderColor, visibility)}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 border-b-2 border-l-2",
          borderColor,
          visibility,
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -bottom-1.5 -right-1.5 h-5 w-5 border-b-2 border-r-2",
          borderColor,
          visibility,
        )}
      />
    </div>
  );
}
