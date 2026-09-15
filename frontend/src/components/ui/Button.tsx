import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-display font-medium transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-scope text-ink-950 hover:bg-scope-deep",
  secondary: "border border-bone-faint text-bone hover:border-scope hover:text-scope",
  ghost: "text-bone-dim hover:text-bone",
  danger: "border border-danger/50 text-danger hover:bg-danger/10",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm sm:text-base",
};

export function buttonVariants(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button ref={ref} className={buttonVariants(variant, size, className)} {...props} />
  ),
);
Button.displayName = "Button";
