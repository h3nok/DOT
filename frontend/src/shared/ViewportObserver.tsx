import { useEffect } from "react";

/** Keep phone panels inside the visible window when a keyboard pans or shrinks
 * it. Leave pinch zoom native; text and controls must remain zoomable. */
export function ViewportObserver() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const style = document.documentElement.style;
    const update = () => {
      if (Math.abs(viewport.scale - 1) > 0.01) return;
      style.setProperty("--visible-height", `${viewport.height}px`);
      style.setProperty("--visible-top", `${Math.max(0, viewport.offsetTop)}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      style.removeProperty("--visible-height");
      style.removeProperty("--visible-top");
    };
  }, []);
  return null;
}
