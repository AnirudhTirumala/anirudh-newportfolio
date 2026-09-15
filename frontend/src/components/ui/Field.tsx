import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-bone placeholder:text-bone-faint focus-visible:border-scope focus-visible:outline-none";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldShell({ label, htmlFor, error, hint, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-display text-sm font-medium text-bone-dim">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-bone-faint">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
        <input ref={ref} id={fieldId} className={cn(controlClasses, className)} {...props} />
      </FieldShell>
    );
  },
);
TextField.displayName = "TextField";

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, hint, id, className, rows = 4, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint}>
        <textarea ref={ref} id={fieldId} rows={rows} className={cn(controlClasses, "resize-y", className)} {...props} />
      </FieldShell>
    );
  },
);
TextAreaField.displayName = "TextAreaField";
