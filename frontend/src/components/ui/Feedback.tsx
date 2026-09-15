import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />;
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-6 w-6 text-scope" />
    </div>
  );
}

/** For empty admin lists / failed loads: says what happened and what to do about it. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-ink-600 px-6 py-10">
      <p className="font-display text-base text-bone">{title}</p>
      {description && <p className="max-w-md text-sm text-bone-dim">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
      {message}
    </div>
  );
}
