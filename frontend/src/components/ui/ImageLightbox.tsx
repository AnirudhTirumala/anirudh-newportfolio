import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}

/** Full-screen image viewer: closes on Escape, on backdrop click, or the
 * close button; locks background scroll while open. Rendered by a parent
 * as a sibling of any `motion.*` ancestors (never nested inside one) -
 * Framer Motion elements keep a `transform` in their style even at rest,
 * which would otherwise turn them into the containing block for this
 * component's `fixed` positioning instead of the viewport. */
export function ImageLightbox({ src, alt, caption, onClose }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
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
        <img src={src} alt={alt} className="max-h-[85vh] max-w-full rounded-lg border border-ink-700 object-contain" />
        {caption && <p className="mt-3 text-center font-mono text-xs text-bone-faint">{caption}</p>}
      </motion.div>
    </motion.div>
  );
}
