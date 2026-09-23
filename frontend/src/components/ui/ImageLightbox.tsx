import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled])';

/** Full-screen image viewer: closes on Escape, on backdrop click, or the
 * close button; locks background scroll while open. Rendered by a parent
 * as a sibling of any `motion.*` ancestors (never nested inside one) -
 * Framer Motion elements keep a `transform` in their style even at rest,
 * which would otherwise turn them into the containing block for this
 * component's `fixed` positioning instead of the viewport. */
export function ImageLightbox({ src, alt, caption, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Captured before focus moves into the dialog so Escape can put the
    // visitor back on the certificate they opened, rather than dropping them
    // on <body> and restarting their next Tab at the top of the document.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // The dialog declares `aria-modal` but renders in place rather than in
      // a portal, so everything behind the 90%-opaque backdrop stays
      // focusable. Cycling within the dialog is what makes that declaration
      // true instead of leaving a keyboard user driving invisible controls.
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const goingBack = event.shiftKey;

      if (!dialogRef.current?.contains(active) || active === (goingBack ? first : last)) {
        event.preventDefault();
        (goingBack ? last : first).focus();
      }
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6"
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-[85vh] max-w-3xl flex-col items-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-ink-600 text-bone-dim transition-colors hover:border-bone-dim hover:text-bone"
        >
          <X className="h-4 w-4" />
        </button>
        {loadFailed ? (
          // Certificate files live on the API host's own disk, so they go
          // missing whenever it restarts or sleeps. Without this the visitor
          // got a full-screen black panel and a broken-image glyph.
          <div className="glass-panel flex max-w-sm flex-col gap-2 rounded-2xl px-6 py-10 text-center">
            <p className="font-display text-base text-bone">This certificate image couldn't be loaded.</p>
            <p className="font-body text-sm text-bone-dim">
              The file may have moved, or the server hosting it is offline right now.
            </p>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            onError={() => setLoadFailed(true)}
            className="max-h-[85vh] max-w-full rounded-lg border border-ink-700 object-contain"
          />
        )}
        {caption && <p className="mt-3 text-center font-mono text-xs text-bone-faint">{caption}</p>}
      </motion.div>
    </motion.div>
  );
}
