import { useEffect, type RefObject } from "react";
import "./reveal.css";

const still = () =>
  (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) ||
  document.documentElement.dataset.motion === "still" ||
  document.documentElement.dataset.organism === "off";

/**
 * Attention OS · Reveal. Content marked `data-reveal` (optionally `data-reveal="1"`…`"6"` for its
 * place in a sequence) settles into view once, when the reader's scroll brings it on screen.
 *
 * Only elements this hook has armed are ever hidden, so text rendered later, text without
 * JavaScript, and text for readers who asked for stillness is simply present. Nothing moves on
 * its own and nothing repeats: the reader's scroll is the only trigger (L1, L3).
 */
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver !== "function" || still()) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.removeAttribute("data-reveal-pending");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -6% 0px" });
    const targets = [...node.querySelectorAll<HTMLElement>("[data-reveal]")];
    for (const target of targets) target.setAttribute("data-reveal-pending", "");
    // Let the browser register the held-back state before anything can be revealed, so content
    // already on screen (the first view) settles in rather than appearing in place.
    void node.offsetWidth;
    for (const target of targets) observer.observe(target);
    // Focus can reach an action before its intersection callback runs.
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-reveal-pending]");
      if (!target || !node.contains(target)) return;
      target.removeAttribute("data-reveal-pending");
      observer.unobserve(target);
    };
    node.addEventListener("focusin", revealFocused);
    return () => {
      observer.disconnect();
      node.removeEventListener("focusin", revealFocused);
      for (const target of targets) target.removeAttribute("data-reveal-pending");
    };
  }, [root]);
}
