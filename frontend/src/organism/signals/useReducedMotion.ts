import { useEffect, useState } from "react";

/**
 * Tracks the user's `prefers-reduced-motion` setting and keeps it live.
 *
 * The organism honours this everywhere: when reduced motion is requested the
 * membrane renders a single static frame and all breathing/pulse animation is
 * suppressed, while the colour/tint physiology is preserved.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
