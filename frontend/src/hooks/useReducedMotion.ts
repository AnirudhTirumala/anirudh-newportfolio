import { useEffect, useState } from "react";

function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  // The visitor's explicit accessibility preference is the only signal that
  // turns off motion. A connection-quality estimate must not silently remove
  // the portfolio's intentional 3D interaction: the UI is already light and
  // usable while its optional assets load on a slow connection.
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tracks the browser's explicit accessibility motion preference. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(shouldReduceMotion);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(shouldReduceMotion());
    onChange();
    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}
