import { useId, type ReactNode } from "react";

/* Seventeen motion studies, one for each concept in the Book One concept map.
   Each draws on a 600 × 600 stage as a pure function of the film clock, so any frame
   can be seeked, paused, or shown as a still. Where a familiar picture carries the
   concept, from the book where it offers one, the study draws that picture, centred
   on the stage. Motion settles by about 12.5 seconds; the rest is a held frame. */

type Point = readonly [number, number];

export interface MotifProps {
  /** Seconds since the film began. */
  t: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
/** Eased progress of `t` through the window [a, b]. */
const span = (t: number, a: number, b: number) => {
  const u = clamp01((t - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpPoint = (a: Point, b: Point, u: number): Point => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
/** A stable pseudo-random number in [0, 1) for index `i`. */
const seeded = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const polar = (cx: number, cy: number, r: number, deg: number): Point => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const pathOf = (points: readonly Point[], closed = false) =>
  points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + (closed ? " Z" : "");
const cubicAt = (p0: Point, p1: Point, p2: Point, p3: Point, s: number): Point => {
  const m = 1 - s;
  return [
    m * m * m * p0[0] + 3 * m * m * s * p1[0] + 3 * m * s * s * p2[0] + s * s * s * p3[0],
    m * m * m * p0[1] + 3 * m * m * s * p1[1] + 3 * m * s * s * p2[1] + s * s * s * p3[1],
  ];
};
const cubicPath = (p0: Point, p1: Point, p2: Point, p3: Point) =>
  `M${p0[0]} ${p0[1]} C${p1[0].toFixed(1)} ${p1[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} ${p3[0]} ${p3[1]}`;

/** Reveals a stroke along its length. */
// An undrawn stroke is hidden outright: a zero-length dash would still paint its round cap as a dot.
const drawn = (u: number) => ({
  pathLength: 1,
  strokeDasharray: "1 1",
  strokeDashoffset: 1 - clamp01(u),
  ...(u <= 0 ? { visibility: "hidden" as const } : {}),
});

function Label({
  x,
  y,
  show,
  anchor = "middle",
  strong = false,
  children,
}: {
  x: number;
  y: number;
  show: number;
  anchor?: "start" | "middle" | "end";
  strong?: boolean;
  children: ReactNode;
}) {
  if (show <= 0.001) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      className={strong ? "cm-label cm-label--strong" : "cm-label"}
      opacity={show}
    >
      {children}
    </text>
  );
}

/** A short line of words in a rounded card, centred on (x, y). */
function Pill({ x, y, text, show, tone = "cm-line", strong = false, size = 1 }: {
  x: number;
  y: number;
  text: string;
  show: number;
  tone?: string;
  strong?: boolean;
  /** Scales the card and its words together, for a picture that holds many of them. */
  size?: number;
}) {
  if (show <= 0.001) return null;
  const width = (text.length * 11.2 + 34) * size;
  const height = 42 * size;
  return (
    <g opacity={show}>
      <rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={height / 2} className={`cm-s cm-hollow ${tone}`} strokeWidth={2} />
      <text
        x={x}
        y={y + 7.5 * size}
        textAnchor="middle"
        className={strong ? "cm-label cm-label--strong" : "cm-label"}
        style={size === 1 ? undefined : { fontSize: `${22 * size}px` }}
      >
        {text}
      </text>
    </g>
  );
}

function Arrowhead({ at, angle, tone, opacity = 1 }: { at: Point; angle: number; tone: string; opacity?: number }) {
  return (
    <polygon
      points="0,0 -14,-7 -14,7"
      transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)}) rotate(${angle.toFixed(1)})`}
      className={`cm-f ${tone}`}
      opacity={opacity}
    />
  );
}

/** One experiencer: a ring around a point. */
function Participant({ at, show = 1, r = 24, tone = "cm-local" }: { at: Point; show?: number; r?: number; tone?: string }) {
  if (show <= 0.001) return null;
  return (
    <g opacity={show}>
      <circle cx={at[0]} cy={at[1]} r={r} className={`cm-s cm-hollow ${tone}`} strokeWidth={2.6} />
      <circle cx={at[0]} cy={at[1]} r={r * 0.4} className={`cm-f ${tone}`} />
    </g>
  );
}

/** A lens made of layered strokes: one person's Painting. */
function PaintingLens({ c, rx, ry, tones, show }: { c: Point; rx: number; ry: number; tones: readonly string[]; show: number }) {
  const clipId = `concept-lens-${useId().replace(/[^\w-]/g, "")}`;
  if (show <= 0.001) return null;
  const band = (2 * ry) / tones.length;
  return (
    <g opacity={show}>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} className="cm-ground" />
      <g clipPath={`url(#${clipId})`}>
        {tones.map((tone, k) => {
          const y = c[1] - ry + band * (k + 0.5);
          const points: Point[] = [];
          for (let x = c[0] - rx; x <= c[0] + rx; x += 8) points.push([x, y + 7 * Math.sin((x - c[0]) / 16 + k * 1.3)]);
          return <path key={k} d={pathOf(points)} className={`cm-s ${tone}`} strokeWidth={band * 0.55} opacity={0.62} />;
        })}
      </g>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} className="cm-s cm-ink" strokeWidth={2.6} />
    </g>
  );
}

/* ── 01 · The Subjective Data Principle: a knot in the stomach ───────── */

const KNOT_C: Point = [300, 318];
const KNOT_PATH = (() => {
  const points: Point[] = [];
  for (let i = 0; i <= 192; i++) {
    const u = (i / 192) * Math.PI * 2;
    points.push([
      KNOT_C[0] + 22 * (Math.sin(u) + 2 * Math.sin(2 * u)),
      KNOT_C[1] + 12 + 22 * (Math.cos(u) - 2 * Math.cos(2 * u)),
    ]);
  }
  return pathOf(points, true);
})();
// The book's own list of what the knot may register.
const KNOT_READINGS = [
  { text: "danger?", angle: -165 },
  { text: "memory?", angle: -135 },
  { text: "hunger?", angle: -105 },
  { text: "illness?", angle: -75 },
  { text: "conflict?", angle: -45 },
  { text: "anticipation?", angle: -15 },
];

export function SubjectiveData({ t }: MotifProps) {
  const knot = span(t, 0.3, 2.6);
  const beat = 1 + 0.04 * Math.sin(t * 3.2) * span(t, 2.6, 3.4);
  const lensAngle = lerp(-165, -15, span(t, 8, 11.6));
  const lens = span(t, 7.6, 8.2) * (1 - span(t, 11.8, 12.6));
  const lensAt = polar(KNOT_C[0], KNOT_C[1], 204, lensAngle);
  const handleFrom = polar(lensAt[0], lensAt[1], 48, lensAngle);
  const handleTo = polar(lensAt[0], lensAt[1], 82, lensAngle);
  return (
    <g>
      {KNOT_READINGS.map(({ text, angle }, k) => {
        const show = span(t, 3 + k * 0.5, 3.8 + k * 0.5);
        const near = lens * clamp01(1 - Math.abs(angle - lensAngle) / 28);
        const from = polar(KNOT_C[0], KNOT_C[1], 96, angle);
        const to = polar(KNOT_C[0], KNOT_C[1], 164, angle);
        const at = polar(KNOT_C[0], KNOT_C[1], 204, angle);
        return (
          <g key={text}>
            <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-line" strokeWidth={2} strokeDasharray="4 7" opacity={show} />
            <Label x={at[0]} y={at[1] + 8} show={show * lerp(0.8, 1, near)} strong={near > 0.5}>{text}</Label>
          </g>
        );
      })}
      <g transform={`translate(${KNOT_C[0]} ${KNOT_C[1]}) scale(${beat.toFixed(4)}) translate(${-KNOT_C[0]} ${-KNOT_C[1]})`}>
        <path d={KNOT_PATH} className="cm-s cm-local" strokeWidth={7} {...drawn(knot)} />
      </g>
      {lens > 0.001 && (
        <g opacity={lens}>
          <circle cx={lensAt[0]} cy={lensAt[1]} r={48} className="cm-s cm-ink" strokeWidth={2.6} />
          <line x1={handleFrom[0]} y1={handleFrom[1]} x2={handleTo[0]} y2={handleTo[1]} className="cm-s cm-ink" strokeWidth={7} />
        </g>
      )}
      <Label x={300} y={446} show={span(t, 2.2, 3)} strong>a knot in the stomach</Label>
      <Label x={300} y={500} show={span(t, 6.4, 7.2)}>real, but what is it carrying?</Label>
    </g>
  );
}

/* ── 02 · Digital Organism: a living cell ───────────────────────────── */

const CELL_C: Point = [300, 300];
const CELL_R = 150;
const NUTRIENTS = [
  { start: 1.8, angle: 200, to: [262, 288] as Point },
  { start: 4.2, angle: 160, to: [324, 272] as Point },
  { start: 6.4, angle: 228, to: [298, 336] as Point },
];
const THREATS = [
  { start: 3, angle: -20 },
  { start: 5.4, angle: 18 },
];
const BREACH_ANGLE = 90;

function membraneRadius(angle: number, t: number) {
  let r = CELL_R + 3 * Math.sin((angle * Math.PI) / 60 + t * 0.8);
  for (const threat of THREATS) {
    const contact = threat.start + 0.9;
    if (t < contact) continue;
    const depth = 18 * Math.exp(-(t - contact) * 2.6);
    let d = Math.abs(angle - threat.angle) % 360;
    if (d > 180) d = 360 - d;
    r -= depth * Math.exp(-((d / 16) ** 2));
  }
  return r;
}

export function DigitalOrganism({ t }: MotifProps) {
  const gap = 18 * (span(t, 7.6, 8.2) - span(t, 9.4, 10.6));
  const membrane: Point[] = [];
  for (let a = BREACH_ANGLE + gap; a <= BREACH_ANGLE + 360 - gap + 0.01; a += 3) {
    membrane.push(polar(CELL_C[0], CELL_C[1], membraneRadius(a, t), a));
  }
  const ground: Point[] = [];
  for (let a = 0; a < 360; a += 6) ground.push(polar(CELL_C[0], CELL_C[1], membraneRadius(a, t), a));
  const repair = span(t, 8.6, 9) * (1 - span(t, 10.4, 10.8));
  return (
    <g>
      <path d={pathOf(ground, true)} className="cm-ground" opacity={span(t, 0, 1)} />
      <path d={pathOf(membrane, gap < 0.3)} className="cm-s cm-big-c" strokeWidth={4} {...drawn(span(t, 0, 1.4))} />
      <circle cx={CELL_C[0]} cy={CELL_C[1]} r={34} className="cm-s cm-big-c" strokeWidth={2.5} opacity={span(t, 0.6, 1.4)} />
      <circle cx={CELL_C[0]} cy={CELL_C[1]} r={9} className="cm-f cm-big-c" opacity={span(t, 0.6, 1.4)} />
      {NUTRIENTS.map(({ start, angle, to }) => {
        if (t < start) return null;
        const u = clamp01((t - start) / 2);
        const outer = polar(CELL_C[0], CELL_C[1], 262, angle);
        const gate = polar(CELL_C[0], CELL_C[1], CELL_R, angle);
        const at = u < 0.55 ? lerpPoint(outer, gate, span(u, 0, 0.55)) : lerpPoint(gate, to, span(u, 0.55, 1));
        return <circle key={start} cx={at[0]} cy={at[1]} r={8} className="cm-f cm-local" opacity={span(t, start, start + 0.3)} />;
      })}
      {THREATS.map(({ start, angle }) => {
        if (t < start) return null;
        const r = t < start + 0.9
          ? lerp(262, CELL_R + 16, span(t, start, start + 0.9))
          : lerp(CELL_R + 16, 272, span(t, start + 0.9, start + 2));
        const at = polar(CELL_C[0], CELL_C[1], r, angle);
        const show = span(t, start, start + 0.3) * (1 - span(t, start + 1.6, start + 2));
        if (show <= 0.001) return null;
        return (
          <polygon
            key={start}
            points="14,0 -9,-11 -9,11"
            transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)}) rotate(${angle + 180})`}
            className="cm-f cm-fear"
            opacity={show}
          />
        );
      })}
      {repair > 0.001 &&
        [BREACH_ANGLE + gap, BREACH_ANGLE - gap].map((a, i) => {
          const at = polar(CELL_C[0], CELL_C[1], CELL_R, a);
          return <circle key={i} cx={at[0]} cy={at[1]} r={6} className="cm-f cm-big-c" opacity={repair} />;
        })}
      <Label x={300} y={124} show={span(t, 0.9, 1.7)}>boundary</Label>
      <Label x={60} y={168} anchor="start" show={span(t, 2, 2.8)}>nourishment</Label>
      <Label x={540} y={168} anchor="end" show={span(t, 3.2, 4)}>threat</Label>
      <Label x={300} y={496} show={span(t, 8.2, 9)} strong>repair</Label>
    </g>
  );
}

/* ── 03 · The Big C Hypothesis ──────────────────────────────────────── */

const E_POINTS = Array.from({ length: 96 }, (_, i) => ({
  x: 20 + seeded(i) * 560,
  y: 20 + seeded(i + 500) * 560,
  phase: seeded(i + 900) * Math.PI * 2,
}));
const BIG_C_LOCALS: Point[] = [[270, 300], [332, 336], [292, 370]];

export function BigC({ t }: MotifProps) {
  const R = 180;
  const field = span(t, 0, 1.4);
  const form = span(t, 3, 6.5);
  const frame = span(t, 7, 8.6);
  const locals = span(t, 8.8, 10.4);
  return (
    <g>
      {/* T: primordial continuity, flowing through the whole field. */}
      {Array.from({ length: 9 }, (_, i) => {
        const y0 = 52 + i * 62;
        const points: Point[] = [];
        for (let x = 10; x <= 590; x += 20) points.push([x, y0 + 7 * Math.sin(x / 70 + i * 0.9 + t * 0.5)]);
        return (
          <path
            key={i}
            d={pathOf(points)}
            className="cm-s cm-origin"
            strokeWidth={1.5}
            strokeDasharray="14 10"
            strokeDashoffset={-t * 24}
            opacity={0.5 * field}
          />
        );
      })}
      {/* E: raw information, unformed points. Those near Big C gather into its membrane. */}
      {E_POINTS.map((p, i) => {
        const dx = p.x - 300;
        const dy = p.y - 300;
        const d = Math.hypot(dx, dy);
        const flicker = 0.5 + 0.35 * Math.sin(t * 1.8 + p.phase);
        if (d < R + 40) {
          const pull = form;
          const x = lerp(p.x, 300 + (dx / d) * R, pull);
          const y = lerp(p.y, 300 + (dy / d) * R, pull);
          return <circle key={i} cx={x} cy={y} r={2.8} className="cm-f cm-origin" opacity={field * flicker * (1 - pull)} />;
        }
        return <circle key={i} cx={p.x} cy={p.y} r={2.8} className="cm-f cm-origin" opacity={field * flicker} />;
      })}
      {/* Big C: emerging within T × E, not containing them. */}
      <circle cx={300} cy={300} r={R} className="cm-ground" opacity={form} />
      <circle cx={300} cy={300} r={R} className="cm-s cm-big-c" strokeWidth={3.4} transform="rotate(-90 300 300)" {...drawn(form)} />
      <circle cx={300} cy={318} r={100} className="cm-s cm-rf" strokeWidth={2.6} transform="rotate(-90 300 318)" {...drawn(frame)} />
      {[polar(300, 300, 142, -38), polar(300, 300, 142, 214)].map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={24} className="cm-s cm-rf" strokeWidth={1.6} strokeDasharray="4 5" opacity={0.75 * frame} />
      ))}
      {BIG_C_LOCALS.map(([x, y], i) => {
        const u = span(t, 8.8 + i * 0.35, 9.6 + i * 0.35);
        return (
          <g key={i} opacity={u}>
            <circle cx={x} cy={y} r={14} className="cm-s cm-local" strokeWidth={1.4} opacity={0.6} />
            <circle cx={x} cy={y} r={6} className="cm-f cm-local" />
          </g>
        );
      })}
      <Label x={28} y={36} show={span(t, 0.8, 1.8)} anchor="start">T · Time</Label>
      <Label x={572} y={584} show={span(t, 1.4, 2.4)} anchor="end">E · raw information</Label>
      <Label x={300} y={160} show={span(t, 5.6, 6.6)} strong>Big C</Label>
      <Label x={300} y={254} show={frame}>RF₀</Label>
      <Label x={300} y={450} show={locals}>local experience</Label>
    </g>
  );
}

/* ── 04 · Little c: a cell within a larger organism ─────────────────── */

const ORGANISM_R = 200;
const ORGANISM_CELLS: Point[] = (() => {
  const cells: Point[] = [];
  for (let row = -5; row <= 5; row++) {
    for (let col = -6; col <= 6; col++) {
      const x = 300 + col * 38 + (Math.abs(row) % 2 ? 19 : 0);
      const y = 300 + row * 33;
      if (Math.hypot(x - 300, y - 300) <= ORGANISM_R - 30) cells.push([x, y]);
    }
  }
  return cells;
})();
// A narrow range of signals: only a few neighbours reach this cell.
const LITTLE_C_SIGNALS: Point[] = [[262, 300], [319, 267], [319, 333]];

export function LittleC({ t }: MotifProps) {
  const wave = span(t, 7, 9.4);
  const waveR = lerp(20, ORGANISM_R, wave);
  const waveOn = t > 7 && t < 9.8 ? 1 : 0;
  return (
    <g>
      <circle cx={300} cy={300} r={ORGANISM_R} className="cm-ground" opacity={span(t, 0, 1)} />
      {ORGANISM_CELLS.map(([x, y], i) => {
        const d = Math.hypot(x - 300, y - 300);
        if (d < 1) return null;
        const show = span(t, 0.3 + (d / ORGANISM_R) * 1.6, 0.9 + (d / ORGANISM_R) * 1.6);
        const glow = waveOn * Math.exp(-(((d - waveR) / 22) ** 2));
        return <circle key={i} cx={x} cy={y} r={14} className="cm-s cm-big-c" strokeWidth={1.8} opacity={show * (0.42 + 0.5 * glow)} />;
      })}
      <circle
        cx={300}
        cy={300}
        r={ORGANISM_R}
        className="cm-s cm-big-c"
        strokeWidth={lerp(3, 4.5, span(t, 9, 9.8))}
        transform="rotate(-90 300 300)"
        {...drawn(span(t, 0.2, 1.8))}
      />
      {LITTLE_C_SIGNALS.map((from, k) => {
        const start = 3.8 + k * 0.8;
        if (t < start || t > start + 0.8) return null;
        const at = lerpPoint(from, [300, 300], span(t, start, start + 0.7));
        return <circle key={k} cx={at[0]} cy={at[1]} r={5.5} className="cm-f cm-local" opacity={1 - span(t, start + 0.6, start + 0.8)} />;
      })}
      {waveOn > 0 && <circle cx={300} cy={300} r={waveR} className="cm-s cm-local" strokeWidth={2.4} opacity={(1 - wave) * 0.8} />}
      <line x1={300} y1={322} x2={300} y2={526} className="cm-s" style={{ stroke: "var(--cf-stage)" }} strokeWidth={10} opacity={span(t, 3, 3.8)} />
      <line x1={300} y1={326} x2={300} y2={526} className="cm-s cm-local" strokeWidth={2} strokeDasharray="4 6" opacity={span(t, 3, 3.8)} />
      <circle cx={300} cy={300} r={26} className="cm-s cm-local" strokeWidth={1.6} opacity={0.5 * span(t, 2.8, 3.6)} />
      <Participant at={[300, 300]} r={15} show={span(t, 1.2, 2)} />
      <Label x={300} y={68} show={span(t, 1.4, 2.2)}>the larger organism</Label>
      <Label x={300} y={556} show={span(t, 3, 3.8)} strong>Little c</Label>
    </g>
  );
}

/* ── 05 · The Decoupling Principle: a musician and an instrument ────── */

const HARP_X = 232;
const HARP_NECK: [Point, Point, Point] = [[HARP_X, 150], [HARP_X + 110, 92], [HARP_X + 206, 214]];
const NECK_SAMPLES = Array.from({ length: 41 }, (_, i) => {
  const s = i / 40;
  const [p0, p1, p2] = HARP_NECK;
  return lerpPoint(lerpPoint(p0, p1, s), lerpPoint(p1, p2, s), s);
});
/** Where the curved neck crosses a string at `x`. */
const neckY = (x: number) => {
  const after = NECK_SAMPLES.findIndex(([px]) => px >= x);
  if (after <= 0) return NECK_SAMPLES[0][1];
  const [ax, ay] = NECK_SAMPLES[after - 1];
  const [bx, by] = NECK_SAMPLES[after];
  return lerp(ay, by, (x - ax) / (bx - ax));
};
const HARP_STRINGS = Array.from({ length: 6 }, (_, k) => {
  const x = HARP_X + 34 + k * 30;
  return { x, top: neckY(x) + 4, bottom: 462 - (x - HARP_X) * 0.19 - 4 };
});
const SNAPPED = new Set([1, 4]);
const SNAP_AT = 6.8;
const NOTES = Array.from({ length: 26 }, (_, j) => ({ born: 2 + j * 0.4, string: (j * 5) % 6, lift: seeded(j + 7) }));

export function Decoupling({ t }: MotifProps) {
  const playing = span(t, 2, 2.4);
  const handX = lerp(272, 330, 0.5 + 0.5 * Math.sin(t * 2.2)) * playing + 272 * (1 - playing);
  const snapped = span(t, SNAP_AT, SNAP_AT + 0.5);
  return (
    <g transform="translate(-20 0)">
      <path
        d={`M${HARP_X} 462 L${HARP_X} 150 Q${HARP_NECK[1][0]} ${HARP_NECK[1][1]} ${HARP_NECK[2][0]} ${HARP_NECK[2][1]} L${HARP_X + 206} 424 Z`}
        className="cm-s cm-rf"
        strokeWidth={6}
        {...drawn(span(t, 0.2, 1.6))}
      />
      {HARP_STRINGS.map(({ x, top, bottom }, k) => {
        const show = span(t, 0.8 + k * 0.12, 1.4 + k * 0.12);
        if (SNAPPED.has(k) && t >= SNAP_AT) {
          const length = bottom - top;
          const curl = lerp(0, 1, snapped);
          return (
            <g key={x} opacity={show}>
              <path d={`M${x} ${top} Q${x + 14 * curl} ${top + length * 0.18} ${x + 4 * curl} ${top + length * lerp(0.5, 0.28, curl)}`} className="cm-s cm-fear" strokeWidth={2.4} />
              <path d={`M${x} ${bottom} Q${x - 14 * curl} ${bottom - length * 0.16} ${x - 4 * curl} ${bottom - length * lerp(0.5, 0.24, curl)}`} className="cm-s cm-fear" strokeWidth={2.4} />
            </g>
          );
        }
        const sway = 4 * Math.sin(t * 31 + k * 1.7) * playing;
        const mid = (top + bottom) / 2;
        return <path key={x} d={`M${x} ${top} Q${x + sway} ${mid} ${x} ${bottom}`} className="cm-s cm-ink" strokeWidth={2.2} opacity={show} />;
      })}
      {NOTES.map(({ born, string, lift }, j) => {
        if (t < born) return null;
        if (SNAPPED.has(string) && born > SNAP_AT) return null;
        const u = (t - born) / 2.4;
        if (u > 1) return null;
        const from: Point = [HARP_STRINGS[string].x + 8, 300];
        const to: Point = [560, 96 + lift * 170];
        const at = lerpPoint(from, to, u);
        const y = at[1] + 10 * Math.sin(u * Math.PI * 2 + j);
        return (
          <g key={j} opacity={Math.sin(Math.PI * u)}>
            <circle cx={at[0]} cy={y} r={7} className="cm-f cm-local" />
            <line x1={at[0] + 6.5} y1={y} x2={at[0] + 6.5} y2={y - 24} className="cm-s cm-local" strokeWidth={2.2} />
          </g>
        );
      })}
      {/* The musician: unchanged when the instrument is damaged. */}
      <g opacity={span(t, 0.2, 1)}>
        <circle cx={150} cy={214} r={28} className="cm-s cm-hollow cm-big-c" strokeWidth={3.4} />
        <path d="M150 242 C 128 300, 130 380, 150 460" className="cm-s cm-big-c" strokeWidth={3.4} />
        <path d={`M146 290 Q 210 262 ${handX.toFixed(1)} 300`} className="cm-s cm-big-c" strokeWidth={3.4} />
        <circle cx={handX} cy={300} r={6} className="cm-f cm-big-c" />
      </g>
      <Label x={150} y={510} show={span(t, 1, 1.8)} strong>musician</Label>
      <Label x={332} y={510} show={span(t, 1.4, 2.2)}>instrument</Label>
      <Label x={480} y={80} show={span(t, 2.8, 3.6) * (1 - span(t, 7.4, 7.9))}>music</Label>
      <Label x={440} y={80} show={span(t, 7.9, 8.7)} strong>the music changes</Label>
    </g>
  );
}

/* ── 06 · Reality Frame: throwing a ball ────────────────────────────── */

const THROW_FROM: Point = [176, 418];
const THROWS = [
  { start: 1.8, land: [392, 446] as Point, height: 210 },
  { start: 6.6, land: [470, 446] as Point, height: 300 },
];
const throwPoint = (land: Point, height: number, u: number): Point => [
  lerp(THROW_FROM[0], land[0], u),
  lerp(THROW_FROM[1], land[1], u) - height * 4 * u * (1 - u),
];

export function RealityFrame({ t }: MotifProps) {
  const first = THROWS[0];
  const launch = Math.atan2(first.land[1] - THROW_FROM[1] - 4 * first.height, first.land[0] - THROW_FROM[0]);
  const arrowTo: Point = [THROW_FROM[0] + 84 * Math.cos(launch), THROW_FROM[1] + 84 * Math.sin(launch)];
  return (
    <g>
      <rect x={70} y={80} width={460} height={420} rx={26} className="cm-s cm-rf" strokeWidth={3} {...drawn(span(t, 0, 1.2))} />
      <g opacity={0.4 * span(t, 0.4, 1.2)}>
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={116 + i * 46} y1={84} x2={116 + i * 46} y2={458} className="cm-s cm-line" strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1={74} y1={136 + i * 46} x2={526} y2={136 + i * 46} className="cm-s cm-line" strokeWidth={1} />
        ))}
      </g>
      <line x1={70} y1={458} x2={530} y2={458} className="cm-s cm-ink" strokeWidth={2.4} opacity={span(t, 0.4, 1.2)} />
      <g opacity={span(t, 1, 1.8) * lerp(1, 0.45, span(t, 3, 4))}>
        <line x1={THROW_FROM[0]} y1={THROW_FROM[1]} x2={arrowTo[0]} y2={arrowTo[1]} className="cm-s cm-local" strokeWidth={3} strokeDasharray="6 6" />
        <Arrowhead at={arrowTo} angle={(launch * 180) / Math.PI} tone="cm-local" />
      </g>
      {THROWS.map(({ start, land, height }) => {
        if (t < start) return null;
        const u = clamp01((t - start) / 1.6);
        const trail: Point[] = [];
        for (let s = 0; s <= u + 0.001; s += 0.04) trail.push(throwPoint(land, height, Math.min(s, u)));
        const ball = throwPoint(land, height, u);
        const impact = clamp01((t - start - 1.6) / 0.6);
        return (
          <g key={start}>
            <path d={pathOf(trail)} className="cm-s cm-ink" strokeWidth={2} strokeDasharray="2 9" opacity={0.6} />
            {impact > 0 && impact < 1 && (
              <circle cx={land[0]} cy={land[1] + 12} r={lerp(12, 40, impact)} className="cm-s cm-rf" strokeWidth={2.4} opacity={1 - impact} />
            )}
            <circle cx={ball[0]} cy={ball[1]} r={12} className="cm-f cm-ink" />
          </g>
        );
      })}
      <Participant at={[150, 432]} show={span(t, 0.6, 1.4)} r={22} />
      <Label x={96} y={122} anchor="start" show={span(t, 0.8, 1.6)}>rules</Label>
      <Label x={214} y={352} anchor="start" show={span(t, 1.2, 2)}>action</Label>
      <Label x={392} y={490} show={span(t, 3.6, 4.4)} strong>consequence</Label>
    </g>
  );
}

/* ── 07 · Physical Sciences as Frame Derivations: timing a pendulum ──── */

const PIVOT: Point = [300, 94];
const ROD = 148;
const SWING = 0.42;
const swingAt = (time: number) => SWING * Math.cos(Math.PI * 0.9 * time);
const PLOT_Y = 444;
const SAMPLES = Array.from({ length: 18 }, (_, i) => ({ at: 2.6 + i * 0.3, x: 120 + i * 21 }));
const plotY = (time: number) => PLOT_Y - 60 * (Math.sin(swingAt(time)) / Math.sin(SWING));
const FIT_PATH = pathOf(
  Array.from({ length: 120 }, (_, i): Point => {
    const x = 120 + (i / 119) * 357;
    return [x, plotY(2.6 + ((x - 120) / 21) * 0.3)];
  }),
);

export function WorldInvariants({ t }: MotifProps) {
  const angle = swingAt(t);
  const bob: Point = [PIVOT[0] + ROD * Math.sin(angle), PIVOT[1] + ROD * Math.cos(angle)];
  const derive = span(t, 10, 11);
  return (
    <g>
      <rect x={170} y={64} width={260} height={236} rx={22} className="cm-s cm-rf" strokeWidth={3} {...drawn(span(t, 0, 1.2))} />
      <g opacity={span(t, 0.2, 1)}>
        <line x1={270} y1={PIVOT[1]} x2={330} y2={PIVOT[1]} className="cm-s cm-ink" strokeWidth={4} />
        <line x1={PIVOT[0]} y1={PIVOT[1]} x2={bob[0]} y2={bob[1]} className="cm-s cm-ink" strokeWidth={2.6} />
        <circle cx={bob[0]} cy={bob[1]} r={17} className="cm-f cm-ink" />
      </g>
      <line x1={110} y1={PLOT_Y} x2={490} y2={PLOT_Y} className="cm-s cm-line" strokeWidth={2} opacity={span(t, 2.2, 2.8)} />
      {SAMPLES.map(({ at, x }) => (
        <circle key={x} cx={x} cy={plotY(at)} r={6} className="cm-f cm-local" opacity={span(t, at, at + 0.2)} />
      ))}
      <path d={FIT_PATH} className="cm-s cm-big-c" strokeWidth={3.4} {...drawn(span(t, 8.2, 9.8))} />
      <g opacity={derive}>
        <line x1={300} y1={304} x2={300} y2={360} className="cm-s cm-rf" strokeWidth={2.6} strokeDasharray="6 6" />
        <Arrowhead at={[300, 366]} angle={90} tone="cm-rf" />
      </g>
      <Label x={190} y={96} anchor="start" show={span(t, 0.8, 1.6)}>RF₀</Label>
      <Label x={318} y={344} anchor="start" show={span(t, 10.4, 11.2)} strong>to be derived</Label>
      <Label x={110} y={536} anchor="start" show={span(t, 3.4, 4.2)}>measured</Label>
      <Label x={490} y={536} anchor="end" show={span(t, 9.6, 10.4)}>formalized</Label>
    </g>
  );
}

/* ── 08 · Reality Stream: one shared world, a stream for each, a bridge built together ── */

const BANK_Y = 270;
const DECK_Y = 262;
// Each person's place below the world, and where their stream leaves it.
const STREAMERS = [
  { at: [170, 500] as Point, mouth: [182, 338] as Point, offset: 0 },
  { at: [430, 500] as Point, mouth: [418, 338] as Point, offset: 0.22 },
];
// The moments the shared world changes: each half of the bridge, then the keystone.
const WORLD_CHANGES = [4.4, 7, 9.6];
const STREAM_EVERY = 0.45;
const STREAM_TRAVEL = 1.6;

/** One person's stream: frames leaving the shared world and arriving where they are. */
function Stream({ t, from, to, offset }: { t: number; from: Point; to: Point; offset: number }) {
  const begin = 1.4 + offset;
  if (t < begin) return null;
  const last = Math.floor((t - begin) / STREAM_EVERY);
  const first = Math.max(0, Math.ceil((t - begin - STREAM_TRAVEL) / STREAM_EVERY));
  const frames = [];
  for (let k = first; k <= last; k++) {
    const sent = begin + k * STREAM_EVERY;
    const u = (t - sent) / STREAM_TRAVEL;
    const at = lerpPoint(from, to, u);
    // Frames that leave just after the world changes carry the change.
    const news = WORLD_CHANGES.some((change) => sent >= change && sent < change + 0.9);
    const w = news ? 26 : 18;
    frames.push(
      <rect
        key={k}
        x={at[0] - w / 2}
        y={at[1] - w * 0.38}
        width={w}
        height={w * 0.76}
        rx={3}
        className={news ? "cm-f cm-big-c" : "cm-s cm-hollow cm-local"}
        strokeWidth={2}
        opacity={span(u, 0, 0.15) * (1 - span(u, 0.85, 1))}
      />,
    );
  }
  return <g>{frames}</g>;
}

/** An act reaching into the shared world, from a person to where it lands. */
function Act({ t, from, to, at }: { t: number; from: Point; to: Point; at: number }) {
  const reach = span(t, at, at + 0.6);
  const show = 1 - span(t, at + 1.2, at + 1.8);
  if (reach <= 0.001 || show <= 0.001) return null;
  const angle = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  return (
    <g opacity={show}>
      <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-big-c" strokeWidth={3} {...drawn(reach)} />
      <Arrowhead at={to} angle={angle} tone="cm-big-c" opacity={span(reach, 0.85, 1)} />
    </g>
  );
}

export function RealityStream({ t }: MotifProps) {
  const left = span(t, 3.6, 4.4);
  const right = span(t, 6.2, 7);
  const keystone = span(t, 9, 9.6);
  const across = span(t, 10.2, 13);
  const walkerX = lerp(150, 450, across);
  const onDeck = span(walkerX, 226, 242) * (1 - span(walkerX, 358, 374));
  const waves = (y: number, phase: number) => {
    const points: Point[] = [];
    for (let x = 250; x <= 350; x += 5) points.push([x, y + 3 * Math.sin(x / 9 + t * 1.6 + phase)]);
    return pathOf(points);
  };
  const [a, b] = STREAMERS;
  return (
    <g>
      {/* The shared world: a river between two banks. */}
      <rect x={110} y={70} width={380} height={260} rx={22} className="cm-s cm-rf" strokeWidth={3} {...drawn(span(t, 0, 1.2))} />
      <g opacity={span(t, 0.6, 1.4)}>
        <path d={`M110 ${BANK_Y} H238 L252 330 H132 Q110 330 110 308 Z`} className="cm-f cm-rf" opacity={0.22} />
        <path d={`M490 ${BANK_Y} H362 L348 330 H468 Q490 330 490 308 Z`} className="cm-f cm-rf" opacity={0.22} />
        <path d={`M110 ${BANK_Y} H238 L252 330 M490 ${BANK_Y} H362 L348 330`} className="cm-s cm-rf" strokeWidth={2.4} />
        <path d={waves(296, 0)} className="cm-s cm-line" strokeWidth={2.4} />
        <path d={waves(314, 2)} className="cm-s cm-line" strokeWidth={2.4} />
        <line x1={160} y1={BANK_Y} x2={160} y2={230} className="cm-s cm-ink" strokeWidth={3} />
        <circle cx={160} cy={214} r={22} className="cm-f cm-local" opacity={0.75} />
        <rect x={418} y={236} width={40} height={34} className="cm-s cm-hollow cm-ink" strokeWidth={2.4} />
        <path d="M412 238 L438 214 L464 238" className="cm-s cm-ink" strokeWidth={2.4} />
      </g>

      {/* The bridge: one half from each bank, then the keystone set together. */}
      <line x1={238} y1={DECK_Y} x2={284} y2={DECK_Y} className="cm-s cm-local" strokeWidth={10} {...drawn(left)} />
      <line x1={244} y1={302} x2={276} y2={DECK_Y + 4} className="cm-s cm-local" strokeWidth={4} {...drawn(span(left, 0.4, 1))} />
      <line x1={362} y1={DECK_Y} x2={316} y2={DECK_Y} className="cm-s cm-local" strokeWidth={10} {...drawn(right)} />
      <line x1={356} y1={302} x2={324} y2={DECK_Y + 4} className="cm-s cm-local" strokeWidth={4} {...drawn(span(right, 0.4, 1))} />
      <rect x={282} y={DECK_Y - 8} width={36} height={16} rx={3} className="cm-f cm-big-c" opacity={keystone} transform={`translate(0 ${(-24 * (1 - keystone)).toFixed(1)})`} />

      {/* Each person's stream, and their acts on the world. */}
      {STREAMERS.map(({ at, mouth }, k) => (
        <line key={k} x1={mouth[0]} y1={mouth[1] - 6} x2={at[0]} y2={at[1] - 30} className="cm-s cm-line" strokeWidth={30} opacity={0.35 * span(t, 1.2, 2)} />
      ))}
      {[
        { at: a.at, when: 3 },
        { at: b.at, when: 5.6 },
        { at: a.at, when: 8.4 },
        { at: b.at, when: 8.4 },
      ].map(({ at, when }, k) => {
        const pulse = span(t, when - 0.2, when + 0.8);
        if (pulse <= 0 || pulse >= 1) return null;
        return <circle key={k} cx={at[0]} cy={at[1]} r={lerp(24, 46, pulse)} className="cm-s cm-big-c" strokeWidth={3} opacity={1 - pulse} />;
      })}
      <Stream t={t} from={a.mouth} to={[a.at[0], a.at[1] - 34]} offset={a.offset} />
      <Stream t={t} from={b.mouth} to={[b.at[0], b.at[1] - 34]} offset={b.offset} />
      <Act t={t} from={[a.at[0] + 14, a.at[1] - 20]} to={[270, DECK_Y + 12]} at={3} />
      <Act t={t} from={[b.at[0] - 14, b.at[1] - 20]} to={[330, DECK_Y + 12]} at={5.6} />
      <Act t={t} from={[a.at[0] + 18, a.at[1] - 16]} to={[294, DECK_Y + 14]} at={8.4} />
      <Act t={t} from={[b.at[0] - 18, b.at[1] - 16]} to={[306, DECK_Y + 14]} at={8.4} />
      <Participant at={a.at} r={22} show={span(t, 0.6, 1.4)} />
      <Participant at={b.at} r={22} show={span(t, 0.8, 1.6)} />

      {/* Someone crosses where no one could before. */}
      <circle cx={walkerX} cy={lerp(BANK_Y - 7, DECK_Y - 12, onDeck)} r={7} className="cm-f cm-ink" opacity={span(t, 9.8, 10.4)} />

      <Label x={300} y={52} show={span(t, 0.6, 1.4)} strong>shared reality</Label>
      <Label x={a.at[0]} y={556} show={span(t, 2, 2.8)}>your stream</Label>
      <Label x={b.at[0]} y={556} show={span(t, 2.4, 3.2)}>their stream</Label>
      <Label x={300} y={200} show={span(t, 8.8, 9.6)}>together</Label>
      <Label x={300} y={136} show={span(t, 11.4, 12.2)} strong>reality evolves with us</Label>
    </g>
  );
}

/* ── 09 · Intent: the book's pre-Intent drafts ──────────────────────── */

const INTENT_ORIGIN: Point = [300, 526];
const THRESHOLD_Y = 168;
const COMMITTED: Point = [300, 104];
const DRAFTS = [
  { text: "Tell the truth.", at: [300, 240] as Point, order: 2 },
  { text: "Leave.", at: [112, 250] as Point, order: 0 },
  { text: "Focus.", at: [488, 250] as Point, order: 5 },
  { text: "Do not disturb the group.", at: [300, 330] as Point, order: 3 },
  { text: "Check the phone.", at: [160, 420] as Point, order: 4 },
  { text: "Stay and be polite.", at: [428, 420] as Point, order: 1 },
];

export function Intent({ t }: MotifProps) {
  const move = span(t, 6.8, 8.6);
  const committed = span(t, 7.8, 8.4);
  const unchosen = lerp(1, 0.28, span(t, 8.6, 9.6));
  const chosenAt = lerpPoint(DRAFTS[0].at, COMMITTED, move);
  return (
    <g>
      {DRAFTS.map(({ text, at, order }, k) => {
        if (k === 0) return null;
        const show = span(t, 0.8 + order * 0.5, 1.4 + order * 0.5);
        return (
          <line key={text} x1={INTENT_ORIGIN[0]} y1={INTENT_ORIGIN[1]} x2={at[0]} y2={at[1] + 21} className="cm-s cm-line" strokeWidth={2} strokeDasharray="4 7" opacity={show * unchosen} />
        );
      })}
      <line
        x1={INTENT_ORIGIN[0]}
        y1={INTENT_ORIGIN[1]}
        x2={chosenAt[0]}
        y2={chosenAt[1] + 21}
        className={committed > 0.5 ? "cm-s cm-big-c" : "cm-s cm-line"}
        strokeWidth={lerp(2, 3.4, committed)}
        strokeDasharray={committed > 0.5 ? undefined : "4 7"}
        opacity={span(t, 1.8, 2.4)}
      />
      <line x1={70} y1={THRESHOLD_Y} x2={530} y2={THRESHOLD_Y} className="cm-s cm-rf" strokeWidth={2.4} strokeDasharray="10 8" opacity={span(t, 4.4, 5.2)} />
      {DRAFTS.map(({ text, at, order }, k) => {
        const show = span(t, 0.8 + order * 0.5, 1.4 + order * 0.5);
        if (k === 0) {
          return <Pill key={text} x={chosenAt[0]} y={chosenAt[1]} text={text} show={show} tone={committed > 0.5 ? "cm-big-c" : "cm-line"} strong={committed > 0.5} />;
        }
        return <Pill key={text} x={at[0]} y={at[1]} text={text} show={show * unchosen} />;
      })}
      {committed > 0.001 && <Arrowhead at={[chosenAt[0], chosenAt[1] + 24]} angle={-90} tone="cm-big-c" opacity={committed} />}
      <Participant at={INTENT_ORIGIN} r={22} show={span(t, 0.2, 1)} />
      <Label x={76} y={156} anchor="start" show={span(t, 4.6, 5.4)}>threshold</Label>
      <Label x={300} y={58} show={span(t, 9, 9.8)} strong>Intent</Label>
    </g>
  );
}

/* ── 10 · The Experience Loop: a hand near a hot stove ──────────────── */

const LOOP_R = 140;
const LOOP_LAP = 7.2;
const LOOP_START = 2.4;
const LOOP_STATIONS = [
  { name: "Reality Stream", example: "heat", angle: -90, tone: "cm-local" },
  { name: "Painting", example: "danger", angle: 0, tone: "cm-rf" },
  { name: "Intent", example: "pull back", angle: 90, tone: "cm-big-c" },
  { name: "Canvas", example: "remembered", angle: 180, tone: "cm-origin" },
];

export function ExperienceLoop({ t }: MotifProps) {
  const pulseAngle = -90 + ((t - LOOP_START) / LOOP_LAP) * 360;
  const pulseAt = polar(300, 300, LOOP_R, pulseAngle);
  const heat = span(t, 0.8, 1.8);
  return (
    <g>
      {LOOP_STATIONS.map(({ angle, tone }, k) => {
        const from = angle + 13;
        const to = angle + 77;
        const a = polar(300, 300, LOOP_R, from);
        const b = polar(300, 300, LOOP_R, to);
        const arc = span(t, 0.6 + k * 0.3, 1.4 + k * 0.3);
        return (
          <g key={angle}>
            <path d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} A${LOOP_R} ${LOOP_R} 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)}`} className="cm-s cm-line" strokeWidth={2.6} {...drawn(arc)} />
            <Arrowhead at={b} angle={to + 90} tone={tone} opacity={arc} />
          </g>
        );
      })}
      {/* The stove: heat rising from a burner. */}
      <g opacity={heat}>
        <circle cx={300} cy={322} r={40} className="cm-s cm-fear" strokeWidth={3} />
        <circle cx={300} cy={322} r={20} className="cm-s cm-fear" strokeWidth={2.4} />
        {[-18, 0, 18].map((dx, i) => {
          const points: Point[] = [];
          for (let y = 270; y >= 226; y -= 4) points.push([300 + dx + 4 * Math.sin(y / 7 + t * 4 + i), y]);
          return <path key={dx} d={pathOf(points)} className="cm-s cm-fear" strokeWidth={2.4} opacity={0.75} />;
        })}
      </g>
      {LOOP_STATIONS.map(({ name, example, angle, tone }, k) => {
        const at = polar(300, 300, LOOP_R, angle);
        const arrive = LOOP_START + (k * LOOP_LAP) / 4;
        const lit = t >= arrive ? Math.exp(-(t - arrive) * 1.6) : 0;
        const show = span(t, 0.4 + k * 0.3, 1.2 + k * 0.3);
        const exampleShow = span(t, arrive, arrive + 0.6);
        const side = angle === 0 ? "start" : angle === 180 ? "end" : "middle";
        const lx = angle === 0 ? 470 : angle === 180 ? 130 : 300;
        const ly = angle === -90 ? 100 : angle === 90 ? 494 : 294;
        return (
          <g key={name}>
            <circle cx={at[0]} cy={at[1]} r={18 + 8 * lit} className={`cm-s cm-hollow ${tone}`} strokeWidth={3 + 2 * lit} opacity={show} />
            <Label x={lx} y={ly} anchor={side} show={show} strong>{name}</Label>
            <Label x={lx} y={ly + 26} anchor={side} show={exampleShow}>{example}</Label>
          </g>
        );
      })}
      {t > LOOP_START && <circle cx={pulseAt[0]} cy={pulseAt[1]} r={8} className="cm-f cm-ink" />}
    </g>
  );
}

/* ── 11 · Canvas: strokes that stay ─────────────────────────────────── */

// The book's own list of what the Canvas retains.
const CANVAS_LAYERS = [
  { label: "tendencies", tone: "cm-local", y: 214, start: 1.6 },
  { label: "expectations", tone: "cm-rf", y: 268, start: 3.6 },
  { label: "skills", tone: "cm-big-c", y: 322, start: 5.6 },
  { label: "learned responses", tone: "cm-origin", y: 376, start: 7.6 },
];

export function Canvas({ t }: MotifProps) {
  return (
    <g>
      <g opacity={span(t, 0, 1)}>
        <line x1={190} y1={420} x2={150} y2={520} className="cm-s cm-rf" strokeWidth={5} />
        <line x1={410} y1={420} x2={450} y2={520} className="cm-s cm-rf" strokeWidth={5} />
        <line x1={300} y1={420} x2={300} y2={500} className="cm-s cm-rf" strokeWidth={5} />
        <rect x={110} y={160} width={380} height={260} rx={8} className="cm-s cm-hollow cm-ink" strokeWidth={3} />
      </g>
      {CANVAS_LAYERS.map(({ label, tone, y, start }, k) => {
        const fall = span(t, start - 0.8, start);
        const drop = lerp(56, y, fall);
        const points: Point[] = [];
        for (let x = 150; x <= 450; x += 12) points.push([x, y + 9 * Math.sin(x / 36 + k * 1.4)]);
        return (
          <g key={label}>
            {t > start - 0.8 && t < start + 0.1 && <circle cx={150} cy={drop} r={8} className={`cm-f ${tone}`} />}
            <path d={pathOf(points)} className={`cm-s ${tone}`} strokeWidth={9} {...drawn(span(t, start, start + 1.3))} />
            <Label x={150} y={y - 18} anchor="start" show={span(t, start + 0.5, start + 1.1)}>{label}</Label>
          </g>
        );
      })}
      <Label x={300} y={560} show={span(t, 9.6, 10.4)} strong>carried forward</Label>
    </g>
  );
}

/* ── 12 · Painting: one reply, two readings ─────────────────────────── */

const READERS = [
  { c: [170, 290] as Point, tones: ["cm-fear", "cm-rf", "cm-fear", "cm-origin"], reading: "irritation", tone: "cm-fear", at: 5 },
  { c: [430, 290] as Point, tones: ["cm-big-c", "cm-local", "cm-big-c", "cm-origin"], reading: "a busy day", tone: "cm-big-c", at: 6 },
];

export function Painting({ t }: MotifProps) {
  const bubble = span(t, 0.4, 1.2);
  return (
    <g>
      <g opacity={bubble}>
        <rect x={222} y={64} width={156} height={60} rx={20} className="cm-s cm-hollow cm-ink" strokeWidth={2.6} />
        <path d="M286 124 L300 144 L314 124" className="cm-s cm-hollow cm-ink" strokeWidth={2.6} />
        <line x1={288} y1={124} x2={312} y2={124} style={{ stroke: "var(--cf-stage)" }} className="cm-s" strokeWidth={4} />
      </g>
      <Label x={300} y={102} show={bubble} strong>“Okay.”</Label>
      {READERS.map(({ c, tones, reading, tone, at }, k) => {
        const travel = span(t, 2.2 + k * 0.3, 3.8 + k * 0.3);
        const through = span(t, at - 1, at);
        const start: Point = [300, 150];
        const lensTop: Point = [c[0], c[1] - 84];
        const dot = travel < 1 ? lerpPoint(start, lensTop, travel) : lerpPoint(lensTop, [c[0], c[1] + 96], through);
        const out = span(t, at, at + 0.8);
        const width = reading.length * 11.2 + 40;
        return (
          <g key={reading}>
            <path d={`M300 150 Q ${c[0]} 150 ${c[0]} ${c[1] - 84}`} className="cm-s cm-line" strokeWidth={2} strokeDasharray="4 7" opacity={span(t, 1.6, 2.4)} />
            <PaintingLens c={c} rx={58} ry={76} tones={tones} show={span(t, 1 + k * 0.3, 1.8 + k * 0.3)} />
            {t > 2.2 && out < 1 && <circle cx={dot[0]} cy={dot[1]} r={8} className="cm-f cm-ink" opacity={1 - out} />}
            <g opacity={out}>
              <rect x={c[0] - width / 2} y={c[1] + 120} width={width} height={44} rx={22} className={`cm-s cm-hollow ${tone}`} strokeWidth={2.6} />
            </g>
            <Label x={c[0]} y={c[1] + 149} show={out} strong>{reading}</Label>
          </g>
        );
      })}
      <Label x={300} y={298} show={span(t, 3, 3.8)} strong>Painting</Label>
    </g>
  );
}

/* ── 13 · Character: a path worn across a lawn ──────────────────────── */

const WALK_FROM: Point = [130, 452];
const WALK_TO: Point = [470, 148];
const WORN_C1: Point = [236, 420];
const WORN_C2: Point = [372, 200];
const WALKS = Array.from({ length: 7 }, (_, k) => {
  const spread = 1 - k / 7;
  return {
    start: 1 + k * 1.15,
    c1: [WORN_C1[0] + (seeded(k) - 0.5) * 220 * spread, WORN_C1[1] + (seeded(k + 20) - 0.5) * 160 * spread] as Point,
    c2: [WORN_C2[0] + (seeded(k + 40) - 0.5) * 220 * spread, WORN_C2[1] + (seeded(k + 60) - 0.5) * 160 * spread] as Point,
  };
});
const WORN_SAMPLES = Array.from({ length: 48 }, (_, i) => cubicAt(WALK_FROM, WORN_C1, WORN_C2, WALK_TO, i / 47));
const GRASS = (() => {
  const blades: { x: number; y: number; onPath: boolean }[] = [];
  for (let x = 104; x <= 496; x += 28) {
    for (let y = 124; y <= 480; y += 28) {
      const near = Math.min(...WORN_SAMPLES.map(([px, py]) => Math.hypot(px - x, py - y)));
      blades.push({ x, y, onPath: near < 26 });
    }
  }
  return blades;
})();

export function Character({ t }: MotifProps) {
  const wear = span(t, 2, 9.5);
  return (
    <g>
      <rect x={80} y={100} width={440} height={400} rx={24} className="cm-s cm-line" strokeWidth={2} opacity={span(t, 0, 0.8)} />
      <g opacity={span(t, 0.2, 1.2)}>
        {GRASS.map(({ x, y, onPath }) => (
          <path
            key={`${x}-${y}`}
            d={`M${x - 5} ${y - 7} L${x} ${y} L${x + 5} ${y - 7}`}
            className="cm-s cm-big-c"
            strokeWidth={1.8}
            opacity={0.5 * (onPath ? 1 - 0.92 * wear : 1)}
          />
        ))}
      </g>
      <path d={cubicPath(WALK_FROM, WORN_C1, WORN_C2, WALK_TO)} className="cm-s cm-rf" strokeWidth={lerp(0, 26, wear)} opacity={0.38 * wear} />
      {WALKS.map(({ start, c1, c2 }, k) => {
        if (t < start) return null;
        const u = clamp01((t - start) / 1);
        const walker = cubicAt(WALK_FROM, c1, c2, WALK_TO, span(u, 0, 1));
        return (
          <g key={k}>
            <path d={cubicPath(WALK_FROM, c1, c2, WALK_TO)} className="cm-s cm-ink" strokeWidth={1.6} strokeDasharray="3 8" opacity={lerp(0.5, 0.18, span(t, start + 1, start + 2))} {...(u < 1 ? drawn(u) : {})} />
            {u < 1 && <circle cx={walker[0]} cy={walker[1]} r={7} className="cm-f cm-local" />}
          </g>
        );
      })}
      <path d={cubicPath(WALK_FROM, WORN_C1, WORN_C2, WALK_TO)} className="cm-s cm-ink" strokeWidth={3.6} {...drawn(span(t, 9.2, 10.6))} />
      <Participant at={WALK_FROM} r={18} show={span(t, 0.4, 1.2)} />
      <Label x={160} y={488} anchor="start" show={span(t, 2, 2.8)}>repeated steps</Label>
      <Label x={490} y={86} anchor="end" show={span(t, 9.8, 10.6)} strong>Character</Label>
    </g>
  );
}

/* ── 14–15 · Fear and Love share one fan of responses ───────────────── */

const FAN_ORIGIN: Point = [300, 440];
const FAN_ANGLES = Array.from({ length: 13 }, (_, k) => -170 + (k * 160) / 12);

function ResponseFan({ t, aperture, fear }: { t: number; aperture: number; fear: number }) {
  const enter = span(t, 0, 1.2);
  const wedge = (from: number, to: number) => {
    const a = polar(FAN_ORIGIN[0], FAN_ORIGIN[1], 260, from);
    const b = polar(FAN_ORIGIN[0], FAN_ORIGIN[1], 260, to);
    return `M${FAN_ORIGIN[0]} ${FAN_ORIGIN[1]} L${a[0].toFixed(1)} ${a[1].toFixed(1)} A260 260 0 0 1 ${b[0].toFixed(1)} ${b[1].toFixed(1)} Z`;
  };
  const leftEdge = polar(FAN_ORIGIN[0], FAN_ORIGIN[1], 260, -90 - aperture);
  const rightEdge = polar(FAN_ORIGIN[0], FAN_ORIGIN[1], 260, -90 + aperture);
  return (
    <g opacity={enter}>
      {FAN_ANGLES.map((angle) => {
        const outside = clamp01((Math.abs(angle + 90) - aperture) / 8 + 0.5);
        const open = 1 - outside;
        const from = polar(FAN_ORIGIN[0], FAN_ORIGIN[1], 30, angle);
        const to = polar(FAN_ORIGIN[0], FAN_ORIGIN[1], 228, angle);
        return (
          <g key={angle}>
            <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-local" strokeWidth={2.6} opacity={lerp(0.12, 0.9, open)} />
            <circle cx={to[0]} cy={to[1]} r={lerp(3, 8, open)} className="cm-f cm-local" opacity={lerp(0.2, 1, open)} />
          </g>
        );
      })}
      {fear > 0 && (
        <g opacity={fear}>
          <path d={wedge(-180, -90 - aperture)} className="cm-f cm-fear" opacity={0.16} />
          <path d={wedge(-90 + aperture, 0)} className="cm-f cm-fear" opacity={0.16} />
          <line x1={FAN_ORIGIN[0]} y1={FAN_ORIGIN[1]} x2={leftEdge[0]} y2={leftEdge[1]} className="cm-s cm-fear" strokeWidth={3} />
          <line x1={FAN_ORIGIN[0]} y1={FAN_ORIGIN[1]} x2={rightEdge[0]} y2={rightEdge[1]} className="cm-s cm-fear" strokeWidth={3} />
        </g>
      )}
      <circle cx={FAN_ORIGIN[0]} cy={FAN_ORIGIN[1]} r={24} className="cm-s cm-hollow cm-local" strokeWidth={2.6} />
      <circle cx={FAN_ORIGIN[0]} cy={FAN_ORIGIN[1]} r={10} className="cm-f cm-local" />
    </g>
  );
}

export function FearGating({ t }: MotifProps) {
  const close = span(t, 4, 9);
  return (
    <g>
      <ResponseFan t={t} aperture={lerp(84, 22, close)} fear={span(t, 3, 4.5)} />
      <Label x={300} y={160} show={span(t, 1.6, 2.6)}>responses that feel available</Label>
      <Label x={128} y={384} show={span(t, 5, 6)} strong>Fear governs</Label>
    </g>
  );
}

export function Love({ t }: MotifProps) {
  const release = span(t, 3.5, 8.5);
  // Fear is still felt at the centre; it no longer governs the fan.
  const felt = 0.55 * span(t, 0, 1);
  return (
    <g>
      <ResponseFan t={t} aperture={lerp(22, 84, release)} fear={1 - release} />
      <circle cx={FAN_ORIGIN[0]} cy={FAN_ORIGIN[1]} r={34 + 5 * Math.sin(t * 2.6)} className="cm-s cm-fear" strokeWidth={2} opacity={felt} />
      <Label x={128} y={384} show={span(t, 0.6, 1.4) * (1 - release)}>Fear</Label>
      <Label x={300} y={160} show={span(t, 8.6, 9.6)}>responses that feel available</Label>
      <Label x={300} y={510} show={span(t, 9, 10)} strong>Love</Label>
      <Label x={300} y={540} show={span(t, 9.4, 10.4)}>Fear no longer governs</Label>
    </g>
  );
}

/* ── 16 · Conscious Authorship: see, pause, choose ──────────────────── */

const AUTHOR_LENS: Point = [138, 300];
const AUTHOR_CHOICES: Point[] = [[476, 222], [476, 300], [476, 378]];
const AUTHOR_CHOSEN = 0;

export function ConsciousAuthorship({ t }: MotifProps) {
  const see = span(t, 1.4, 2.8);
  const pause = lerp(10, 56, span(t, 4.2, 6.4));
  const choose = span(t, 8.2, 9.8);
  const reinforce = clamp01((t - 10) / 1.4);
  const chosen = AUTHOR_CHOICES[AUTHOR_CHOSEN];
  return (
    <g>
      <PaintingLens c={AUTHOR_LENS} rx={44} ry={62} tones={["cm-fear", "cm-local", "cm-rf", "cm-big-c"]} show={span(t, 0.2, 1)} />
      <circle
        cx={AUTHOR_LENS[0]}
        cy={AUTHOR_LENS[1]}
        r={84}
        className="cm-s cm-ink"
        strokeWidth={2}
        strokeDasharray="5 8"
        transform={`rotate(${(t * 12).toFixed(1)} ${AUTHOR_LENS[0]} ${AUTHOR_LENS[1]})`}
        opacity={see}
      />
      <line x1={182} y1={300} x2={300 - pause} y2={300} className="cm-s cm-ink" strokeWidth={2.4} opacity={span(t, 3, 3.8)} />
      <g opacity={span(t, 3.6, 4.4)}>
        <line x1={300 - pause} y1={244} x2={300 - pause} y2={356} className="cm-s cm-big-c" strokeWidth={4} />
        <line x1={300 + pause} y1={244} x2={300 + pause} y2={356} className="cm-s cm-big-c" strokeWidth={4} />
      </g>
      {AUTHOR_CHOICES.map((end, k) => {
        const isChosen = k === AUTHOR_CHOSEN;
        const show = span(t, 7 + k * 0.2, 7.8 + k * 0.2);
        const d = `M${300 + pause} 300 C ${380} 300, ${400} ${end[1]}, ${end[0] - 18} ${end[1]}`;
        return (
          <g key={k}>
            <path d={d} className={isChosen ? "cm-s cm-big-c" : "cm-s cm-line"} strokeWidth={isChosen ? lerp(2, 3.6, choose) : 2} strokeDasharray={isChosen && choose > 0.5 ? undefined : "4 7"} opacity={show * (isChosen ? 1 : lerp(1, 0.4, choose))} />
            <circle cx={end[0]} cy={end[1]} r={isChosen ? lerp(7, 11, choose) : 7} className={isChosen && choose > 0.5 ? "cm-f cm-big-c" : "cm-f cm-line"} opacity={show} />
          </g>
        );
      })}
      {reinforce > 0 && reinforce < 1 && (
        <circle cx={chosen[0]} cy={chosen[1]} r={lerp(12, 46, reinforce)} className="cm-s cm-big-c" strokeWidth={2.4} opacity={1 - reinforce} />
      )}
      <Label x={138} y={418} show={span(t, 1.8, 2.6)}>1 · see the Painting</Label>
      <Label x={300} y={214} show={span(t, 4.4, 5.2)}>2 · widen the pause</Label>
      <Label x={476} y={180} show={span(t, 7.6, 8.4)} strong>3 · choose</Label>
    </g>
  );
}

/* ── 17 · Limits and Unpaid Debts: a living ledger of claims ────────── */

const LEVELS = [
  { name: "Observed", fill: "cm-f cm-ink" },
  { name: "Modeled", fill: "cm-f cm-local" },
  { name: "Hypothesized", fill: "cm-s cm-rf" },
  { name: "Speculative", fill: "cm-s cm-fear" },
];
const CLAIM_BANDS = [0, 1, 0, 2, 1, 3, 1, 2, 0, 2, 3, 1, 2, 3];
const LEDGER_ROW_Y = (band: number) => 222 + band * 76;

export function LimitsAndDebts({ t }: MotifProps) {
  const slots = [0, 0, 0, 0];
  const open = span(t, 9.8, 10.8);
  return (
    <g>
      <g opacity={span(t, 0, 1)}>
        <path d="M530 120 L90 120 Q76 120 76 134 L76 496 Q76 510 90 510 L530 510" className="cm-s cm-ink" strokeWidth={2.6} />
        <line x1={530} y1={120} x2={530} y2={510} className="cm-s cm-ink" strokeWidth={2.6} strokeDasharray={open > 0.5 ? "6 10" : undefined} opacity={lerp(1, 0.7, open)} />
        <line x1={76} y1={176} x2={530} y2={176} className="cm-s cm-ink" strokeWidth={2} />
        {LEVELS.map((_, band) => band > 0 && (
          <line key={band} x1={76} y1={LEDGER_ROW_Y(band) - 38} x2={530} y2={LEDGER_ROW_Y(band) - 38} className="cm-s cm-line" strokeWidth={1.6} />
        ))}
      </g>
      <Label x={300} y={156} show={span(t, 0.6, 1.4)} strong>claims ledger</Label>
      {LEVELS.map(({ name }, band) => (
        <Label key={name} x={98} y={LEDGER_ROW_Y(band) + 8} anchor="start" show={span(t, 0.8 + band * 0.25, 1.6 + band * 0.25)}>{name}</Label>
      ))}
      {CLAIM_BANDS.map((band, i) => {
        const slot = slots[band]++;
        const land = 1.6 + i * 0.55;
        if (t < land - 0.6) return null;
        const target: Point = [300 + slot * 40, LEDGER_ROW_Y(band)];
        const at = lerpPoint([300, 64], target, span(t, land - 0.6, land));
        const { fill } = LEVELS[band];
        return (
          <circle key={i} cx={at[0]} cy={at[1]} r={10} className={fill} strokeWidth={2.6} strokeDasharray={band === 3 ? "3 4" : undefined} />
        );
      })}
      <Label x={300} y={552} show={span(t, 10, 10.8)} strong>open to criticism</Label>
    </g>
  );
}

/* ── The tour's opening: the struggle, the cultural trap, the setup, the turn ──
   One continuous drawing on the film's own clock. The camera pulls back twice: the struggle
   sits inside a ring that closes and locks, a cultural trap, and the trap is one of several
   cultures inside a ruled frame. Then the lock springs, the ring opens, and the person
   rises out of it. Its clock gives the scenes 11, 12, 12, and 7 seconds
   (TOUR_OPENING_DRAWN_SECONDS); the tour stretches each to fill its scene. */

// The six cultural messages the American Millennial Manifesto examines, set around the
// person with clear space between each message and the pain at the centre.
const PRESSURES = [
  { text: "Your worth is what you earn.", at: [300, 66] as Point },
  { text: "Everyone does it.", at: [170, 162] as Point },
  { text: "You have no choice.", at: [432, 162] as Point },
  { text: "Do not risk your place.", at: [432, 438] as Point },
  { text: "Protect what is yours.", at: [170, 438] as Point },
  { text: "If it pays, it must be progress.", at: [300, 534] as Point },
];
const PRESSURE_SIZE = 0.86;
// The book's words for what the trap makes ordinary.
const TRAP_TERMS = [
  { text: "time as money", y: 70 },
  { text: "attention as inventory", y: 104 },
  { text: "nature as raw material", y: 502 },
  { text: "human beings as units of production", y: 536 },
];
const OTHER_CULTURES = [
  { c: [140, 170] as Point, r: 56, tone: "cm-rf" },
  { c: [460, 166] as Point, r: 50, tone: "cm-big-c" },
  { c: [130, 410] as Point, r: 46, tone: "cm-origin" },
  { c: [470, 410] as Point, r: 52, tone: "cm-fear" },
];
const TRAP_R = 150;

/** A culture's boundary: a ring drawn closed from the top, which can open there again. */
function Enclosure({ c, r, tone, show, closed = 1, gap = 0 }: { c: Point; r: number; tone: string; show: number; closed?: number; gap?: number }) {
  if (show <= 0.001) return null;
  const outline: Point[] = [];
  for (let a = -90 + gap; a <= 270 - gap + 0.01; a += 4) outline.push(polar(c[0], c[1], r, a));
  return (
    <g opacity={show}>
      <circle cx={c[0]} cy={c[1]} r={r} className={`cm-f ${tone}`} opacity={0.07 * span(closed, 0.7, 1)} />
      <path d={pathOf(outline, gap < 0.5 && closed >= 1)} className={`cm-s ${tone}`} strokeWidth={Math.max(2, r / 40)} {...drawn(closed)} />
    </g>
  );
}

/** The padlock where the trap closes; it springs open and falls away at the turn. */
function Lock({ at, show, open, size = 1 }: { at: Point; show: number; open: number; size?: number }) {
  if (show <= 0.001) return null;
  const snap = lerp(1.35, 1, show) * size;
  return (
    <g
      opacity={show * (1 - span(open, 0.5, 1))}
      transform={`translate(${at[0]} ${at[1] + 26 * span(open, 0.4, 1)}) scale(${snap.toFixed(3)})`}
    >
      <path
        d="M -9 -4 V -13 A 9 9 0 0 1 9 -13 V -4"
        transform={`translate(0 ${(-6 * span(open, 0, 0.4)).toFixed(2)}) rotate(${(-40 * span(open, 0.1, 0.5)).toFixed(1)} 9 -4)`}
        className="cm-s cm-local"
        strokeWidth={3.4}
      />
      <rect x={-14} y={-5} width={28} height={22} rx={4} className="cm-f cm-local" />
      <circle cx={0} cy={4} r={3} className="cm-ground" />
      <rect x={-1.2} y={5} width={2.4} height={6} rx={1} className="cm-ground" />
    </g>
  );
}

export function TourOpening({ t }: MotifProps) {
  const pullBack = span(t, 11, 13);
  const pullFurther = span(t, 23, 25);
  const inner = lerp(1, 0.42, pullBack);
  const outer = lerp(1, 0.45, pullFurther);
  const turn = span(t, 35.2, 36.4);
  const opening = span(t, 35.4, 37.2);
  const rise = span(t, 36.2, 38.6);
  const unlock = span(t, 35, 36);
  const person: Point = [300, lerp(300, 150, rise)];
  const scaleAbout = (s: number) => `translate(300 300) scale(${s.toFixed(4)}) translate(-300 -300)`;
  return (
    <g>
      {/* The setup: a ruled frame holding many cultures. */}
      <g opacity={lerp(1, 0.35, turn)}>
        <rect x={50} y={60} width={500} height={440} rx={26} className="cm-s cm-rf" strokeWidth={3} {...drawn(span(t, 24, 25.6))} />
        <g opacity={0.35 * span(t, 24.4, 25.6)}>
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`v${i}`} x1={92 + i * 46} y1={64} x2={92 + i * 46} y2={496} className="cm-s cm-line" strokeWidth={1} />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1={54} y1={100 + i * 46} x2={546} y2={100 + i * 46} className="cm-s cm-line" strokeWidth={1} />
          ))}
        </g>
        {OTHER_CULTURES.map(({ c, r, tone }, k) => {
          const show = span(t, 25 + k * 0.4, 25.8 + k * 0.4);
          return (
            <g key={k}>
              <Enclosure c={c} r={r} tone={tone} show={show} />
              {[0, 1, 2].map((i) => {
                const at = polar(c[0], c[1], r * 0.45 * seeded(k * 7 + i), seeded(k * 11 + i) * 360);
                return <circle key={i} cx={at[0]} cy={at[1]} r={4} className={`cm-f ${tone}`} opacity={show} />;
              })}
            </g>
          );
        })}
        <Label x={74} y={94} anchor="start" show={span(t, 26.4, 27.2)}>RF₀</Label>
        <Label x={300} y={94} show={span(t, 26.6, 27.4)}>stable rules</Label>
        <Label x={300} y={486} show={span(t, 27.4, 28.2)}>legible consequences</Label>
        <Label x={300} y={548} show={span(t, 28.2, 29)}>more than one response</Label>
      </g>

      {/* The trap, and inside it, the struggle. */}
      <g transform={scaleAbout(outer)}>
        <g transform={scaleAbout(inner)} opacity={lerp(1, 0.25, turn)}>
          {PRESSURES.map(({ text, at }, k) => {
            const show = span(t, 0.6 + k * 0.55, 1.2 + k * 0.55);
            const towards = Math.atan2(300 - at[1], 300 - at[0]);
            const from: Point = [at[0] + Math.cos(towards) * 28, at[1] + Math.sin(towards) * 28];
            const to: Point = [300 - Math.cos(towards) * 46, 300 - Math.sin(towards) * 46];
            return (
              <g key={text} opacity={show}>
                <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-fear" strokeWidth={2.4} strokeDasharray="6 7" strokeDashoffset={-t * 18} />
                <Arrowhead at={to} angle={(towards * 180) / Math.PI} tone="cm-fear" />
              </g>
            );
          })}
          {[0, 1, 2].map((n) => {
            const phase = (((t - 4 - n * 0.8) % 2.4) + 2.4) % 2.4 / 2.4;
            return (
              <circle key={n} cx={300} cy={300} r={30 + 42 * phase} className="cm-s cm-fear" strokeWidth={2.6} opacity={(1 - phase) * 0.75 * span(t, 4, 5)} />
            );
          })}
          <Participant at={[300, 300]} r={22} show={span(t, 0.1, 0.8)} />
          {PRESSURES.map(({ text, at }, k) => (
            <Pill
              key={text}
              x={at[0] + 3 * Math.sin(t * 2.3 + k * 1.7) * span(t, 3.5, 5)}
              y={at[1]}
              text={text}
              show={span(t, 0.6 + k * 0.55, 1.2 + k * 0.55)}
              tone="cm-fear"
              size={PRESSURE_SIZE}
            />
          ))}
        </g>
        <Enclosure c={[300, 300]} r={TRAP_R} tone="cm-local" show={span(t, 11.6, 12)} closed={span(t, 11.6, 13.2)} gap={70 * opening} />
        <g opacity={1 - pullFurther}>
          {TRAP_TERMS.map(({ text, y }, k) => (
            <Label key={text} x={300} y={y} show={span(t, 13.8 + k * 0.8, 14.6 + k * 0.8)}>{text}</Label>
          ))}
        </g>
      </g>
      {/* The lock stays legible as the camera pulls back. */}
      <Lock at={[300, 300 - TRAP_R * outer]} show={span(t, 13.2, 13.6)} open={unlock} size={lerp(1, 0.75, pullFurther)} />
      <Label x={300} y={400} show={span(t, 27, 27.8) * (1 - turn)} strong>a historical Painting</Label>

      {/* The turn: the lock springs, the trap opens, and the person rises out of it. */}
      <g opacity={span(t, 36.4, 37.4)}>
        {[-60, -40, -20, 0, 20, 40, 60].map((a) => {
          const from = polar(300, 232, 18, a - 90);
          const to = polar(300, 232, lerp(18, 60, span(t, 36.4, 37.8)), a - 90);
          return <line key={a} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-big-c" strokeWidth={2.4} />;
        })}
      </g>
      <Participant at={person} r={22} show={span(t, 35.8, 36.4)} />
    </g>
  );
}

/* ── The architecture, as the homepage draws it ─────────────────────────
   T × E outside, Big C emerged within it, RF₀ inside Big C, and Little c within RF₀.
   The camera moves in to the layer a concept belongs to, so each concept is first seen
   where it sits. */

export type ArchitectureLayer = "all" | "big-c" | "reality-frame" | "reality-stream" | "little-c";

const ARCH_CENTRE: Point = [300, 320];
const ARCH_FIELD_R = 262;
const ARCH_BIG_C_R = 222;
const ARCH_RF: Point = [394, 236];
const ARCH_RF_R = 74;
const ARCH_LITTLE_C: Point = [384, 248];
const ARCH_LITTLE_C_R = 13;
const ARCH_VIEWS: Record<ArchitectureLayer, { focus: Point; scale: number }> = {
  all: { focus: ARCH_CENTRE, scale: 1 },
  "big-c": { focus: ARCH_CENTRE, scale: 1 },
  "reality-frame": { focus: ARCH_RF, scale: 2.3 },
  "reality-stream": { focus: ARCH_RF, scale: 2.3 },
  "little-c": { focus: ARCH_LITTLE_C, scale: 5 },
};

// The map is seen through a round lens, so moving in never shows the picture's square edge.
const ARCH_LENS: Point = [300, 316];
const ARCH_LENS_R = 284;

export function ArchitectureMap({ t, layer }: { t: number; layer: ArchitectureLayer }) {
  const clipId = `architecture-lens-${useId().replace(/[^\w-]/g, "")}`;
  const move = span(t, 0.6, 2.2);
  const ease = move * move * (3 - 2 * move);
  const view = ARCH_VIEWS[layer];
  const scale = lerp(1, view.scale, ease);
  const focus = lerpPoint(ARCH_CENTRE, view.focus, ease);
  const at = (p: Point): Point => [ARCH_CENTRE[0] + (p[0] - focus[0]) * scale, ARCH_CENTRE[1] + (p[1] - focus[1]) * scale];
  const within = ([x, y]: Point) => Math.hypot(x - ARCH_LENS[0], y - ARCH_LENS[1]) < ARCH_LENS_R - 24;
  const lit = (part: ArchitectureLayer) => (layer === "all" ? 1 : span(t, 0.9, 1.6) * (part === layer ? 1 : 0));
  const drawIn = (from: number) => (layer === "all" ? span(t, from, from + 1) : span(t, 0, 0.5));

  const centre = at(ARCH_CENTRE);
  const rf = at(ARCH_RF);
  const littleC = at(ARCH_LITTLE_C);
  const rfLit = Math.max(lit("reality-frame"), lit("reality-stream"));
  const littleLit = Math.max(lit("little-c"), lit("reality-stream"));
  const labels: { text: string; p: Point; show: number; strong: boolean }[] = [
    { text: "T × E", p: [centre[0], centre[1] - ARCH_FIELD_R * scale - 14], show: drawIn(0), strong: false },
    { text: "Big C", p: [centre[0] - 120 * scale, centre[1] - 150 * scale], show: drawIn(0.4), strong: lit("big-c") > 0.5 },
    { text: "RF₀", p: [rf[0] - 54 * scale, rf[1] - 56 * scale], show: drawIn(0.9), strong: rfLit > 0.5 },
    { text: "Little c", p: [littleC[0], littleC[1] + ARCH_LITTLE_C_R * scale + 32], show: drawIn(1.4), strong: littleLit > 0.5 },
  ];

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={ARCH_LENS[0]} cy={ARCH_LENS[1]} r={ARCH_LENS_R} />
        </clipPath>
        <radialGradient id={`${clipId}-sphere`} cx="42%" cy="38%" r="68%">
          <stop offset="0%" style={{ stopColor: "var(--cf-big-c)", stopOpacity: 0.08 }} />
          <stop offset="70%" style={{ stopColor: "var(--cf-big-c)", stopOpacity: 0.18 }} />
          <stop offset="100%" style={{ stopColor: "var(--cf-big-c)", stopOpacity: 0.32 }} />
        </radialGradient>
      </defs>
      <circle cx={ARCH_LENS[0]} cy={ARCH_LENS[1]} r={ARCH_LENS_R} className="cm-s cm-line" strokeWidth={2} opacity={view.scale > 1 ? ease : 0} />
      <g clipPath={`url(#${clipId})`}>
      {/* T × E: the field Big C emerged within, outside it, as the homepage draws it. */}
      <g opacity={drawIn(0)}>
        <circle cx={centre[0]} cy={centre[1]} r={ARCH_FIELD_R * scale} className="cm-s cm-origin" strokeWidth={2} strokeDasharray="3 9" />
        <circle cx={centre[0]} cy={centre[1]} r={(ARCH_FIELD_R - 12) * scale} className="cm-s cm-line" strokeWidth={1.4} strokeDasharray="1 7" />
        {[-150, -110, -70, -30, 30, 70, 110, 150].map((angle) => {
          const from = polar(centre[0], centre[1], (ARCH_FIELD_R - 6) * scale, angle - 90);
          const to = polar(centre[0], centre[1], (ARCH_FIELD_R + 8) * scale, angle - 90);
          return <line key={angle} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-origin" strokeWidth={2} />;
        })}
      </g>
      {/* Big C: a living sphere with a membrane, lit from within. */}
      <circle cx={centre[0]} cy={centre[1]} r={ARCH_BIG_C_R * scale} fill={`url(#${clipId}-sphere)`} opacity={drawIn(0.4) * (0.75 + 0.25 * lit("big-c"))} />
      <g opacity={drawIn(0.4)}>
        <circle
          cx={centre[0]}
          cy={centre[1]}
          r={ARCH_BIG_C_R * scale}
          className={`cm-s ${lit("big-c") > 0.5 || layer === "all" ? "cm-big-c" : "cm-line"}`}
          strokeWidth={2.4 + 1.6 * lit("big-c")}
        />
        <circle cx={centre[0]} cy={centre[1]} r={(ARCH_BIG_C_R - 10) * scale} className="cm-s cm-big-c" strokeWidth={1.4} strokeDasharray="5 8" opacity={0.55} />
        {[-116, -72, -28, 18, 64, 112, 158, 204].map((angle) => {
          const node = polar(centre[0], centre[1], ARCH_BIG_C_R * scale, angle);
          return <circle key={angle} cx={node[0]} cy={node[1]} r={3.2} className="cm-f cm-big-c" />;
        })}
      </g>
      {/* RF₀, a lawful world inside Big C. */}
      <g opacity={drawIn(0.9)}>
        <circle cx={rf[0]} cy={rf[1]} r={ARCH_RF_R * scale} className="cm-f cm-rf" opacity={0.08 + 0.08 * rfLit} />
        {[-2, -1, 0, 1, 2].flatMap((i) =>
          [-2, -1, 0, 1, 2].map((j) => {
            const p: Point = [ARCH_RF[0] + i * 24, ARCH_RF[1] + j * 24];
            if (Math.hypot(i * 24, j * 24) > ARCH_RF_R - 10) return null;
            const q = at(p);
            return <circle key={`${i}${j}`} cx={q[0]} cy={q[1]} r={1.8} className="cm-f cm-rf" opacity={0.6} />;
          }),
        )}
        <circle
          cx={rf[0]}
          cy={rf[1]}
          r={ARCH_RF_R * scale}
          className={`cm-s ${rfLit > 0.5 || layer === "all" ? "cm-rf" : "cm-line"}`}
          strokeWidth={2 + 1.6 * rfLit}
        />
        {[0, 90, 180, 270].map((angle) => {
          const from = polar(rf[0], rf[1], (ARCH_RF_R - 6) * scale, angle);
          const to = polar(rf[0], rf[1], (ARCH_RF_R + 6) * scale, angle);
          return <line key={angle} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-rf" strokeWidth={2} />;
        })}
      </g>
      {/* The Reality Stream: what reaches Little c from within the Frame. */}
      {layer === "reality-stream" &&
        [0, 1, 2, 3, 4, 5].map((k) => {
          const phase = (((t - 1.4 + k * 0.38) % 2.2) + 2.2) % 2.2 / 2.2;
          const angle = -150 + k * 52;
          const from = polar(ARCH_RF[0], ARCH_RF[1], ARCH_RF_R - 6, angle);
          const p = at(lerpPoint(from, ARCH_LITTLE_C, phase));
          return <circle key={k} cx={p[0]} cy={p[1]} r={5} className="cm-f cm-local" opacity={span(t, 1.4, 2) * (1 - phase) * 0.9} />;
        })}
      {/* Little c. */}
      <g opacity={drawIn(1.4)}>
        <circle cx={littleC[0]} cy={littleC[1]} r={ARCH_LITTLE_C_R * scale} className="cm-s cm-hollow cm-local" strokeWidth={2 + 1.4 * littleLit} />
        <circle cx={littleC[0]} cy={littleC[1]} r={Math.max(3.5, 4 * Math.sqrt(scale))} className="cm-f cm-local" />
      </g>
      </g>
      {labels.map(({ text, p, show, strong }) =>
        within(p) ? (
          <Label key={text} x={p[0]} y={p[1]} show={show} strong={strong}>
            {text}
          </Label>
        ) : null,
      )}
    </g>
  );
}

/* ── The human character: Ego the protector, and Arrogance at its gate ──
   It follows the Fear-Gating Principle. Little c, in one corner of its Canvas, sits inside
   the same ring of fear and paints Ego around itself in the shape of a body to protect it.
   The outline hardens; Arrogance stands at its edge and turns new strokes away. */

const EGO_OUTLINE = "M80 556 L80 446 C82 384 102 344 142 332 L208 332 C248 344 268 384 270 446 L270 556";
const EGO_HEAD: Point = [175, 274];
const EGO_GATE: Point = [271, 420];
const OPEN_STROKES = [
  { d: "M330 96 C370 80 420 112 470 92", tone: "cm-big-c", at: 0.3 },
  { d: "M362 140 C410 124 452 160 520 140", tone: "cm-rf", at: 0.6 },
  { d: "M392 232 C424 218 460 244 500 230", tone: "cm-origin", at: 0.9 },
  { d: "M380 520 C420 504 470 532 528 516", tone: "cm-big-c", at: 1.2 },
];

export function HumanCharacter({ t }: MotifProps) {
  const painted = span(t, 2, 5);
  const hardened = span(t, 6.2, 7.6);
  const gate = span(t, 7.4, 8.2);
  return (
    <g>
      {/* The Canvas, most of it open. */}
      <rect x={40} y={40} width={520} height={520} rx={18} className="cm-s cm-line" strokeWidth={2} opacity={span(t, 0, 0.6)} />
      <Label x={60} y={74} anchor="start" show={span(t, 0.2, 0.8)}>the Canvas</Label>
      {OPEN_STROKES.map(({ d, tone, at }) => (
        <path key={d} d={d} className={`cm-s ${tone}`} strokeWidth={5} opacity={0.45 * span(t, at, at + 0.8)} {...drawn(span(t, at, at + 1.2))} />
      ))}

      {/* In one corner: Little c, inside the ring of fear from the Fear-Gating Principle. */}
      <circle cx={175} cy={430} r={34 + 3 * Math.sin(t * 2.4)} className="cm-s cm-fear" strokeWidth={2.6} opacity={0.75 * span(t, 0.8, 1.4)} />
      <Participant at={[175, 430]} r={18} show={span(t, 0.4, 1)} />

      {/* Ego, painted around it in the shape of a body, then hardening. */}
      <path
        d={EGO_OUTLINE}
        className={hardened > 0.5 ? "cm-s cm-ink" : "cm-s cm-muted"}
        strokeWidth={lerp(4, 9, hardened)}
        {...drawn(painted)}
      />
      <circle
        cx={EGO_HEAD[0]}
        cy={EGO_HEAD[1]}
        r={40}
        className={hardened > 0.5 ? "cm-s cm-ink" : "cm-s cm-muted"}
        strokeWidth={lerp(4, 9, hardened)}
        {...drawn(span(painted, 0.5, 1))}
      />
      <Label x={175} y={212} show={span(t, 4.2, 4.8)} strong>Ego</Label>

      {/* Arrogance at the gate: new strokes are turned away. */}
      {[0, 1, 2].map((k) => {
        const start = 8.6 + k * 1.5;
        const go = span(t, start, start + 0.7);
        const back = span(t, start + 0.7, start + 1.3);
        const last = k === 2;
        if (go <= 0 || (back >= 1 && !last)) return null;
        const x = back > 0 ? lerp(EGO_GATE[0] + 26, 470, back) : lerp(520, EGO_GATE[0] + 26, go);
        const y = EGO_GATE[1] + (k - 1) * 10;
        return <line key={k} x1={x} y1={y} x2={x + 48} y2={y} className="cm-s cm-big-c" strokeWidth={5} opacity={last ? 1 - 0.4 * back : 1 - back} />;
      })}
      <g opacity={gate} transform={`translate(${EGO_GATE[0]} ${EGO_GATE[1]}) scale(${lerp(1.3, 1, gate).toFixed(3)})`}>
        <path d="M0 -26 L20 -18 L20 4 C20 18 10 26 0 32 C-10 26 -20 18 -20 4 L-20 -18 Z" className="cm-f cm-fear" />
      </g>
      <Label x={306} y={428} anchor="start" show={span(t, 8, 8.6)} strong>Arrogance</Label>
    </g>
  );
}

/** The architecture in miniature, lit where a concept sits: a locator beside its place in the film. */
export function ArchitectureGlyph({ layer }: { layer: ArchitectureLayer }) {
  const on = (part: ArchitectureLayer) => layer === part || (layer === "reality-stream" && (part === "reality-frame" || part === "little-c"));
  return (
    <svg className="concept-film-glyph" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx={24} cy={24} r={22} className="cm-s cm-origin" strokeWidth={1.4} strokeDasharray="1.5 3.5" />
      <circle cx={24} cy={24} r={18} className={on("big-c") ? "cm-f cm-big-c" : "cm-f cm-line"} opacity={on("big-c") ? 0.35 : 0.5} />
      <circle cx={24} cy={24} r={18} className={on("big-c") ? "cm-s cm-big-c" : "cm-s cm-muted"} strokeWidth={on("big-c") ? 2.4 : 1.2} />
      <circle cx={30} cy={18} r={7} className={on("reality-frame") ? "cm-f cm-rf" : "cm-f cm-hollow"} opacity={on("reality-frame") ? 0.55 : 1} />
      <circle cx={30} cy={18} r={7} className={on("reality-frame") ? "cm-s cm-rf" : "cm-s cm-muted"} strokeWidth={on("reality-frame") ? 2.2 : 1.2} />
      {on("little-c") && <circle cx={29.2} cy={18.8} r={4.8} className="cm-s cm-hollow cm-local" strokeWidth={2} />}
      <circle cx={29.2} cy={18.8} r={on("little-c") ? 2.2 : 1.6} className={on("little-c") ? "cm-f cm-local" : "cm-f cm-muted"} />
    </svg>
  );
}
