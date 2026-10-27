import { useId, type ReactNode } from "react";

/* Seventeen silent motion studies, one for each concept in the Book One concept map.
   Each draws on a 600 × 600 stage as a pure function of the film clock, so any frame
   can be seeked, paused, or shown as a still. Labels name only what the map names. */

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

const quadAt = (p0: Point, p1: Point, p2: Point, s: number): Point =>
  lerpPoint(lerpPoint(p0, p1, s), lerpPoint(p1, p2, s), s);
/** The first `s` of a quadratic curve, as path data. */
const quadTo = (p0: Point, p1: Point, p2: Point, s: number) => {
  const c = lerpPoint(p0, p1, s);
  const end = quadAt(p0, p1, p2, s);
  return `M${p0[0]} ${p0[1]} Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${end[0].toFixed(1)} ${end[1].toFixed(1)}`;
};
const cubicAt = (p0: Point, p1: Point, p2: Point, p3: Point, s: number): Point => {
  const m = 1 - s;
  return [
    m * m * m * p0[0] + 3 * m * m * s * p1[0] + 3 * m * s * s * p2[0] + s * s * s * p3[0],
    m * m * m * p0[1] + 3 * m * m * s * p1[1] + 3 * m * s * s * p2[1] + s * s * s * p3[1],
  ];
};

/** Reveals a stroke along its length. */
const drawn = (u: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - clamp01(u) });

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

function Arrowhead({ at, angle, tone, opacity = 1 }: { at: Point; angle: number; tone: string; opacity?: number }) {
  return (
    <polygon
      points="0,0 -13,-6.5 -13,6.5"
      transform={`translate(${at[0].toFixed(1)} ${at[1].toFixed(1)}) rotate(${angle.toFixed(1)})`}
      className={`cm-f ${tone}`}
      opacity={opacity}
    />
  );
}

const angleOf = (from: Point, to: Point) => (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;

/* ── 01 · The Subjective Data Principle ─────────────────────────────── */

export function SubjectiveData({ t }: MotifProps) {
  const observer: Point = [300, 230];
  const sweep = span(t, 10.2, 12.6);
  const sweepX = lerp(150, 450, sweep);
  const waves = [0, 1, 2, 3, 4].map((k) => ({ k, start: 1 + k * 1.6 }));
  const enter = span(t, 0, 0.8);
  return (
    <g>
      <circle cx={observer[0]} cy={observer[1]} r={64} className="cm-s cm-local" strokeWidth={1.2} opacity={0.25 * span(t, 1, 2)} />
      {waves.map(({ k, start }) => {
        const u = clamp01((t - start) / 2.2);
        if (t < start || u >= 1) return null;
        return (
          <circle key={k} cx={observer[0]} cy={observer[1]} r={lerp(34, 170, u)} className="cm-s cm-local" strokeWidth={2} opacity={(1 - u) * 0.7} />
        );
      })}
      <line x1={300} y1={272} x2={300} y2={440} className="cm-s cm-line" strokeWidth={1.5} strokeDasharray="3 7" opacity={span(t, 2.8, 3.8)} />
      <circle cx={observer[0]} cy={observer[1]} r={28} className="cm-s cm-local" strokeWidth={2} opacity={enter} />
      <circle cx={observer[0]} cy={observer[1]} r={9} className="cm-f cm-local" opacity={enter} />
      <line x1={140} y1={470} x2={460} y2={470} className="cm-s cm-line" strokeWidth={1.5} opacity={span(t, 2.6, 3.4)} />
      {waves.map(({ k, start }) => {
        const land = start + 2.2;
        if (t < land - 0.4) return null;
        const x = 180 + k * 60;
        const confirmed = k !== 3 && sweepX >= x;
        return (
          <circle
            key={k}
            cx={x}
            cy={lerp(400, 470, span(t, land - 0.4, land + 0.2))}
            r={8}
            className={confirmed ? "cm-f cm-local" : "cm-s cm-hollow cm-local"}
            strokeWidth={2}
          />
        );
      })}
      {sweep > 0 && sweep < 1 && (
        <line x1={sweepX} y1={438} x2={sweepX} y2={502} className="cm-s cm-ink" strokeWidth={1.5} opacity={0.7} />
      )}
      <Label x={430} y={112} show={span(t, 1.6, 2.6)} anchor="start">feeling</Label>
      <Label x={128} y={476} show={span(t, 3.2, 4.2)} anchor="end">data</Label>
      <Label x={300} y={545} show={span(t, 10.4, 11.4)}>examined</Label>
    </g>
  );
}

/* ── 02 · Digital Organism ──────────────────────────────────────────── */

const ORGANISM_HITS = [0, 1, 2, 3, 4, 5].map((k) => ({
  angle: -150 + k * 62 + seeded(k) * 24,
  at: 2.2 + k * 1.5,
}));

function organismState(time: number): Point {
  let x = 300;
  let y = 300;
  for (const hit of ORGANISM_HITS) {
    const dt = time - hit.at;
    if (dt <= 0) continue;
    const pull = 15 * (1 - Math.exp(-dt * 2.5));
    const [dx, dy] = polar(0, 0, 1, hit.angle);
    x += dx * pull;
    y += dy * pull;
  }
  return [x, y];
}

export function DigitalOrganism({ t }: MotifProps) {
  const R = 150;
  const grow = span(t, 0, 1.2);
  const membrane: Point[] = [];
  for (let i = 0; i < 96; i++) {
    const th = (i / 96) * Math.PI * 2;
    let r = R + 3 * Math.sin(3 * th + t * 0.9) + 2 * Math.sin(5 * th - t * 0.6);
    for (const hit of ORGANISM_HITS) {
      const dt = t - hit.at;
      if (dt <= 0) continue;
      const a = (hit.angle * Math.PI) / 180;
      const d = Math.atan2(Math.sin(th - a), Math.cos(th - a));
      r -= 26 * Math.exp(-dt * 1.7) * Math.cos(dt * 5) * Math.exp(-(d * d) / 0.18);
    }
    r *= lerp(0.7, 1, grow);
    membrane.push([300 + r * Math.cos(th), 300 + r * Math.sin(th)]);
  }
  const trace: Point[] = [];
  for (let s = 0; s <= t; s += 0.1) trace.push(organismState(s));
  const state = organismState(t);
  return (
    <g>
      <path d={pathOf(membrane, true)} className="cm-s cm-hollow cm-local" strokeWidth={2.6} opacity={grow} />
      {trace.length > 1 && (
        <path d={pathOf(trace)} className="cm-s cm-local" strokeWidth={1.4} opacity={0.45} />
      )}
      <circle cx={state[0]} cy={state[1]} r={10} className="cm-f cm-local" opacity={grow} />
      <circle cx={state[0]} cy={state[1]} r={22} className="cm-s cm-local" strokeWidth={1.2} opacity={0.5 * grow} />
      {ORGANISM_HITS.map((hit, k) => {
        const u = clamp01((t - (hit.at - 1)) / 1);
        if (t < hit.at - 1) return null;
        if (u >= 1) {
          const ripple = clamp01((t - hit.at) / 0.9);
          if (ripple >= 1) return null;
          const at = polar(300, 300, R, hit.angle);
          return <circle key={k} cx={at[0]} cy={at[1]} r={lerp(6, 34, ripple)} className="cm-s cm-rf" strokeWidth={1.6} opacity={1 - ripple} />;
        }
        const at = polar(300, 300, lerp(292, R, u), hit.angle);
        return <circle key={k} cx={at[0]} cy={at[1]} r={7} className="cm-f cm-rf" />;
      })}
      <Label x={state[0]} y={state[1] + 48} show={span(t, 0.8, 1.8)}>state</Label>
      <Label x={polar(300, 300, 250, ORGANISM_HITS[0].angle)[0]} y={polar(300, 300, 250, ORGANISM_HITS[0].angle)[1]} show={span(t, 1.4, 2.2)}>
        difference
      </Label>
      <Label x={470} y={306} show={span(t, 6, 7)} anchor="start">coherence</Label>
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
            strokeWidth={1.3}
            strokeDasharray="14 10"
            strokeDashoffset={-t * 24}
            opacity={0.42 * field}
          />
        );
      })}
      {/* E: raw information, unformed points. Those near Big C gather into its membrane. */}
      {E_POINTS.map((p, i) => {
        const dx = p.x - 300;
        const dy = p.y - 300;
        const d = Math.hypot(dx, dy);
        const flicker = 0.45 + 0.35 * Math.sin(t * 1.8 + p.phase);
        if (d < R + 40) {
          const pull = form;
          const x = lerp(p.x, 300 + (dx / d) * R, pull);
          const y = lerp(p.y, 300 + (dy / d) * R, pull);
          return <circle key={i} cx={x} cy={y} r={2.6} className="cm-f cm-origin" opacity={field * flicker * (1 - pull)} />;
        }
        return <circle key={i} cx={p.x} cy={p.y} r={2.6} className="cm-f cm-origin" opacity={field * flicker} />;
      })}
      {/* Big C: emerging within T × E, not containing them. */}
      <circle cx={300} cy={300} r={R} className="cm-ground" opacity={form} />
      <circle cx={300} cy={300} r={R} className="cm-s cm-big-c" strokeWidth={2.8} transform="rotate(-90 300 300)" {...drawn(form)} />
      <circle cx={300} cy={318} r={100} className="cm-s cm-rf" strokeWidth={2.2} transform="rotate(-90 300 318)" {...drawn(frame)} />
      {[polar(300, 300, 142, -38), polar(300, 300, 142, 214)].map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={24} className="cm-s cm-rf" strokeWidth={1.4} strokeDasharray="4 5" opacity={0.75 * frame} />
      ))}
      {BIG_C_LOCALS.map(([x, y], i) => {
        const u = span(t, 8.8 + i * 0.35, 9.6 + i * 0.35);
        return (
          <g key={i} opacity={u}>
            <circle cx={x} cy={y} r={14} className="cm-s cm-local" strokeWidth={1.2} opacity={0.6} />
            <circle cx={x} cy={y} r={5.5} className="cm-f cm-local" />
          </g>
        );
      })}
      <Label x={28} y={34} show={span(t, 0.8, 1.8)} anchor="start">T · Time</Label>
      <Label x={572} y={584} show={span(t, 1.4, 2.4)} anchor="end">E · raw information</Label>
      <Label x={300} y={160} show={span(t, 5.6, 6.6)} strong>Big C</Label>
      <Label x={300} y={252} show={frame}>RF₀</Label>
      <Label x={300} y={448} show={locals}>local experience</Label>
    </g>
  );
}

/* ── 04 · Little c ──────────────────────────────────────────────────── */

const LITTLE_C: Point = [300, 236];
const LITTLE_C_TARGET: Point = [452, 404];

export function LittleC({ t }: MotifProps) {
  const cycles = [0, 1, 2].map((k) => 2 + k * 3.4);
  const done = cycles.filter((s) => t > s + 3.2).length;
  return (
    <g>
      <rect x={60} y={60} width={480} height={480} rx={40} className="cm-s cm-rf" strokeWidth={2} opacity={span(t, 0, 1)} />
      <rect x={246} y={276} width={108} height={160} rx={54} className="cm-s cm-hollow cm-muted" strokeWidth={1.6} opacity={span(t, 0.6, 1.6)} />
      {cycles.map((s, k) => {
        const exp = span(t, s, s + 1.1);
        const act = span(t, s + 1.1, s + 2.2);
        const ret = span(t, s + 2.2, s + 3.2);
        const fade = 1 - span(t, s + 3.2, s + 4.2) * 0.75;
        const from: Point = [100, 150 + k * 46];
        const via: Point = [180, 116 + k * 30];
        const actionPath: Point[] = [LITTLE_C, [300, 360], LITTLE_C_TARGET];
        const actionHead = act < 0.5 ? lerpPoint(actionPath[0], actionPath[1], act * 2) : lerpPoint(actionPath[1], actionPath[2], (act - 0.5) * 2);
        const actionTrail = act < 0.5 ? [actionPath[0], actionHead] : [actionPath[0], actionPath[1], actionHead];
        return (
          <g key={k} opacity={fade}>
            {exp > 0 && <path d={quadTo(from, via, LITTLE_C, exp)} className="cm-s cm-rf" strokeWidth={2} strokeDasharray="5 6" />}
            {exp > 0 && exp < 1 && <circle cx={quadAt(from, via, LITTLE_C, exp)[0]} cy={quadAt(from, via, LITTLE_C, exp)[1]} r={6} className="cm-f cm-rf" />}
            {act > 0 && <path d={pathOf(actionTrail)} className="cm-s cm-local" strokeWidth={2.6} />}
            {act > 0 && act < 1 && <circle cx={actionHead[0]} cy={actionHead[1]} r={6} className="cm-f cm-local" />}
            {ret > 0 && ret < 1 && (
              <circle cx={LITTLE_C_TARGET[0]} cy={LITTLE_C_TARGET[1]} r={lerp(8, 40, ret)} className="cm-s cm-rf" strokeWidth={1.6} opacity={1 - ret} />
            )}
            {ret > 0 && <path d={quadTo(LITTLE_C_TARGET, [450, 240], LITTLE_C, ret)} className="cm-s cm-rf" strokeWidth={1.8} />}
            {ret > 0 && ret < 1 && <circle cx={quadAt(LITTLE_C_TARGET, [450, 240], LITTLE_C, ret)[0]} cy={quadAt(LITTLE_C_TARGET, [450, 240], LITTLE_C, ret)[1]} r={6} className="cm-f cm-rf" />}
          </g>
        );
      })}
      <circle cx={LITTLE_C[0]} cy={LITTLE_C[1]} r={26} className="cm-s cm-hollow cm-local" strokeWidth={2 + done * 0.9} opacity={span(t, 0.4, 1.2)} />
      <circle cx={LITTLE_C[0]} cy={LITTLE_C[1]} r={10} className="cm-f cm-local" opacity={span(t, 0.4, 1.2)} />
      <Label x={92} y={100} show={span(t, 0.4, 1.4)} anchor="start">RF₀</Label>
      <Label x={300} y={466} show={span(t, 1.2, 2)}>body</Label>
      <Label x={88} y={292} show={span(t, 2.3, 3.1)} anchor="start">experience</Label>
      <Label x={338} y={232} show={span(t, 3.3, 4.1)} anchor="start">Intent</Label>
      <Label x={452} y={452} show={span(t, 4.6, 5.4)}>consequence</Label>
    </g>
  );
}

/* ── 05 · The Decoupling Principle ──────────────────────────────────── */

function renderingShape(cx: number, cy: number, r: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < 72; i++) {
    const th = (i / 72) * Math.PI * 2;
    const c = Math.abs(Math.cos(th));
    const s = Math.abs(Math.sin(th));
    const k = r / Math.pow(c ** 4 + s ** 4, 0.25);
    points.push([cx + k * Math.cos(th), cy + k * Math.sin(th)]);
  }
  return points;
}

export function Decoupling({ t }: MotifProps) {
  const apart = t < 6 ? 70 * span(t, 2.5, 6) : 70 - 44 * span(t, 8.5, 11);
  const ax = 300 - apart / 2;
  const rx = 300 + apart / 2;
  const enter = span(t, 0, 1.2);
  const threads = span(t, 3.5, 5);
  return (
    <g opacity={enter}>
      <path d={pathOf(renderingShape(rx, 300, 112), true)} className="cm-f cm-rf" opacity={0.12} />
      <path d={pathOf(renderingShape(rx, 300, 112), true)} className="cm-s cm-rf" strokeWidth={2} />
      <circle cx={ax} cy={300} r={120} className="cm-s cm-local" strokeWidth={2.4} />
      <circle cx={ax} cy={300} r={9} className="cm-f cm-local" />
      {[-140, -95, -50, -5, 40, 85, 130, 175].map((deg) => {
        const a = polar(ax, 300, 120, deg);
        const b = polar(rx, 300, 112, deg);
        return <line key={deg} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="cm-s cm-ink" strokeWidth={1.2} opacity={0.45 * threads} />;
      })}
      <Label x={ax - 28} y={160} show={span(t, 4, 5)} anchor="end">awareness</Label>
      <Label x={rx + 28} y={160} show={span(t, 4.4, 5.4)} anchor="start">bodily rendering</Label>
      <Label x={300} y={490} show={span(t, 10.5, 11.5)} strong>coupled, not identical</Label>
    </g>
  );
}

/* ── 06 · Reality Frame ─────────────────────────────────────────────── */

const FRAME_PARTICIPANT: Point = [190, 400];
const FRAME_BOUNCES: { start: number; hit: Point; bend: Point; wall: [Point, Point] }[] = [
  { start: 2.4, hit: [530, 230], bend: [470, 430], wall: [[530, 186], [530, 274]] },
  { start: 6.6, hit: [346, 70], bend: [160, 170], wall: [[302, 70], [390, 70]] },
];

export function RealityFrame({ t }: MotifProps) {
  const rules = span(t, 0.6, 1.8);
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => 70 + 46 * (i + 1)).map((v) => (
        <g key={v} opacity={0.55 * rules}>
          <line x1={v} y1={70} x2={v} y2={530} className="cm-s cm-line" strokeWidth={1} />
          <line x1={70} y1={v} x2={530} y2={v} className="cm-s cm-line" strokeWidth={1} />
        </g>
      ))}
      <rect x={70} y={70} width={460} height={460} rx={36} className="cm-s cm-rf" strokeWidth={2.4} opacity={span(t, 0, 1)} />
      {FRAME_BOUNCES.map(({ start: s, hit, bend, wall }, k) => {
        const out = span(t, s, s + 1.3);
        const flash = span(t, s + 1.2, s + 1.4) * (1 - span(t, s + 1.8, s + 2.8));
        const ret = span(t, s + 1.5, s + 2.8);
        const arrive = clamp01((t - (s + 2.8)) / 0.8);
        const fade = 1 - 0.65 * span(t, s + 3.4, s + 4.4);
        const head = lerpPoint(FRAME_PARTICIPANT, hit, out);
        return (
          <g key={k} opacity={fade}>
            {out > 0 && <line x1={FRAME_PARTICIPANT[0]} y1={FRAME_PARTICIPANT[1]} x2={head[0]} y2={head[1]} className="cm-s cm-local" strokeWidth={2.6} />}
            {out > 0 && out < 1 && <Arrowhead at={head} angle={angleOf(FRAME_PARTICIPANT, hit)} tone="cm-local" />}
            {flash > 0 && <line x1={wall[0][0]} y1={wall[0][1]} x2={wall[1][0]} y2={wall[1][1]} className="cm-s cm-rf" strokeWidth={6} opacity={flash} />}
            {ret > 0 && <path d={quadTo(hit, bend, FRAME_PARTICIPANT, ret)} className="cm-s cm-rf" strokeWidth={2} strokeDasharray="7 6" />}
            {ret > 0 && ret < 1 && <circle cx={quadAt(hit, bend, FRAME_PARTICIPANT, ret)[0]} cy={quadAt(hit, bend, FRAME_PARTICIPANT, ret)[1]} r={6} className="cm-f cm-rf" />}
            {arrive > 0 && arrive < 1 && (
              <circle cx={FRAME_PARTICIPANT[0]} cy={FRAME_PARTICIPANT[1]} r={lerp(16, 50, arrive)} className="cm-s cm-rf" strokeWidth={1.6} opacity={1 - arrive} />
            )}
          </g>
        );
      })}
      <circle cx={FRAME_PARTICIPANT[0]} cy={FRAME_PARTICIPANT[1]} r={20} className="cm-s cm-hollow cm-local" strokeWidth={2} opacity={span(t, 0.8, 1.6)} />
      <circle cx={FRAME_PARTICIPANT[0]} cy={FRAME_PARTICIPANT[1]} r={8} className="cm-f cm-local" opacity={span(t, 0.8, 1.6)} />
      <Label x={96} y={106} show={span(t, 1.2, 2.2)} anchor="start">rules</Label>
      <Label x={350} y={296} show={span(t, 2.8, 3.6)} anchor="end">action</Label>
      <Label x={448} y={420} show={span(t, 4.4, 5.2)} anchor="middle">consequence</Label>
    </g>
  );
}

/* ── 07 · Physical Sciences as Frame Derivations ────────────────────── */

const ORBIT_C: Point = [300, 200];
const orbitPhase = (time: number) => time * 0.9;
const plotX = (time: number) => 120 + (time - 2) * 50;
const plotY = (time: number) => 470 - 46 * Math.sin(orbitPhase(time));

export function WorldInvariants({ t }: MotifProps) {
  const enter = span(t, 0, 1.2);
  const body = [ORBIT_C[0] + 112 * Math.cos(orbitPhase(t)), ORBIT_C[1] + 46 * Math.sin(orbitPhase(t))];
  const samples: number[] = [];
  for (let s = 2; s <= Math.min(t, 9); s += 0.45) samples.push(s);
  const fit: Point[] = [];
  for (let s = 2; s <= 9.2; s += 0.1) fit.push([plotX(s), plotY(s)]);
  const derive = span(t, 10.8, 12.4);
  return (
    <g>
      <rect x={80} y={70} width={440} height={270} rx={28} className="cm-s cm-rf" strokeWidth={2.2} opacity={enter} />
      <ellipse cx={ORBIT_C[0]} cy={ORBIT_C[1]} rx={112} ry={46} className="cm-s cm-line" strokeWidth={1.4} strokeDasharray="4 6" opacity={enter} />
      <circle cx={ORBIT_C[0]} cy={ORBIT_C[1]} r={13} className="cm-f cm-rf" opacity={0.7 * enter} />
      <circle cx={body[0]} cy={body[1]} r={8} className="cm-f cm-local" opacity={enter} />
      <line x1={110} y1={470} x2={490} y2={470} className="cm-s cm-line" strokeWidth={1.2} opacity={span(t, 1.6, 2.4)} />
      {samples.map((s) => (
        <circle key={s.toFixed(2)} cx={plotX(s)} cy={plotY(s)} r={4.5} className="cm-f cm-local" opacity={span(t, s, s + 0.3)} />
      ))}
      <path d={pathOf(fit)} className="cm-s cm-local" strokeWidth={2.2} {...drawn(span(t, 9.2, 10.6))} />
      {derive > 0 && (
        <g opacity={derive}>
          <line x1={300} y1={346} x2={300} y2={lerp(352, 404, derive)} className="cm-s cm-big-c" strokeWidth={2} strokeDasharray="5 6" />
          <Arrowhead at={[300, lerp(352, 410, derive)]} angle={90} tone="cm-big-c" />
        </g>
      )}
      <Label x={104} y={104} show={enter} anchor="start">RF₀</Label>
      <Label x={300} y={312} show={span(t, 1.4, 2.4)}>regularity</Label>
      <Label x={106} y={398} show={span(t, 3, 4)} anchor="start">measured</Label>
      <Label x={494} y={556} show={span(t, 10.2, 11)} anchor="end">formalized</Label>
      <Label x={318} y={388} show={span(t, 11.4, 12.4)} anchor="start" strong>to be derived</Label>
    </g>
  );
}

/* ── 08 · Reality Stream ────────────────────────────────────────────── */

const STREAMS: { path: [Point, Point, Point, Point]; count: number; main: boolean }[] = [
  { path: [[80, 100], [220, 60], [250, 380], [400, 360]], count: 9, main: true },
  { path: [[520, 520], [540, 420], [470, 300], [480, 190]], count: 5, main: false },
  { path: [[80, 520], [120, 440], [170, 480], [210, 440]], count: 5, main: false },
];

export function RealityStream({ t }: MotifProps) {
  const flow = span(t, 1.4, 2.4);
  const main = STREAMS[0].path[3];
  return (
    <g>
      <rect x={60} y={60} width={480} height={480} rx={40} className="cm-s cm-rf" strokeWidth={2} opacity={span(t, 0, 1)} />
      {STREAMS.map(({ path: [a, b, c, d], count, main: isMain }, si) => (
        <g key={si} opacity={isMain ? 1 : 0.4}>
          <path d={`M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`} className="cm-s cm-line" strokeWidth={1.4} opacity={span(t, 0.6, 1.6)} />
          {Array.from({ length: count }, (_, k) => {
            const s = (((t - 1.4) / 4.2 + k / count) % 1 + 1) % 1;
            const [x, y] = cubicAt(a, b, c, d, s);
            const edge = Math.min(1, s / 0.08, (1 - s) / 0.08);
            const tone = k % 2 ? "cm-rf" : "cm-local";
            return k % 3 === 0 ? (
              <rect key={k} x={x - 6} y={y - 6} width={12} height={12} rx={3} className={`cm-f ${tone}`} opacity={flow * edge} />
            ) : (
              <circle key={k} cx={x} cy={y} r={6} className={`cm-f ${tone}`} opacity={flow * edge} />
            );
          })}
          <circle cx={d[0]} cy={d[1]} r={isMain ? 22 : 14} className="cm-s cm-hollow cm-local" strokeWidth={isMain ? 2.2 : 1.4} opacity={span(t, 0.6, 1.4)} />
          <circle cx={d[0]} cy={d[1]} r={isMain ? 9 : 5} className="cm-f cm-local" opacity={span(t, 0.6, 1.4)} />
        </g>
      ))}
      <Label x={256} y={214} show={span(t, 2.2, 3.2)} anchor="start">Reality Stream</Label>
      <Label x={main[0]} y={main[1] + 54} show={span(t, 3.6, 4.6)} strong>this participant</Label>
      <Label x={512} y={522} show={span(t, 0.4, 1.4)} anchor="end">RF₀</Label>
    </g>
  );
}

/* ── 09 · Intent ────────────────────────────────────────────────────── */

const INTENT_ORIGIN: Point = [120, 300];
const INTENT_BEND: Point = [300, 300];
const INTENT_ENDS: Point[] = Array.from({ length: 9 }, (_, k) => [520, 90 + k * 52.5]);
const INTENT_CHOSEN = 5;

export function Intent({ t }: MotifProps) {
  const fan = span(t, 1.6, 4.4);
  const bead = clamp01((t - 6) / 4);
  const committed = bead >= 0.5;
  const settle = span(t, 8, 9.4);
  return (
    <g>
      <line x1={312} y1={70} x2={312} y2={530} className="cm-s cm-ink" strokeWidth={1.4} strokeDasharray="2 8" opacity={0.6 * span(t, 4.4, 5.2)} />
      {INTENT_ENDS.map((end, k) => {
        if (k === INTENT_CHOSEN && t >= 6) return null;
        const shimmer = 0.32 + 0.12 * Math.sin(t * 2 + k);
        return (
          <path
            key={k}
            d={quadTo(INTENT_ORIGIN, INTENT_BEND, end, 1)}
            className="cm-s cm-local"
            strokeWidth={1.6}
            strokeDasharray="4 7"
            opacity={fan * lerp(shimmer, 0.12, settle)}
            {...(fan < 1 ? drawn(span(t, 1.6 + k * 0.2, 2.6 + k * 0.2)) : {})}
          />
        );
      })}
      {t >= 6 && (
        <>
          <path d={quadTo(INTENT_ORIGIN, INTENT_BEND, INTENT_ENDS[INTENT_CHOSEN], 1)} className="cm-s cm-local" strokeWidth={1.6} strokeDasharray="4 7" opacity={0.5 * (1 - settle)} />
          <path d={quadTo(INTENT_ORIGIN, INTENT_BEND, INTENT_ENDS[INTENT_CHOSEN], Math.min(bead, 0.5))} className="cm-s cm-local" strokeWidth={2} opacity={0.75} />
          {committed && (
            <path
              d={quadTo(INTENT_ORIGIN, INTENT_BEND, INTENT_ENDS[INTENT_CHOSEN], bead)}
              className="cm-s cm-local"
              strokeWidth={4.5}
            />
          )}
          {bead < 1 ? (
            <circle cx={quadAt(INTENT_ORIGIN, INTENT_BEND, INTENT_ENDS[INTENT_CHOSEN], bead)[0]} cy={quadAt(INTENT_ORIGIN, INTENT_BEND, INTENT_ENDS[INTENT_CHOSEN], bead)[1]} r={7} className="cm-f cm-local" />
          ) : (
            <Arrowhead at={INTENT_ENDS[INTENT_CHOSEN]} angle={angleOf(quadAt(INTENT_ORIGIN, INTENT_BEND, INTENT_ENDS[INTENT_CHOSEN], 0.96), INTENT_ENDS[INTENT_CHOSEN])} tone="cm-local" />
          )}
        </>
      )}
      <circle cx={INTENT_ORIGIN[0]} cy={INTENT_ORIGIN[1]} r={22} className="cm-s cm-hollow cm-local" strokeWidth={2} opacity={span(t, 0, 1)} />
      <circle cx={INTENT_ORIGIN[0]} cy={INTENT_ORIGIN[1]} r={9} className="cm-f cm-local" opacity={span(t, 0, 1)} />
      <Label x={420} y={64} show={span(t, 3, 4)}>possibilities</Label>
      <Label x={312} y={556} show={span(t, 4.6, 5.4)}>threshold</Label>
      <Label x={520} y={INTENT_ENDS[INTENT_CHOSEN][1] + 40} show={span(t, 10, 10.8)} anchor="end" strong>Intent</Label>
    </g>
  );
}

/* ── 10 · The Experience Loop ───────────────────────────────────────── */

const LOOP_R = 150;
const LOOP_NODES = [
  { angle: -90, name: "Reality Stream", tone: "cm-rf", label: [300, 100] as Point },
  { angle: 0, name: "Painting", tone: "cm-local", label: [496, 307] as Point, anchor: "start" as const },
  { angle: 90, name: "Intent", tone: "cm-local", label: [300, 514] as Point },
  { angle: 180, name: "Canvas", tone: "cm-big-c", label: [104, 307] as Point, anchor: "end" as const },
];

export function ExperienceLoop({ t }: MotifProps) {
  const pulseAngle = -90 + ((t - 4.2) / 6) * 360;
  const pulsing = span(t, 4, 4.6);
  const pulse = polar(300, 300, LOOP_R, pulseAngle);
  return (
    <g>
      {LOOP_NODES.map((node, k) => {
        const next = LOOP_NODES[(k + 1) % 4];
        const a0 = node.angle + 16;
        const a1 = (next.angle <= node.angle ? next.angle + 360 : next.angle) - 16;
        const p0 = polar(300, 300, LOOP_R, a0);
        const p1 = polar(300, 300, LOOP_R, a1);
        const u = span(t, 1 + k * 0.7, 1.6 + k * 0.7);
        return (
          <g key={node.name}>
            <path d={`M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${LOOP_R} ${LOOP_R} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`} className="cm-s cm-line" strokeWidth={2} {...drawn(u)} />
            {u >= 1 && <Arrowhead at={p1} angle={a1 + 90} tone="cm-muted" opacity={0.8} />}
          </g>
        );
      })}
      {pulsing > 0 && (
        <>
          <path
            d={(() => {
              const pts: Point[] = [];
              for (let a = pulseAngle - 70; a <= pulseAngle; a += 4) pts.push(polar(300, 300, LOOP_R, a));
              return pathOf(pts);
            })()}
            className="cm-s cm-local"
            strokeWidth={4}
            opacity={0.55 * pulsing}
          />
          <circle cx={pulse[0]} cy={pulse[1]} r={8} className="cm-f cm-local" opacity={pulsing} />
        </>
      )}
      {LOOP_NODES.map((node, k) => {
        const [x, y] = polar(300, 300, LOOP_R, node.angle);
        const d = Math.abs(((pulseAngle - node.angle) % 360 + 540) % 360 - 180);
        const glow = pulsing * Math.exp(-((d / 22) ** 2));
        const show = span(t, 0.6 + k * 0.7, 1.2 + k * 0.7);
        return (
          <g key={node.name} opacity={show}>
            <circle cx={x} cy={y} r={34} className="cm-ground" />
            <circle cx={x} cy={y} r={34} className={`cm-f ${node.tone}`} opacity={0.08 + 0.3 * glow} />
            <circle cx={x} cy={y} r={34} className={`cm-s ${node.tone}`} strokeWidth={2 + 2 * glow} />
            <Label x={node.label[0]} y={node.label[1]} show={show} anchor={"anchor" in node ? node.anchor : "middle"} strong>{node.name}</Label>
          </g>
        );
      })}
      <Label x={434} y={168} show={span(t, 1.6, 2.4)} anchor="start">interpreted</Label>
      <Label x={166} y={440} show={span(t, 3, 3.8)} anchor="end">consequence</Label>
    </g>
  );
}

/* ── 11 · Canvas ────────────────────────────────────────────────────── */

const CANVAS_TONES = ["cm-local", "cm-rf", "cm-big-c"];
const CANVAS_STROKES = Array.from({ length: 8 }, (_, k) => {
  const y = 200 + seeded(k + 40) * 200;
  const x0 = 140 + seeded(k + 60) * 60;
  const x1 = 460 - seeded(k + 80) * 60;
  const lift = (seeded(k + 100) - 0.5) * 140;
  return {
    d: `M${x0.toFixed(1)} ${y.toFixed(1)} C${(x0 + 90).toFixed(1)} ${(y + lift).toFixed(1)} ${(x1 - 90).toFixed(1)} ${(y - lift).toFixed(1)} ${x1.toFixed(1)} ${(y + lift * 0.3).toFixed(1)}`,
    at: 1.6 + k * 1.15,
    width: 3 + seeded(k + 120) * 5,
    drop: [lerp(x0, x1, 0.15), y] as Point,
    tone: CANVAS_TONES[k % 3],
  };
});

export function Canvas({ t }: MotifProps) {
  return (
    <g>
      <rect x={110} y={140} width={380} height={330} rx={26} className="cm-s cm-hollow cm-line" strokeWidth={2} opacity={span(t, 0, 1)} />
      {CANVAS_STROKES.map((stroke, k) => {
        const fall = clamp01((t - (stroke.at - 0.7)) / 0.7);
        const paint = span(t, stroke.at, stroke.at + 0.9);
        const age = Math.max(0, t - stroke.at - 0.9);
        return (
          <g key={k}>
            {fall > 0 && fall < 1 && <circle cx={stroke.drop[0]} cy={lerp(46, stroke.drop[1], fall)} r={6} className={`cm-f ${stroke.tone}`} />}
            {paint > 0 && (
              <path d={stroke.d} className={`cm-s ${stroke.tone}`} strokeWidth={stroke.width} opacity={0.5 + 0.4 * Math.exp(-age / 3)} {...drawn(paint)} />
            )}
          </g>
        );
      })}
      <Label x={132} y={174} show={span(t, 0.6, 1.6)} anchor="start" strong>Canvas</Label>
      <Label x={490} y={70} show={span(t, 1.2, 2)} anchor="end">experience</Label>
      <Label x={490} y={508} show={span(t, 8, 9)} anchor="end">carried forward</Label>
    </g>
  );
}

/* ── 12 · Painting ──────────────────────────────────────────────────── */

const PAINTING_STROKES = Array.from({ length: 7 }, (_, k) => ({
  d: `M226 ${140 + k * 53} C266 ${110 + k * 53} 334 ${170 + k * 53} 374 ${130 + k * 53}`,
  tone: CANVAS_TONES[k % 3],
  width: 6 + seeded(k + 30) * 5,
}));

function Moment({ x, y, shape, interpreted, opacity }: { x: number; y: number; shape: "circle" | "square"; interpreted: number; opacity: number }) {
  const outline = (className: string, extra: number) =>
    shape === "circle" ? (
      <circle cx={x} cy={y} r={26} className={className} strokeWidth={2.2} opacity={extra} />
    ) : (
      <rect x={x - 24} y={y - 24} width={48} height={48} rx={8} className={className} strokeWidth={2.2} opacity={extra} />
    );
  return (
    <g opacity={opacity}>
      {outline("cm-s cm-hollow cm-muted", 1 - interpreted)}
      {outline("cm-f cm-local", 0.22 * interpreted)}
      {outline("cm-s cm-local", interpreted)}
      <path d={`M${x - 14} ${y - 4} Q${x} ${y - 14} ${x + 14} ${y - 2} M${x - 12} ${y + 9} Q${x + 2} ${y + 1} ${x + 13} ${y + 10}`} className="cm-s cm-rf" strokeWidth={2.4} opacity={interpreted} />
    </g>
  );
}

export function Painting({ t }: MotifProps) {
  const clipId = `concept-lens-${useId().replace(/[^\w-]/g, "")}`;
  const lens = span(t, 0.6, 2);
  const moments = [
    { y: 220, shape: "circle" as const, appear: 2.4, start: 3.2, end: 6.4 },
    { y: 380, shape: "square" as const, appear: 5.8, start: 6.8, end: 10 },
  ];
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={300} cy={300} rx={70} ry={180} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {PAINTING_STROKES.map((stroke, k) => (
          <path key={k} d={stroke.d} className={`cm-s ${stroke.tone}`} strokeWidth={stroke.width} opacity={0.55} {...drawn(span(t, 0.8 + k * 0.18, 1.6 + k * 0.18))} />
        ))}
      </g>
      <ellipse cx={300} cy={300} rx={70} ry={180} className="cm-s cm-local" strokeWidth={2} opacity={lens} />
      {moments.map((m, k) => {
        const x = lerp(110, 490, span(t, m.start, m.end));
        return <Moment key={k} x={x} y={m.y} shape={m.shape} interpreted={clamp01((x - 250) / 100)} opacity={span(t, m.appear, m.appear + 0.6)} />;
      })}
      <Label x={300} y={98} show={span(t, 1.4, 2.2)} strong>Painting</Label>
      <Label x={110} y={176} show={span(t, 2.6, 3.4)}>present moment</Label>
      <Label x={490} y={448} show={span(t, 5.6, 6.4)}>interpretation</Label>
    </g>
  );
}

/* ── 13 · Character ─────────────────────────────────────────────────── */

const CHARACTER_TRIALS = Array.from({ length: 8 }, (_, k) => ({
  at: 1.2 + k * 1.1,
  dev: (seeded(k + 7) - 0.5) * 300 * (1 - k / 8.5),
}));

export function Character({ t }: MotifProps) {
  const origin: Point = [100, 300];
  const groove = span(t, 10, 11.4);
  return (
    <g>
      {CHARACTER_TRIALS.map((trial, k) => {
        const end: Point = [500, 300 + trial.dev * 0.35];
        const age = Math.max(0, t - trial.at - 0.9);
        return (
          <path
            key={k}
            d={quadTo(origin, [300, 300 + trial.dev], end, 1)}
            className="cm-s cm-local"
            strokeWidth={2}
            opacity={(0.22 + 0.5 * Math.exp(-age / 1.2)) * (1 - 0.5 * groove)}
            {...drawn(span(t, trial.at, trial.at + 0.9))}
          />
        );
      })}
      <path d="M100 300 Q300 300 500 300" className="cm-s cm-local" strokeWidth={7} {...drawn(groove)} />
      <circle cx={origin[0]} cy={origin[1]} r={22} className="cm-s cm-hollow cm-local" strokeWidth={2} opacity={span(t, 0, 1)} />
      <circle cx={origin[0]} cy={origin[1]} r={9} className="cm-f cm-local" opacity={span(t, 0, 1)} />
      <circle cx={500} cy={300} r={12} className="cm-f cm-local" opacity={span(t, 11, 11.6)} />
      <Label x={300} y={96} show={span(t, 2.4, 3.4)}>interpretation · commitment · behavior</Label>
      <Label x={300} y={480} show={span(t, 3.6, 4.6)}>repeated</Label>
      <Label x={500} y={266} show={span(t, 11, 11.8)} strong>Character</Label>
    </g>
  );
}

/* ── 14–15 · Fear and Love share one fan of responses ───────────────── */

const FAN_ORIGIN: Point = [300, 420];
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
            <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="cm-s cm-local" strokeWidth={2} opacity={lerp(0.12, 0.85, open)} />
            <circle cx={to[0]} cy={to[1]} r={lerp(3, 7, open)} className="cm-f cm-local" opacity={lerp(0.2, 1, open)} />
          </g>
        );
      })}
      {fear > 0 && (
        <g opacity={fear}>
          <path d={wedge(-180, -90 - aperture)} className="cm-f cm-fear" opacity={0.14} />
          <path d={wedge(-90 + aperture, 0)} className="cm-f cm-fear" opacity={0.14} />
          <line x1={FAN_ORIGIN[0]} y1={FAN_ORIGIN[1]} x2={leftEdge[0]} y2={leftEdge[1]} className="cm-s cm-fear" strokeWidth={2.2} />
          <line x1={FAN_ORIGIN[0]} y1={FAN_ORIGIN[1]} x2={rightEdge[0]} y2={rightEdge[1]} className="cm-s cm-fear" strokeWidth={2.2} />
        </g>
      )}
      <circle cx={FAN_ORIGIN[0]} cy={FAN_ORIGIN[1]} r={24} className="cm-s cm-hollow cm-local" strokeWidth={2} />
      <circle cx={FAN_ORIGIN[0]} cy={FAN_ORIGIN[1]} r={10} className="cm-f cm-local" />
    </g>
  );
}

export function FearGating({ t }: MotifProps) {
  const close = span(t, 4, 9);
  return (
    <g>
      <ResponseFan t={t} aperture={lerp(84, 22, close)} fear={span(t, 3, 4.5)} />
      <Label x={300} y={140} show={span(t, 1.6, 2.6)}>responses that feel available</Label>
      <Label x={128} y={360} show={span(t, 5, 6)} strong>Fear governs</Label>
    </g>
  );
}

export function Love({ t }: MotifProps) {
  const release = span(t, 3.5, 8.5);
  return (
    <g>
      <ResponseFan t={t} aperture={lerp(22, 84, release)} fear={1 - release} />
      <Label x={128} y={360} show={span(t, 0.6, 1.4) * (1 - release)}>Fear</Label>
      <Label x={300} y={140} show={span(t, 8.6, 9.6)}>responses that feel available</Label>
      <Label x={300} y={490} show={span(t, 9, 10)} strong>Love</Label>
      <Label x={300} y={522} show={span(t, 9.4, 10.4)}>Fear no longer governs</Label>
    </g>
  );
}

/* ── 16 · Conscious Authorship ──────────────────────────────────────── */

const AUTHOR_CHOICES: Point[] = [[490, 230], [490, 300], [490, 370]];
const AUTHOR_CHOSEN = 2;

export function ConsciousAuthorship({ t }: MotifProps) {
  const see = span(t, 1, 2.4);
  const intentX = lerp(286, 392, span(t, 4.4, 7.8));
  const choose = span(t, 8, 8.6);
  const travel = span(t, 9.6, 10.8);
  const reinforce = span(t, 10.8, 11.8);
  const chosen = AUTHOR_CHOICES[AUTHOR_CHOSEN];
  const bead = lerpPoint([intentX + 16, 300], chosen, travel);
  return (
    <g>
      <circle cx={80} cy={300} r={16} className="cm-s cm-hollow cm-muted" strokeWidth={2} opacity={span(t, 0, 0.8)} />
      <line x1={98} y1={300} x2={162} y2={300} className="cm-s cm-line" strokeWidth={1.6} opacity={span(t, 0.4, 1)} />
      <ellipse cx={190} cy={300} rx={26} ry={70} className="cm-f cm-local" opacity={0.08 + 0.14 * see} />
      <ellipse cx={190} cy={300} rx={26} ry={70} className="cm-s cm-local" strokeWidth={2 + 1.6 * see} opacity={span(t, 0.2, 1)} />
      <line x1={218} y1={300} x2={intentX - 18} y2={300} className="cm-s cm-line" strokeWidth={1.6} strokeDasharray="3 6" opacity={span(t, 0.6, 1.2)} />
      <path
        d={`M226 262 L226 250 L${(intentX - 18).toFixed(1)} 250 L${(intentX - 18).toFixed(1)} 262`}
        className="cm-s cm-ink"
        strokeWidth={1.6}
        opacity={span(t, 4, 4.8)}
      />
      <rect x={474} y={190} width={60} height={220} rx={12} className="cm-s cm-hollow cm-big-c" strokeWidth={2} opacity={span(t, 0.4, 1.2)} />
      {[214, 262, 330].map((y, k) => (
        <path key={y} d={`M482 ${y} Q504 ${y - 10} 526 ${y + 4}`} className={`cm-s ${CANVAS_TONES[k]}`} strokeWidth={4} opacity={0.35 * span(t, 0.6, 1.4)} />
      ))}
      {AUTHOR_CHOICES.map((end, k) => (
        <line
          key={k}
          x1={intentX + 16}
          y1={300}
          x2={end[0] - 16}
          y2={end[1]}
          className="cm-s cm-local"
          strokeWidth={k === AUTHOR_CHOSEN ? 2.6 : 1.6}
          strokeDasharray={k === AUTHOR_CHOSEN && travel > 0 ? undefined : "4 6"}
          opacity={choose * (k === AUTHOR_CHOSEN ? 1 : 1 - 0.75 * span(t, 9.2, 10))}
        />
      ))}
      {travel > 0 && travel < 1 && <circle cx={bead[0]} cy={bead[1]} r={6} className="cm-f cm-local" />}
      <path d="M482 384 Q504 372 526 388" className="cm-s cm-local" strokeWidth={5} {...drawn(reinforce)} />
      <circle cx={intentX} cy={300} r={16} className={choose > 0 ? "cm-f cm-local" : "cm-s cm-hollow cm-local"} strokeWidth={2} opacity={span(t, 0.6, 1.2)} />
      <Label x={190} y={400} show={span(t, 1.2, 2)}>1 · see the Painting</Label>
      <Label x={(226 + intentX - 18) / 2} y={232} show={span(t, 4.4, 5.2)}>2 · widen the pause</Label>
      <Label x={intentX} y={346} show={span(t, 1.6, 2.4)}>Intent</Label>
      <Label x={420} y={160} show={span(t, 8.2, 9)}>3 · choose</Label>
      <Label x={504} y={446} show={span(t, 0.8, 1.6)}>Canvas</Label>
    </g>
  );
}

/* ── 17 · Limits and Unpaid Debts ───────────────────────────────────── */

const LEVELS = [
  { name: "Observed", dash: undefined },
  { name: "Modeled", dash: "10 6" },
  { name: "Hypothesized", dash: "3 6" },
  { name: "Speculative", dash: "1 8" },
];
const CLAIM_BANDS = [0, 1, 0, 2, 1, 3, 1, 2, 0, 2, 3, 1, 2, 3];
const bandTop = (i: number) => 110 + i * 95;

export function LimitsAndDebts({ t }: MotifProps) {
  const scan = span(t, 9.5, 12.5);
  return (
    <g>
      {LEVELS.map((level, i) => {
        const show = span(t, 0.6 + i * 0.3, 1.2 + i * 0.3);
        const top = bandTop(i);
        return (
          <g key={level.name} opacity={show}>
            <path d={`M560 ${top} L190 ${top} L190 ${top + 80} L560 ${top + 80}`} className="cm-s cm-line" strokeWidth={1.8} strokeDasharray={level.dash} />
            <Label x={176} y={top + 46} show={show} anchor="end" strong={i === 0}>{level.name}</Label>
          </g>
        );
      })}
      {CLAIM_BANDS.map((band, k) => {
        const at = 2 + k * 0.45;
        if (t < at) return null;
        const y = lerp(40, bandTop(band) + 40, span(t, at, at + 0.6));
        const x = 222 + ((k * 0.618 + 0.13) % 1) * 310;
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r={8}
            className={band < 2 ? "cm-f cm-local" : "cm-s cm-hollow cm-local"}
            strokeWidth={2}
            strokeDasharray={band === 3 ? "2 4" : undefined}
            opacity={span(t, at, at + 0.3) * (band === 0 ? 1 : band === 1 ? 0.8 : 0.9)}
          />
        );
      })}
      {scan > 0 && scan < 1 && (
        <line x1={lerp(190, 590, scan)} y1={96} x2={lerp(190, 590, scan)} y2={494} className="cm-s cm-ink" strokeWidth={1.5} opacity={0.6} />
      )}
      <Label x={375} y={540} show={span(t, 10.5, 11.5)} strong>open to criticism</Label>
    </g>
  );
}
