import { useId, type CSSProperties } from "react";

import { HeroArchitecture } from "../core/home/HeroArchitecture";
import { membranePath } from "../core/home/architectureGeometry";
import "../core/home/home.css";
import { TypedText } from "./ConceptFrame";
import { DARK_TRAILER_LINES, TRAILER_HEARTBEATS_DESIGN, darkTrailerShot, trailerDrawingTime } from "./darkFilmRevision";

/* ── Film-time helpers: every motion is a pure function of the film second (L1). ── */
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const between = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));
const smooth = (t: number, start: number, end: number) => {
  const value = between(t, start, end);
  return value * value * (3 - 2 * value);
};
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;
const drawn = (progress: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - progress });
const hash = (n: number) => {
  const value = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const JADE = "#8ad6b9";
const INK = "#f2f0e8";
const CLAY = "#d4876d";
const GOLD = "#e6bc78";

type Point = readonly [number, number];
type Cubic = readonly [Point, Point, Point, Point];

/* ── World layout (viewBox 1600 × 900) ── */
const FIG_X = 640;
const FIG_Y = 450;
const FIG = 1.55;
/** Where a figure's chest, head-top, and right hand sit, relative to its centre. */
const CHEST_DY = -36 * FIG;
const HEAD_TOP_DY = -150 * FIG;
const HAND: Point = [49 * FIG, 63 * FIG];
const CHEST: Point = [FIG_X, FIG_Y + CHEST_DY];
const SPHERE: Point = [1010, 420];
const SPHERE_R = 220;
const BOX = { x: FIG_X - 120, y: 190, w: 240, h: 540 } as const;
const LATTICE = { dx: 330, dy: 640 } as const;
const INTENT: Cubic = [[790, 392], [748, 316], [690, 318], [660, 378]];
const RETURN: Cubic = [[660, 448], [690, 512], [750, 520], [790, 452]];

/* ── The drawing's own clock (seconds), before it is stretched to the words ── */
const NUDGE = 42;
const PAUSE = 49;
const ARCH = 57;
const TITLE = 69;
const END = 78;

/** The camera: where it looks and how close, eased between held positions. */
const CAMERA: readonly (readonly [number, number, number, number])[] = [
  [0, FIG_X, 470, 1.36],
  [15, FIG_X, 455, 1.52],
  [20.5, 825, 440, 0.95],
  [23, 825, 440, 0.95],
  [25, FIG_X, 450, 1.25],
  [32, FIG_X, 450, 1.25],
  [35.5, FIG_X, 450, 0.42],
  [PAUSE + 0.4, FIG_X, 450, 0.42],
  [PAUSE + 4.6, FIG_X, 380, 1.5],
  [ARCH, FIG_X, 370, 1.9],
];

function cameraAt(t: number) {
  const index = CAMERA.findIndex(([at]) => at > t);
  if (index <= 0) {
    const [, x, y, s] = index === 0 ? CAMERA[0] : CAMERA.at(-1)!;
    return { x, y, s };
  }
  const [a, ax, ay, as] = CAMERA[index - 1];
  const [b, bx, by, bs] = CAMERA[index];
  const u = smooth(t, a, b);
  return { x: lerp(ax, bx, u), y: lerp(ay, by, u), s: Math.exp(lerp(Math.log(as), Math.log(bs), u)) };
}

const cubicAt = ([p0, p1, p2, p3]: Cubic, u: number): Point => {
  const v = 1 - u;
  return [
    v ** 3 * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u ** 3 * p3[0],
    v ** 3 * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u ** 3 * p3[1],
  ];
};
const cubicPath = ([p0, p1, p2, p3]: Cubic) => `M${p0.join(" ")}C${p1.join(" ")} ${p2.join(" ")} ${p3.join(" ")}`;

const BODY_PATHS = [
  "M-26 -119C-26 -157 26 -157 26 -119C26 -102 18 -90 0 -90C-18 -90 -26 -102 -26 -119Z",
  "M-11 -91V-72M11 -91V-72",
  "M-11 -72C-39 -70 -54 -57 -57 -32L-62 15L-58 54Q-57 63 -49 63Q-41 62 -42 53L-43 17L-36 -29",
  "M11 -72C39 -70 54 -57 57 -32L62 15L58 54Q57 63 49 63Q41 62 42 53L43 17L36 -29",
  "M-36 -31C-34 1 -32 29 -26 60L-29 111L-35 164Q-35 171 -28 171H-15Q-9 171 -9 165L-5 113L0 73L5 113L9 165Q9 171 15 171H28Q35 171 35 164L29 111L26 60C32 29 34 1 36 -31",
] as const;

/** A recognizable human outline. `px` is its line width on screen at the current camera. */
function Figure({ x, y, px, cameraScale, progress = 1, opacity = 1, shrink = 0 }: {
  x: number; y: number; px: number; cameraScale: number; progress?: number; opacity?: number; shrink?: number;
}) {
  const scale = FIG * (1 - 0.12 * shrink);
  const width = px / (cameraScale * scale);
  // Shrinking settles toward the feet, so a diminished figure still stands in its box.
  const lift = 171 * (FIG - scale);
  return (
    <g transform={`translate(${x} ${y + lift}) scale(${scale})`} opacity={opacity} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {BODY_PATHS.map((d) => (
        <path key={d} d={d} {...(progress < 1 ? drawn(progress) : {})} />
      ))}
    </g>
  );
}

function Arrow({ from, to, px, s, color, opacity }: { from: Point; to: Point; px: number; s: number; color: string; opacity: number }) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head = 16;
  const left: Point = [to[0] - head * Math.cos(angle - 0.45), to[1] - head * Math.sin(angle - 0.45)];
  const right: Point = [to[0] - head * Math.cos(angle + 0.45), to[1] - head * Math.sin(angle + 0.45)];
  return (
    <g opacity={opacity} fill="none" stroke={color} strokeWidth={px / s} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${from.join(" ")}L${to.join(" ")}`} />
      <path d={`M${left.join(" ")}L${to.join(" ")}L${right.join(" ")}`} />
    </g>
  );
}

/**
 * A box and its measuring grid: the objective lens closed around one figure. The nudge
 * opens a jade gap in its lid; devolving thickens its walls and closes the gap again.
 */
function MeasuringBox({ cx, cy, scale, opacity, loosen, px, s, gap = 0, weight = 0 }: {
  cx: number; cy: number; scale: number; opacity: number; loosen: number; px: number; s: number; gap?: number; weight?: number;
}) {
  if (opacity <= 0.001) return null;
  const w = BOX.w * scale;
  const h = BOX.h * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const columns = Array.from({ length: 5 }, (_, i) => x + ((i + 1) * w) / 6);
  const rows = Array.from({ length: 12 }, (_, i) => y + ((i + 1) * h) / 13);
  const dash = loosen > 0 ? `${(14 * (1 - loosen) + 2).toFixed(1)} ${(4 + 18 * loosen).toFixed(1)}` : undefined;
  const half = 34 * gap;
  return (
    <g opacity={opacity}>
      <g stroke={CLAY} strokeWidth={(px * (0.45 + 0.4 * weight)) / s} opacity={(0.22 + 0.2 * weight) * (1 - loosen)}>
        {columns.map((cxLine) => <line key={`c${cxLine}`} x1={cxLine} y1={y} x2={cxLine} y2={y + h} />)}
        {rows.map((ryLine) => <line key={`r${ryLine}`} x1={x} y1={ryLine} x2={x + w} y2={ryLine} />)}
      </g>
      <path
        d={`M${cx - half} ${y}H${x + 6}Q${x} ${y} ${x} ${y + 6}V${y + h - 6}Q${x} ${y + h} ${x + 6} ${y + h}H${x + w - 6}Q${x + w} ${y + h} ${x + w} ${y + h - 6}V${y + 6}Q${x + w} ${y} ${x + w - 6} ${y}H${cx + half}`}
        fill="none" stroke={CLAY} strokeWidth={(px * (1 + 1.3 * weight)) / s} strokeDasharray={dash}
      />
      {gap > 0.01 && (
        <g opacity={gap}>
          <path d={`M${cx - half} ${y}H${cx + half}`} stroke={JADE} strokeWidth={(px * 1.6) / s} strokeLinecap="round" />
          <path d={`M${cx - 12} ${y - 14}L${cx} ${y - 28}L${cx + 12} ${y - 14}`} fill="none" stroke={JADE} strokeWidth={(px * 1.4) / s} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

/** Two rings of pain on their own phase; they keep nudging until the film pauses. */
function PainRings({ at, phase, t, opacity, s }: { at: Point; phase: number; t: number; opacity: number; s: number }) {
  if (opacity <= 0.001) return null;
  const frozen = Math.min(t, PAUSE + 0.2);
  return (
    <g fill="none" stroke={CLAY}>
      {[0, 0.5].map((offset) => {
        const raw = frozen * 0.6 + phase + offset;
        const frac = raw - Math.floor(raw);
        return (
          <g key={offset}>
            <circle cx={at[0]} cy={at[1]} r={46 + 110 * frac} strokeWidth={3 / s} opacity={0.95 * (1 - frac) * opacity} />
            {offset === 0 && <circle cx={at[0]} cy={at[1]} r={10} fill={CLAY} stroke="none" opacity={0.55 * opacity} />}
          </g>
        );
      })}
    </g>
  );
}

function heartbeat(t: number) {
  let glow = 0;
  for (const beat of TRAILER_HEARTBEATS_DESIGN) {
    if (t >= beat) glow = Math.max(glow, Math.exp(-(t - beat) * 4.5));
    if (t >= beat + 0.3) glow = Math.max(glow, 0.6 * Math.exp(-(t - beat - 0.3) * 5));
  }
  return glow;
}

/** The five senses, each a stream from its own direction, named at the edge of the frame. */
const SENSES = [
  { name: "SIGHT", angle: -145, label: [300, 222] as Point, color: GOLD },
  { name: "SMELL", angle: -90, label: [640, 186] as Point, color: INK },
  { name: "SOUND", angle: -35, label: [980, 222] as Point, color: JADE },
  { name: "TOUCH", angle: 170, label: [190, 476] as Point, color: INK },
  { name: "TASTE", angle: 10, label: [1090, 476] as Point, color: GOLD },
] as const;

const PARTICLES = Array.from({ length: 170 }, (_, k) => {
  const sense = SENSES[k % SENSES.length];
  const angle = ((sense.angle + (hash(k + 1.7) - 0.5) * 26) * Math.PI) / 180;
  const radius = 640 + 140 * hash(k + 2.3);
  return {
    spawn: 7.2 + 7.0 * hash(k + 0.1),
    life: 1.5 + 1.1 * hash(k + 0.6),
    from: [FIG_X + Math.cos(angle) * radius, 420 + Math.sin(angle) * radius] as Point,
    to: [FIG_X + (hash(k + 3.1) - 0.5) * 120, 420 + (hash(k + 4.4) - 0.5) * 380] as Point,
    color: sense.color,
    size: 3.2 + 1.2 * hash(k + 5.2),
  };
});

const LATTICE_COPIES = Array.from({ length: 11 }, (_, i) => i - 5).flatMap((i) =>
  [-1, 0, 1].filter((j) => i !== 0 || j !== 0).map((j) => ({
    i, j, x: FIG_X + LATTICE.dx * i, y: FIG_Y + LATTICE.dy * j, delay: 0.28 * (Math.abs(i) + Math.abs(j)), phase: hash(i * 7.1 + j * 3.3),
  })),
);

/**
 * The strings: each figure is tugged from the hand of the figure in the box above it,
 * who is boxed too; the top row's strings rise out of frame.
 */
function Strings({ t, s, opacity }: { t: number; s: number; opacity: number }) {
  if (opacity <= 0.001) return null;
  return (
    <g fill="none" stroke={CLAY} strokeWidth={1.2 / s} strokeLinecap="round" opacity={opacity * 0.75}>
      {Array.from({ length: 11 }, (_, i) => i - 5).flatMap((i) =>
        [-1, 0, 1].map((j) => {
          const x = FIG_X + LATTICE.dx * i;
          const y = FIG_Y + LATTICE.dy * j;
          const tug = Math.sin(Math.min(t, PAUSE + 0.2) * 1.7 + hash(i * 3.7 + j)) * 10;
          const head: Point = [x, y + HEAD_TOP_DY - 6];
          const from: Point = j === -1 ? [x + 40, y - LATTICE.dy] : [x + HAND[0], y - LATTICE.dy + HAND[1]];
          return <path key={`${i}:${j}`} d={`M${from.join(" ")}Q${(from[0] + head[0]) / 2 + tug} ${(from[1] + head[1]) / 2} ${head.join(" ")}`} />;
        }),
      )}
    </g>
  );
}

/** Shots 1–7: one continuous drawing seen through a moving camera. */
function TrailerDrawing({ t }: { t: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const cam = cameraAt(t);
  const s = cam.s;
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`;

  const drawProgress = smooth(t, 0.4, 3.6);
  const beat = heartbeat(t) * (1 - smooth(t, 14.5, 16));
  const immersion = smooth(t, 7.5, 14.5) * (1 - smooth(t, 23.2, 25));
  const sphere = smooth(t, 16.2, 18.4) * (1 - 0.88 * smooth(t, 23.2, 25.4)) * (1 - smooth(t, 31, 33));
  const coupling = smooth(t, 17, 19) * (1 - smooth(t, 23.2, 24.6));
  const snap = smooth(t, 24.1, 24.75);
  const boxShown = between(t, 24.1, 24.35);
  const boxScale = lerp(1.7, 1, snap) + 0.035 * Math.sin(Math.PI * between(t, 24.75, 25.3));
  const push = smooth(t, 25.2, 27.2) * (1 - smooth(t, 31.4, 32.6));
  const lens = smooth(t, 25.6, 26.4) * (1 - smooth(t, 31.2, 32.2));
  const pain = smooth(t, 33.2, 34.2);
  const strings = smooth(t, 37.8, 39.2) * (1 - smooth(t, PAUSE + 0.4, PAUSE + 2));
  // The nudge opens a way out; ignored, it closes and everyone diminishes.
  const nudge = smooth(t, NUDGE + 0.4, NUDGE + 1.4);
  const devolve = smooth(t, NUDGE + 4, NUDGE + 6.6);
  const gap = nudge * (1 - devolve);
  const calm = smooth(t, PAUSE + 0.4, PAUSE + 2);
  const noticed = smooth(t, PAUSE + 2, PAUSE + 3);
  const loosen = smooth(t, PAUSE + 3, PAUSE + 5.4);
  const opening = smooth(t, PAUSE + 5.5, ARCH);
  const mainPain = pain * (1 - smooth(t, PAUSE + 1.4, PAUSE + 2.4));

  return (
    <div className="dark-trailer-stage" style={{ opacity: 1 - smooth(t, ARCH - 0.9, ARCH + 0.1) }}>
    <svg className="dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-jade`}>
          <stop offset="0" stopColor={JADE} stopOpacity=".55" />
          <stop offset=".45" stopColor={JADE} stopOpacity=".16" />
          <stop offset="1" stopColor={JADE} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-warm`}>
          <stop offset="0" stopColor={GOLD} stopOpacity=".28" />
          <stop offset=".5" stopColor={JADE} stopOpacity=".08" />
          <stop offset="1" stopColor={JADE} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={world}>
        {/* 2 · Five senses build the world: the body's own light grows as they pour in. */}
        <circle cx={FIG_X} cy={420} r={150 + 90 * immersion} fill={`url(#${uid}-warm)`} opacity={immersion} />
        {t >= 7 && t < 16.5 && PARTICLES.map((particle, k) => {
          const u = (t - particle.spawn) / particle.life;
          if (u <= 0 || u >= 1) return null;
          const eased = u ** 1.6;
          const p: Point = [lerp(particle.from[0], particle.to[0], eased), lerp(particle.from[1], particle.to[1], eased)];
          const back = Math.max(0, eased - 0.09);
          const tail: Point = [lerp(particle.from[0], particle.to[0], back), lerp(particle.from[1], particle.to[1], back)];
          const alpha = Math.sin(Math.PI * u) * (1 - smooth(t, 15, 16.4));
          return (
            <g key={k} opacity={alpha}>
              <line x1={tail[0]} y1={tail[1]} x2={p[0]} y2={p[1]} stroke={particle.color} strokeWidth={1.8 / s} strokeLinecap="round" opacity={0.65} />
              <circle cx={p[0]} cy={p[1]} r={particle.size / s} fill={particle.color} />
            </g>
          );
        })}
        {t >= 7 && t < 16 && SENSES.map((sense, k) => (
          <text
            key={sense.name} x={sense.label[0]} y={sense.label[1]} textAnchor="middle" fill={sense.color}
            fontSize={20 / s} fontFamily="JetBrains Mono, monospace" letterSpacing={5 / s}
            opacity={0.85 * smooth(t, 7.6 + 0.35 * k, 8.4 + 0.35 * k) * (1 - smooth(t, 14.4, 15.4))}
          >
            {sense.name}
          </text>
        ))}

        {/* 3 · By design: Little c behind the avatar, its inner loop turning. */}
        {sphere > 0.001 && (
          <g opacity={sphere}>
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={SPHERE_R * 1.25} fill={`url(#${uid}-jade)`} opacity={0.35} />
            <path d={membranePath(SPHERE[0], SPHERE[1], SPHERE_R, { amplitude: 7, lobes: 4, phase: t * 0.22 })} fill={JADE} fillOpacity={0.035} stroke={JADE} strokeWidth={1.8 / s} />
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={SPHERE_R * 0.64} fill="none" stroke={JADE} strokeWidth={1 / s} strokeDasharray={`${3 / s} ${7 / s}`} opacity={0.6} />
            <circle
              cx={SPHERE[0]} cy={SPHERE[1]} r={SPHERE_R * 0.42} fill="none" stroke={GOLD} strokeWidth={2.2 / s} strokeLinecap="round"
              strokeDasharray={`${SPHERE_R * 1.9} ${SPHERE_R * 0.74}`}
              transform={`rotate(${(t * 16).toFixed(2)} ${SPHERE[0]} ${SPHERE[1]})`}
            />
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={11} fill={JADE} />
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={4} fill={INK} />
            <text x={SPHERE[0]} y={SPHERE[1] + SPHERE_R + 50} textAnchor="middle" fill={JADE} fontSize={26 / s} fontFamily="JetBrains Mono, monospace" letterSpacing={4 / s}>LITTLE c</text>
          </g>
        )}
        {coupling > 0.001 && (
          <g fill="none" strokeLinecap="round" opacity={coupling}>
            <path d={cubicPath(INTENT)} stroke={JADE} strokeWidth={2.6 / s} opacity={0.85} />
            <path d={cubicPath(RETURN)} stroke={GOLD} strokeWidth={2.6 / s} opacity={0.85} />
            {[0, 1].map((n) => {
              const raw = (t - 17.4 - n * 1.1) / 2.2;
              const u = raw - Math.floor(raw);
              const p = cubicAt(n === 0 ? INTENT : RETURN, u);
              return <circle key={n} cx={p[0]} cy={p[1]} r={7 / s} fill={n === 0 ? JADE : GOLD} opacity={Math.sin(Math.PI * u)} />;
            })}
          </g>
        )}

        {/* 5–6 · The lattice: the same box around everyone, tugged on strings, nudged by pain. */}
        {t >= 32 && LATTICE_COPIES.map((copy) => {
          const shown = smooth(t, 32.5 + copy.delay, 33.2 + copy.delay) * (1 - 0.8 * calm);
          if (shown <= 0.001) return null;
          return (
            <g key={`${copy.i}:${copy.j}`} opacity={shown}>
              <MeasuringBox cx={copy.x} cy={copy.y + 10} scale={1} opacity={1} loosen={0} px={1.4} s={s} gap={gap} weight={devolve} />
              <Figure x={copy.x} y={copy.y} px={1.3} cameraScale={s} opacity={0.75 - 0.35 * devolve} shrink={devolve} />
              <PainRings at={[copy.x, copy.y + CHEST_DY]} phase={copy.phase} t={t} opacity={pain} s={s} />
            </g>
          );
        })}
        <Strings t={t} s={s} opacity={strings} />

        {/* 4 · The lens snaps shut around the one figure we follow. */}
        <MeasuringBox
          cx={FIG_X} cy={FIG_Y + 10} scale={boxScale * (1 + 0.18 * loosen)} opacity={boxShown * (1 - 0.85 * loosen)}
          loosen={loosen} px={2.2} s={s} gap={gap} weight={devolve * (1 - noticed)}
        />
        {push > 0.001 && [330, 460, 590].map((y) => (
          <g key={y}>
            <Arrow from={[BOX.x - 200 - 260 * (1 - push), y]} to={[BOX.x - 14 - 120 * (1 - push), y]} px={2} s={s} color={CLAY} opacity={push} />
            <Arrow from={[BOX.x + BOX.w + 200 + 260 * (1 - push), y]} to={[BOX.x + BOX.w + 14 + 120 * (1 - push), y]} px={2} s={s} color={CLAY} opacity={push} />
          </g>
        ))}
        {lens > 0.001 && (
          <text x={FIG_X} y={BOX.y - 38} textAnchor="middle" fill={CLAY} fontSize={24 / s} fontFamily="JetBrains Mono, monospace" letterSpacing={4 / s} opacity={lens}>
            CAUSE → EFFECT
          </text>
        )}

        {/* 1 · The figure, with its heartbeat; it stays the one we follow throughout. */}
        <circle cx={CHEST[0]} cy={CHEST[1]} r={70} fill={`url(#${uid}-jade)`} opacity={beat * 0.9} />
        <Figure
          x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} progress={drawProgress}
          opacity={1 - 0.25 * smooth(t, 24.4, 25.4) - 0.3 * devolve * (1 - noticed) + 0.25 * noticed}
          shrink={devolve * (1 - noticed)}
        />
        <PainRings at={CHEST} phase={0.37} t={t} opacity={mainPain} s={s} />

        {/* 7 · The pause: someone is experiencing this. */}
        {noticed > 0.001 && (
          <g>
            <circle cx={CHEST[0]} cy={CHEST[1]} r={36 + 120 * opening} fill={`url(#${uid}-jade)`} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={14 + 4 * noticed} fill="none" stroke={JADE} strokeWidth={1.4 / s} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={5 + 2 * noticed} fill={JADE} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={2} fill={INK} opacity={noticed} />
          </g>
        )}
      </g>
    </svg>
    </div>
  );
}

/** Shots 8–9: the homepage architecture, pulled back from Little c₁ to the T × E field. */
function TrailerArchitecture({ t }: { t: number }) {
  const startScale = 6.5;
  const pull = smooth(t, ARCH + 0.4, ARCH + 8.4);
  const scale = Math.exp(lerp(Math.log(startScale), 0, pull)) * (1 + 0.035 * smooth(t, ARCH + 8.4, END));
  const centring = Math.max(0, (scale - 1) / (startScale - 1));
  const settle = smooth(t, TITLE, TITLE + 1.8);
  const style = {
    // Arrives as the drawing leaves, rises above the title so they never overlap, and is
    // gone before Concept 1.
    opacity: smooth(t, ARCH - 0.3, ARCH + 0.7) * lerp(1, 0.85, settle) * (1 - smooth(t, END - 0.9, END - 0.1)),
    // Placed in layout (no transform), so every exported frame shows exactly this moment.
    // Sized from the frame itself (container units), so it stays square on wide and tall screens.
    ...(() => {
      const size = `calc(min(74cqh, 92cqw) * ${(1 - 0.42 * settle).toFixed(4)})`;
      const centre = 44 - 14 * settle;
      return { height: size, width: size, top: `calc(${centre.toFixed(3)}cqh - ${size} / 2)`, left: `calc(50cqw - ${size} / 2)` };
    })(),
    // Ring labels wait until the view is wide enough to show them whole.
    "--labels": smooth(t, ARCH + 3.2, ARCH + 5.2),
    "--te": smooth(t, ARCH + 6.8, ARCH + 8.4),
    "--big-c": smooth(t, ARCH + 5.4, ARCH + 7),
    "--rfn": smooth(t, ARCH + 4.8, ARCH + 6.2),
    "--rf": smooth(t, ARCH + 2.4, ARCH + 4),
    "--lc": smooth(t, ARCH - 0.5, ARCH + 0.7),
  } as CSSProperties;
  return (
    <div className="dark-trailer-arch" style={style} aria-hidden="true">
      {/* The camera is sized and placed in layout, not with a CSS transform: a transformed
          layer can be composited a frame late, which made the labels jump in exported video.
          Little c₁ (at 44.857%, 47.429% of the figure) starts centred and the view widens around it. */}
      <div
        className="dark-trailer-arch-camera"
        style={{
          width: `${(scale * 100).toFixed(3)}%`,
          height: `${(scale * 100).toFixed(3)}%`,
          left: `${(44.857 * (1 - scale) + 5.143 * centring).toFixed(3)}%`,
          top: `${(47.429 * (1 - scale) + 2.571 * centring).toFixed(3)}%`,
        }}
      >
        <div className="home-hero-environment dark-trailer-arch-figure" data-hero-motion="still" inert>
          <HeroArchitecture embedded />
        </div>
      </div>
    </div>
  );
}

/**
 * The opening trailer: experience → the senses → the body as an interface → the interface
 * taken for the whole → a culture that measures everything except experience → the stress
 * response → the pause → the architecture → the title. Reduced motion shows each shot finished.
 */
export function DarkFilmTrailer({ seconds, still = false }: { seconds: number; still?: boolean }) {
  const shot = darkTrailerShot(seconds);
  // Reduced motion shows each shot finished, with its last line still on screen.
  const lastLine = DARK_TRAILER_LINES.filter((typed) => typed.shot === shot.kind).at(-1);
  const t = still ? Math.min(shot.end - 0.8, lastLine ? lastLine.until - 0.7 : Infinity) : seconds;
  // The picture runs on its own choreographed clock, stretched so every line can be read.
  const d = trailerDrawingTime(t);
  return (
    <section className="dark-trailer" aria-label={shot.label} data-trailer-shot={shot.kind}>
      <p className="sr-only">{shot.description}</p>
      {d < ARCH + 0.6 && <TrailerDrawing t={d} />}
      {d >= ARCH - 0.5 && <TrailerArchitecture t={d} />}
      <div className="dark-trailer-words">
        {DARK_TRAILER_LINES.map((typed) => {
          if (t < typed.start - 0.3 || t >= typed.until) return null;
          const opacity = smooth(t, typed.start - 0.3, typed.start) * (1 - smooth(t, typed.until - 0.5, typed.until));
          const Tag = typed.role === "title" ? "h2" : "p";
          const voiced = typed.voice ? ` dark-trailer-${typed.role}--${typed.voice}` : "";
          return (
            <Tag key={typed.text} className={`dark-trailer-${typed.role}${voiced}`} style={{ opacity }} data-trailer-line={typed.shot}>
              {/* Whose claim it is, named above it: DOT's proposal or the view it examines. */}
              {typed.voice && (
                <span className={`dark-trailer-voice dark-trailer-voice--${typed.voice}`}>
                  {typed.voice === "dot" ? "DOT proposes" : "The prevailing view"}
                </span>
              )}
              <TypedText line={typed} time={t} caret={typed.role !== "subtitle"} />
              {typed.cite && (
                <span className="dark-trailer-cite" style={{ opacity: smooth(t, typed.end + 0.2, typed.end + 0.9) }}>
                  — {typed.cite}
                </span>
              )}
            </Tag>
          );
        })}
      </div>
    </section>
  );
}
