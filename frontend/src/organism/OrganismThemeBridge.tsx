import React, { useEffect } from "react";
import { useOrganism } from "./OrganismContext";
import type { VitalSigns } from "./types";

const TAU = Math.PI * 2;

/**
 * Translates the organism's vitals into CSS custom properties on `<html>`,
 * eased frame-by-frame so colour and tempo glide rather than jump.
 *
 * It writes raw vital channels (`--organism-hue`, `--organism-chroma`, …) plus
 * a breathing cadence; `organism.css` composes those into the living accent,
 * the aura, and the breathing animation. Driving CSS variables (instead of
 * React state) keeps this at zero render cost no matter how fast the vitals
 * move. Renders nothing.
 */
export const OrganismThemeBridge: React.FC = () => {
  const { vitals, config, reducedMotion } = useOrganism();

  const tint = config.tint;

  useEffect(() => {
    if (!config.enabled) return;
    const root = document.documentElement;

    // A pinned tint is the member's choice and outranks the circadian arc;
    // synaptic firing still bends it, so the organism stays legible.
    const hueOf = (v: VitalSigns) => {
      if (tint === "mono") return 0;
      return tint === "auto"
        ? hueFor(v)
        : circularMix(tint, 290, v.synapsis * 0.3 + v.synapticPulse * 0.25);
    };

    root.style.setProperty("--organism-accent-chroma-floor", tint === "mono" ? "0" : "0.02");
    root.style.setProperty(
      "--organism-accent-strong-chroma-floor",
      tint === "mono" ? "0" : "0.03",
    );

    // Eased display values so we never snap between frames.
    const shown = {
      hue: 210,
      chroma: 0,
      luma: 0.6,
      arousal: 0,
      synapsis: 0,
      glow: 0,
      calm: 0,
    };

    const writeStatic = (v: VitalSigns) => {
      // One settled frame for reduced-motion users: full physiology, no motion.
      v.calm = v.calmTarget; // snap; nothing animates here anyway
      // Reading desaturates the field a touch so text contrast stays stable.
      const hue = hueOf(v);
      const rawStaticChroma =
        0.13 * v.metabolism * config.intensity * (1 - 0.5 * v.strain) *
        (1 - 0.45 * v.calm);
      // Same floors as the animated path; reduced motion changes the tempo,
      // not the palette.
      const chroma =
        tint === "mono"
          ? 0
          : Math.max(tint === "auto" ? 0.045 : 0.06, rawStaticChroma);
      // Reduced motion never flashes: drop any pending/queued pulse silently.
      v.pendingPulse = false;
      v.pulseDeferred = false;
      v.synapticPulse = 0;
      root.style.setProperty("--organism-hue", hue.toFixed(1));
      root.style.setProperty("--organism-chroma", chroma.toFixed(4));
      root.style.setProperty("--organism-luma", v.daylight.toFixed(3));
      root.style.setProperty("--organism-arousal", v.arousal.toFixed(3));
      root.style.setProperty("--organism-synapsis", v.synapsis.toFixed(3));
      root.style.setProperty("--organism-calm", v.calm.toFixed(3));
      root.style.setProperty("--organism-pulse", "0");
      root.style.setProperty("--organism-breath", "0s");
      root.style.setProperty(
        "--organism-glow",
        `${(3.5 * config.intensity * (1 - v.calm)).toFixed(1)}px`,
      );
    };

    // Radial motion is composited by the browser. Its surfaces need ambient
    // updates, not document-wide style invalidation on every animation frame.
    if (reducedMotion || config.stillness || config.preset === "radial") {
      writeStatic(vitals.current);
      const id = window.setInterval(() => {
        if (!document.hidden) writeStatic(vitals.current);
      }, 1000);
      return () => window.clearInterval(id);
    }

    let raf = 0;
    const loop = () => {
      const v = vitals.current;
      const k = 0.06; // easing toward live targets

      // Quiescence eases in/out over ~1s so reading transitions never snap.
      shown.calm += (v.calmTarget - shown.calm) * 0.05;
      v.calm = shown.calm;
      const calm = shown.calm;
      // (1 - calm) gates everything "alive": motion, excitement, glow.
      const alive = 1 - calm;

      const targetHue = hueOf(v);
      // Shortest-path hue interpolation around the 360° wheel.
      const dh = ((targetHue - shown.hue + 540) % 360) - 180;
      shown.hue = (shown.hue + dh * k + 360) % 360;

      // Reading pins chroma lower so body-text contrast stays stable, then a
      // floor keeps the accent perceptible. A pinned tint is a stated choice
      // and gets the higher floor; "auto" gets one too, because following the
      // time of day should mean taking the hour's colour, not going grey —
      // without it the circadian accent washes out to a neutral exactly when
      // the reader settles in, and the field goes with it.
      const rawChroma =
        0.14 * v.metabolism * config.intensity * (1 - 0.5 * v.strain) *
        (1 - 0.45 * calm);
      const targetChroma =
        tint === "mono"
          ? 0
          : Math.max(tint === "auto" ? 0.045 : 0.06, rawChroma);
      shown.chroma += (targetChroma - shown.chroma) * k;
      shown.luma += (v.daylight - shown.luma) * k;
      shown.arousal += (v.arousal - shown.arousal) * 0.1;
      shown.synapsis += (v.synapsis - shown.synapsis) * k;

      // --- Pulse: fire when alive, defer (no flash) while reading -----------
      if (v.pendingPulse) {
        if (calm < 0.35) {
          // A held pulse surfaces softly after a read; a live one fires fully.
          const amplitude = v.pulseDeferred ? 0.5 : 1;
          v.synapticPulse = Math.max(v.synapticPulse, amplitude);
          v.pendingPulse = false;
          v.pulseDeferred = false;
        } else {
          // Hold it back while the user is reading.
          v.pulseDeferred = true;
        }
      }
      v.synapticPulse *= 0.92;
      if (v.synapticPulse < 0.001) v.synapticPulse = 0;

      // Glow is a whisper, not a beacon: hairline at rest, a few px at full
      // synaptic activity, always scaled by the member's intensity dial.
      const glow =
        Math.min(
          6,
          (1 + 1.5 * shown.arousal + 3 * shown.synapsis + 3 * v.synapticPulse),
        ) *
        config.intensity *
        alive;
      shown.glow += (glow - shown.glow) * 0.2;

      // Breath cadence: quickens with arousal/synapsis, but reading silences
      // that excitement and lengthens the breath toward a deep, slow rest.
      const excitation =
        Math.min(1, shown.arousal + 0.4 * shown.synapsis) * (1 - 0.92 * calm);
      const breath = 9 + 3 * calm - 5.8 * excitation;

      root.style.setProperty("--organism-hue", shown.hue.toFixed(1));
      root.style.setProperty("--organism-chroma", shown.chroma.toFixed(4));
      root.style.setProperty("--organism-luma", shown.luma.toFixed(3));
      root.style.setProperty("--organism-arousal", shown.arousal.toFixed(3));
      root.style.setProperty("--organism-synapsis", shown.synapsis.toFixed(3));
      root.style.setProperty("--organism-calm", calm.toFixed(3));
      root.style.setProperty("--organism-pulse", v.synapticPulse.toFixed(3));
      root.style.setProperty("--organism-breath", `${breath.toFixed(2)}s`);
      root.style.setProperty("--organism-glow", `${shown.glow.toFixed(1)}px`);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [vitals, config.enabled, config.intensity, config.preset, config.stillness, tint, reducedMotion]);

  return null;
};

/**
 * Hue, in degrees, blended from the circadian arc and pushed toward an
 * electric violet by synaptic firing:
 *  - deep night → cool indigo (255°)
 *  - midday     → oxygenated cyan-green (170°)
 *  - golden hour→ warm amber (40°)
 */
function hueFor(v: VitalSigns): number {
  const cool = 255; // night indigo
  const day = 170; // midday cyan-green
  const warm = 40; // dawn/dusk amber
  // Circular blend between night and day by daylight, then toward warm by warmth.
  const base = circularMix(cool, day, v.daylight);
  const withWarmth = circularMix(base, warm, v.warmth * 0.8);
  // Active synapses bias toward violet (290°).
  return circularMix(withWarmth, 290, v.synapsis * 0.5 + v.synapticPulse * 0.4);
}

function circularMix(a: number, b: number, t: number): number {
  const ar = (a / 360) * TAU;
  const br = (b / 360) * TAU;
  const x = Math.cos(ar) * (1 - t) + Math.cos(br) * t;
  const y = Math.sin(ar) * (1 - t) + Math.sin(br) * t;
  return ((Math.atan2(y, x) / TAU) * 360 + 360) % 360;
}
