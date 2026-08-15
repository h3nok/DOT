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
  /** Current tracers: the path walked so far (flat x,y pairs), and its age. */
  trail?: number[];
  age?: number;
  life?: number;
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
      // Deep layer — large, slow, faint
      { ox: 0.16, oy: 0.12, rx: 0.14, ry: 0.1, size: 0.62, speed: 0.025, phase: 0, hueShift: -22, weight: 0.6 },
      { ox: 0.82, oy: 0.88, rx: 0.12, ry: 0.09, size: 0.58, speed: 0.02, phase: 3.2, hueShift: 14, weight: 0.5 },
      // Mid layer — medium, moderate drift
      { ox: 0.72, oy: 0.18, rx: 0.09, ry: 0.11, size: 0.44, speed: 0.04, phase: 1.4, hueShift: 30, weight: 0.85 },
      { ox: 0.28, oy: 0.76, rx: 0.1, ry: 0.08, size: 0.48, speed: 0.035, phase: 4.6, hueShift: -38, weight: 0.75 },
      { ox: 0.5, oy: 0.45, rx: 0.06, ry: 0.07, size: 0.36, speed: 0.045, phase: 2.8, hueShift: 8, weight: 0.65 },
      // Near layer — smaller, brighter, faster
      { ox: 0.38, oy: 0.15, rx: 0.07, ry: 0.06, size: 0.28, speed: 0.06, phase: 5.1, hueShift: 42, weight: 0.95 },
      { ox: 0.65, oy: 0.7, rx: 0.05, ry: 0.08, size: 0.3, speed: 0.055, phase: 0.8, hueShift: -12, weight: 0.9 },
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

    /* The value-noise field is defined here rather than beside its other
       users because Current's tracers are integrated at build time, which
       happens during the first resize() — before a later `const` would be
       initialised. Topology, Intent, and Current all read from it. */

    /** Deterministic value noise. Same lattice every frame; only `t` moves. */
    const lattice = (ix: number, iy: number): number => {
      const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };

    const smooth = (t: number) => t * t * (3 - 2 * t);

    const valueNoise = (x: number, y: number): number => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = smooth(x - ix);
      const fy = smooth(y - iy);
      const a = lattice(ix, iy);
      const b = lattice(ix + 1, iy);
      const c = lattice(ix, iy + 1);
      const d = lattice(ix + 1, iy + 1);
      return (
        a * (1 - fx) * (1 - fy) +
        b * fx * (1 - fy) +
        c * (1 - fx) * fy +
        d * fx * fy
      );
    };

    /**
     * One hand, not many.
     *
     * Strokes used to fly off at random angles, which reads as scribble: a
     * dozen unrelated marks with nothing in common. Here every stroke follows
     * the same slow field the contours are cut from, so neighbouring marks
     * curve *together* — the page looks written on rather than scratched at,
     * and the two fields share one underlying ground.
     */
    const flowAngle = (x: number, y: number): number =>
      valueNoise(x / 460, y / 460) * Math.PI * 3;

    /**
     * Current — tracers carried by the field, each keeping its own wake.
     *
     * A tracer that drew only the step it took last frame draws a dot: the
     * canvas is cleared every frame, so there is nothing for the marks to
     * accumulate on. Each one therefore carries its own short history and is
     * stroked as a filament, which is what makes the flow visible rather than
     * merely present.
     *
     * Trails are integrated forward at build time as well, so a field that is
     * never allowed to animate — stillness, or reduced motion — is still a
     * composed picture of the flow on its first and only frame.
     */
    const TRAIL = 30;

    /**
     * The same value-noise ground Topology and Intent read, sampled at a much
     * longer wavelength and over a single turn.
     *
     * `flowAngle` sweeps three half-turns inside one noise cell, which suits a
     * short ink stroke and is wrong for a tracer: neighbouring particles pick
     * near-opposite directions and the result reads as scattered dashes rather
     * than as a current. Same terrain, seen from further away.
     */
    const currentAngle = (x: number, y: number): number =>
      valueNoise(x / 1000, y / 1000) * Math.PI * 2;

    const buildFlow = () => {
      const budget = Math.round(
        Math.min(140, Math.max(48, (w * h) / 14000)) * config.fieldScale,
      );
      points = Array.from({ length: budget }, (_, i) => {
        const depth = DEPTHS[i % DEPTHS.length];
        let x = Math.random() * w;
        let y = Math.random() * h;
        const trail: number[] = [];
        // Walk it forward once so the tracer arrives with a wake behind it.
        for (let s = 0; s < TRAIL; s++) {
          trail.push(x, y);
          const ang = currentAngle(x, y);
          x += Math.cos(ang) * 2.1 * (0.6 + depth);
          y += Math.sin(ang) * 2.1 * (0.6 + depth);
        }
        return {
          x,
          y,
          hx: x,
          hy: y,
          vx: 0,
          vy: 0,
          r: 0.7 + depth * 1.1,
          depth,
          phase: Math.random() * Math.PI * 2,
          bit: "0" as const,
          flipAt: 0,
          trail,
          age: Math.random() * 300,
          life: 220 + Math.random() * 240,
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

    const rebuild = () => {
      if (config.preset === "lattice") buildLattice();
      else if (config.preset === "field") buildField();
      else if (config.preset === "flow") buildFlow();
      else if (spec.density > 0) {
        const budget =
          Math.min(POINT_BUDGET, (w * h) / 14000) * spec.density * config.fieldScale;
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
      // Contrast must come from the base theme: darker strokes on light,
      // lighter strokes on dark — otherwise the membrane vanishes.
      const dark = document.documentElement.classList.contains("dark");

      /*
       * Weber correction.
       *
       * The field used to draw at the same alpha in both themes, which looks
       * fair and is not: the eye judges a mark against the luminance around it,
       * not in absolute terms. The same mark that lands 16% below a dark ground
       * lands under 2% above a light one — an eight-fold difference — which is
       * why every pattern was close to invisible in daylight while looking
       * correct at night. Light mode therefore gets substantially more alpha
       * and a darker mark, to arrive at the same *apparent* presence.
       */
      const gain = dark ? 1 : 2.6;
      const light = dark ? 60 + luma * 16 : 30 - luma * 6;
      // Chroma collapses to its floor while reading, and a 12%-saturated grey
      // reads as smudged glass rather than as a decision. Light grounds show
      // colour far more readily than dark ones, so the floor is raised there.
      const sat = Math.max(dark ? 12 : 26, Math.min(72, chroma * 320));
      return { hue, sat, light, dark, gain };
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
        const strength = alpha * b.weight * (dark ? 0.15 : 0.1);
        if (strength <= 0.002) continue;
        const bh = (hue + b.hueShift + 360) % 360;
        // A bloom lighter than the paper it sits on is not a bloom, it is
        // nothing. On a light ground the light has to arrive as shadow.
        const light = dark ? 52 : 44;
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
      // Faint threads between nearby bits — the stream beginning to cohere.
      ctx.lineWidth = 0.5;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const nearest = { d2: 90 * 90, j: -1 };
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < nearest.d2) { nearest.d2 = d2; nearest.j = j; }
        }
        if (nearest.j < 0) continue;
        const b = points[nearest.j];
        const mask = Math.min(clearance(a.x, a.y), clearance(b.x, b.y));
        const la = alpha * mask * 0.06;
        if (la <= 0.005) continue;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 8}%, ${la})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    };

    // Dots — each dot is a Little c, a centre of experience. One is you.
    const drawDots = (
      hue: number, sat: number, light: number, alpha: number, animate: boolean,
    ) => {
      // Subtle inter-node field connections between nearby conscious nodes
      ctx.lineWidth = 0.6;
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          const maxReach = 140;
          if (d2 < maxReach * maxReach) {
            const prox = 1 - Math.sqrt(d2) / maxReach;
            const mask = Math.min(clearance(a.x, a.y), clearance(b.x, b.y));
            const lineAlpha = alpha * Math.max(0.3, mask) * prox * 0.18;
            if (lineAlpha > 0.005) {
              ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 14}%, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (animate) {
          // Gentle organic drift — each consciousness moving through its own field
          p.x += Math.sin(p.phase) * 0.08 * spec.speed;
          p.y += Math.cos(p.phase * 0.7) * 0.05 * spec.speed;
          p.phase += 0.003 + p.depth * 0.002;
          if (p.x < -30) p.x = w + 30;
          if (p.x > w + 30) p.x = -30;
          if (p.y < -30) p.y = h + 30;
          if (p.y > h + 30) p.y = -30;
        }

        const mask = clearance(p.x, p.y);
        const effMask = Math.max(0.42, mask);
        const pulse = animate ? 0.8 + 0.2 * Math.sin(p.phase * 2.2) : 0.9;
        const isYou = i === 0;

        // Prominent, crisp node sizing
        const r = (3.6 + p.depth * 4.2) * (isYou ? 2.0 : 1);
        const dotAlpha = alpha * effMask * (0.45 + p.depth * 0.45) * pulse * (isYou ? 1.4 : 1);
        if (dotAlpha <= 0.005) continue;

        // 1. Soft atmospheric luminous halo around each node
        const haloR = r * 3.6;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, haloR);
        grad.addColorStop(0, `hsla(${(hue + (isYou ? 20 : 0)) % 360}, ${sat + 15}%, ${light + 18}%, ${dotAlpha * 0.45})`);
        grad.addColorStop(0.5, `hsla(${hue}, ${sat}%, ${light + 10}%, ${dotAlpha * 0.15})`);
        grad.addColorStop(1, `hsla(${hue}, ${sat}%, ${light}%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Extra radiating awareness ring for "You"
        if (isYou) {
          const breatheR = r * (1.6 + 0.5 * Math.sin(t * 2));
          ctx.strokeStyle = `hsla(${(hue + 25) % 360}, ${sat + 25}%, ${light + 22}%, ${dotAlpha * 0.75})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, breatheR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3. Solid conscious core body
        ctx.fillStyle = `hsla(${hue + (isYou ? 15 : 0)}, ${sat + (isYou ? 25 : 10)}%, ${light + (isYou ? 20 : 10)}%, ${dotAlpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // 4. Luminous pinpoint spark at the centre of consciousness
        const sparkLight = light > 50 ? 98 : 95;
        ctx.fillStyle = `hsla(${(hue + 30) % 360}, 40%, ${sparkLight}%, ${dotAlpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.2, r * 0.35), 0, Math.PI * 2);
        ctx.fill();
      }
    };

    /**
     * Topology — iso-contours of a slow scalar field.
     *
     * The earlier version stacked three sine waves per line, which produces
     * near-parallel ripples: a wallpaper, not a landscape. A real contour map
     * is the *same* field cut at rising levels, so the lines close into basins
     * and ridges, crowd where the ground is steep, and open out where it is
     * flat. That is what makes it read as terrain rather than decoration, and
     * it is the reason to compute a field at all.
     *
     * The field drifts rather than scrolls: the ground itself changes shape,
     * slowly enough that nothing appears to move while you are reading it.
     */
    const TOPO_CELL = 30;
    const TOPO_LEVELS = 7;

    /** Three octaves is enough for ridges without turning into static. */
    const terrain = (x: number, y: number, t: number): number =>
      valueNoise(x * 0.9 + t, y * 0.9) * 0.6 +
      valueNoise(x * 2.1 - t * 0.6, y * 2.1 + t * 0.3) * 0.28 +
      valueNoise(x * 4.3, y * 4.3 - t * 0.4) * 0.12;

    let topoField: Float32Array | null = null;
    let topoCols = 0;
    let topoRows = 0;

    const sampleTerrain = (t: number) => {
      topoCols = Math.ceil(w / TOPO_CELL) + 1;
      topoRows = Math.ceil(h / TOPO_CELL) + 1;
      const size = topoCols * topoRows;
      if (!topoField || topoField.length !== size) topoField = new Float32Array(size);
      for (let row = 0; row < topoRows; row++) {
        for (let col = 0; col < topoCols; col++) {
          topoField[row * topoCols + col] = terrain(
            (col * TOPO_CELL) / 420,
            (row * TOPO_CELL) / 420,
            t,
          );
        }
      }
    };

    /** Where along an edge the level crosses, so contours are smooth, not stepped. */
    const crossing = (a: number, b: number, level: number): number =>
      Math.abs(b - a) < 1e-6 ? 0.5 : (level - a) / (b - a);

    const drawTopology = (
      hue: number, sat: number, light: number, alpha: number, animate: boolean,
    ) => {
      topoTime += animate ? 0.0006 * spec.speed : 0;
      sampleTerrain(topoTime);
      const field = topoField;
      if (!field) return;

      ctx.lineWidth = 0.8;
      ctx.lineCap = "round";

      for (let level = 1; level <= TOPO_LEVELS; level++) {
        // Levels span the band the field actually occupies. Cutting at even
        // fractions of 0..1 wasted the outer contours — three octaves of noise
        // average toward the middle, so the highest line never appeared and the
        // lowest traced the edge of the viewport rather than any terrain.
        const value = 0.3 + (level / (TOPO_LEVELS + 1)) * 0.44;
        // Higher ground is drawn brighter, which is what gives the map depth.
        const a = alpha * 0.3 * (0.45 + 0.55 * (level / TOPO_LEVELS));
        if (a <= 0.005) continue;
        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + 6}%, ${a})`;
        ctx.beginPath();

        for (let row = 0; row < topoRows - 1; row++) {
          for (let col = 0; col < topoCols - 1; col++) {
            const x0 = col * TOPO_CELL;
            const y0 = row * TOPO_CELL;
            // The clearance mask thins the field behind the reading column.
            if (clearance(x0 + TOPO_CELL / 2, y0 + TOPO_CELL / 2) < 0.06) continue;

            const tl = field[row * topoCols + col];
            const tr = field[row * topoCols + col + 1];
            const br = field[(row + 1) * topoCols + col + 1];
            const bl = field[(row + 1) * topoCols + col];

            // Marching squares: which corners stand above this level.
            const code =
              (tl > value ? 8 : 0) | (tr > value ? 4 : 0) |
              (br > value ? 2 : 0) | (bl > value ? 1 : 0);
            if (code === 0 || code === 15) continue;

            const top = { x: x0 + TOPO_CELL * crossing(tl, tr, value), y: y0 };
            const right = { x: x0 + TOPO_CELL, y: y0 + TOPO_CELL * crossing(tr, br, value) };
            const bottom = { x: x0 + TOPO_CELL * crossing(bl, br, value), y: y0 + TOPO_CELL };
            const left = { x: x0, y: y0 + TOPO_CELL * crossing(tl, bl, value) };

            const segment = (from: { x: number; y: number }, to: { x: number; y: number }) => {
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
            };

            switch (code) {
              case 1: case 14: segment(left, bottom); break;
              case 2: case 13: segment(bottom, right); break;
              case 3: case 12: segment(left, right); break;
              case 4: case 11: segment(top, right); break;
              case 6: case 9: segment(top, bottom); break;
              case 7: case 8: segment(left, top); break;
              // Saddles: both crossings are real, so draw both.
              case 5: segment(left, top); segment(bottom, right); break;
              case 10: segment(top, right); segment(left, bottom); break;
            }
          }
        }
        ctx.stroke();
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
    let topoTime = 0;
    const inkStrokes: InkStroke[] = [];
    let inkTimer = 0;


    const spawnInkStroke = () => {
      // Strokes favour the edges where the clearance mask lets them show.
      const edge = Math.random() < 0.6;
      let x = edge
        ? (Math.random() < 0.5 ? Math.random() * w * 0.3 : w * 0.7 + Math.random() * w * 0.3)
        : Math.random() * w;
      let y = edge
        ? Math.random() * h
        : (Math.random() < 0.5 ? Math.random() * h * 0.25 : h * 0.75 + Math.random() * h * 0.25);

      const segments = 16 + Math.floor(Math.random() * 10);
      const step = 14 + Math.random() * 10;
      // The hand keeps its heading and is only bent by the field, so a stroke
      // curves instead of wandering.
      let angle = flowAngle(x, y);
      const pts: { x: number; y: number }[] = [{ x, y }];
      for (let i = 0; i < segments; i++) {
        angle = angle * 0.82 + flowAngle(x, y) * 0.18;
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        pts.push({ x, y });
      }

      const maxLife = 5 + Math.random() * 6;
      inkStrokes.push({
        points: pts, life: maxLife, maxLife,
        width: 1.2 + Math.random() * 2.2,
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

      }
    };

    /**
     * Current — tracers on the same field the contours are cut from.
     *
     * Topology draws that field's level sets and Intent writes along it; this
     * one lets particles be carried by it and keeps only the segment each one
     * covered in a frame. Three fields, one ground: switching between them
     * changes what you are shown about the field, not which field it is.
     *
     * Sampling at an offset that grows with `t` translates the whole field
     * slowly, so the flow evolves without a second noise function.
     */
    const drawFlow = (
      hue: number, sat: number, light: number, alpha: number,
      dark: boolean, animate: boolean,
    ) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const step = 2.1 * spec.speed;
      for (const p of points) {
        const trail = p.trail;
        if (!trail) continue;

        if (animate) {
          const ang = currentAngle(p.x + t * 6, p.y - t * 4);
          p.x += Math.cos(ang) * step * (0.6 + p.depth);
          p.y += Math.sin(ang) * step * (0.6 + p.depth);
          p.age = (p.age ?? 0) + 1;
          trail.push(p.x, p.y);
          while (trail.length > TRAIL * 2) trail.splice(0, 2);
        }

        // Respawn on expiry or on leaving the viewport, so the field keeps
        // renewing instead of draining into its attractors.
        const spent = (p.age ?? 0) > (p.life ?? 300);
        if (spent || p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.age = 0;
          trail.length = 0;
          trail.push(p.x, p.y);
          continue;
        }

        const mask = clearance(p.x, p.y);
        // Fade in and out across the tracer's life so nothing pops in.
        const t01 = Math.min(1, Math.max(0, (p.age ?? 0) / (p.life ?? 300)));
        const envelope = Math.sin(t01 * Math.PI);
        const a = alpha * mask * envelope * (0.16 + p.depth * 0.3);
        if (a <= 0.004 || trail.length < 4) continue;

        ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + (dark ? 10 : -2)}%, ${a})`;
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(trail[0], trail[1]);
        for (let i = 2; i < trail.length; i += 2) ctx.lineTo(trail[i], trail[i + 1]);
        ctx.stroke();

        // A brighter head, so the filament reads as travelling rather than drawn.
        const n = trail.length;
        ctx.strokeStyle = `hsla(${hue}, ${Math.min(80, sat + 12)}%, ${light + (dark ? 18 : -8)}%, ${a * 1.5})`;
        ctx.lineWidth = p.r * 1.15;
        ctx.beginPath();
        ctx.moveTo(trail[n - 6] ?? trail[0], trail[n - 5] ?? trail[1]);
        ctx.lineTo(trail[n - 2], trail[n - 1]);
        ctx.stroke();
      }
    };

    /**
     * Interference — concentric wavefronts from a few sources.
     *
     * No fringe is computed. Each source emits evenly spaced rings and the
     * hyperbolic fringes appear where the rings cross, exactly as in a ripple
     * tank: drawing the causes is both cheaper than summing the field and
     * truer to what it depicts.
     *
     * The amplitude envelope rises away from the source before falling, which
     * is not physical. A physical falloff puts maximum energy at the centre and
     * paints three bullseyes — three things to look at, competing with the
     * page. Fading the first rings turns each source back into a place a wave
     * came from rather than a target.
     */
    const drawInterference = (
      hue: number, sat: number, light: number, alpha: number, dark: boolean,
    ) => {
      const sources = [
        { x: w * 0.18, y: h * 0.22, phase: 0, weight: 1 },
        { x: w * 0.83, y: h * 0.74, phase: 1.9, weight: 0.92 },
        { x: w * 0.6, y: h * 0.08, phase: 3.6, weight: 0.6 },
      ];
      ctx.lineWidth = 1;
      for (const s of sources) {
        /*
         * Reach is measured to this source's own farthest visible corner, and
         * the ring count is capped. Both matter: a full-viewport arc is an
         * expensive path, and an earlier version drew ~75 of them every frame
         * from a radius fixed to the diagonal. That starved the main thread
         * badly enough to stall the page's own entrance animation — the
         * background was costing the content its render budget.
         */
        const reach = Math.max(
          Math.hypot(s.x, s.y),
          Math.hypot(w - s.x, s.y),
          Math.hypot(s.x, h - s.y),
          Math.hypot(w - s.x, h - s.y),
        );
        const gap = Math.max(reach / 15, 52 / Math.max(0.5, config.fieldScale));
        const travel = (t * 9 * spec.speed + s.phase * gap) % gap;
        for (let r = travel; r < reach; r += gap) {
          const f = r / reach;
          // Rise over the first fifth, then fall away to nothing. Not physical
          // — a physical falloff peaks at the source and paints a bullseye,
          // which is one more thing competing with the page for attention.
          const envelope = Math.min(1, f / 0.2) * (1 - f) * (1 - f);
          const a = alpha * s.weight * envelope * 0.62;
          if (a <= 0.004) continue;
          ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light + (dark ? 8 : 0)}%, ${a})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    /**
     * Strata — settled layers, the oldest at the bottom.
     *
     * Each layer is a ribbon of its own thickness, not a fill down to the foot
     * of the page. Filling downward stacks every layer's alpha on every layer
     * below it, and nine translucent bands compound into an opaque sheet with
     * the text somewhere underneath it.
     */
    const drawStrata = (
      hue: number, sat: number, light: number, alpha: number, dark: boolean,
    ) => {
      const bands = Math.round(11 * Math.min(1.6, Math.max(0.5, config.fieldScale)));
      const drift = t * 0.16 * spec.speed;
      const stepX = Math.max(10, w / 72);
      for (let i = 0; i < bands; i++) {
        const f = i / bands;
        const baseY = h * (-0.05 + f * 1.12);
        const amp = 10 + 24 * (1 - f) + 7 * Math.sin(i * 1.7);
        const freq = 0.0015 + 0.001 * ((i % 3) + 1);
        const thickness = h * (0.028 + 0.03 * (1 - f));
        // Deeper layers are older and denser, but every one stays a whisper.
        const a = alpha * (0.05 + 0.075 * f);
        if (a <= 0.004) continue;
        const yAt = (x: number) =>
          baseY +
          Math.sin(x * freq + drift * (0.4 + f) + i * 0.9) * amp +
          Math.sin(x * freq * 2.3 - drift * 0.6) * amp * 0.28;

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light + (dark ? 6 : 2)}%, ${a})`;
        ctx.beginPath();
        ctx.moveTo(-4, yAt(-4));
        for (let x = -4; x <= w + 4; x += stepX) ctx.lineTo(x, yAt(x));
        for (let x = w + 4; x >= -4; x -= stepX) ctx.lineTo(x, yAt(x) + thickness);
        ctx.closePath();
        ctx.fill();
      }
    };

    /**
     * Erase the reading column out of an area-filling field.
     *
     * The point fields multiply each mark by {@link clearance}, which cannot
     * work for a pattern made of continuous rings and ribbons: a single ring
     * crosses both the margin and the text. These fields are therefore drawn
     * whole and then cut, which produces the same result — a background that is
     * a frame and never a texture behind prose — with one composite operation.
     */
    const clearReadingColumn = (strength: number) => {
      const r = Math.min(w, h) * 0.62;
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      // Matches the ellipse `clearance` uses, so cut and mask agree.
      ctx.translate(w / 2, h / 2);
      ctx.scale(1.18, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, `rgba(0,0,0,${strength})`);
      g.addColorStop(0.45, `rgba(0,0,0,${strength * 0.8})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(-w, -h, w * 2, h * 2);
      ctx.restore();
    };

    const draw = (animate: boolean) => {
      const v = vitals.current;
      const { hue, sat, light, dark, gain } = palette();
      const synapsis = num("--organism-synapsis", v.synapsis);
      const arousal = num("--organism-arousal", v.arousal);
      const pulse = num("--organism-pulse", 0);
      const calm = num("--organism-calm", v.calm);
      const intensity = config.intensity;
      // Reading settles the field without extinguishing it.
      // Reading dims the field; it should not delete it. At 0.72 the organism
      // fell to 28% of an already faint alpha exactly when a reader is most
      // likely to be looking at it, so the intended courtesy — receding while
      // you read — arrived as "the background is broken". Half strength still
      // recedes, and can still be seen to move.
      const quiet = 1 - 0.45 * calm;
      // The reader's own correction rides on top of the theme correction.
      const alpha = intensity * spec.alpha * quiet * gain * config.fieldContrast;

      // One clock for the whole membrane, so the reader's tempo dial slows
      // drift, blooms, wavefronts, and sediment by the same factor.
      if (animate) t += (1 / 60) * config.fieldSpeed;

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

      if (config.preset === "dots") {
        drawDots(hue, sat, light, alpha, animate);
      } else if (config.preset === "topology") {
        drawTopology(hue, sat, light, alpha, animate);
      } else if (config.preset === "interference") {
        drawInterference(hue, sat, light, alpha, dark);
        clearReadingColumn(0.9);
      } else if (config.preset === "flow") {
        drawFlow(hue, sat, light, alpha, dark, animate);
      } else if (config.preset === "strata") {
        drawStrata(hue, sat, light, alpha, dark);
        clearReadingColumn(0.82);
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
      if (
        config.preset !== "field" &&
        config.preset !== "topology" &&
        config.preset !== "ink" &&
        config.preset !== "dots" &&
        config.preset !== "interference" &&
        config.preset !== "flow" &&
        config.preset !== "strata"
      )
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
    // Scale changes the point budget, so the field has to be rebuilt, not
    // merely redrawn. Speed and contrast are read every frame but still belong
    // here: with stillness on there is no next frame to read them in.
    config.fieldScale,
    config.fieldSpeed,
    config.fieldContrast,
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
