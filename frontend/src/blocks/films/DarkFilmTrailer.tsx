import { createContext, useContext, useId, type CSSProperties } from "react";

import amm from "../../content/amm.json";
import { HeroArchitecture } from "../core/home/HeroArchitecture";
import { ARCHITECTURE_RADII, FRAME_CENTRE, LOCAL_CENTRE, membranePath } from "../core/home/architectureGeometry";
import "../core/home/home.css";
import { TypedText } from "./ConceptFrame";
import { DARK_TRAILER_LINES, DARK_TRAILER_SHOTS, NORMAL_DESIGN, TRAILER_HEARTBEATS_DESIGN, darkTrailerShot, trailerDrawingTime } from "./darkFilmRevision";

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

/** Every line is drawn this much heavier than its nominal width, so it survives video compression on a phone. */
const WEIGHT = 1.3;

/** The film's two tones. Light lines glow on the dark stage; deeper inks hold their contrast on the light one. */
export type FilmTone = "dark" | "light";
type Palette = { jade: string; ink: string; clay: string; gold: string; stage: string };
const PALETTES: Record<FilmTone, Palette> = {
  dark: { jade: "#8ad6b9", ink: "#f2f0e8", clay: "#d4876d", gold: "#e6bc78", stage: "#081912" },
  light: { jade: "#23805f", ink: "#17271f", clay: "#ad5434", gold: "#9a6a1c", stage: "#f3efe5" },
};
const TrailerPalette = createContext<Palette>(PALETTES.dark);

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
  [41.6, FIG_X, 450, 0.42],
  // In on the person and the one above who holds their string: looking up, then blamed.
  [43.4, FIG_X, 230, 0.8],
  [45.4, FIG_X, 230, 0.8],
  // Out again as everyone diminishes.
  [46.6, FIG_X, 450, 0.46],
  [PAUSE + 0.4, FIG_X, 450, 0.46],
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

const polar = (centre: Point, radius: number, degrees: number): Point => [
  centre[0] + Math.cos((degrees * Math.PI) / 180) * radius,
  centre[1] + Math.sin((degrees * Math.PI) / 180) * radius,
];
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
  const { ink } = useContext(TrailerPalette);
  const width = (px * WEIGHT) / (cameraScale * scale);
  // Shrinking settles toward the feet, so a diminished figure still stands in its box.
  const lift = 171 * (FIG - scale);
  return (
    <g transform={`translate(${x} ${y + lift}) scale(${scale})`} opacity={opacity} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
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
    <g opacity={opacity} fill="none" stroke={color} strokeWidth={(px * WEIGHT) / s} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M${from.join(" ")}L${to.join(" ")}`} />
      <path d={`M${left.join(" ")}L${to.join(" ")}L${right.join(" ")}`} />
    </g>
  );
}

/**
 * A box and its measuring grid: the objective lens closed around one figure. The nudge
 * opens a jade gap in its lid; devolving thickens its walls and closes the gap again.
 */
function MeasuringBox({ cx, cy, scale, opacity, loosen, px, s, gap = 0, weight = 0, press = 0 }: {
  cx: number; cy: number; scale: number; opacity: number; loosen: number; px: number; s: number; gap?: number; weight?: number;
  /** 0–1: the lid presses down on the figure inside. */
  press?: number;
}) {
  const { clay, jade } = useContext(TrailerPalette);
  if (opacity <= 0.001) return null;
  const w = BOX.w * scale;
  const lid = BOX.h * scale * 0.12 * press;
  const h = BOX.h * scale - lid;
  const x = cx - w / 2;
  const y = cy - (BOX.h * scale) / 2 + lid;
  const columns = Array.from({ length: 5 }, (_, i) => x + ((i + 1) * w) / 6);
  const rows = Array.from({ length: 12 }, (_, i) => y + ((i + 1) * h) / 13);
  const dash = loosen > 0 ? `${(14 * (1 - loosen) + 2).toFixed(1)} ${(4 + 18 * loosen).toFixed(1)}` : undefined;
  const half = 34 * gap;
  return (
    <g opacity={opacity}>
      <g stroke={clay} strokeWidth={(px * WEIGHT * (0.45 + 0.4 * weight)) / s} opacity={(0.22 + 0.2 * weight) * (1 - loosen)}>
        {columns.map((cxLine) => <line key={`c${cxLine}`} x1={cxLine} y1={y} x2={cxLine} y2={y + h} />)}
        {rows.map((ryLine) => <line key={`r${ryLine}`} x1={x} y1={ryLine} x2={x + w} y2={ryLine} />)}
      </g>
      <path
        d={`M${cx - half} ${y}H${x + 6}Q${x} ${y} ${x} ${y + 6}V${y + h - 6}Q${x} ${y + h} ${x + 6} ${y + h}H${x + w - 6}Q${x + w} ${y + h} ${x + w} ${y + h - 6}V${y + 6}Q${x + w} ${y} ${x + w - 6} ${y}H${cx + half}`}
        fill="none" stroke={clay} strokeWidth={(px * WEIGHT * (1 + 1.3 * weight)) / s} strokeDasharray={dash}
      />
      {gap > 0.01 && (
        <g opacity={gap}>
          <path d={`M${cx - half} ${y}H${cx + half}`} stroke={jade} strokeWidth={(px * WEIGHT * 1.6) / s} strokeLinecap="round" />
          <path d={`M${cx - 12} ${y - 14}L${cx} ${y - 28}L${cx + 12} ${y - 14}`} fill="none" stroke={jade} strokeWidth={(px * WEIGHT * 1.4) / s} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
}

/** Two rings of pain on their own phase; they keep nudging until the film pauses. */
function PainRings({ at, phase, t, opacity, s }: { at: Point; phase: number; t: number; opacity: number; s: number }) {
  const { clay } = useContext(TrailerPalette);
  if (opacity <= 0.001) return null;
  const frozen = Math.min(t, PAUSE + 0.2);
  return (
    <g fill="none" stroke={clay}>
      {[0, 0.5].map((offset) => {
        const raw = frozen * 0.6 + phase + offset;
        const frac = raw - Math.floor(raw);
        return (
          <g key={offset}>
            <circle cx={at[0]} cy={at[1]} r={46 + 110 * frac} strokeWidth={(3 * WEIGHT) / s} opacity={0.95 * (1 - frac) * opacity} />
            {offset === 0 && <circle cx={at[0]} cy={at[1]} r={10} fill={clay} stroke="none" opacity={0.55 * opacity} />}
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
const SENSES: readonly { name: string; angle: number; label: Point; color: keyof Palette }[] = [
  { name: "SIGHT", angle: -145, label: [300, 222] as Point, color: "gold" },
  { name: "SMELL", angle: -90, label: [640, 186] as Point, color: "ink" },
  { name: "SOUND", angle: -35, label: [980, 222] as Point, color: "jade" },
  { name: "TOUCH", angle: 170, label: [190, 476] as Point, color: "ink" },
  { name: "TASTE", angle: 10, label: [1090, 476] as Point, color: "gold" },
];

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

/** The culture's messages, as the American Millennial Manifesto quotes them, closing in on the one we follow. */
const CULTURE = amm.home.concepts.map((concept) => concept.script);
const CULTURE_START = 35.5;
const CULTURE_STEP = 0.72;
const CULTURE_LIFE = 2.8;
/** Each message keeps its own lane, from beyond the frame to a place beside the person; "You have no choice." lands last, just above them. */
const CULTURE_LANES: readonly (readonly [Point, Point])[] = [
  [[-900, 40], [60, 130]],
  [[2180, 40], [1220, 130]],
  [[-900, 470], [60, 430]],
  [[2180, 470], [1220, 430]],
  [[640, -900], [640, -120]],
  [[640, -760], [640, 96]],
];

function CultureMessages({ t, s }: { t: number; s: number }) {
  const { clay, stage } = useContext(TrailerPalette);
  return (
    <g fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" textAnchor="middle" fill={clay} stroke={stage} paintOrder="stroke" strokeLinejoin="round">
      {CULTURE.map((text, k) => {
        const u = (t - (CULTURE_START + k * CULTURE_STEP)) / CULTURE_LIFE;
        if (u <= 0 || u >= 1) return null;
        const [from, to] = CULTURE_LANES[k];
        const arrive = 1 - (1 - smooth(u, 0, 0.7)) ** 2;
        return (
          <text
            key={text} x={lerp(from[0], to[0], arrive)} y={lerp(from[1], to[1], arrive)}
            fontSize={34 / s} strokeWidth={8 / s} opacity={smooth(u, 0, 0.18) * (1 - smooth(u, 0.72, 1))}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
}

/** The figure in the box above, who holds our string: where we look for leadership, and who points back. */
const ABOVE_BOX_FLOOR = FIG_Y - LATTICE.dy + 10 + BOX.h / 2;

function LookingUp({ look, blame, s }: { look: number; blame: number; s: number }) {
  const { ink, clay } = useContext(TrailerPalette);
  if (look <= 0.001 && blame <= 0.001) return null;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {look > 0.001 && (
        <g stroke={ink} strokeWidth={(2 * WEIGHT) / s} opacity={look * 0.85}>
          <path d={`M${FIG_X} ${FIG_Y + HEAD_TOP_DY - 16}V${ABOVE_BOX_FLOOR + 22}`} strokeDasharray={`${6 / s} ${7 / s}`} />
          <path d={`M${FIG_X - 12} ${ABOVE_BOX_FLOOR + 36}L${FIG_X} ${ABOVE_BOX_FLOOR + 20}L${FIG_X + 12} ${ABOVE_BOX_FLOOR + 36}`} />
        </g>
      )}
      {blame > 0.001 && (
        <g stroke={clay} strokeWidth={(2.6 * WEIGHT) / s} opacity={blame}>
          <path d={`M${FIG_X + 96} ${ABOVE_BOX_FLOOR + 16}Q${FIG_X + 120} ${CHEST[1] - 130} ${lerp(FIG_X + 104, FIG_X + 46, blame)} ${CHEST[1] - 8}`} />
          <path d={`M${FIG_X + 34} ${CHEST[1] - 30}L${FIG_X + 44} ${CHEST[1] - 6}L${FIG_X + 68} ${CHEST[1] - 16}`} opacity={smooth(blame, 0.7, 1)} />
        </g>
      )}
    </g>
  );
}

/** Paths open out from the person in every direction, each ending in an open choice. */
const OPTIONS_LEFT: readonly Cubic[] = [
  [[530, 300], [470, 280], [390, 220], [290, 170]],
  [[524, 380], [450, 380], [360, 360], [240, 330]],
  [[528, 460], [460, 470], [380, 500], [280, 500]],
];
const mirror = ([x, y]: Point): Point => [2 * FIG_X - x, y];
const OPTIONS: readonly Cubic[] = OPTIONS_LEFT.flatMap((path) => [
  path,
  [mirror(path[0]), mirror(path[1]), mirror(path[2]), mirror(path[3])] as const,
]);

function Options({ open, s }: { open: number; s: number }) {
  const { jade } = useContext(TrailerPalette);
  if (open <= 0.001) return null;
  return (
    <g fill="none" stroke={jade} strokeLinecap="round">
      {OPTIONS.map((path, k) => {
        const drawnIn = smooth(open, 0.06 * k, 0.55 + 0.06 * k);
        const end = path[3];
        return (
          <g key={k}>
            <path d={cubicPath(path)} strokeWidth={(2.2 * WEIGHT) / s} strokeDasharray={`${8 / s} ${7 / s}`} opacity={0.9 * drawnIn} />
            <circle cx={end[0]} cy={end[1]} r={14} strokeWidth={(2 * WEIGHT) / s} opacity={smooth(drawnIn, 0.85, 1)} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * The strings: each figure is tugged from the hand of the figure in the box above it,
 * who is boxed too; the top row's strings rise out of frame.
 */
function Strings({ t, s, opacity }: { t: number; s: number; opacity: number }) {
  const { clay } = useContext(TrailerPalette);
  if (opacity <= 0.001) return null;
  return (
    <g fill="none" stroke={clay} strokeWidth={(1.2 * WEIGHT) / s} strokeLinecap="round" opacity={opacity * 0.75}>
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

/* ── Shot 1: the performance of normality ── */
const DAY_CENTRE: Point = [FIG_X, 430];
const DAY_R = 282;
const NORMAL_LINES = DARK_TRAILER_LINES.filter((typed) => typed.shot === "normal");
const NORMAL_END = DARK_TRAILER_SHOTS[0].end;
/** The film second a phrase of the opening sentence starts typing. */
const phraseAt = (phrase: string) =>
  NORMAL_LINES[0].start + NORMAL_LINES[0].text.indexOf(phrase) / NORMAL_LINES[0].charsPerSecond;
const DAY_ITEMS = [
  { phrase: "We go to work.", angle: -152 },
  { phrase: "We pay bills.", angle: -28 },
  { phrase: "We scroll.", angle: 28 },
  { phrase: "We compete.", angle: 152 },
].map((item) => ({ ...item, at: phraseAt(item.phrase) }));

function Laptop({ seconds, color, w }: { seconds: number; color: string; w: number }) {
  return (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x={-70} y={-54} width={140} height={90} rx={8} />
      <path d="M-90 36H90L78 54H-78Z" />
      {[-34, -16, 2].map((y, k) => (
        <path key={y} d={`M-50 ${y}H${-50 + 100 * (0.45 + 0.55 * Math.abs(Math.sin(seconds * 0.9 + k * 1.7)))}`} opacity={0.75} />
      ))}
    </g>
  );
}

function Bills({ seconds, from, color, paper, w }: { seconds: number; from: number; color: string; paper: string; w: number }) {
  const sheets = 1 + Math.min(4, Math.floor(Math.max(0, seconds - from) / 2.4));
  return (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: sheets }, (_, k) => {
        const dx = (k % 2 ? 1 : -1) * 3 * k;
        const dy = -9 * k;
        return (
          <g key={k} transform={`translate(${dx} ${dy})`}>
            <rect x={-48} y={-58} width={96} height={118} rx={4} fill={paper} />
            {k === sheets - 1 && (
              <>
                <path d="M-30 -36H10M-30 -16H30M-30 4H30" opacity={0.65} />
                <path d="M6 36H30" strokeWidth={w * 2} />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

function Phone({ seconds, color, w, clip }: { seconds: number; color: string; w: number; clip: string }) {
  const travel = (seconds * 34) % 56;
  return (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
      <rect x={-46} y={-84} width={92} height={168} rx={13} />
      <g clipPath={`url(#${clip})`}>
        {[0, 1, 2, 3, 4].map((k) => {
          const y = -96 + k * 56 - travel;
          return (
            <g key={k}>
              <rect x={-34} y={y} width={68} height={44} rx={5} />
              <circle cx={-22} cy={y + 12} r={5} />
              <path d={`M-10 ${y + 12}H22M-22 ${y + 31}H22`} opacity={0.7} />
            </g>
          );
        })}
      </g>
    </g>
  );
}

function Ranking({ seconds, from, color, ink, w }: { seconds: number; from: number; color: string; ink: string; w: number }) {
  const rise = smooth(seconds, from, from + 2);
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={w}>
      {[30, 62, 44, 96, 128].map((height, k) => {
        const x = -84 + k * 42;
        const h = height * rise;
        const ours = k === 2;
        return (
          <g key={k} stroke={ours ? ink : color}>
            <rect x={x - 14} y={64 - h} width={28} height={h} />
            <circle cx={x} cy={64 - h - 17} r={10} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * The film opens on the book's own sentence about an ordinary day: one person, and the day going
 * round them, faster each time. It is the same figure the rest of the opening follows. As the
 * words name what we call this life, the person wears a smile over the strain, and the day closes in.
 */
function TrailerNormal({ seconds }: { seconds: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade, ink, clay, gold, stage } = useContext(TrailerPalette);
  const s = CAMERA[0][3];
  const world = `translate(800 450) scale(${s}) translate(${-CAMERA[0][1]} ${-CAMERA[0][2]})`;
  const naming = NORMAL_LINES[1].start;
  const clear = smooth(seconds, NORMAL_END - 1, NORMAL_END - 0.15);
  const mask = smooth(seconds, naming - 0.4, naming + 1.6) * (1 - clear);
  const closing = smooth(seconds, naming, NORMAL_LINES[2].until);
  // Each day takes less time than the one before.
  const turn = seconds / 7 + 2.4 * (seconds / NORMAL_END) ** 3;
  const light = polar(DAY_CENTRE, DAY_R, turn * 360 - 90);
  const w = (2.2 * WEIGHT) / s;
  return (
    <div className="dark-trailer-stage">
      <svg className="dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <clipPath id={`${uid}-screen`}><rect x={-40} y={-78} width={80} height={156} rx={9} /></clipPath>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor={jade} stopOpacity=".3" />
            <stop offset="1" stopColor={jade} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={world}>
          <g opacity={smooth(seconds, 0.2, 1.4) * (1 - clear)}>
            <circle cx={DAY_CENTRE[0]} cy={DAY_CENTRE[1]} r={DAY_R} fill="none" stroke={ink} strokeWidth={WEIGHT / s} strokeDasharray={`${2 / s} ${9 / s}`} opacity={0.45} />
            <circle cx={light[0]} cy={light[1]} r={26} fill={gold} opacity={0.18} />
            <circle cx={light[0]} cy={light[1]} r={8} fill={gold} />
          </g>
          {DAY_ITEMS.map(({ phrase, angle, at }) => {
            const shown = smooth(seconds, at - 0.1, at + 0.7);
            if (shown <= 0.001) return null;
            const place = polar(DAY_CENTRE, lerp(DAY_R + 78, DAY_R - 22, closing), angle);
            const opacity = shown * lerp(1, 0.62, closing) * (1 - clear);
            return (
              <g key={phrase} transform={`translate(${place[0]} ${place[1]}) scale(1.16)`} opacity={opacity}>
                {phrase === "We go to work." && <Laptop seconds={seconds} color={ink} w={w} />}
                {phrase === "We pay bills." && <Bills seconds={seconds} from={at} color={gold} paper={stage} w={w} />}
                {phrase === "We scroll." && (
                  <>
                    <circle r={130} fill={`url(#${uid}-glow)`} />
                    <Phone seconds={seconds} color={jade} w={w} clip={`${uid}-screen`} />
                  </>
                )}
                {phrase === "We compete." && <Ranking seconds={seconds} from={at} color={clay} ink={ink} w={w} />}
              </g>
            );
          })}
          <PainRings at={CHEST} phase={0.37} t={seconds} opacity={mask} s={s} />
          <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} progress={smooth(seconds, 0.1, 1.5)} />
          {mask > 0.001 && (
            <g transform={`translate(${FIG_X} ${FIG_Y}) scale(${FIG})`} opacity={mask} fill="none" stroke={ink} strokeWidth={(2.6 * WEIGHT) / (s * FIG)} strokeLinecap="round">
              <path d="M-13 -112Q0 -100 13 -112" />
              <path d="M-10 -126V-125M10 -126V-125" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

/** Shots 2–8: one continuous drawing seen through a moving camera. */
function TrailerDrawing({ t }: { t: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const palette = useContext(TrailerPalette);
  const { jade, ink, clay, gold } = palette;
  const cam = cameraAt(t);
  const s = cam.s;
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`;

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
  // We look up to the one who holds our string; as the costs compound, they point back at us.
  const lookUp = smooth(t, NUDGE + 0.2, NUDGE + 1) * (1 - calm);
  const blame = smooth(t, NUDGE + 2, NUDGE + 2.9) * (1 - calm);
  // Once the box dissolves, the person's options open out.
  const options = smooth(t, PAUSE + 4, PAUSE + 7.4);
  // A soft light stays on the one person through the crowd, which recedes while the culture speaks.
  const spotlight = smooth(t, 32.5, 34) * (1 - calm);
  const cultureSpeaks = smooth(t, CULTURE_START, CULTURE_START + 0.8) * (1 - smooth(t, NUDGE, NUDGE + 1));

  return (
    <div className="dark-trailer-stage" style={{ opacity: 1 - smooth(t, ARCH - 0.9, ARCH + 0.1) }}>
    <svg className="dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-jade`}>
          <stop offset="0" stopColor={jade} stopOpacity=".55" />
          <stop offset=".45" stopColor={jade} stopOpacity=".16" />
          <stop offset="1" stopColor={jade} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-warm`}>
          <stop offset="0" stopColor={gold} stopOpacity=".28" />
          <stop offset=".5" stopColor={jade} stopOpacity=".08" />
          <stop offset="1" stopColor={jade} stopOpacity="0" />
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
              <line x1={tail[0]} y1={tail[1]} x2={p[0]} y2={p[1]} stroke={palette[particle.color]} strokeWidth={(1.8 * WEIGHT) / s} strokeLinecap="round" opacity={0.75} />
              <circle cx={p[0]} cy={p[1]} r={particle.size / s} fill={palette[particle.color]} />
            </g>
          );
        })}
        {t >= 7 && t < 16 && SENSES.map((sense, k) => (
          <text
            key={sense.name} x={sense.label[0]} y={sense.label[1]} textAnchor="middle" fill={palette[sense.color]}
            fontSize={26 / s} fontFamily="JetBrains Mono, monospace" letterSpacing={6 / s}
            opacity={smooth(t, 7.6 + 0.35 * k, 8.4 + 0.35 * k) * (1 - smooth(t, 14.4, 15.4))}
          >
            {sense.name}
          </text>
        ))}

        {/* 3 · By design: Little c behind the avatar, its inner loop turning. */}
        {sphere > 0.001 && (
          <g opacity={sphere}>
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={SPHERE_R * 1.25} fill={`url(#${uid}-jade)`} opacity={0.35} />
            <path d={membranePath(SPHERE[0], SPHERE[1], SPHERE_R, { amplitude: 7, lobes: 4, phase: t * 0.22 })} fill={jade} fillOpacity={0.035} stroke={jade} strokeWidth={(1.8 * WEIGHT) / s} />
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={SPHERE_R * 0.64} fill="none" stroke={jade} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${7 / s}`} opacity={0.6} />
            <circle
              cx={SPHERE[0]} cy={SPHERE[1]} r={SPHERE_R * 0.42} fill="none" stroke={gold} strokeWidth={(2.2 * WEIGHT) / s} strokeLinecap="round"
              strokeDasharray={`${SPHERE_R * 1.9} ${SPHERE_R * 0.74}`}
              transform={`rotate(${(t * 16).toFixed(2)} ${SPHERE[0]} ${SPHERE[1]})`}
            />
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={11} fill={jade} />
            <circle cx={SPHERE[0]} cy={SPHERE[1]} r={4} fill={ink} />
            <text x={SPHERE[0]} y={SPHERE[1] + SPHERE_R + 50} textAnchor="middle" fill={jade} fontSize={32 / s} fontFamily="JetBrains Mono, monospace" letterSpacing={4 / s}>LITTLE c</text>
          </g>
        )}
        {coupling > 0.001 && (
          <g fill="none" strokeLinecap="round" opacity={coupling}>
            <path d={cubicPath(INTENT)} stroke={jade} strokeWidth={(2.6 * WEIGHT) / s} opacity={0.9} />
            <path d={cubicPath(RETURN)} stroke={gold} strokeWidth={(2.6 * WEIGHT) / s} opacity={0.9} />
            {[0, 1].map((n) => {
              const raw = (t - 17.4 - n * 1.1) / 2.2;
              const u = raw - Math.floor(raw);
              const p = cubicAt(n === 0 ? INTENT : RETURN, u);
              return <circle key={n} cx={p[0]} cy={p[1]} r={7 / s} fill={n === 0 ? jade : gold} opacity={Math.sin(Math.PI * u)} />;
            })}
          </g>
        )}

        {/* 5–6 · The lattice: the same box around everyone, tugged on strings, nudged by pain. */}
        <circle cx={FIG_X} cy={FIG_Y - 40} r={330} fill={`url(#${uid}-warm)`} opacity={spotlight} />
        {t >= 32 && LATTICE_COPIES.map((copy) => {
          const shown = smooth(t, 32.5 + copy.delay, 33.2 + copy.delay) * (1 - 0.8 * calm) * (1 - 0.3 * cultureSpeaks);
          if (shown <= 0.001) return null;
          return (
            <g key={`${copy.i}:${copy.j}`} opacity={shown}>
              <MeasuringBox cx={copy.x} cy={copy.y + 10} scale={1} opacity={1} loosen={0} px={1.4} s={s} gap={gap} weight={devolve} press={devolve} />
              <Figure
                x={copy.x} y={copy.y} px={1.3} cameraScale={s} shrink={devolve}
                opacity={0.62 - 0.3 * devolve + (copy.i === 0 && copy.j === -1 ? 0.38 * lookUp : 0)}
              />
              <PainRings at={[copy.x, copy.y + CHEST_DY]} phase={copy.phase} t={t} opacity={pain} s={s} />
            </g>
          );
        })}
        <Strings t={t} s={s} opacity={strings} />
        <LookingUp look={lookUp} blame={blame} s={s} />

        {/* 4 · The lens snaps shut around the one figure we follow. */}
        <MeasuringBox
          cx={FIG_X} cy={FIG_Y + 10} scale={boxScale * (1 + 0.18 * loosen)} opacity={boxShown * (1 - 0.85 * loosen)}
          loosen={loosen} px={2.2} s={s} gap={gap} weight={devolve * (1 - noticed)} press={devolve * (1 - noticed)}
        />
        {push > 0.001 && [330, 460, 590].map((y) => (
          <g key={y}>
            <Arrow from={[BOX.x - 200 - 260 * (1 - push), y]} to={[BOX.x - 14 - 120 * (1 - push), y]} px={2} s={s} color={clay} opacity={push} />
            <Arrow from={[BOX.x + BOX.w + 200 + 260 * (1 - push), y]} to={[BOX.x + BOX.w + 14 + 120 * (1 - push), y]} px={2} s={s} color={clay} opacity={push} />
          </g>
        ))}
        {lens > 0.001 && (
          <text x={FIG_X} y={BOX.y - 38} textAnchor="middle" fill={clay} fontSize={30 / s} fontFamily="JetBrains Mono, monospace" letterSpacing={4 / s} opacity={lens}>
            CAUSE → EFFECT
          </text>
        )}

        {/* 1 · The figure, with its heartbeat; it stays the one we follow throughout. */}
        <circle cx={CHEST[0]} cy={CHEST[1]} r={70} fill={`url(#${uid}-jade)`} opacity={beat * 0.9} />
        <Figure
          x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s}
          opacity={1 - 0.25 * smooth(t, 24.4, 25.4) - 0.3 * devolve * (1 - noticed) + 0.25 * noticed}
          shrink={devolve * (1 - noticed)}
        />
        <PainRings at={CHEST} phase={0.37} t={t} opacity={mainPain} s={s} />

        {/* 7 · The pause: someone is experiencing this. */}
        {noticed > 0.001 && (
          <g>
            <circle cx={CHEST[0]} cy={CHEST[1]} r={36 + 120 * opening} fill={`url(#${uid}-jade)`} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={14 + 4 * noticed} fill="none" stroke={jade} strokeWidth={(1.4 * WEIGHT) / s} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={5 + 2 * noticed} fill={jade} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={2} fill={ink} opacity={noticed} />
          </g>
        )}
        <Options open={options} s={s} />
        {t >= CULTURE_START && t < CULTURE_START + CULTURE_STEP * CULTURE.length + CULTURE_LIFE && <CultureMessages t={t} s={s} />}
      </g>
    </svg>
    </div>
  );
}

/** Shots 9–10: the homepage architecture, pulled back from Little c₁ to the T × E field. */
/** A single pass through the existing diagram: embodiment in RF₀, its Stream, then Little c.
 * These are model relationships, not motion through physical space. The still frame shows
 * the completed path; no CSS loop or independent animation runs behind a paused film. */
function ExperienceLabPassage({ t }: { t: number }) {
  const frame = smooth(t, ARCH + 5.6, ARCH + 6.8);
  const stream = smooth(t, ARCH + 7.2, ARCH + 8.8);
  const experiencer = smooth(t, ARCH + 8.8, ARCH + 10);
  const opacity = 1 - smooth(t, TITLE, TITLE + 1.2);
  return (
    <svg className="dark-trailer-lab-flow" viewBox="0 0 700 700" aria-hidden="true" data-experience-lab-passage>
      <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle
          className="dark-trailer-lab-frame"
          cx={FRAME_CENTRE.x} cy={FRAME_CENTRE.y} r={ARCHITECTURE_RADII.frame}
          {...drawn(frame)} opacity={frame > 0 ? 1 : 0}
        />
        <path className="dark-trailer-lab-stream" d="M379 333H436" {...drawn(stream)} opacity={stream > 0 ? 1 : 0} />
        {stream > 0 && stream < 1 && (
          <circle className="dark-trailer-lab-signal" cx={lerp(379, 436, stream)} cy={333} r={5} />
        )}
        <path
          className="dark-trailer-lab-receiver"
          d={membranePath(LOCAL_CENTRE.x, LOCAL_CENTRE.y, ARCHITECTURE_RADII.local, { amplitude: 2.5, lobes: 4, phase: .4 })}
          {...drawn(experiencer)} opacity={experiencer > 0 ? 1 : 0}
        />
      </g>
    </svg>
  );
}

function TrailerArchitecture({ t }: { t: number }) {
  const startScale = 6.5;
  // Arrive at the whole diagram before the laboratory line finishes typing.
  const pull = smooth(t, ARCH + 0.4, ARCH + 6);
  const scale = Math.exp(lerp(Math.log(startScale), 0, pull)) * (1 + 0.035 * smooth(t, ARCH + 8.4, END));
  const centring = Math.max(0, (scale - 1) / (startScale - 1));
  const localX = LOCAL_CENTRE.x / 7;
  const localY = LOCAL_CENTRE.y / 7;
  const settle = smooth(t, TITLE, TITLE + 1.8);
  const style = {
    // Arrives as the drawing leaves, rises above the title so they never overlap, and is
    // gone before Concept 1.
    opacity: smooth(t, ARCH - 0.3, ARCH + 0.7) * lerp(1, 0.85, settle) * (1 - smooth(t, END - 0.9, END - 0.1)),
    // Placed in layout (no transform), so every exported frame shows exactly this moment.
    // Sized from the frame itself (container units), so it stays square on wide and tall screens.
    ...(() => {
      const size = `calc(min(84cqh, 92cqw) * ${(1 - 0.42 * settle).toFixed(4)})`;
      const centre = 44 - 14 * settle;
      return { height: size, width: size, top: `calc(${centre.toFixed(3)}cqh - ${size} / 2)`, left: `calc(50cqw - ${size} / 2)` };
    })(),
    // Ring labels wait until the view is wide enough to show them whole.
    "--labels": smooth(t, ARCH + 3.2, ARCH + 5.2),
    "--lab-avatars": smooth(t, ARCH + 6.2, ARCH + 7.8) * (1 - smooth(t, TITLE, TITLE + 1.2)),
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
          Little c starts centred; its position follows the shared, author-confirmed geometry. */}
      <div
        className="dark-trailer-arch-camera"
        style={{
          width: `${(scale * 100).toFixed(3)}%`,
          height: `${(scale * 100).toFixed(3)}%`,
          left: `${(localX * (1 - scale) + (50 - localX) * centring).toFixed(3)}%`,
          top: `${(localY * (1 - scale) + (50 - localY) * centring).toFixed(3)}%`,
        }}
      >
        <div className="home-hero-environment dark-trailer-arch-figure" data-hero-motion="still" inert>
          <HeroArchitecture embedded />
        </div>
        <ExperienceLabPassage t={t} />
      </div>
    </div>
  );
}

/**
 * The opening trailer: an ordinary day → experience → the senses → the body as an interface →
 * the interface taken for the whole → the culture around the person → the strain and the blame →
 * the opening and the person's options → the architecture → the title. Reduced motion shows each
 * shot finished.
 */
export function DarkFilmTrailer({ seconds, still = false, tone = "dark" }: { seconds: number; still?: boolean; tone?: FilmTone }) {
  const shot = darkTrailerShot(seconds);
  // Reduced motion shows each shot finished, with its last line still on screen.
  const lastLine = DARK_TRAILER_LINES.filter((typed) => typed.shot === shot.kind).at(-1);
  const t = still ? Math.min(shot.end - 0.8, lastLine ? lastLine.until - 0.7 : Infinity) : seconds;
  // The picture runs on its own choreographed clock, stretched so every line can be read.
  const drawingTime = trailerDrawingTime(t);
  // Hold the settled title diagram under reduced motion, before its normal exit fade.
  const d = (still && shot.kind === "title" ? Math.min(drawingTime, NORMAL_DESIGN + END - 1) : drawingTime) - NORMAL_DESIGN;
  return (
    <TrailerPalette.Provider value={PALETTES[tone]}>
    <section className="dark-trailer" aria-label={shot.label} data-trailer-shot={shot.kind}>
      <p className="sr-only">{shot.description}</p>
      {shot.kind === "normal" ? <TrailerNormal seconds={t} /> : d < ARCH + 0.6 && <TrailerDrawing t={d} />}
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
    </TrailerPalette.Provider>
  );
}
