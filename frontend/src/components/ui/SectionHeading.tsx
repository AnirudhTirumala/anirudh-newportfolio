import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The shared section opener.
 *
 * Every section used to announce itself with one line of 14px accent text,
 * so the page had no typographic rhythm - scrolling it felt like one
 * undifferentiated column of cards. An index, a display-size title and a rule
 * that draws itself in give each section a clear beginning, and the index
 * numbers tell a visitor how much is left.
 */
export function SectionHeading({
  index,
  label,
  title,
  description,
  aside,
  accent = "scope",
  className,
}: {
  /** Two-digit position, e.g. "01". Omitted for an opener that is not one of
   *  the numbered sections of the page, such as the closing contact block -
   *  the rule and the label still render. */
  index?: string;
  /** Small technical label above the title. */
  label: string;
  title: ReactNode;
  description?: string;
  /** Optional status chip pinned to the right on wide screens. */
  aside?: ReactNode;
  accent?: "scope" | "signal";
  className?: string;
}) {
  const accentText = accent === "signal" ? "text-signal" : "text-scope";
  const accentRule = accent === "signal" ? "bg-signal/70" : "bg-scope/70";

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {index && <span className={cn("font-mono text-xs tracking-[0.2em]", accentText)}>{index}</span>}
            <motion.span
              aria-hidden
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={cn("h-px w-14 origin-left", accentRule)}
            />
            <span className="font-mono text-xs tracking-[0.2em] text-bone-faint">{label.toUpperCase()}</span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-2xl font-display text-[2.1rem] font-semibold leading-[1.04] tracking-[-0.03em] text-bone sm:text-[2.9rem] lg:text-[3.4rem]"
          >
            {title}
          </motion.h2>

          {description && (
            <p className="mt-4 max-w-xl font-body text-base leading-relaxed text-bone-dim">{description}</p>
          )}
        </div>

        {aside && <div className="shrink-0 sm:pb-2">{aside}</div>}
      </div>
    </div>
  );
}

/** The small status chip several sections pin beside their heading. */
export function HeadingChip({ children, accent = "scope" }: { children: ReactNode; accent?: "scope" | "signal" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-bone/12 bg-ink-900/80 px-3.5 py-1.5 font-mono text-[0.62rem] tracking-[0.16em] text-bone-faint">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full animate-pulse-soft",
          accent === "signal" ? "bg-signal" : "bg-scope",
        )}
      />
      {children}
    </span>
  );
}
