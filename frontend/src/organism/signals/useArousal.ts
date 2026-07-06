import { useEffect } from "react";
import type { RefObject } from "react";
import type { VitalSigns } from "../types";

interface ArousalOptions {
  /** Pause the rAF loop (e.g. when the organism is disabled). */
  active: boolean;
  /** Skip the per-frame loop under reduced motion; still register input. */
  reducedMotion: boolean;
}

/**
 * Sympathetic activation from raw user input.
 *
 * Pointer movement, scrolling, key presses and clicks deposit "energy" into a
 * pool that decays exponentially. The result — a smoothed [0,1] arousal — is
 * written straight into the shared {@link VitalSigns} ref every animation
 * frame. It never calls setState, so an actively-used page does not re-render
 * React 60 times a second; only the bridge and membrane read the ref.
 *
 * This is the "highly reactive to the user" axis: the organism quickens when
 * you move and settles when you rest.
 */
export function useArousal(
  vitals: RefObject<VitalSigns>,
  { active, reducedMotion }: ArousalOptions,
): void {
  useEffect(() => {
    if (!active) {
      vitals.current.arousal = 0;
      return;
    }

    let energy = 0; // raw, uncapped excitement pool
    let raf = 0;
    let lastPointer: { x: number; y: number; t: number } | null = null;

    const deposit = (amount: number) => {
      energy = Math.min(1.6, energy + amount);
    };

    const onPointerMove = (e: PointerEvent) => {
      const t = performance.now();
      if (lastPointer) {
        const dt = Math.max(16, t - lastPointer.t);
        const dist = Math.hypot(e.clientX - lastPointer.x, e.clientY - lastPointer.y);
        // Speed in px/ms, gently saturated so a fast flick can't peg it.
        deposit(Math.min(0.22, (dist / dt) * 0.05));
      }
      lastPointer = { x: e.clientX, y: e.clientY, t };
    };
    const onScroll = () => deposit(0.06);
    const onKey = () => deposit(0.05);
    const onDown = () => deposit(0.18);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });

    // Reduced motion: don't run a 60fps loop. Reflect input at a calm 4Hz and
    // let the value settle without animating anything downstream.
    if (reducedMotion) {
      const id = window.setInterval(() => {
        energy *= 0.6;
        vitals.current.arousal = Math.min(1, energy);
      }, 250);
      return () => {
        window.clearInterval(id);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("pointerdown", onDown);
      };
    }

    const loop = () => {
      // Decay ~per frame. Tab-blur freezes rAF, so no runaway while hidden.
      energy *= 0.972;
      // Ease the published value toward the pool for a fluid, organic response.
      const target = Math.min(1, energy);
      vitals.current.arousal += (target - vitals.current.arousal) * 0.12;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [vitals, active, reducedMotion]);
}
