import React, { useEffect, useRef } from "react";
import { useOrganism } from "./OrganismContext";
import { ORGANISM_PRESETS } from "./types";

interface Point {
  /** Live position. */
  x: number;
  y: number;
  /** Home position — the lattice anchors to it; the constellation ignores it. */
  hx: number;
  hy: number;
  vx: number;
  vy: number;
  r: number;
  /** 0 = far (small, faint, slow) … 1 = near (larger, brighter, quicker). */
  depth: number;
  phase: number;
  /** Field-of-bits state: the bit carried, and when it next flips (a delta). */
  bit: "0" | "1";
  flipAt: number;
}

interface Bloom {
  /** Orbit centre, in viewport fractions. */
  ox: number;
  oy: number;
  rx: number;
  ry: number;
  /** Bloom radius as a fraction of the viewport diagonal. */
  size: number;
  speed: number;
  phase: number;
  /** Degrees off the base hue, so the blooms read as one family, not a rainbow. */
  hueShift: number;
  weight: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  life: number; // 1 → 0
}

/** Depth tiers for the constellation. Parallax is what makes it read as space. */
const DEPTHS = [0.28, 0.62, 1];
const POINT_BUDGET = 120;
/** The field never goes fully dark at centre — it thins, which reads as depth. */
const CLEARANCE_FLOOR = 0.14;

/**
 * The living membrane — the page's ambient ground.
 *
 * Three deliberately different compositions, not three densities of one effect.
 * Each obeys a single rule, so nothing on screen is arbitrary:
 *
 *  - **Aurora** — no points at all. Four slow blooms of light on lazy orbits,
 *    mostly parked past the edges so only their falloff reaches the page.
 *    Nothing to read, nothing to track: the kindest ground for prose.
 *  - **Constellation** — sparse points on three parallax planes; each point
 *    joins *only its single nearest neighbour on its own plane*. That cap is
 *    the whole design: quiet pairs and short chains instead of the
 *    everything-to-everything mesh that reads as noise.
 *  - **Lattice** — an even grid warped by one travelling wave, linked along its
 *    own rows and columns and never diagonally. The graph substrate, made
 *    visible.
 *
 * Every field is multiplied by a **clearance mask** that fades it to nothing
 * across the middle of the viewport, where content sits. The background is a
 * frame, never a texture behind text.
 *
 * Physiology still drives it: drift tracks arousal, brightness tracks synapsis,
 * hue/chroma/luminance track circadian time and metabolism, the cursor exerts a
 * gentle tropism, and each orchestrator pulse spawns a ripple. Reading
 * (calm → 1) settles all of it toward stillness.
 *
 * Under reduced motion — or with stillness on — it paints one settled frame and
 * never animates. It is `pointer-events: none`, sits behind all content, and
 * caps its own work.
 */
export const OrganismMembrane: React.FC = () => {
  const { vitals, config, reducedMotion } = useOrganism();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  const still = reducedMotion || config.stillness;

  useEffect(() => {
    if (!config.enabled || !config.showMembrane || config.preset === "off")
      return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const spec = ORGANISM_PRESETS[config.preset];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let points: Point[] = [];
    let cols = 0;
    let rows = 0;
    const ripples: Ripple[] = [];
    let prevPulse = 0;
    let t = 0;

    const blooms: Bloom[] = [
      { ox: 0.16, oy: 0.12, rx: 0.1, ry: 0.08, size: 0.52, speed: 0.055, phase: 0, hueShift: -18, weight: 1 },
      { ox: 0.86, oy: 0.22, rx: 0.09, ry: 0.11, size: 0.46, speed: 0.041, phase: 2.1, hueShift: 26, weight: 0.85 },
      { ox: 0.72, oy: 0.92, rx: 0.12, ry: 0.07, size: 0.58, speed: 0.033, phase: 4.0, hueShift: 8, weight: 0.7 },
      { ox: 0.24, oy: 0.82, rx: 0.08, ry: 0.1, size: 0.42, speed: 0.048, phase: 5.4, hueShift: -34, weight: 0.55 },
    ];

    const buildConstellation = (count: number) => {
      points = Array.from({ length: count }, (_, i) => {
        const depth = DEPTHS[i % DEPTHS.length];
        const x = Math.random() * w;
        const y = Math.random() * h;
        const drift = 0.16 + depth * 0.22;
        return {
          x,
          y,
          hx: x,
          hy: y,
          vx: (Math.random() - 0.5) * drift,
          vy: (Math.random() - 0.5) * drift,
          r: 0.5 + depth * 1.6,
          depth,
          phase: Math.random() * Math.PI * 2,
          bit: Math.random() < 0.5 ? ("0" as const) : ("1" as const),
          flipAt: Math.random() * 8,
        };
      });
    };

    /**
     * The field of bits — E, the stream of experience. Points are glyphs, not
     * dots: 0s and 1s rising slowly, each flipping now and then. A flip is a
     * delta — the smallest unit of change the Canvas would carry. No links;
     * experience arrives unjoined until something interprets it.
     */
    const buildField = () => {
      const budget = Math.min(160, Math.max(48, Math.round((w * h) / 16000)));
      points = Array.from({ length: budget }, (_, i) => {
        const depth = DEPTHS[i % DEPTHS.length];
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          hx: 0,
          hy: 0,
          vx: 0,
          vy: 0,
          r: 1,
          depth,
          phase: Math.random() * Math.PI * 2,
          bit: Math.random() < 0.5 ? ("0" as const) : ("1" as const),
          flipAt: Math.random() * 10,
        };
      });
    };

    const buildLattice = () => {
      // One spacing rule for every viewport keeps the grid's rhythm recognisable.
      const gap = Math.max(64, Math.min(112, Math.min(w, h) / 9));
      cols = Math.ceil(w / gap) + 1;
      rows = Math.ceil(h / gap) + 1;
      const offX = (w - (cols - 1) * gap) / 2;
      const offY = (h - (rows - 1) * gap) / 2;
      points = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hx = offX + c * gap;
          const hy = offY + r * gap;
          points.push({
            x: hx,
            y: hy,
            hx,
            hy,
            vx: 0,
            vy: 0,
            r: 1.1,
            depth: 1,
            phase: (c + r) * 0.6,
            bit: "0",
            flipAt: 0,
          });
        }
      }
    };

    const buildNeural = () => {
      const count = Math.min(40, Math.max(12, Math.round((w * h) / 40000)));
      points = Array.from({ length: count }, (_, i) => {
        const depth = DEPTHS[i % DEPTHS.length];
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x, y, hx: x, hy: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.5 + depth * 2.5,
          depth, phase: Math.random() * Math.PI * 2,
          bit: "0" as const, flipAt: 0,
        };
      });
    };

    const rebuild = () => {
      if (config.preset === "lattice") buildLattice();
      else if (config.preset === "field") buildField();
      else if (config.preset === "neural") buildNeural();
      else if (spec.density > 0) {
        const budget = Math.min(POINT_BUDGET, (w * h) / 14000) * spec.density;
        buildConstellation(Math.max(24, Math.round(budget)));
      } else points = [];
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    };

    resize();

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
      const sat = Math.max(12, Math.min(72, chroma * 320));
      // Contrast must come from the base theme: darker strokes on light,
      // lighter strokes on dark — otherwise the membrane vanishes.
      const dark = document.documentElement.classList.contains("dark");
      const light = dark ? 60 + luma * 16 : 34 + luma * 10;
      return { hue, sat, light, dark };
    };

    /**
     * Clearance: thinnest across the middle of the viewport where content
     * lives, full strength at the edges. Slightly elliptical so wide screens
     * keep their centre column clean, and floored rather than cut to zero so
     * the field stays continuous instead of breaking into stray marks.
     */
    const clearance = (x: number, y: number) => {
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      const d = Math.sqrt(nx * nx * 0.72 + ny * ny);
      const e = Math.min(1, Math.max(0, (d - 0.18) / 0.72));
      const s = e * e * (3 - 2 * e); // smoothstep
      return CLEARANCE_FLOOR + (1 - CLEARANCE_FLOOR) * s;
    };

    const drawAurora = (
      alpha: number,
      hue: number,
      sat: number,
      dark: boolean,
    ) => {
      if (alpha <= 0.002) return;
      const diag = Math.hypot(w, h);
      for (const b of blooms) {
        const a = t * b.speed + b.phase;
        const x = (b.ox + Math.cos(a) * b.rx) * w;
        const y = (b.oy + Math.sin(a * 1.3) * b.ry) * h;
        const radius = b.size * diag * (0.9 + 0.1 * Math.sin(a * 0.7));
        const strength = alpha * b.weight * (dark ? 0.15 : 0.085);
        if (strength <= 0.002) continue;
        const bh = (hue + b.hueShift + 360) % 360;
        const light = dark ? 52 : 58;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `hsla(${bh}, ${sat + 14}%, ${light}%, ${strength})`);
        grad.addColorStop(0.5, `hsla(${bh}, ${sat}%, ${light}%, ${strength * 0.38})`);
        grad.addColorStop(1, `hsla(${bh}, ${sat}%, ${light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /**
     * A nearest-neighbour graph, one edge per point, computed per plane.
     *
     * Every point reaches for exactly one partner, so the field resolves into
    /** Rows and columns only — the lattice never draws a diagonal. */
    const drawLatticeLinks = (
      hue: number,
      sat: number,
      light: number,
      alpha: number,
    ) => {
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const a = points[r * cols + c];
          const east = c + 1 < cols ? points[r * cols + c + 1] : null;
          const south = r + 1 < rows ? points[(r + 1) * cols + c] : null;
          for (const n of [east, south]) {
            if (!n) continue;
            const mask = Math.min(clearance(a.x, a.y), clearance(n.x, n.y));
            const strength = alpha * mask * 0.32;
            if (strength <= 0.004) continue;
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${strength})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
      }
    };

    /**
     * The field of bits — glyphs rising like experience arriving, each
     * occasionally flipping. No links: this stream is not yet interpreted.
     * Quieter than the other fields — it's a weather, not a structure.
     */
    const drawField = (
      hue: number,
      sat: number,
      light: number,
      alpha: number,
      animate: boolean,
    ) => {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const p of points) {
        if (animate) {
          // Slow rise with a gentle sway; wrap at the edges so the stream
          // never ends. Deeper bits move a touch faster — parallax of attention.
          p.y -= (0.12 + p.depth * 0.3) * spec.speed;
          p.x += Math.sin(p.phase) * 0.08;
          p.phase += 0.004;
          if (p.y < -20) {
            p.y = h + 20;
            p.x = Math.random() * w;
          }
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          // A bit flips when its time comes — a delta in the stream.
          p.flipAt -= 1 / 60;
          if (p.flipAt <= 0) {
            p.bit = p.bit === "0" ? "1" : "0";
            p.flipAt = 4 + Math.random() * 10;
          }
        }
        const mask = clearance(p.x, p.y);
        const a = alpha * mask * (0.16 + p.depth * 0.22);
        if (a <= 0.005) continue;
        const size = 9 + p.depth * 5;
        ctx.font = `${size}px ui-monospace, monospace`;
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light + 8}%, ${a})`;
        ctx.fillText(p.bit, p.x, p.y);
      }
    };

    const drawNeuralLinks = (
      reach: number, hue: number, sat: number, light: number, alpha: number,
      synapsis: number, animate: boolean,
    ) => {
      const r2 = reach * reach;
      // Draw connections with signal propagation
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const proximity = 1 - Math.sqrt(d2) / reach;
          const mask = Math.min(clearance(a.x, a.y), clearance(b.x, b.y));
          const pulse = animate ? 0.5 + 0.5 * Math.sin(a.phase + b.phase + t * 2) : 0.7;
          const lineAlpha = alpha * mask * proximity * (0.15 + 0.35 * synapsis) * pulse;
          if (lineAlpha <= 0.005) continue;

          // Signal traveling along the connection
          if (animate && synapsis > 0.1) {
            const signalPos = (Math.sin(a.phase * 0.7 + t * 3) + 1) / 2;
            const sx = a.x + (b.x - a.x) * signalPos;
            const sy = a.y + (b.y - a.y) * signalPos;
            const signalAlpha = lineAlpha * 2.5 * synapsis;
            ctx.fillStyle = `hsla(${(hue + 30) % 360}, ${Math.min(90, sat + 25)}%, ${light + 20}%, ${signalAlpha})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5 + proximity * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 10}%, ${lineAlpha})`;
          ctx.lineWidth = 0.8 + proximity * 1.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Node halos — each node glows with its own rhythm
      for (const p of points) {
        const mask = clearance(p.x, p.y);
        const glow = animate ? 0.6 + 0.4 * Math.sin(p.phase + t * 1.5) : 0.8;
        const haloAlpha = alpha * mask * p.depth * 0.12 * glow;
        if (haloAlpha <= 0.005) continue;
        const haloR = p.r * (3 + 2 * synapsis);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        grad.addColorStop(0, `hsla(${(hue + 15) % 360}, ${sat + 10}%, ${light + 15}%, ${haloAlpha})`);
        grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Breath — concentric rings that expand and fade, like the organism breathing.
    const drawBreath = (
      hue: number, sat: number, light: number, alpha: number, animate: boolean,
    ) => {
      // Two breath sources — primary at centre, secondary offset for depth.
      const sources = [
        { x: w / 2, y: h / 2, weight: 1, phaseOff: 0 },
        { x: w * 0.3, y: h * 0.35, weight: 0.5, phaseOff: 0.33 },
        { x: w * 0.72, y: h * 0.65, weight: 0.4, phaseOff: 0.6 },
      ];
      const maxR = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2);
      const ringCount = 6;
      const period = 8;

      for (const src of sources) {
        for (let i = 0; i < ringCount; i++) {
          const phase = animate
            ? (t / period + i / ringCount + src.phaseOff) % 1
            : (i / ringCount + src.phaseOff) % 1;
          const r = phase * maxR * 0.9;
          const life = 1 - phase;
          const a = alpha * life * life * 0.25 * src.weight;
          if (a <= 0.005) continue;
          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 8}%, ${a})`;
          ctx.lineWidth = 0.8 + life * 1.8;
          ctx.beginPath();
          ctx.arc(src.x, src.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Soft central glow that pulses with the breath
      if (alpha > 0.01) {
        const breathPhase = animate ? (Math.sin(t / period * Math.PI * 2) + 1) / 2 : 0.5;
        const glowR = maxR * (0.2 + 0.15 * breathPhase);
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, glowR);
        grad.addColorStop(0, `hsla(${hue}, ${sat}%, ${light + 12}%, ${alpha * 0.08 * (0.5 + 0.5 * breathPhase)})`);
        grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Ink — calligraphic strokes that drift and dissolve.
    interface InkStroke {
      points: { x: number; y: number }[];
      life: number;
      maxLife: number;
      width: number;
      phase: number;
    }
    const inkStrokes: InkStroke[] = [];
    let inkTimer = 0;

    const spawnInkStroke = () => {
      // Strokes favour the edges where the clearance mask lets them show.
      const edge = Math.random() < 0.6;
      const startX = edge
        ? (Math.random() < 0.5 ? Math.random() * w * 0.3 : w * 0.7 + Math.random() * w * 0.3)
        : Math.random() * w;
      const startY = edge
        ? Math.random() * h
        : (Math.random() < 0.5 ? Math.random() * h * 0.25 : h * 0.75 + Math.random() * h * 0.25);
      const angle = Math.random() * Math.PI * 2;
      const len = 140 + Math.random() * 260;
      const segments = 10 + Math.floor(Math.random() * 8);
      const curvature = 25 + Math.random() * 40;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= segments; i++) {
        const frac = i / segments;
        // Organic curve: sine-wave deviation perpendicular to the stroke direction
        const perp = Math.sin(frac * Math.PI * (1.5 + Math.random())) * curvature;
        pts.push({
          x: startX + Math.cos(angle) * len * frac + Math.sin(angle) * perp + (Math.random() - 0.5) * 8,
          y: startY + Math.sin(angle) * len * frac - Math.cos(angle) * perp + (Math.random() - 0.5) * 8,
        });
      }
      const maxLife = 5 + Math.random() * 6;
      inkStrokes.push({
        points: pts, life: maxLife, maxLife,
        width: 1.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    };

    const drawInk = (
      hue: number, sat: number, light: number, alpha: number, animate: boolean,
    ) => {
      if (animate) {
        inkTimer -= 1 / 60;
        if (inkTimer <= 0) {
          // Spawn 1-2 strokes at a time for density
          spawnInkStroke();
          if (Math.random() < 0.4) spawnInkStroke();
          inkTimer = 0.6 + Math.random() * 1.8;
        }
      }
      if (!animate && inkStrokes.length === 0) {
        for (let i = 0; i < 8; i++) spawnInkStroke();
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = inkStrokes.length - 1; i >= 0; i--) {
        const s = inkStrokes[i];
        if (animate) s.life -= 1 / 60;
        if (s.life <= 0) { inkStrokes.splice(i, 1); continue; }
        const frac = s.life / s.maxLife;
        // Smooth fade in (first 15%) then long sustain then fade out (last 20%)
        const envelope = frac > 0.85 ? (1 - frac) / 0.15 : frac < 0.2 ? frac / 0.2 : 1;
        // Ink ignores the clearance mask — strokes are the content, not noise
        const a = alpha * envelope * 0.7;
        if (a <= 0.005) continue;

        // Pressure-sensitive width: thicker in the middle, tapered at ends
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 6}%, ${a})`;
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        for (let j = 1; j < s.points.length; j++) {
          const prev = s.points[j - 1];
          const cur = s.points[j];
          const mx = (prev.x + cur.x) / 2;
          const my = (prev.y + cur.y) / 2;
          // Vary width along the stroke for a calligraphic feel
          const strokeFrac = j / s.points.length;
          const pressure = Math.sin(strokeFrac * Math.PI);
          ctx.lineWidth = s.width * (0.3 + 0.7 * pressure) * (0.5 + 0.5 * envelope);
          ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
        }
        const last = s.points[s.points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();

        // Faint glow trail along the stroke
        if (a > 0.1) {
          const mid = s.points[Math.floor(s.points.length / 2)];
          const glowA = a * 0.15;
          const grad = ctx.createRadialGradient(mid.x, mid.y, 0, mid.x, mid.y, 30);
          grad.addColorStop(0, `hsla(${(hue + 20) % 360}, ${sat + 10}%, ${light + 15}%, ${glowA})`);
          grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(mid.x, mid.y, 30, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const draw = (animate: boolean) => {
      const v = vitals.current;
      const { hue, sat, light, dark } = palette();
      const synapsis = num("--organism-synapsis", v.synapsis);
      const arousal = num("--organism-arousal", v.arousal);
      const pulse = num("--organism-pulse", 0);
      const calm = num("--organism-calm", v.calm);
      const intensity = config.intensity;
      // Reading settles the field without extinguishing it.
      const quiet = 1 - 0.72 * calm;
      const alpha = intensity * spec.alpha * quiet;

      if (animate) t += 1 / 60;

      // Rising edge of a pulse → ripple. (The bridge already withholds pulses
      // during reading, so this rarely fires there.)
      if (pulse > prevPulse + 0.25) {
        const src = points.length
          ? points[Math.floor(Math.random() * points.length)]
          : { x: w / 2, y: h * 0.12 };
        ripples.push({ x: src.x, y: src.y, r: 0, life: 1 });
      }
      prevPulse = pulse;

      ctx.clearRect(0, 0, w, h);

      // Every field rests on the same light, so changing field changes the
      // structure without changing the colour of the room.
      drawAurora(alpha * (config.preset === "aurora" ? 1 : 0.4), hue, sat, dark);

      const speed = animate
        ? (0.35 + arousal * 1.6) * (1 - 0.9 * calm) * spec.speed
        : 0;

      if (config.preset === "neural") {
        for (const p of points) {
          if (!animate) continue;
          p.x += p.vx * speed * p.depth;
          p.y += p.vy * speed * p.depth;

          if (pointer.current.active && calm < 0.5) {
            const dx = pointer.current.x - p.x;
            const dy = pointer.current.y - p.y;
            const d2 = dx * dx + dy * dy;
            const reach = 200;
            if (d2 < reach * reach) {
              const f = (1 - Math.sqrt(d2) / reach) * 0.0004 * p.depth;
              p.vx += dx * f;
              p.vy += dy * f;
            }
          }

          p.vx *= 0.992;
          p.vy *= 0.992;
          if (p.x < -30) p.x = w + 30;
          if (p.x > w + 30) p.x = -30;
          if (p.y < -30) p.y = h + 30;
          if (p.y > h + 30) p.y = -30;
          p.phase += (0.006 + arousal * 0.012) * (1 - 0.85 * calm);
        }
        drawNeuralLinks(
          Math.min(w, h) * (spec.linkFactor + 0.04 * synapsis),
          hue, sat, light, alpha, synapsis, animate,
        );
      } else if (config.preset === "breath") {
        drawBreath(hue, sat, light, alpha, animate);
      } else if (config.preset === "ink") {
        drawInk(hue, sat, light, alpha, animate);
      } else if (config.preset === "lattice") {
        // One travelling wave warps the whole grid coherently, so the structure
        // stays legible while nothing sits perfectly still.
        const amp = 7 + 5 * arousal;
        const wave = t * 0.5 * spec.speed * (animate ? 1 : 0);
        for (const p of points) {
          p.x = p.hx + Math.sin(p.hy * 0.012 + wave + p.phase * 0.1) * amp;
          p.y = p.hy + Math.cos(p.hx * 0.011 - wave * 0.8) * amp * 0.7;
        }
        drawLatticeLinks(hue, sat, light, alpha);
      } else if (config.preset === "field") {
        // E, as glyphs — the stream before interpretation. Drawn and moved in
        // its own pass; the generic point-body loop below skips this preset
        // because bits are text, not dots.
        drawField(hue, sat, light, alpha, animate);
      }

      // Point bodies — presets that draw their own visuals skip this.
      if (config.preset !== "field" && config.preset !== "breath" && config.preset !== "ink")
      for (const p of points) {
        const mask = clearance(p.x, p.y);
        const breath = animate ? 0.8 + 0.2 * Math.sin(p.phase) : 1;
        const a = alpha * mask * p.depth * (0.4 + 0.3 * synapsis);
        if (a <= 0.005) continue;
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light + 12}%, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * breath, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulse ripples — a synapse firing across the body.
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        if (animate) {
          rp.r += 3.2;
          rp.life -= 0.018;
        }
        if (rp.life <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `hsla(${(hue + 60) % 360}, ${Math.min(90, sat + 20)}%, ${light + 16}%, ${rp.life * 0.4 * intensity * quiet})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    // Still: paint one settled frame, then nothing.
    if (still) {
      draw(false);
      const onResize = () => {
        resize();
        draw(false);
      };
      // Repaint the static frame when the light/dark class flips.
      const themeObserver = new MutationObserver(() => draw(false));
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      window.addEventListener("resize", onResize);
      return () => {
        themeObserver.disconnect();
        window.removeEventListener("resize", onResize);
      };
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
    still,
  ]);

  if (!config.enabled || !config.showMembrane || config.preset === "off")
    return null;

  return (
    <div className="organism-membrane" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
};
