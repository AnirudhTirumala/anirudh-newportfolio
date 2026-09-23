import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />;
}

/**
 * `PageSpinner` is the entire content of the page while a lazy route, the
 * auth check, or an admin editor's data is loading. The icon itself is
 * decorative and stays hidden from the accessibility tree, so without the
 * live region and the label below a screen reader landed on a document with
 * nothing to announce at all - indistinguishable from a crash.
 */
export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-6 w-6 text-scope" />
      <span className="sr-only">{label}</span>
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

/**
 * Shown in place of an admin editor whose data could not be loaded.
 *
 * The editors used to render regardless: a failed GET left every input empty,
 * and one Save then wrote those blanks over the real content. Refusing to
 * render the form at all is what actually protects the data.
 */
export function LoadError({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-md border border-danger/40 bg-danger/10 px-6 py-8"
      role="alert"
    >
      <p className="font-display text-base text-bone">Couldn't load this section.</p>
      <p className="max-w-md text-sm text-bone-dim">{message}</p>
      <p className="max-w-md text-xs text-bone-faint">
        Nothing has been changed. Editing is disabled until this loads, so a blank form can't overwrite your
        content.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-1 inline-flex items-center gap-2 rounded-md border border-bone-faint px-3.5 py-1.5 font-display text-sm text-bone transition-colors hover:border-scope hover:text-scope disabled:opacity-50"
        >
          {isRetrying && <Spinner />}
          {isRetrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
