import React, { useEffect, useRef } from "react";
import { useOrganism } from "./OrganismContext";
import { ORGANISM_PRESETS } from "./types";

interface Cell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  life: number; // 1 → 0
}

const MAX_CELLS = 72;
const BASE_CELLS = 32;

/**
 * The living membrane: an ambient plexus that *is* the organism's body.
 *
 *  - drift speed tracks **arousal** (it quickens as you move and use the page);
 *  - the number of connected cells tracks **synapsis** (the orchestrator's
 *    work — more imports running, more of the body lights up);
 *  - hue / chroma / luminance track **circadian time** and **metabolism**,
 *    read live from the CSS variables the bridge eases each frame so the
 *    membrane and the page aura always agree;
 *  - your cursor exerts a gentle **tropism** — nearby cells lean toward it;
 *  - each orchestrator **pulse** spawns an expanding ripple.
 *
 * Under reduced motion it paints a single calm frame and never animates. It is
 * `pointer-events: none`, sits behind all content, and caps its own work.
 */
export const OrganismMembrane: React.FC = () => {
  const { vitals, config, reducedMotion } = useOrganism();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    if (!config.enabled || !config.showMembrane) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    const cells: Cell[] = [];
    const ripples: Ripple[] = [];
    let prevPulse = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnCell = (): Cell => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
    });

    const ensureCells = (count: number) => {
      while (cells.length < count && cells.length < MAX_CELLS) cells.push(spawnCell());
      if (cells.length > count) cells.length = Math.max(count, 0);
    };

    resize();
    ensureCells(BASE_CELLS);

    // Read the eased physiology the bridge writes onto <html>.
    const styles = getComputedStyle(document.documentElement);
    const num = (name: string, fallback: number) => {
      const v = parseFloat(styles.getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };

    const palette = () => {
      const hue = num("--organism-hue", 200);
      const chroma = num("--organism-chroma", 0.05);
      const luma = num("--organism-luma", 0.6);
      const sat = Math.max(8, Math.min(72, chroma * 320));
      const light = 46 + luma * 22;
      return { hue, sat, light };
    };

    const draw = (animate: boolean) => {
      const v = vitals.current;
      const { hue, sat, light } = palette();
      const synapsis = num("--organism-synapsis", v.synapsis);
      const arousal = num("--organism-arousal", v.arousal);
      const pulse = num("--organism-pulse", 0);
      const calm = num("--organism-calm", v.calm);
      const intensity = config.intensity;
      const preset = ORGANISM_PRESETS[config.preset] ?? ORGANISM_PRESETS.plexus;
      // While reading, the body grows still: fewer connections, fainter, slower.
      const alive = 1 - calm;
      const effSyn = synapsis * alive;

      ensureCells(
        Math.round((BASE_CELLS + effSyn * (MAX_CELLS - BASE_CELLS)) * preset.density),
      );

      // Rising edge of a pulse → ripple from a random living cell. (The bridge
      // already withholds pulses during reading, so this rarely fires there.)
      if (pulse > prevPulse + 0.25 && cells.length) {
        const c = cells[Math.floor(Math.random() * cells.length)];
        ripples.push({ x: c.x, y: c.y, r: 0, life: 1 });
      }
      prevPulse = pulse;

      ctx.clearRect(0, 0, w, h);

      const speed =
        animate ? (0.4 + arousal * 2.2) * (1 - 0.92 * calm) * preset.speed : 0;
      const linkDist = Math.min(w, h) * (0.16 + 0.06 * synapsis);

      for (const c of cells) {
        if (animate) {
          c.x += c.vx * speed;
          c.y += c.vy * speed;

          // Cursor tropism: a soft pull toward the pointer when it's near.
          // Suppressed during reading so the field never tugs under the text.
          if (pointer.current.active && calm < 0.5) {
            const dx = pointer.current.x - c.x;
            const dy = pointer.current.y - c.y;
            const d2 = dx * dx + dy * dy;
            const reach = 180;
            if (d2 < reach * reach) {
              const f = (1 - Math.sqrt(d2) / reach) * 0.04 * alive;
              c.vx += dx * f * 0.01;
              c.vy += dy * f * 0.01;
            }
          }

          // Mild damping keeps velocities organic, not explosive.
          c.vx *= 0.99;
          c.vy *= 0.99;

          // Wrap softly at the edges.
          if (c.x < -20) c.x = w + 20;
          if (c.x > w + 20) c.x = -20;
          if (c.y < -20) c.y = h + 20;
          if (c.y > h + 20) c.y = -20;
          c.phase += (0.01 + arousal * 0.02) * (1 - 0.85 * calm);
        }
      }

      // Synapse links between nearby cells.
      ctx.lineWidth = 1;
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const a = cells[i];
          const b = cells[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha =
              (1 - dist / linkDist) * (0.1 + 0.18 * synapsis) * intensity *
              (1 - 0.78 * calm);
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Cell bodies — gently breathing nuclei. They dim but never fully vanish
      // while reading, so the body still feels quietly alive.
      for (const c of cells) {
        const breath = animate ? 0.75 + 0.25 * Math.sin(c.phase) : 1;
        const a = (0.24 + 0.42 * synapsis) * intensity * (1 - 0.6 * calm);
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light + 12}%, ${a})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * breath, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulse ripples — a synapse firing across the body.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 3.2;
        rp.life -= 0.018;
        if (rp.life <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `hsla(${(hue + 60) % 360}, ${Math.min(90, sat + 20)}%, ${light + 16}%, ${rp.life * 0.5 * intensity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    // Reduced motion: paint one settled frame, then nothing.
    if (reducedMotion) {
      draw(false);
      const onResize = () => {
        resize();
        draw(false);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let raf = 0;
    let running = true;
    const frame = () => {
      if (!running) return;
      draw(true);
      raf = requestAnimationFrame(frame);
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onPointerLeave = () => {
      pointer.current.active = false;
    };
    // Pause when the tab is hidden to spend nothing in the background.
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    vitals,
    config.enabled,
    config.showMembrane,
    config.intensity,
    config.preset,
    reducedMotion,
  ]);

  if (!config.enabled || !config.showMembrane) return null;

  return (
    <div className="organism-membrane" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
};
