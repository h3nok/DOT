import { createContext, useContext, useEffect, useId, type CSSProperties, type ReactNode } from "react";

import { HeroArchitecture } from "../core/home/HeroArchitecture";
import { Link } from "react-router-dom";
import filmsData from "../../content/films.json";
import { DoWordmark } from "../../shared/DoWordmark";
import { ARCHITECTURE_RADII, FRAME_CENTRE, LOCAL_CENTRE, membranePath } from "../core/home/architectureGeometry";
import "../core/home/home.css";
import { TypedText } from "./ConceptFrame";
import { DARK_TRAILER_LINES, DARK_TRAILER_SHOTS, TRAILER_HEARTBEATS_DESIGN, TRAILER_PLATES, darkTrailerShot, trailerDrawingTime, type TrailerVoice } from "./darkFilmRevision";

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
/** Where a figure's chest sits, relative to its centre. */
const CHEST_DY = -36 * FIG;
const CHEST: Point = [FIG_X, FIG_Y + CHEST_DY];
const SPHERE: Point = [1010, 420];
const SPHERE_R = 220;
const BOX = { x: FIG_X - 120, y: 190, w: 240, h: 540 } as const;
const INTENT: Cubic = [[790, 392], [748, 316], [690, 318], [660, 378]];
const RETURN: Cubic = [[660, 448], [690, 512], [750, 520], [790, 452]];

/* ── The drawing's own clock (seconds), before it is stretched to the words ── */
const PAUSE = 49;
const ARCH = 57;
const TITLE = 69;
const END = 78;

/** The camera: where it looks and how close, eased between held positions. */
const CAMERA: readonly (readonly [number, number, number, number])[] = [
  [0, FIG_X, 470, 1.36],
  [7, FIG_X, 415, 1.7],
  [15, FIG_X, 455, 1.52],
  [20.5, 825, 440, 0.95],
  [23, 825, 440, 0.95],
  [PAUSE, FIG_X, 450, 1.05],
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
  const { ink, jade } = useContext(TrailerPalette);
  const width = (px * WEIGHT) / (cameraScale * scale);
  // Shrinking settles toward the feet, so a diminished figure still stands in its box.
  const lift = 171 * (FIG - scale);
  const feet = y + 171 * FIG;
  const backlight = `${useId().replace(/[^\w-]/g, "")}-back`;
  const paths = BODY_PATHS.map((d) => <path key={d} d={d} {...(progress < 1 ? drawn(progress) : {})} />);
  return (
    <>
      <defs>
        <radialGradient id={backlight}>
          <stop offset="0" stopColor={jade} stopOpacity=".16" />
          <stop offset=".6" stopColor={jade} stopOpacity=".05" />
          <stop offset="1" stopColor={jade} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y - 40 * scale} r={250 * scale} fill={`url(#${backlight})`} opacity={opacity * progress} />
      <Ground x={x} y={feet} width={120 * scale} opacity={opacity * progress} />
      <Reflection x={x} y={feet} opacity={0.16 * opacity}>
        <g transform={`scale(${scale} ${-scale}) translate(0 -171)`} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">{paths}</g>
      </Reflection>
      <g transform={`translate(${x} ${y + lift}) scale(${scale})`} opacity={opacity} fill="none" stroke={ink} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
        {paths}
      </g>
    </>
  );
}

/** A soft pool of light where someone stands, so no one floats in the void. */
function Ground({ x, y, width, opacity = 1 }: { x: number; y: number; width: number; opacity?: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade } = useContext(TrailerPalette);
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={`${uid}-pool`}>
          <stop offset="0" stopColor={jade} stopOpacity=".34" />
          <stop offset=".55" stopColor={jade} stopOpacity=".08" />
          <stop offset="1" stopColor={jade} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* A wide, faint floor, then the bright pool where they stand. */}
      <ellipse cx={x} cy={y + 10} rx={width * 6} ry={width * 0.55} fill={`url(#${uid}-pool)`} opacity={0.35} />
      <ellipse cx={x} cy={y + 4} rx={width * 1.6} ry={width * 0.2} fill={`url(#${uid}-pool)`} />
    </g>
  );
}

/** What stands at (x, y), mirrored on a dark, glassy floor that swallows it within a body's height. */
function Reflection({ x, y, opacity, children }: { x: number; y: number; opacity: number; children: ReactNode }) {
  const uid = useId().replace(/[^\w-]/g, "");
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={`${uid}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1={y} x2="0" y2={y + 220}>
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}-mask`} maskUnits="userSpaceOnUse" x={x - 400} y={y} width={800} height={240}>
          <rect x={x - 400} y={y} width={800} height={240} fill={`url(#${uid}-fade)`} />
        </mask>
      </defs>
      <g mask={`url(#${uid}-mask)`}>
        <g transform={`translate(${x} ${y + 3})`}>{children}</g>
      </g>
    </g>
  );
}

/** The opening's dust in the air, for the rest of the film, in its tone. */
export function FilmAtmosphere({ seconds, tone }: { seconds: number; tone: FilmTone }) {
  return (
    <TrailerPalette.Provider value={PALETTES[tone]}>
      <Atmosphere seconds={seconds} />
    </TrailerPalette.Provider>
  );
}

/* ── Dust in the light: slow, deterministic, over every scene of the opening ── */
const MOTES = Array.from({ length: 64 }, (_, k) => ({
  x: hash(k * 1.31 + 0.2) * 1600,
  y: hash(k * 2.17 + 0.7) * 900,
  /** 0 is far and faint; 1 is near, larger and softer. */
  depth: hash(k * 3.71 + 0.5) ** 1.6,
  drift: 0.5 + hash(k * 5.3) * 0.8,
  phase: hash(k * 7.9) * Math.PI * 2,
}));

function Atmosphere({ seconds }: { seconds: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { gold } = useContext(TrailerPalette);
  return (
    <svg className="dark-trailer-atmosphere" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={`${uid}-mote`}>
          <stop offset="0" stopColor={gold} stopOpacity="1" />
          <stop offset=".4" stopColor={gold} stopOpacity=".5" />
          <stop offset="1" stopColor={gold} stopOpacity="0" />
        </radialGradient>
      </defs>
      {MOTES.map(({ x, y, depth, drift, phase }, k) => {
        const rise = seconds * (5 + 16 * depth) * drift;
        const cy = (((y - rise) % 960) + 960) % 960 - 30;
        const cx = x + Math.sin(seconds * 0.16 * drift + phase) * (12 + 30 * depth);
        const twinkle = 0.65 + 0.35 * Math.sin(seconds * (0.4 + 0.5 * drift) + phase);
        return <circle key={k} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={(1.4 + 7 * depth).toFixed(2)} fill={`url(#${uid}-mote)`} opacity={((0.1 + 0.3 * depth) * twinkle).toFixed(3)} />;
      })}
    </svg>
  );
}

/** An arrow drawn at a steady width on screen, whatever the camera. */
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
    if (t >= beat) glow = Math.max(glow, Math.exp(-(t - beat) * 14));
    if (t >= beat + 0.08) glow = Math.max(glow, 0.6 * Math.exp(-(t - beat - 0.08) * 16));
  }
  return glow;
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

function Options({ open, s, t = 0 }: { open: number; s: number; t?: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade } = useContext(TrailerPalette);
  if (open <= 0.001) return null;
  return (
    <g fill="none" stroke={jade} strokeLinecap="round">
      <defs>
        <radialGradient id={`${uid}-end`}>
          <stop offset="0" stopColor={jade} stopOpacity=".45" />
          <stop offset="1" stopColor={jade} stopOpacity="0" />
        </radialGradient>
      </defs>
      {OPTIONS.map((path, k) => {
        const drawnIn = smooth(open, 0.06 * k, 0.55 + 0.06 * k);
        const end = path[3];
        // A light travels each way once it is open: options are live, not drawn on a map.
        const raw = (t * 0.32 + k / OPTIONS.length) % 1;
        const along = cubicAt(path, raw);
        return (
          <g key={k}>
            <circle cx={end[0]} cy={end[1]} r={52} fill={`url(#${uid}-end)`} stroke="none" opacity={smooth(drawnIn, 0.8, 1)} />
            <path d={cubicPath(path)} strokeWidth={(2.6 * WEIGHT) / s} strokeDasharray={`${8 / s} ${7 / s}`} opacity={drawnIn} />
            <circle cx={end[0]} cy={end[1]} r={14} strokeWidth={(2.4 * WEIGHT) / s} opacity={smooth(drawnIn, 0.85, 1)} />
            <circle cx={along[0]} cy={along[1]} r={5 / s + 2} fill={jade} stroke="none" opacity={smooth(drawnIn, 0.9, 1) * Math.sin(Math.PI * raw)} />
          </g>
        );
      })}
    </g>
  );
}

/* ── The DOT mark: the film's signature, from a point of light ── */
/* The rays leave room beneath the mark for its name. */
const MARK_RAYS = Array.from({ length: 36 }, (_, k) => (k * 360) / 36).filter((angle) => angle < 65 || angle > 115);

function TrailerMark({ seconds, name = "Digital Organism Theory" }: { seconds: number; name?: string }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade, ink } = useContext(TrailerPalette);
  const rise = smooth(seconds, 0.1, 1.5);
  const centre: Point = [800, 400];
  return (
    <>
      <svg className="dark-trailer-field dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-mark`}>
            <stop offset="0" stopColor={jade} stopOpacity=".34" />
            <stop offset="1" stopColor={jade} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={centre[0]} cy={centre[1]} r={lerp(30, 430, rise)} fill={`url(#${uid}-mark)`} />
        <g stroke={ink} strokeWidth={1.2} strokeLinecap="round" opacity={0.3 * smooth(seconds, 0.6, 2)}>
          {MARK_RAYS.map((angle) => {
            const from = polar(centre, 250, angle);
            const to = polar(centre, lerp(250, angle % 30 ? 300 : 345, smooth(seconds, 0.6, 2)), angle);
            return <line key={angle} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} />;
          })}
        </g>
        <circle cx={centre[0]} cy={centre[1]} r={205} fill="none" stroke={jade} strokeWidth={2.4} strokeLinecap="round" {...drawn(smooth(seconds, 0.4, 1.8))} />
      </svg>
      <div className="dark-trailer-mark" style={{ opacity: smooth(seconds, 0.5, 1.5) }}>
        <DoWordmark />
        <p style={{ opacity: smooth(seconds, 1.5, 2.3) }}>{name}</p>
      </div>
    </>
  );
}

/**
 * The film's last frames: the same mark, which holds rather than fades, and the film stops on it.
 * On the website it also offers the ways onward; exported video shows the mark alone.
 */
export function FilmClosingMark({ seconds, still = false, tone = "dark", links = false }: {
  seconds: number; still?: boolean; tone?: FilmTone; links?: boolean;
}) {
  const time = still ? 5 : seconds;
  return (
    <TrailerPalette.Provider value={PALETTES[tone]}>
      <section className="dark-trailer" aria-label="DOT">
        <div className="dark-trailer-scene" style={{ opacity: smooth(time, 0, 0.7) }}>
          <TrailerMark seconds={time} name="dotheory.org" />
          {links && (
            <nav className="dark-trailer-mark-links concept-film-links" aria-label="After the film" style={{ opacity: smooth(time, 1.8, 2.6) }}>
              {filmsData.conceptTour.closing.links.map((link) => (
                <Link key={link.to} to={link.to} onClick={(event) => event.stopPropagation()}>{link.label}</Link>
              ))}
            </nav>
          )}
        </div>
      </section>
    </TrailerPalette.Provider>
  );
}

/* ── The performance of normality ── */
const DAY_CENTRE: Point = [FIG_X, 430];
const DAY_R = 282;
const NORMAL_LINES = DARK_TRAILER_LINES.filter((typed) => typed.shot === "normal");
const NORMAL_START = DARK_TRAILER_SHOTS[1].start;
const NORMAL_END = DARK_TRAILER_SHOTS[1].end;
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
  const mask = smooth(seconds, naming - 0.4, naming + 1.6);
  const closing = smooth(seconds, naming, NORMAL_LINES[2].until);
  // "We pretend…": the day falls away, and only the smile and the strain remain.
  const leaving = smooth(seconds, NORMAL_LINES[3].start, NORMAL_LINES[3].end + 1);
  // Each day takes less time than the one before.
  const day = seconds - NORMAL_START;
  const turn = day / 7 + 2.4 * (day / (NORMAL_END - NORMAL_START)) ** 3;
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
          <g opacity={smooth(day, 0.2, 1.4) * (1 - leaving)}>
            <circle cx={DAY_CENTRE[0]} cy={DAY_CENTRE[1]} r={DAY_R} fill="none" stroke={ink} strokeWidth={WEIGHT / s} strokeDasharray={`${2 / s} ${9 / s}`} opacity={0.45} />
            <circle cx={light[0]} cy={light[1]} r={26} fill={gold} opacity={0.18} />
            <circle cx={light[0]} cy={light[1]} r={8} fill={gold} />
          </g>
          {DAY_ITEMS.map(({ phrase, angle, at }) => {
            const shown = smooth(seconds, at - 0.1, at + 0.7);
            if (shown <= 0.001) return null;
            const place = polar(DAY_CENTRE, lerp(DAY_R + 78, DAY_R - 22, closing), angle);
            const opacity = shown * lerp(1, 0.62, closing) * (1 - leaving);
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
          <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} progress={smooth(day, 0.1, 1.5)} />
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

/* ── One person: what not knowing does to a life ── */
const shotOf = (kind: string) => DARK_TRAILER_SHOTS.find((shot) => shot.kind === kind)!;
const PERSON_SHOTS = ["confused", "health", "inherited", "unfulfilled"];
const HEAD: Point = [FIG_X, FIG_Y - 119 * FIG];
/** When a word in one of a shot's lines starts typing. */
function wordAt(kind: string, word: string) {
  const line = DARK_TRAILER_LINES.find((typed) => typed.shot === kind && typed.text.includes(word))!;
  return line.start + line.text.indexOf(word) / line.charsPerSecond;
}
const unit = (n: number) => hash(n * 3.17 + 0.41);

/** A line that loses its way inside the head. */
const TANGLE = (() => {
  let d = `M${HEAD[0] - 22} ${HEAD[1] + 8}`;
  for (let k = 0; k < 26; k++) {
    const a = unit(k) * Math.PI * 2;
    const r = 8 + 22 * unit(k + 40);
    const b = unit(k + 80) * Math.PI * 2;
    d += `Q${(HEAD[0] + Math.cos(b) * 34).toFixed(1)} ${(HEAD[1] + Math.sin(b) * 34).toFixed(1)} ${(HEAD[0] + Math.cos(a) * r).toFixed(1)} ${(HEAD[1] + Math.sin(a) * r).toFixed(1)}`;
  }
  return d;
})();
const FRAGMENTS = Array.from({ length: 14 }, (_, k) => ({ start: (k * 360) / 14, drift: unit(k + 120), turn: unit(k + 160) - 0.5 }));
const QUESTIONS = [[-150, 128], [-62, 118], [-20, 146], [158, 150], [24, 132]].map(([angle, radius], k) => ({ place: polar(HEAD, radius, angle), k }));

/** What progress is measured in, each rising as it is named, while the person does not. */
const MACHINERY = [
  { word: "Producing more?", label: "OUTPUT", x: FIG_X + 320 },
  { word: "Predicting behavior?", label: "PREDICTION", x: FIG_X + 460 },
  { word: "Getting people to comply?", label: "COMPLIANCE", x: FIG_X + 600 },
];
const MACHINERY_BASE = FIG_Y + 110;
/**
 * The establishment as people: Uncle Sam, the leadership class, holding the strings; and the
 * scientific community in a lab coat, standing on money, prestige and power rather than above them.
 */
const SAM = { x: FIG_X + 800, y: 416, scale: 1.75 };
const SCIENTIST = { x: FIG_X + 380, y: 418, scale: 1.3 };
const PEDESTAL_TOP = SCIENTIST.y + 171 * SCIENTIST.scale + 6;
const FOUNDATIONS = [
  { word: "money", label: "MONEY", dx: -116 },
  { word: "prestige", label: "PRESTIGE", dx: 0 },
  { word: "power", label: "POWER", dx: 116 },
];
/** Uncle Sam's own parts, in the figure's coordinates: a striped top hat, goatee, bow tie, and a raised arm with the strings' control. */
const SAM_HAT = "M-40 -146H40M-23 -147L-26 -214H26L23 -147M-24 -162H24";
const SAM_STRIPES = "M-12 -166V-212M0 -166V-213M12 -166V-212";
const SAM_FACE = "M-7 -92L0 -77L7 -92M-9 -86L9 -79M9 -86L-9 -79";
const SAM_RAISED_ARM = "M-11 -72C-39 -70 -50 -84 -60 -118L-70 -168";
const SAM_CONTROL = "M-98 -174H-42M-70 -184V-164";
const SAM_TAILS = "M-36 -20L-50 92L-30 82M36 -20L50 92L30 82";
/** A five-pointed star of radius r at (x, y). */
const starPath = (x: number, y: number, r: number) =>
  `M${Array.from({ length: 10 }, (_, k) => {
    const radius = k % 2 ? r * 0.42 : r;
    const angle = (k * Math.PI) / 5 - Math.PI / 2;
    return `${(x + radius * Math.cos(angle)).toFixed(2)} ${(y + radius * Math.sin(angle)).toFixed(2)}`;
  }).join("L")}Z`;
/** The scientist's: lab coat, lapels, glasses and clipboard. */
const LAB_COAT = "M-38 -58L-46 112H-8M38 -58L46 112H8M-11 -72L0 -38L11 -72";
const LAB_GLASSES = "M-17 -122A7 7 0 1 0 -3 -122A7 7 0 1 0 -17 -122M3 -122A7 7 0 1 0 17 -122A7 7 0 1 0 3 -122M-3 -122H3";
const CLIPBOARD = "M44 22H70V60H44ZM50 32H64M50 40H64M50 48H60";
/** Where a figure's own point lands in the world. */
const placed = (figure: { x: number; y: number; scale: number }, [px, py]: Point): Point => [figure.x + px * figure.scale, figure.y + py * figure.scale];
const SAM_STRING_FROM: readonly Point[] = [placed(SAM, [-98, -174]), placed(SAM, [-70, -174]), placed(SAM, [-42, -174])];
const SCIENTIST_STRUNG: readonly Point[] = [placed(SCIENTIST, [-49, 63]), placed(SCIENTIST, [0, -150]), placed(SCIENTIST, [49, 63])];
const CLIPBOARD_AT = placed(SCIENTIST, [44, 40]);

/** What research can be made to do to a person, each landing where it acts on them. */
const BODY_POINTS = [
  { word: "predict,", label: "PREDICTED", at: HEAD },
  { word: "persuade,", label: "PERSUADED", at: [FIG_X + 40, FIG_Y - 92] as Point },
  { word: "endure more", label: "ENDURE MORE", at: [FIG_X, FIG_Y - 4] as Point },
  { word: "control", label: "CONTROLLED", at: [FIG_X - 76, FIG_Y + 92] as Point },
];
/** The sky over the culture scene at night. */
const NIGHT_STARS = Array.from({ length: 36 }, (_, k) => [hash(k * 1.9 + 0.4) * 1400 - 60, 40 + hash(k * 3.3 + 0.2) * 300, 1.2 + 1.8 * hash(k * 6.1)] as const)
  .filter(([x, y]) => Math.hypot(x - FIG_X, y - 380) > 340);
/** What insecurity keeps a person buying: each fills the circle and drains away. */
const GAINS = ["PURCHASE", "UPGRADE", "APPROVAL", "STATUS", "REASSURANCE"];
const RINGS = [
  { word: "family", label: "FAMILY", r: 130, angle: -6 },
  { word: "school", label: "SCHOOL", r: 165, angle: -174 },
  { word: "employer", label: "EMPLOYER", r: 200, angle: -30 },
  { word: "what to want", label: "WANTS", r: 235, angle: -150 },
  { word: "whom to believe", label: "BELIEFS", r: 270, angle: -52 },
  { word: "which questions", label: "QUESTIONS", r: 305, angle: -128 },
];

function personCamera(seconds: number) {
  const health = shotOf("health").start;
  const inherited = shotOf("inherited").start;
  const unfulfilled = shotOf("unfulfilled").start;
  const end = shotOf("unfulfilled").end;
  const keys: (readonly [number, number, number, number])[] = [
    [shotOf("confused").start, FIG_X + 170, 360, 1.6],
    [health - 0.2, FIG_X + 170, 360, 1.6],
    [health + 2.4, FIG_X + 330, 440, 1],
    [inherited - 0.2, FIG_X + 330, 440, 1],
    [inherited + 2.6, FIG_X, 440, 1.18],
    [unfulfilled - 0.2, FIG_X, 440, 1.18],
    [unfulfilled + 2.4, FIG_X, 395, 1.85],
    [end - 2, FIG_X, 395, 1.85],
    [end, CAMERA[0][1], CAMERA[0][2], CAMERA[0][3]],
  ];
  const index = keys.findIndex(([at]) => at > seconds);
  if (index <= 0) {
    const [, x, y, s] = index === 0 ? keys[0] : keys.at(-1)!;
    return { x, y, s };
  }
  const [a, ax, ay, as] = keys[index - 1];
  const [b, bx, by, bs] = keys[index];
  const u = smooth(seconds, a, b);
  return { x: lerp(ax, bx, u), y: lerp(ay, by, u), s: Math.exp(lerp(Math.log(as), Math.log(bs), u)) };
}

function TrailerPerson({ seconds }: { seconds: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade, ink, clay, gold, stage } = useContext(TrailerPalette);
  const cam = personCamera(seconds);
  const s = cam.s;
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`;
  const confused = shotOf("confused");
  const health = shotOf("health");
  const unfulfilled = shotOf("unfulfilled");
  const inherited = shotOf("inherited");
  // The person declines through progress, the establishment and the culture, and stays diminished
  // until DOT asks what it would mean for them to develop (the next scene finds them upright).
  const decline = smooth(seconds, confused.start, inherited.end);
  const label = { fontFamily: "JetBrains Mono, monospace", letterSpacing: 3 / s, fontSize: 34 / s, textAnchor: "middle" as const, stroke: stage, strokeWidth: 6 / s, paintOrder: "stroke" as const };

  // Confusion.
  const inConfusion = seconds < confused.end ? smooth(seconds, confused.start, confused.start + 1) : 0;
  const tangled = smooth(seconds, confused.start + 0.4, confused.end - 1);
  // Attention breaks apart as progress is measured in output, prediction and compliance.
  const fragmenting = smooth(seconds, wordAt("confused", "Producing more?"), wordAt("confused", "regression"));

  // The machinery keeps rising after it is named; the person's attention does not.
  const rising = smooth(seconds, wordAt("confused", "Getting people"), wordAt("confused", "regression") + 2);

  // The establishment: Uncle Sam arrives with the word, then the scientific community on money,
  // prestige and power; his strings answer "whose purposes", and the clipboard reaches the person
  // where it predicts, persuades, controls, and asks them to endure.
  const inBody = smooth(seconds, health.start, health.start + 1.6) * (1 - smooth(seconds, inherited.start, inherited.start + 1.4));
  const sam = smooth(seconds, wordAt("health", "establishment"), wordAt("health", "establishment") + 2);
  const scientist = smooth(seconds, wordAt("health", "scientific community"), wordAt("health", "scientific community") + 2);
  const strung = smooth(seconds, wordAt("health", "whose purposes"), wordAt("health", "whose purposes") + 1.6);

  // Why it persists: each thing bought for security fills the circle, and drains faster than the last.
  const inEmpty = smooth(seconds, unfulfilled.start, unfulfilled.start + 1.4) * (1 - smooth(seconds, unfulfilled.end - 1.6, unfulfilled.end));
  const gainStart = unfulfilled.start + 1;
  const gainEnd = wordAt("unfulfilled", "The rewards") + 2;
  // Named, the extraction shows: the circle leaks.
  const leak = smooth(seconds, wordAt("unfulfilled", "somebody can profit"), wordAt("unfulfilled", "somebody can profit") + 1) * (1 - smooth(seconds, gainEnd, gainEnd + 1.2));
  const gainStep = (gainEnd - gainStart) / GAINS.length;
  const gains = GAINS.map((name, k) => ({ name, at: gainStart + gainStep * k }));
  const hold = gainStep - 0.1;
  const level = Math.max(0, ...gains.map(({ at }, k) => (seconds >= at + 1.2 ? Math.exp(-(seconds - at - 1.2) * (0.7 + 0.25 * k)) : 0))) * (1 - smooth(seconds, gainEnd, gainEnd + 1));
  const R = 44;
  // The circle sits on the chest of the figure as it now stands: shrinking settles toward the feet.
  const figureScale = FIG * (1 - 0.12 * decline);
  const chestY = FIG_Y + 171 * (FIG - figureScale) - 36 * figureScale;

  // The culture inside you: the rings draw in as its expectations start to sound like your own
  // thoughts, and soften when we ask how to help one another get free.
  const inRings = smooth(seconds, inherited.start, inherited.start + 1.4);
  const drawIn = 1 - 0.16 * smooth(seconds, wordAt("inherited", "Eventually"), wordAt("inherited", "By the time") + 2);
  const soften = smooth(seconds, wordAt("inherited", "I am asking how"), inherited.end - 1);
  const ringsLeave = smooth(seconds, inherited.end - 2.4, inherited.end - 0.4);
  // At night the words you were afraid to say; in the morning, back to proving your worth.
  const night = smooth(seconds, wordAt("inherited", "at night") - 0.4, wordAt("inherited", "at night") + 0.8)
    * (1 - smooth(seconds, wordAt("inherited", "in the morning"), wordAt("inherited", "in the morning") + 1.2));
  const morning = smooth(seconds, wordAt("inherited", "in the morning"), wordAt("inherited", "in the morning") + 1.2)
    * (1 - smooth(seconds, wordAt("inherited", "I am not describing") - 0.6, wordAt("inherited", "I am not describing") + 0.6));
  const SKY: Point = [FIG_X + 470, 160];

  return (
    <div className="dark-trailer-stage">
      <svg className="dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor={jade} stopOpacity=".42" />
            <stop offset="1" stopColor={jade} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-hurt`}>
            <stop offset="0" stopColor={clay} stopOpacity=".62" />
            <stop offset="1" stopColor={clay} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={gold} stopOpacity="0" />
            <stop offset=".5" stopColor={gold} stopOpacity=".07" />
            <stop offset="1" stopColor={gold} stopOpacity=".12" />
          </linearGradient>
          <clipPath id={`${uid}-level`}>
            {/* The surface moves, so it reads as something poured, not a gauge. */}
            <path d={(() => {
              const top = chestY + R - 2 * R * level;
              const wave = Array.from({ length: 13 }, (_, k) => {
                const x = CHEST[0] - R + (k * 2 * R) / 12;
                return `L${x.toFixed(1)} ${(top + 3.2 * Math.sin(seconds * 3.1 + k * 0.9)).toFixed(1)}`;
              }).join("");
              return `M${CHEST[0] - R} ${chestY + R}${wave}L${CHEST[0] + R} ${chestY + R}Z`;
            })()} />
          </clipPath>
        </defs>
        <g transform={world}>
          {inRings > 0.001 && (
            <g fill="none" opacity={inRings * (1 - 0.45 * soften) * (1 - ringsLeave)}>
              {RINGS.map(({ word, label: name, r, angle }) => {
                const at = wordAt("inherited", word);
                const drawnIn = smooth(seconds, at - 0.1, at + 1.3);
                if (drawnIn <= 0.001) return null;
                // The names sway together around the person, slowly, so the layout never collides.
                const orbit = 12 * Math.sin((seconds - inherited.start) * 0.045);
                const place = polar([FIG_X, FIG_Y - 20], r * drawIn, angle + orbit);
                return (
                  <g key={name}>
                    <circle cx={FIG_X} cy={FIG_Y - 20} r={r * drawIn} stroke={ink} strokeWidth={(1.3 * WEIGHT) / s} {...drawn(drawnIn)} transform={`rotate(-90 ${FIG_X} ${FIG_Y - 20})`} opacity={0.62} />
                    <text x={place[0]} y={place[1] + 8 / s} fill={ink} opacity={smooth(seconds, at + 0.3, at + 1)} {...label}>{name}</text>
                  </g>
                );
              })}
            </g>
          )}

          {inBody > 0.001 && (
            <g opacity={inBody} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <g opacity={sam}>
                {/* The light of power falls on him from above. */}
                <path d={`M${SAM.x - 60} -400L${SAM.x + 60} -400L${SAM.x + 230} ${SAM.y + 171 * SAM.scale}L${SAM.x - 230} ${SAM.y + 171 * SAM.scale}Z`} fill={`url(#${uid}-beam)`} stroke="none" />
                <Ground x={SAM.x} y={SAM.y + 171 * SAM.scale} width={120 * SAM.scale} />
                <g transform={`translate(${SAM.x} ${SAM.y}) scale(${SAM.scale})`} stroke={ink} strokeWidth={(2.4 * WEIGHT) / (s * SAM.scale)}>
                  {BODY_PATHS.filter((_, k) => k !== 2).map((d) => <path key={d} d={d} {...drawn(sam)} />)}
                  <path d={SAM_RAISED_ARM} {...drawn(sam)} />
                  <path d={SAM_HAT} />
                  {[-14, 0, 14].map((dx) => <path key={dx} d={starPath(dx, -154, 5)} fill={ink} stroke="none" />)}
                  <path d={SAM_TAILS} />
                  <path d={SAM_STRIPES} stroke={clay} />
                  <path d={SAM_FACE} />
                  <path d={SAM_CONTROL} stroke={gold} />
                </g>
                <text x={SAM.x} y={SAM.y + 171 * SAM.scale + 44} fill={ink} {...label} fontSize={30 / s} letterSpacing={4 / s} strokeWidth={4 / s}>UNCLE SAM</text>
              </g>
              <g opacity={scientist}>
                <Ground x={SCIENTIST.x} y={PEDESTAL_TOP + 40} width={150} />
                <g transform={`translate(${SCIENTIST.x} ${SCIENTIST.y}) scale(${SCIENTIST.scale})`} stroke={ink} strokeWidth={(2.4 * WEIGHT) / (s * SCIENTIST.scale)}>
                  {BODY_PATHS.map((d) => <path key={d} d={d} {...drawn(scientist)} />)}
                  <path d={LAB_COAT} />
                  <path d={LAB_GLASSES} />
                  <path d={CLIPBOARD} stroke={gold} />
                </g>
                <text x={SCIENTIST.x} y={PEDESTAL_TOP + 82} fill={ink} {...label} fontSize={25 / s} letterSpacing={2.4 / s} strokeWidth={4 / s}>THE SCIENTIFIC COMMUNITY</text>
              </g>
              {FOUNDATIONS.map(({ word, label: name, dx }) => {
                const shown = smooth(seconds, wordAt("health", word), wordAt("health", word) + 0.7);
                const x = SCIENTIST.x + dx;
                return (
                  <g key={name}>
                    {/* The scientist stands on the pedestal from the start; each block is named as it is said. */}
                    <rect x={x - 56} y={PEDESTAL_TOP} width={112} height={40} rx={3} stroke={gold} strokeWidth={(1.4 * WEIGHT) / s} opacity={Math.max(shown, 0.45 * scientist)} />
                    <text x={x} y={PEDESTAL_TOP + 27} fill={gold} {...label} fontSize={21 / s} letterSpacing={1.6 / s} strokeWidth={3 / s} opacity={shown}>{name}</text>
                  </g>
                );
              })}
              {strung > 0.001 && SAM_STRING_FROM.map((from, k) => {
                const to = SCIENTIST_STRUNG[k];
                const sway = Math.sin(seconds * 1.3 + k) * 8;
                return <path key={k} d={`M${from[0]} ${from[1]}Q${(from[0] + to[0]) / 2 + sway} ${(from[1] + to[1]) / 2 + 30} ${to[0]} ${to[1]}`} stroke={clay} strokeWidth={(1.2 * WEIGHT) / s} opacity={0.8} {...drawn(strung)} />;
              })}
            </g>
          )}
          {inBody > 0.001 && BODY_POINTS.map(({ word, label: name, at }) => {
            const start = wordAt("health", word);
            const lit = smooth(seconds, start, start + 0.7);
            if (lit <= 0.001) return null;
            const endX = FIG_X - 250;
            const pulse = 0.82 + 0.18 * Math.sin(seconds * 2.4 + at[1]);
            const reach = smooth(seconds, start, start + 1.2);
            return (
              <g key={name} opacity={lit * inBody}>
                <path d={`M${CLIPBOARD_AT[0]} ${CLIPBOARD_AT[1]}L${at[0]} ${at[1]}`} fill="none" stroke={gold} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${7 / s}`} opacity={0.35 * reach} />
                <circle cx={at[0]} cy={at[1]} r={46} fill={`url(#${uid}-hurt)`} opacity={pulse} />
                <path d={`M${at[0]} ${at[1]}L${endX} ${at[1]}`} fill="none" stroke={clay} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${6 / s}`} opacity={0.7} />
                <text x={endX - 100} y={at[1] + 8 / s} fill={clay} {...label}>{name}</text>
              </g>
            );
          })}

          {inRings > 0.001 && seconds < inherited.end && <circle cx={CHEST[0]} cy={CHEST[1]} r={90} fill={`url(#${uid}-glow)`} opacity={soften * (1 - smooth(seconds, inherited.end - 1.2, inherited.end))} />}
          <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} opacity={1 - 0.34 * decline} shrink={decline} />
          {night > 0.001 && <rect x={-1000} y={-1000} width={3600} height={3000} fill={stage} opacity={0.42 * night} />}
          {night > 0.001 && NIGHT_STARS.map(([x, y, size], k) => (
            <circle key={k} cx={x} cy={y} r={size} fill={ink} opacity={night * (0.35 + 0.35 * Math.sin(seconds * 1.7 + k * 2.3))} />
          ))}
          {night > 0.001 && (
            <g opacity={night}>
              <circle cx={SKY[0]} cy={SKY[1]} r={26} fill={ink} opacity={0.85} />
              <circle cx={SKY[0] + 11} cy={SKY[1] - 7} r={24} fill={stage} />
            </g>
          )}
          {morning > 0.001 && (
            <g opacity={morning} transform={`translate(0 ${(30 * (1 - morning)).toFixed(2)})`}>
              <circle cx={SKY[0]} cy={SKY[1]} r={20} fill={gold} opacity={0.85} />
              {Array.from({ length: 8 }, (_, k) => {
                const a = polar(SKY, 32, k * 45);
                const b = polar(SKY, 44, k * 45);
                return <path key={k} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={gold} strokeWidth={(1.8 * WEIGHT) / s} strokeLinecap="round" />;
              })}
            </g>
          )}

          {inConfusion > 0.001 && (
            <g fill="none" strokeLinecap="round" opacity={inConfusion}>
              <path d={TANGLE} stroke={clay} strokeWidth={(1.3 * WEIGHT) / s} {...drawn(tangled)} />
              {FRAGMENTS.map(({ start, drift, turn }, k) => {
                const radius = 88 + 74 * drift * fragmenting;
                const shift = start + turn * 70 * fragmenting;
                const a = polar(HEAD, radius, shift);
                const b = polar(HEAD, radius, shift + 360 / 14 - 7);
                return <path key={k} d={`M${a[0]} ${a[1]}A${radius} ${radius} 0 0 1 ${b[0]} ${b[1]}`} stroke={jade} strokeWidth={(1.8 * WEIGHT) / s} opacity={1 - 0.45 * fragmenting * drift} />;
              })}
              <path d={`M${MACHINERY[0].x - 50} ${MACHINERY_BASE}H${MACHINERY.at(-1)!.x + 50}`} stroke={ink} strokeWidth={WEIGHT / s} opacity={0.5 * smooth(seconds, wordAt("confused", "Producing more?") - 0.6, wordAt("confused", "Producing more?"))} />
              {[1, 2, 3, 4].map((k) => (
                <path key={k} d={`M${MACHINERY[0].x - 60} ${MACHINERY_BASE - 90 * k}H${MACHINERY.at(-1)!.x + 60}`} stroke={ink} strokeWidth={WEIGHT / s} strokeDasharray={`${2 / s} ${8 / s}`}
                  opacity={0.18 * smooth(seconds, wordAt("confused", "Producing more?") - 0.6, wordAt("confused", "Producing more?") + 0.6)} />
              ))}
              {MACHINERY.map(({ word, label: name, x }, k) => {
                const named = smooth(seconds, wordAt("confused", word), wordAt("confused", word) + 1.4);
                if (named <= 0.001) return null;
                const height = named * (120 + 30 * k) + rising * (110 + 25 * k);
                return (
                  <g key={name}>
                    <rect x={x - 28} y={MACHINERY_BASE - height} width={56} height={height} fill={gold} fillOpacity={0.16} stroke={gold} strokeWidth={(1.6 * WEIGHT) / s} />
                    <path d={`M${x - 10} ${MACHINERY_BASE - height - 14}L${x} ${MACHINERY_BASE - height - 28}L${x + 10} ${MACHINERY_BASE - height - 14}Z`} fill={gold} stroke="none" opacity={named} />
                    <text x={x} y={MACHINERY_BASE + 36} fill={gold} {...label} fontSize={25 / s} letterSpacing={1.6 / s} strokeWidth={4 / s} opacity={named}>{name}</text>
                  </g>
                );
              })}
              {/* The trend: up and to the right, whatever happens to the person. */}
              {rising > 0.001 && (
                <path d={`M${MACHINERY.map(({ x }, k) => `${x} ${MACHINERY_BASE - (120 + 30 * k) - rising * (110 + 25 * k) - 46}`).join("L")}`} fill="none" stroke={gold} strokeWidth={(1.4 * WEIGHT) / s} strokeDasharray={`${4 / s} ${5 / s}`} opacity={0.7 * rising} />
              )}
              {QUESTIONS.map(({ place, k }) => {
                const at = wordAt("confused", "advanced at what?") + k * 1.6;
                return <text key={k} x={place[0]} y={place[1]} fill={ink} stroke="none" fontFamily="Source Serif 4, Georgia, serif" fontSize={30 / s + 6} textAnchor="middle" opacity={0.75 * smooth(seconds, at, at + 1) * (0.55 + 0.45 * Math.sin(seconds * 0.9 + k))}>?</text>;
              })}
            </g>
          )}

          {inEmpty > 0.001 && (
            <g opacity={inEmpty}>
              <circle cx={CHEST[0]} cy={chestY} r={R} fill={stage} stroke={ink} strokeWidth={(1.8 * WEIGHT) / s} strokeDasharray={level < 0.02 ? `${5 / s} ${7 / s}` : undefined} />
              <circle cx={CHEST[0]} cy={chestY} r={R - 3} fill={gold} opacity={0.75} clipPath={`url(#${uid}-level)`} />
              {leak > 0.001 && [0, 1, 2].map((n) => {
                const fall = (seconds * 0.9 + n / 3) % 1;
                return <circle key={n} cx={CHEST[0]} cy={chestY + R + 8 + 70 * fall * fall} r={4.5} fill={clay} opacity={leak * (1 - fall)} />;
              })}
              {gains.map(({ name, at }) => {
                const fall = between(seconds, at, at + 1.3);
                if (fall <= 0 || seconds > at + hold) return null;
                const eased = fall * fall;
                const y = lerp(chestY - 300, chestY - 10, eased);
                return (
                  <g key={name}>
                    <path d={`M${FIG_X} ${y - 13}L${FIG_X + 13} ${y}L${FIG_X} ${y + 13}L${FIG_X - 13} ${y}Z`} fill={gold} opacity={smooth(seconds, at, at + 0.2) * (1 - smooth(seconds, at + 1.2, at + 1.4))} />
                    <text x={FIG_X + 210} y={chestY + 10} fill={gold} {...label} opacity={smooth(seconds, at, at + 0.3) * (1 - smooth(seconds, at + hold - 0.4, at + hold))}>{name}</text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

/* ── Where to begin: the measuring box, then experience, the senses, and feeling as data ── */
/** The five senses, each a stream from its own direction, named at the edge of the frame. */
const SENSES: readonly { name: string; angle: number; label: Point; color: keyof Palette }[] = [
  { name: "SIGHT", angle: -145, label: [300, 222], color: "gold" },
  { name: "SMELL", angle: -90, label: [640, 150], color: "ink" },
  { name: "SOUND", angle: -35, label: [980, 222], color: "jade" },
  { name: "TOUCH", angle: 170, label: [170, 476], color: "ink" },
  { name: "TASTE", angle: 10, label: [1110, 476], color: "gold" },
];
const SENSE_PARTICLES = Array.from({ length: 170 }, (_, k) => {
  const sense = SENSES[k % SENSES.length];
  const angle = ((sense.angle + (hash(k + 1.7) - 0.5) * 26) * Math.PI) / 180;
  const radius = 640 + 140 * hash(k + 2.3);
  return {
    spawn: 7 * hash(k + 0.1),
    life: 1.5 + 1.1 * hash(k + 0.6),
    from: [FIG_X + Math.cos(angle) * radius, 420 + Math.sin(angle) * radius] as Point,
    to: [FIG_X + (hash(k + 3.1) - 0.5) * 120, 420 + (hash(k + 4.4) - 0.5) * 380] as Point,
    color: sense.color,
    size: 3.2 + 1.2 * hash(k + 5.2),
  };
});

function TrailerBegin({ seconds }: { seconds: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const palette = useContext(TrailerPalette);
  const { jade, clay, stage } = palette;
  const turn = shotOf("turn");
  const cue = (word: string) => wordAt("turn", word);
  const measure = cue("not a measurement");
  const experience = cue("experience one");
  const observer = cue("The observer");
  const feeling = cue("Feeling must");
  const framework = cue("Digital Organism Theory");
  // Wide for the box and the senses, then in on the person for the purpose that follows.
  const keys: (readonly [number, number, number, number])[] = [
    [turn.start, CAMERA[0][1], CAMERA[0][2], CAMERA[0][3]],
    [measure - 0.6, CAMERA[0][1], CAMERA[0][2], CAMERA[0][3]],
    [measure + 1.4, FIG_X, 450, 1.1],
    [feeling - 0.6, FIG_X, 440, 1.05],
    [feeling + 1.4, FIG_X, 400, 1.55],
    [framework - 0.6, FIG_X, 400, 1.55],
    [framework + 2, FIG_X, 440, 1.05],
    [turn.end - 1, CAMERA[1][1], CAMERA[1][2], CAMERA[1][3]],
  ];
  const index = keys.findIndex(([at]) => at > seconds);
  const [a, ax, ay, as] = keys[Math.max(0, (index < 0 ? keys.length : index) - 1)];
  const [b, bx, by, bs] = keys[index < 0 ? keys.length - 1 : index];
  const u = index <= 0 ? (index === 0 ? 0 : 1) : smooth(seconds, a, b);
  const s = Math.exp(lerp(Math.log(as), Math.log(bs), u));
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-lerp(ax, bx, u)).toFixed(2)} ${(-lerp(ay, by, u)).toFixed(2)})`;

  const beat = heartbeat(trailerDrawingTime(seconds));
  const develop = smooth(seconds, cue("to develop"), cue("to develop") + 2);
  // Unless we address our own conditioning, the pain continues.
  const pain = smooth(seconds, cue("the pain continues"), cue("the pain continues") + 0.8) * (1 - smooth(seconds, measure - 0.6, measure + 0.4));
  // Not a measurement: the lens snaps shut, and cause and effect press in from both sides.
  const snap = smooth(seconds, measure, measure + 0.65);
  const boxScale = lerp(1.7, 1, snap) + 0.035 * Math.sin(Math.PI * between(seconds, measure + 0.65, measure + 1.2));
  const push = smooth(seconds, measure + 1.1, measure + 3.1) * (1 - smooth(seconds, experience - 0.4, experience + 0.8));
  const lens = smooth(seconds, measure + 1.5, measure + 2.3) * (1 - smooth(seconds, experience - 0.4, experience + 0.6));
  // You are here to experience one: the box loosens, the light grows.
  const loosen = smooth(seconds, experience, experience + 2.4);
  const presence = smooth(seconds, experience, experience + 3);
  // The observer belongs in the inquiry: the senses pour in.
  const immersion = smooth(seconds, observer, observer + 3) * (1 - smooth(seconds, feeling - 1, feeling + 1));
  // Feeling is data, not automatically truth.
  const knot = smooth(seconds, feeling, feeling + 1.2) * (1 - smooth(seconds, framework - 1, framework + 0.5));
  const data = smooth(seconds, cue("treated as data"), cue("treated as data") + 0.8);
  const truth = smooth(seconds, cue("not automatically truth"), cue("not automatically truth") + 0.8);
  // The framework draws around the person, and gives way as the view moves in.
  const ring = smooth(seconds, framework, framework + 2.4) * (1 - smooth(seconds, turn.end - 6, turn.end - 2));
  const label = { fontFamily: "JetBrains Mono, monospace", letterSpacing: 3 / s, fontSize: 26 / s, textAnchor: "middle" as const, stroke: stage, strokeWidth: 5 / s, paintOrder: "stroke" as const };
  return (
    <div className="dark-trailer-stage">
      <svg className="dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-jade`}>
            <stop offset="0" stopColor={jade} stopOpacity=".55" />
            <stop offset=".45" stopColor={jade} stopOpacity=".16" />
            <stop offset="1" stopColor={jade} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={world}>
          {/* The senses build the world the observer is part of. */}
          {immersion > 0.001 && SENSE_PARTICLES.map((particle, k) => {
            const life = (seconds - observer - particle.spawn) / particle.life;
            const cycle = life - Math.floor(life);
            if (life < 0) return null;
            const eased = cycle ** 1.6;
            const p: Point = [lerp(particle.from[0], particle.to[0], eased), lerp(particle.from[1], particle.to[1], eased)];
            const back = Math.max(0, eased - 0.09);
            const tail: Point = [lerp(particle.from[0], particle.to[0], back), lerp(particle.from[1], particle.to[1], back)];
            return (
              <g key={k} opacity={Math.sin(Math.PI * cycle) * immersion}>
                <line x1={tail[0]} y1={tail[1]} x2={p[0]} y2={p[1]} stroke={palette[particle.color]} strokeWidth={(1.8 * WEIGHT) / s} strokeLinecap="round" opacity={0.75} />
                <circle cx={p[0]} cy={p[1]} r={particle.size / s} fill={palette[particle.color]} />
              </g>
            );
          })}
          {immersion > 0.001 && SENSES.map((sense, k) => (
            <text key={sense.name} x={sense.label[0]} y={sense.label[1]} fill={palette[sense.color]} {...label} letterSpacing={6 / s}
              opacity={immersion * smooth(seconds, observer + 0.5 + 0.35 * k, observer + 1.3 + 0.35 * k)}>
              {sense.name}
            </text>
          ))}
          {ring > 0.001 && (
            <g fill="none" opacity={ring}>
              <circle cx={FIG_X} cy={FIG_Y - 30} r={330} stroke={jade} strokeWidth={(2.2 * WEIGHT) / s} transform={`rotate(-90 ${FIG_X} ${FIG_Y - 30})`} {...drawn(ring)} />
              <circle cx={FIG_X} cy={FIG_Y - 30} r={300} stroke={jade} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${9 / s}`} opacity={0.5} />
            </g>
          )}
          <MeasuringBox
            cx={FIG_X} cy={FIG_Y + 10} scale={boxScale * (1 + 0.18 * loosen)} opacity={(seconds >= measure ? 1 : 0) * (1 - loosen)}
            loosen={loosen} px={2.2} s={s}
          />
          {push > 0.001 && [330, 460, 590].map((y) => (
            <g key={y}>
              <Arrow from={[BOX.x - 200 - 260 * (1 - push), y]} to={[BOX.x - 14 - 120 * (1 - push), y]} px={2} s={s} color={clay} opacity={push} />
              <Arrow from={[BOX.x + BOX.w + 200 + 260 * (1 - push), y]} to={[BOX.x + BOX.w + 14 + 120 * (1 - push), y]} px={2} s={s} color={clay} opacity={push} />
            </g>
          ))}
          {lens > 0.001 && <text x={FIG_X} y={BOX.y - 38} fill={clay} {...label} fontSize={30 / s} letterSpacing={4 / s} opacity={lens}>CAUSE → EFFECT</text>}
          <circle cx={CHEST[0]} cy={CHEST[1]} r={70 + 90 * presence} fill={`url(#${uid}-jade)`} opacity={Math.min(1, beat * 0.9 + 0.3 * develop + 0.6 * presence)} />
          <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} opacity={1 - 0.25 * snap * (1 - loosen)} />
          <PainRings at={CHEST} phase={0.37} t={seconds} opacity={pain} s={s} />
          {knot > 0.001 && (
            <g opacity={knot} fill="none">
              {[0, 120, 240].map((angle) => {
                const c = polar(CHEST, 13, angle - 90);
                return <circle key={angle} cx={c[0]} cy={c[1]} r={20} stroke={clay} strokeWidth={(2 * WEIGHT) / s} />;
              })}
              <path d={`M${CHEST[0] + 44} ${CHEST[1]}H${CHEST[0] + 190}`} stroke={jade} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${6 / s}`} opacity={data} />
              <text x={CHEST[0] + 250} y={CHEST[1] + 9 / s} fill={jade} {...label} opacity={data}>DATA</text>
              <path d={`M${CHEST[0] - 44} ${CHEST[1]}H${CHEST[0] - 190}`} stroke={clay} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${6 / s}`} opacity={truth} />
              <text x={CHEST[0] - 260} y={CHEST[1] + 9 / s} fill={clay} {...label} opacity={truth}>TRUTH?</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

/* ── The American Millennial Manifesto's own illustration, for the culture's moral erosion ── */
type PlateKind = keyof typeof TRAILER_PLATES;
const isPlate = (kind: string): kind is PlateKind => kind in TRAILER_PLATES;
/** Past the waiting frame, so the illustrations load once a viewer has pressed Play, never with the page. */
const PLATES_LOAD_AFTER = 12;
let platesRequested = false;
function requestPlates() {
  if (platesRequested) return;
  platesRequested = true;
  for (const { src } of Object.values(TRAILER_PLATES)) new Image().src = src;
}
const PLATE_HEIGHT = 680;
/** Where the illustration sits on the stage: whole, clear of the caption band. */
const PLATE_CENTRE_Y = 405;
const PLATE_WIDTH = PLATE_HEIGHT * 1.5;

/** One illustration, held and slowly explored. The camera is an SVG transform, so it never jitters. */
function TrailerPlate({ kind, progress }: { kind: PlateKind; progress: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { gold, jade } = useContext(TrailerPalette);
  const { src, from, to } = TRAILER_PLATES[kind];
  const eased = progress * progress * (3 - 2 * progress);
  const x = lerp(from[0], to[0], eased);
  const y = lerp(from[1], to[1], eased);
  const scale = lerp(from[2], to[2], eased);
  return (
    <div className="dark-trailer-stage">
      <svg className="dark-trailer-plate" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-halo`}>
            <stop offset="0" stopColor={gold} stopOpacity=".16" />
            <stop offset=".6" stopColor={jade} stopOpacity=".05" />
            <stop offset="1" stopColor={jade} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-shadow`}>
            <stop offset="0" stopColor="#000" stopOpacity=".55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(800 ${PLATE_CENTRE_Y}) scale(${scale.toFixed(5)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})`}>
          <ellipse cx={800} cy={450} rx={PLATE_WIDTH * 0.42} ry={PLATE_HEIGHT * 0.5} fill={`url(#${uid}-halo)`} />
          <ellipse cx={800} cy={450 + PLATE_HEIGHT * 0.4} rx={PLATE_WIDTH * 0.36} ry={40} fill={`url(#${uid}-shadow)`} />
          <image href={src} x={800 - PLATE_WIDTH / 2} y={450 - PLATE_HEIGHT / 2} width={PLATE_WIDTH} height={PLATE_HEIGHT} preserveAspectRatio="xMidYMid meet" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Two lenses: the Manifesto's illustration looks outward at the arrangement; as Digital Organism
 * Theory "looks inward", it moves aside and the person, with the light at their chest, stands beside it.
 */
function TrailerLenses({ seconds }: { seconds: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade } = useContext(TrailerPalette);
  const shot = shotOf("lenses");
  const outward = smooth(seconds, wordAt("lenses", "looks outward"), wordAt("lenses", "looks outward") + 1.2);
  const inward = smooth(seconds, wordAt("lenses", "looks inward") - 0.6, wordAt("lenses", "looks inward") + 1.6);
  const beat = 0.85 + 0.15 * Math.sin(seconds * 2.2);
  return (
    <>
      <div className="dark-trailer-lens" style={{ transform: `translateX(${(-21 * inward).toFixed(2)}%) scale(${(1 - 0.2 * inward).toFixed(3)})` }}>
        <TrailerPlate kind="lenses" progress={(seconds - shot.start) / (shot.end - shot.start)} />
        <p className="dark-trailer-lens-label" style={{ opacity: outward }}>The Manifesto · outward</p>
      </div>
      {inward > 0.001 && (
        <div className="dark-trailer-lens dark-trailer-lens--inward" style={{ opacity: inward }}>
          <svg className="dark-trailer-drawing" viewBox={`${FIG_X - 320} ${FIG_Y - 330} 640 760`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <radialGradient id={`${uid}-in`}>
                <stop offset="0" stopColor={jade} stopOpacity=".6" />
                <stop offset=".5" stopColor={jade} stopOpacity=".14" />
                <stop offset="1" stopColor={jade} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={CHEST[0]} cy={CHEST[1]} r={150} fill={`url(#${uid}-in)`} opacity={beat} />
            <Figure x={FIG_X} y={FIG_Y} px={2.4} cameraScale={0.9} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={7} fill={jade} />
          </svg>
          <p className="dark-trailer-lens-label dark-trailer-lens-label--inward">Digital Organism Theory · inward</p>
        </div>
      )}
    </>
  );
}

/* ── The purpose: awareness widening from the person, and coherence with room for correction ── */
const DIVISIONS = Array.from({ length: 8 }, (_, k) => ({ start: (k * 360) / 8 + 10, drift: unit(k + 200), turn: unit(k + 240) - 0.5 }));

/** Points of the world that come into view as awareness widens, kept clear of the person. */
const FIELD_STARS = (() => {
  const stars: { p: Point; d: number; size: number; tone: "ink" | "jade" | "gold" }[] = [];
  for (let k = 0; stars.length < 92 && k < 1200; k++) {
    const p: Point = [60 + hash(k * 1.7 + 0.3) * 1560, 40 + hash(k * 2.9 + 0.1) * 720];
    const d = Math.hypot(p[0] - CHEST[0], (p[1] - CHEST[1]) * 1.2);
    // A clear column around the person: the field surrounds them, never crosses them.
    if (d < 200 || Math.abs(p[0] - FIG_X) < 160 || stars.some((star) => Math.hypot(star.p[0] - p[0], star.p[1] - p[1]) < 72)) continue;
    const tone = hash(k * 4.1 + 0.8);
    stars.push({ p, d, size: 2.2 + 3.4 * hash(k * 5.3), tone: tone < 0.62 ? "ink" : tone < 0.86 ? "jade" : "gold" });
  }
  return stars;
})();
/** Understanding: each point joined to its nearest neighbours. */
const FIELD_LINKS = FIELD_STARS.flatMap((star, i) =>
  FIELD_STARS.map((other, j) => ({ i, j, length: Math.hypot(star.p[0] - other.p[0], star.p[1] - other.p[1]) }))
    .filter(({ j, length }) => j > i && length < 170)
    .sort((x, y) => x.length - y.length)
    .slice(0, 2),
);
/** Choosing: one way through the field, from the person outward. */
const CHOSEN: readonly Point[] = (() => {
  const path: Point[] = [CHEST];
  const used = new Set<number>();
  let at: Point = CHEST;
  for (let step = 0; step < 6; step++) {
    let best = -1;
    FIELD_STARS.forEach((star, k) => {
      if (used.has(k) || star.p[0] < at[0] + 40) return;
      const cost = Math.hypot(star.p[0] - at[0], (star.p[1] - at[1]) * 1.6);
      if (best < 0 || cost < Math.hypot(FIELD_STARS[best].p[0] - at[0], (FIELD_STARS[best].p[1] - at[1]) * 1.6)) best = k;
    });
    if (best < 0) break;
    used.add(best);
    at = FIELD_STARS[best].p;
    path.push(at);
  }
  return path;
})();
/** What you would rather avoid: a dim point off to one side, held in focus. */
const AVOIDED: Point = [CHEST[0] - 430, CHEST[1] - 170];
/** Far off on the floor, others doing the same work: lights only, no crowd. */
const OTHERS: readonly Point[] = [[FIG_X - 420, 650], [FIG_X + 520, 640], [FIG_X + 760, 662], [FIG_X + 1000, 646], [FIG_X + 300, 668]];

function TrailerPurpose({ seconds }: { seconds: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const palette = useContext(TrailerPalette);
  const { jade, ink, gold, clay } = palette;
  const purpose = shotOf("purpose");
  const cue = (word: string) => wordAt("purpose", word);
  // From the question's close view out to a wide field, in for coherence, and out again for one another.
  const keys: (readonly [number, number, number, number])[] = [
    [purpose.start, CAMERA[1][1], CAMERA[1][2], CAMERA[1][3]],
    [purpose.start + 1, CAMERA[1][1], CAMERA[1][2], CAMERA[1][3]],
    [purpose.start + 8, FIG_X + 230, 420, 0.95],
    [cue("internal coherence") - 1.5, FIG_X + 230, 420, 0.95],
    [cue("internal coherence") + 1.5, FIG_X, 400, 1.5],
    [cue("The purpose is not") - 1, FIG_X, 400, 1.5],
    [cue("The purpose is not") + 2, FIG_X + 230, 420, 0.95],
    [cue("And we can help") + 1, FIG_X + 200, 440, 0.9],
  ];
  const index = keys.findIndex(([at]) => at > seconds);
  const [a, ax, ay, as] = keys[Math.max(0, (index < 0 ? keys.length : index) - 1)];
  const [b, bx, by, bs] = keys[index < 0 ? keys.length - 1 : index];
  const u = index <= 0 ? (index === 0 ? 0 : 1) : smooth(seconds, a, b);
  const s = Math.exp(lerp(Math.log(as), Math.log(bs), u));
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-lerp(ax, bx, u)).toFixed(2)} ${(-lerp(ay, by, u)).toFixed(2)})`;

  // Awareness widens: the world comes into view from the person outward, and further still at the end.
  const expand = smooth(seconds, purpose.start + 0.6, cue("That requires"));
  const beyond = smooth(seconds, cue("could not see before"), cue("could not see before") + 3);
  const reach = 160 + 760 * expand + 900 * beyond;
  const understanding = smooth(seconds, cue("understanding"), cue("understanding") + 3);
  const choosing = smooth(seconds, cue("choosing"), cue("choosing") + 2.4);
  const focus = smooth(seconds, cue("mental focus"), cue("mental focus") + 1.5) * (1 - smooth(seconds, cue("internal coherence") - 1.5, cue("internal coherence")));
  const avoided = smooth(seconds, cue("rather avoid"), cue("rather avoid") + 1);
  const divided = smooth(seconds, cue("internal coherence") - 1, cue("internal coherence"));
  const gather = smooth(seconds, cue("less divided"), cue("Coherence is not"));
  // Coherence is not certainty: one part of the ring stays open, room for correction.
  const open = smooth(seconds, cue("room for correction"), cue("room for correction") + 1.4);
  const together = smooth(seconds, cue("And we can help"), cue("And we can help") + 3);
  const R = 118;
  const seen = (d: number) => clamp01((reach - d) / 120);
  return (
    <div className="dark-trailer-stage">
      <svg className="dark-trailer-drawing" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor={jade} stopOpacity=".55" />
            <stop offset=".45" stopColor={jade} stopOpacity=".16" />
            <stop offset="1" stopColor={jade} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-warm`}>
            <stop offset="0" stopColor={gold} stopOpacity=".5" />
            <stop offset=".5" stopColor={gold} stopOpacity=".1" />
            <stop offset="1" stopColor={gold} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={world}>
          {/* The edge of awareness, widening. */}
          {[0, 1].map((k) => (
            <ellipse key={k} cx={CHEST[0]} cy={CHEST[1]} rx={Math.max(1, reach - 60 * k)} ry={Math.max(1, (reach - 60 * k) / 1.2)} fill="none" stroke={jade}
              strokeWidth={(1.2 * WEIGHT) / s} strokeDasharray={`${3 / s} ${9 / s}`} opacity={(0.5 - 0.2 * k) * expand * (1 - 0.6 * beyond)} />
          ))}
          {/* Understanding: what is seen, connected. */}
          {understanding > 0.001 && FIELD_LINKS.map(({ i, j }) => {
            const shown = understanding * Math.min(seen(FIELD_STARS[i].d), seen(FIELD_STARS[j].d));
            if (shown <= 0.001) return null;
            const [p, q] = [FIELD_STARS[i].p, FIELD_STARS[j].p];
            return <path key={`${i}-${j}`} d={`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`} stroke={jade} strokeWidth={WEIGHT / s} opacity={0.32 * shown} />;
          })}
          {/* Choosing: one way taken, in gold. */}
          {choosing > 0.001 && (
            <path d={`M${CHOSEN.map((p) => p.join(" ")).join("L")}`} fill="none" stroke={gold} strokeWidth={(2 * WEIGHT) / s} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} {...drawn(choosing)} />
          )}
          {FIELD_STARS.map(({ p, d, size, tone }, k) => {
            const shown = seen(d);
            if (shown <= 0.001) return null;
            const twinkle = 0.75 + 0.25 * Math.sin(seconds * 1.1 + k);
            return <circle key={k} cx={p[0]} cy={p[1]} r={(size * (0.6 + 0.4 * shown)) / Math.sqrt(s)} fill={palette[tone]} opacity={shown * twinkle * 0.9} />;
          })}
          {/* Mental focus: a steady line held on what one would rather avoid. */}
          {focus > 0.001 && (
            <g opacity={focus}>
              <path d={`M${CHEST[0]} ${CHEST[1]}L${AVOIDED[0]} ${AVOIDED[1]}`} stroke={ink} strokeWidth={(1.6 * WEIGHT) / s} strokeLinecap="round" opacity={0.6} />
              <circle cx={AVOIDED[0]} cy={AVOIDED[1]} r={46} fill={`url(#${uid}-warm)`} opacity={0.5 * avoided} />
              <circle cx={AVOIDED[0]} cy={AVOIDED[1]} r={7 + 3 * avoided} fill={clay} opacity={0.5 + 0.5 * avoided} />
            </g>
          )}
          {/* One another: other lights, far off on the floor, and the threads between. */}
          {together > 0.001 && OTHERS.map((other, k) => {
            const shown = smooth(seconds, cue("And we can help") + 0.5 * k, cue("And we can help") + 1.5 + 0.5 * k);
            return (
              <g key={k} opacity={shown}>
                <path d={`M${CHEST[0]} ${CHEST[1] + 40}Q${(CHEST[0] + other[0]) / 2} ${Math.min(CHEST[1], other[1]) - 60} ${other[0]} ${other[1]}`} fill="none" stroke={gold} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${7 / s}`} opacity={0.5} />
                <circle cx={other[0]} cy={other[1]} r={60} fill={`url(#${uid}-warm)`} />
                <circle cx={other[0]} cy={other[1]} r={5} fill={gold} />
              </g>
            );
          })}
          <circle cx={CHEST[0]} cy={CHEST[1]} r={200 + 200 * together} fill={`url(#${uid}-warm)`} opacity={0.6 * together} />
          <circle cx={CHEST[0]} cy={CHEST[1]} r={160 + 20 * Math.sin(seconds * 0.8)} fill={`url(#${uid}-glow)`} opacity={0.6} />
          <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} />
          <circle cx={CHEST[0]} cy={CHEST[1]} r={6 + 2 * focus} fill={jade} opacity={Math.max(focus, divided)} />
          <circle cx={CHEST[0]} cy={CHEST[1]} r={2} fill={ink} opacity={Math.max(focus, divided)} />
          {/* Divided by fear, self-deception and defended identity, the arcs gather into one ring. */}
          {divided > 0.001 && (
            <g fill="none" strokeLinecap="round">
              {DIVISIONS.map(({ start, drift, turn }, k) => {
                const radius = R + 80 * drift * (1 - gather);
                const shift = start + turn * 90 * (1 - gather);
                const a = polar(CHEST, radius, shift);
                // Gathered, the arcs close up; only the one left open shows a gap.
                const b = polar(CHEST, radius, shift + 360 / 8 - (8 - 7 * gather));
                const left = k === 0 ? 1 - 0.85 * open : 1;
                return <path key={k} d={`M${a[0]} ${a[1]}A${radius} ${radius} 0 0 1 ${b[0]} ${b[1]}`} stroke={k === 0 && open > 0.5 ? gold : jade} strokeWidth={(2 * WEIGHT) / s} opacity={divided * left} />;
              })}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

/** One continuous drawing seen through a moving camera; each shot plays its own part of it. */
function TrailerDrawing({ t }: { t: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade, ink, gold } = useContext(TrailerPalette);
  const cam = cameraAt(t);
  const s = cam.s;
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`;
  const sphere = smooth(t, 16.2, 18.4) * (t < PAUSE - 1 ? 1 : 0);
  const coupling = smooth(t, 17, 19) * (t < PAUSE - 1 ? 1 : 0);
  const warmth = sphere;
  // In the box: diminished and in pain, until attention returns and the box dissolves.
  const boxed = t >= PAUSE - 1;
  const noticed = smooth(t, PAUSE + 2, PAUSE + 3);
  const loosen = smooth(t, PAUSE + 3, PAUSE + 5.4);
  const opening = smooth(t, PAUSE + 5.5, ARCH);
  const pain = boxed ? 1 - smooth(t, PAUSE + 1.4, PAUSE + 2.4) : 0;
  const options = smooth(t, PAUSE + 3.4, PAUSE + 6.6);
  const diminished = boxed ? 1 - noticed : 0;

  return (
    <div className="dark-trailer-stage">
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
        <circle cx={FIG_X} cy={420} r={240} fill={`url(#${uid}-warm)`} opacity={warmth} />
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

        
        {boxed && (
          <MeasuringBox
            cx={FIG_X} cy={FIG_Y + 10} scale={1 + 0.18 * loosen} opacity={1 - 0.85 * loosen}
            loosen={loosen} px={2.2} s={s} weight={diminished} press={diminished}
          />
        )}
        <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} opacity={1 - 0.3 * diminished} shrink={diminished} />
        <PainRings at={CHEST} phase={0.37} t={t} opacity={pain} s={s} />
        {/* The pause: someone is experiencing this. */}
        {noticed > 0.001 && (
          <g>
            <circle cx={CHEST[0]} cy={CHEST[1]} r={36 + 120 * opening} fill={`url(#${uid}-jade)`} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={14 + 4 * noticed} fill="none" stroke={jade} strokeWidth={(1.4 * WEIGHT) / s} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={5 + 2 * noticed} fill={jade} opacity={noticed} />
            <circle cx={CHEST[0]} cy={CHEST[1]} r={2} fill={ink} opacity={noticed} />
          </g>
        )}
        <Options open={options} s={s} t={t} />
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
      const size = `calc(min(78cqh, 92cqw) * ${(1 - 0.42 * settle).toFixed(4)})`;
      const centre = 41 - 11 * settle;
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
 * The opening trailer's picture and words, one shot at a time (the argument is set out in
 * darkFilmRevision.ts). Reduced motion shows each shot finished.
 */
/** How the opening's words appear: typed as you watch, or as subtitles to the author's voice. */
export type FilmCaptions = "typed" | "spoken";

/** The most characters a typed line holds on one caption row at the trailer's type size. */
export const LONG_LINE = 57;
/** The narration's pace, for placing a pull quote as it is said. */
const SPOKEN_CPS = 13.5;
const VOICE_LABEL: Record<TrailerVoice, string> = { dot: "DOT proposes", prevailing: "The prevailing view" };
/** With the voice, whose claim it is is named once for a run of lines, so the label holds still. */
const VOICE_RUNS = DARK_TRAILER_LINES.filter((typed) => typed.role === "line" && typed.voice).reduce<{ voice: TrailerVoice; start: number; until: number }[]>((runs, typed) => {
  const last = runs.at(-1);
  if (last && last.voice === typed.voice && typed.start - last.until < 1) last.until = typed.until;
  else runs.push({ voice: typed.voice!, start: typed.start, until: typed.until });
  return runs;
}, []);

/**
 * With the author's voice, the screen carries few words: a pull quote at each turn of the
 * argument, a whole sentence held while he says it. Every word stays in the captions track.
 */
function SpokenWords({ t }: { t: number }) {
  const run = VOICE_RUNS.find(({ start, until }) => t >= start && t < until);
  const quote = DARK_TRAILER_LINES.find((typed) => typed.card && t >= typed.start && t < typed.until);
  const said = quote ? quote.start + 0.15 + quote.text.indexOf(quote.card!) / SPOKEN_CPS : 0;
  const shown = quote ? smooth(t, said, said + 0.9) * (1 - smooth(t, quote.until - 0.6, quote.until)) : 0;
  const rise = quote ? 1 - smooth(t, said, said + 0.9) : 0;
  if (!run && shown <= 0.001) return null;
  return (
    <div className="dark-trailer-pull">
      {run && (
        <span className={`dark-trailer-voice dark-trailer-voice--${run.voice}`} style={{ opacity: smooth(t, run.start, run.start + 0.5) * (1 - smooth(t, run.until - 0.6, run.until)) }}>
          {VOICE_LABEL[run.voice]}
        </span>
      )}
      {shown > 0.001 && !run && <span className="dark-trailer-pull-rule" style={{ opacity: shown, transform: `scaleX(${(1 - rise).toFixed(3)})` }} />}
      {shown > 0.001 && (
        <p key={quote!.text} data-trailer-line={quote!.shot} style={{ opacity: shown, transform: `translateY(${(rise * 0.22).toFixed(3)}em)`, filter: rise > 0.01 ? `blur(${(rise * 5).toFixed(2)}px)` : undefined }}>
          {quote!.card![0].toUpperCase() + quote!.card!.slice(1)}
        </p>
      )}
    </div>
  );
}

export function DarkFilmTrailer({ seconds, still = false, tone = "dark", captions = "typed" }: {
  seconds: number; still?: boolean; tone?: FilmTone; captions?: FilmCaptions;
}) {
  const shot = darkTrailerShot(seconds);
  useEffect(() => { if (seconds > PLATES_LOAD_AFTER) requestPlates(); }, [seconds]);
  // Reduced motion shows each shot finished, with its last line still on screen.
  const lastLine = DARK_TRAILER_LINES.filter((typed) => typed.shot === shot.kind).at(-1);
  const t = still ? Math.min(shot.end - 0.8, lastLine ? lastLine.until - 0.7 : Infinity) : seconds;
  // The picture runs on its own choreographed clock, stretched so every line can be read.
  const drawingTime = trailerDrawingTime(t);
  // Hold the settled title diagram under reduced motion, before its normal exit fade.
  const d = still && shot.kind === "title" ? Math.min(drawingTime, END - 1) : drawingTime;
  // Separate scenes rise from and return to the stage; the person's shots run on without a break.
  const index = DARK_TRAILER_SHOTS.indexOf(shot);
  const inPerson = (kind?: string) => kind === "turn" || kind === "purpose" || (kind !== undefined && PERSON_SHOTS.includes(kind));
  const opens = !inPerson(shot.kind) || !inPerson(DARK_TRAILER_SHOTS[index - 1]?.kind);
  const closes = !inPerson(shot.kind) || !inPerson(DARK_TRAILER_SHOTS[index + 1]?.kind);
  const arrive = opens ? smooth(t, shot.start, shot.start + 0.9) : 1;
  const leave = closes ? 1 - smooth(t, shot.end - 0.8, shot.end) : 1;
  const fade = arrive * leave;
  // Separate scenes breathe: each settles in from slightly near, and recedes as it goes.
  const breathe = 1 + 0.045 * (1 - arrive) - 0.025 * (1 - leave);
  // The camera is never quite still: a slow float and breath keep long holds alive.
  const float = still ? { x: 0, y: 0, z: 1 } : { x: 5 * Math.sin(t * 0.11), y: 3.5 * Math.cos(t * 0.083), z: 1 + 0.01 * Math.sin(t * 0.057) };
  const sceneTransform = `translate(${float.x.toFixed(2)}px, ${float.y.toFixed(2)}px) scale(${(breathe * float.z).toFixed(4)})`;
  return (
    <TrailerPalette.Provider value={PALETTES[tone]}>
    <section className="dark-trailer" aria-label={shot.label} data-trailer-shot={shot.kind}>
      <p className="sr-only">{shot.description}</p>
      <div className="dark-trailer-scene" style={{ opacity: fade, transform: still ? undefined : sceneTransform }}>
        {shot.kind === "mark" && <TrailerMark seconds={t} />}
        {shot.kind === "normal" && <TrailerNormal seconds={t} />}
        {PERSON_SHOTS.includes(shot.kind) && <TrailerPerson seconds={t} />}
        {shot.kind === "turn" && <TrailerBegin seconds={t} />}
        {["design", "pause"].includes(shot.kind) && <TrailerDrawing t={d} />}
        {shot.kind === "purpose" && <TrailerPurpose seconds={t} />}
        {shot.kind === "lenses" && <TrailerLenses seconds={t} />}
        {isPlate(shot.kind) && shot.kind !== "lenses" && <TrailerPlate kind={shot.kind} progress={(t - shot.start) / (shot.end - shot.start)} />}
        {(shot.kind === "architecture" || shot.kind === "title") && <TrailerArchitecture t={d} />}
      </div>
      <Atmosphere seconds={t} />
      <div className="dark-trailer-words">
        {/* The illustrations are AI-generated, and every appearance says so. */}
        {isPlate(shot.kind) && (
          <p className="dark-trailer-plate-note" style={{ opacity: fade }}>AI-generated illustration, directed by the author. A visual metaphor.</p>
        )}
        {DARK_TRAILER_LINES.map((typed) => {
          if (t < typed.start - 0.3 || t >= typed.until) return null;
          // With the voice, the spoken lines give way to a few pull quotes (SpokenWords).
          if (captions === "spoken" && typed.role === "line") return null;
          const opacity = smooth(t, typed.start - 0.3, typed.start) * (1 - smooth(t, typed.until - 0.5, typed.until));
          const Tag = typed.role === "title" ? "h2" : "p";
          const voiced = typed.voice ? ` dark-trailer-${typed.role}--${typed.voice}` : "";
          // Longer lines of the author's script wrap into two smaller rows instead of one.
          const long = typed.role === "line" && typed.text.length > LONG_LINE ? " dark-trailer-line--long" : "";
          return (
            <Tag key={typed.text} className={`dark-trailer-${typed.role}${voiced}${long}`} style={{ opacity }} data-trailer-line={typed.shot}>
              {/* Whose claim it is, named above it: DOT's proposal or the view it examines. */}
              {typed.voice && (
                <span className={`dark-trailer-voice dark-trailer-voice--${typed.voice}`}>
                  {VOICE_LABEL[typed.voice]}
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
        {captions === "spoken" && <SpokenWords t={t} />}
      </div>
    </section>
    </TrailerPalette.Provider>
  );
}
