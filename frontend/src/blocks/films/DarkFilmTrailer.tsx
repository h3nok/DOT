import { createContext, useContext, useId, type CSSProperties } from "react";

import { HeroArchitecture } from "../core/home/HeroArchitecture";
import { Link } from "react-router-dom";
import filmsData from "../../content/films.json";
import { DoWordmark } from "../../shared/DoWordmark";
import { ARCHITECTURE_RADII, FRAME_CENTRE, LOCAL_CENTRE, membranePath } from "../core/home/architectureGeometry";
import "../core/home/home.css";
import { TypedText } from "./ConceptFrame";
import { DARK_TRAILER_LINES, DARK_TRAILER_SHOTS, TRAILER_HEARTBEATS_DESIGN, darkTrailerShot, trailerDrawingTime } from "./darkFilmRevision";

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
const PERSON_SHOTS = ["confused", "health", "unfulfilled", "inherited", "author"];
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

const BODY_POINTS = [
  { word: "sleep", label: "SLEEP", at: HEAD, side: -1 },
  { word: "muscle tension", label: "TENSION", at: [FIG_X + 40, FIG_Y - 92] as Point, side: 1 },
  { word: "digestion", label: "DIGESTION", at: [FIG_X, FIG_Y - 4] as Point, side: -1 },
  { word: "attention,", label: "ATTENTION", at: [FIG_X - 4, FIG_Y - 212] as Point, side: 1 },
  { word: "behavior", label: "BEHAVIOR", at: [FIG_X - 76, FIG_Y + 92] as Point, side: -1 },
];
const GAINS = ["CREDENTIALS", "INCOME", "APPEARANCE", "INFLUENCE", "PRODUCTIVITY"];
const RINGS = [
  { word: "language", label: "LANGUAGE", r: 130, angle: -20 },
  { word: "permitted emotions", label: "EMOTIONS", r: 160, angle: -160 },
  { word: "authority", label: "AUTHORITY", r: 190, angle: -28 },
  { word: "Schools", label: "SCHOOLS", r: 220, angle: -152 },
  { word: "religions", label: "RELIGION", r: 250, angle: -36 },
  { word: "entertainment", label: "ENTERTAINMENT", r: 280, angle: -144 },
  { word: "work,", label: "WORK", r: 310, angle: -42 },
  { word: "markets", label: "MARKETS", r: 340, angle: -138 },
];

function personCamera(seconds: number) {
  const health = shotOf("health").start;
  const unfulfilled = shotOf("unfulfilled").start;
  const inherited = shotOf("inherited").start;
  const end = shotOf("inherited").end;
  const keys: (readonly [number, number, number, number])[] = [
    [shotOf("confused").start, FIG_X, 300, 2.5],
    [health - 0.2, FIG_X, 300, 2.5],
    [health + 2.4, FIG_X, 470, 1.36],
    [unfulfilled - 0.2, FIG_X, 470, 1.36],
    [unfulfilled + 2.4, FIG_X, 395, 1.85],
    [inherited - 0.2, FIG_X, 395, 1.85],
    [inherited + 2.6, FIG_X, 440, 1.18],
    [end - 2, FIG_X, 440, 1.18],
    [end, CAMERA[0][1], CAMERA[0][2], CAMERA[0][3]],
    // The author: in on him as he gives his name, out as his career appears beside him,
    // and back to the question's opening view.
    [shotOf("author").start, CAMERA[0][1], CAMERA[0][2], CAMERA[0][3]],
    [shotOf("author").start + 3, FIG_X, 415, 1.7],
    [wordAt("author", "a career") - 1.5, FIG_X, 415, 1.7],
    [wordAt("author", "a career") + 1.5, FIG_X - 70, 440, 1.2],
    [shotOf("author").end - 1.5, FIG_X - 70, 440, 1.2],
    [shotOf("author").end, CAMERA[0][1], CAMERA[0][2], CAMERA[0][3]],
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
  // The person declines through the first three shots, and recovers only as they take responsibility.
  const decline = smooth(seconds, confused.start, unfulfilled.end) * (1 - smooth(seconds, wordAt("inherited", "But undoing"), inherited.end - 1));
  const label = { fontFamily: "JetBrains Mono, monospace", letterSpacing: 3 / s, fontSize: 30 / s, textAnchor: "middle" as const, stroke: stage, strokeWidth: 6 / s, paintOrder: "stroke" as const };

  // Confusion.
  const inConfusion = smooth(seconds, confused.start, confused.start + 1) * (1 - smooth(seconds, health.start, health.start + 1.6));
  const tangled = smooth(seconds, confused.start + 0.4, health.start - 1);
  const fragmenting = smooth(seconds, wordAt("confused", "Screens"), wordAt("confused", "Money"));

  // The body.
  const inBody = smooth(seconds, health.start, health.start + 1.6) * (1 - smooth(seconds, unfulfilled.start, unfulfilled.start + 1.4));
  const trace = Array.from({ length: 64 }, (_, k) => {
    const x = FIG_X + 200 + k * 4.6;
    const u = (k / 64 + (seconds % 3.2) / 3.2) % 1;
    const skip = Math.floor((seconds + k / 22) / 3.2);
    const spike = Math.exp(-((u - 0.5) ** 2) * 2600) * (unit(skip) > 0.3 * decline ? 56 : 18);
    const dip = Math.exp(-((u - 0.54) ** 2) * 2600) * 20;
    return `${k ? "L" : "M"}${x.toFixed(1)} ${(FIG_Y + 80 - spike + dip).toFixed(1)}`;
  }).join("");

  // The author: a career beside him, the strain he names, and stepping away to share this work.
  const author = shotOf("author");
  const inAuthor = seconds >= author.start ? 1 : 0;
  const career = inAuthor * smooth(seconds, wordAt("author", "a career") - 0.3, wordAt("author", "a career") + 0.9)
    * (1 - smooth(seconds, wordAt("author", "to share this work"), wordAt("author", "to share this work") + 2.2));
  const strain = inAuthor * smooth(seconds, wordAt("author", "erosion"), wordAt("author", "erosion") + 0.8)
    * (1 - smooth(seconds, wordAt("author", "Now I’m") - 1, wordAt("author", "Now I’m") + 0.5));
  // Stepping away: his career drifts off and fades; he stays where he is.
  const drift = inAuthor * 140 * smooth(seconds, wordAt("author", "to share this work"), wordAt("author", "to share this work") + 2.2);
  // His entrance: as he says his name, a light rises at the chest, then settles.
  const entrance = inAuthor * smooth(seconds, wordAt("author", "My name"), wordAt("author", "My name") + 1.4) * (1 - smooth(seconds, wordAt("author", "For forty"), wordAt("author", "as if I were")));
  // Forty years asleep in the culture: the figure dims, and wakes as he names the contrast.
  const asleep = inAuthor * smooth(seconds, wordAt("author", "For forty"), wordAt("author", "as if I were") + 1) * (1 - smooth(seconds, wordAt("author", "It gave me contrast"), wordAt("author", "It gave me contrast") + 1.6));

  // Never enough: each gain fills the circle, and drains faster than the last.
  const inEmpty = smooth(seconds, unfulfilled.start, unfulfilled.start + 1.4) * (1 - smooth(seconds, inherited.start, inherited.start + 1.4));
  const gainStart = unfulfilled.start + 1;
  const gainEnd = wordAt("unfulfilled", "something essential") - 0.4;
  const gainStep = (gainEnd - gainStart) / GAINS.length;
  const gains = GAINS.map((name, k) => ({ name, at: gainStart + gainStep * k }));
  const hold = gainStep - 0.1;
  const level = Math.max(0, ...gains.map(({ at }, k) => (seconds >= at + 1.2 ? Math.exp(-(seconds - at - 1.2) * (0.7 + 0.25 * k)) : 0))) * (1 - smooth(seconds, gainEnd, gainEnd + 1));
  const R = 44;
  // The circle sits on the chest of the figure as it now stands: shrinking settles toward the feet.
  const figureScale = FIG * (1 - 0.12 * decline);
  const chestY = FIG_Y + 171 * (FIG - figureScale) - 36 * figureScale;

  // What you were given.
  const inRings = smooth(seconds, inherited.start, inherited.start + 1.4);
  const soften = smooth(seconds, wordAt("inherited", "But undoing"), inherited.end - 1);
  const ringsLeave = smooth(seconds, inherited.end - 2.4, inherited.end - 0.4);

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
          <clipPath id={`${uid}-level`}>
            <rect x={CHEST[0] - R} y={chestY + R - 2 * R * level} width={2 * R} height={2 * R * level} />
          </clipPath>
        </defs>
        <g transform={world}>
          {inRings > 0.001 && (
            <g fill="none" opacity={inRings * (1 - 0.45 * soften) * (1 - ringsLeave)}>
              {RINGS.map(({ word, label: name, r, angle }) => {
                const at = wordAt("inherited", word);
                const drawnIn = smooth(seconds, at - 0.1, at + 1.3);
                if (drawnIn <= 0.001) return null;
                const place = polar([FIG_X, FIG_Y - 20], r, angle);
                return (
                  <g key={name}>
                    <circle cx={FIG_X} cy={FIG_Y - 20} r={r} stroke={ink} strokeWidth={(1.3 * WEIGHT) / s} {...drawn(drawnIn)} transform={`rotate(-90 ${FIG_X} ${FIG_Y - 20})`} opacity={0.62} />
                    <text x={place[0]} y={place[1] + 8 / s} fill={ink} opacity={smooth(seconds, at + 0.3, at + 1)} {...label}>{name}</text>
                  </g>
                );
              })}
            </g>
          )}

          {inBody > 0.001 && (
            <g opacity={inBody}>
              <path d={trace} fill="none" stroke={clay} strokeWidth={(1.8 * WEIGHT) / s} strokeLinejoin="round" opacity={0.85} />
            </g>
          )}
          {inBody > 0.001 && BODY_POINTS.map(({ word, label: name, at, side }) => {
            const start = wordAt("health", word);
            const lit = smooth(seconds, start, start + 0.7);
            if (lit <= 0.001) return null;
            const endX = FIG_X + side * 250;
            const pulse = 0.82 + 0.18 * Math.sin(seconds * 2.4 + at[1]);
            return (
              <g key={name} opacity={lit * inBody}>
                <circle cx={at[0]} cy={at[1]} r={46} fill={`url(#${uid}-hurt)`} opacity={pulse} />
                <path d={`M${at[0]} ${at[1]}L${endX} ${at[1]}`} fill="none" stroke={clay} strokeWidth={WEIGHT / s} strokeDasharray={`${3 / s} ${6 / s}`} opacity={0.7} />
                <text x={endX + side * 92} y={at[1] + 8 / s} fill={clay} {...label}>{name}</text>
              </g>
            );
          })}

          {inRings > 0.001 && seconds < inherited.end && <circle cx={CHEST[0]} cy={CHEST[1]} r={90} fill={`url(#${uid}-glow)`} opacity={soften * (1 - smooth(seconds, inherited.end - 1.2, inherited.end))} />}
          {career > 0.001 && (
            <g transform={`translate(${FIG_X - 300 - drift} ${FIG_Y - 40}) scale(1.4)`} opacity={career}>
              <Laptop seconds={seconds} color={ink} w={(2.2 * WEIGHT) / (s * 1.4)} />
            </g>
          )}
          {strain > 0.001 && [0, 0.5].map((offset) => {
            const raw = seconds * 0.45 + offset;
            const frac = raw - Math.floor(raw);
            return <circle key={offset} cx={FIG_X} cy={CHEST[1]} r={40 + 80 * frac} fill="none" stroke={clay} strokeWidth={(2.4 * WEIGHT) / s} opacity={0.95 * strain * (1 - frac)} />;
          })}
          {entrance > 0.001 && <circle cx={FIG_X} cy={CHEST[1]} r={70 + 60 * entrance} fill={`url(#${uid}-glow)`} opacity={entrance} />}
          <Figure x={FIG_X} y={FIG_Y} px={2.6} cameraScale={s} opacity={(1 - 0.34 * decline) * (1 - 0.6 * asleep)} shrink={decline} />

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
              {QUESTIONS.map(({ place, k }) => {
                const at = wordAt("confused", "Marketing") + k * 1.6;
                return <text key={k} x={place[0]} y={place[1]} fill={ink} stroke="none" fontFamily="Source Serif 4, Georgia, serif" fontSize={30 / s + 6} textAnchor="middle" opacity={0.75 * smooth(seconds, at, at + 1) * (0.55 + 0.45 * Math.sin(seconds * 0.9 + k))}>?</text>;
              })}
            </g>
          )}

          {inEmpty > 0.001 && (
            <g opacity={inEmpty}>
              <circle cx={CHEST[0]} cy={chestY} r={R} fill={stage} stroke={ink} strokeWidth={(1.8 * WEIGHT) / s} strokeDasharray={level < 0.02 ? `${5 / s} ${7 / s}` : undefined} />
              <circle cx={CHEST[0]} cy={chestY} r={R - 3} fill={gold} opacity={0.75} clipPath={`url(#${uid}-level)`} />
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

/** One continuous drawing seen through a moving camera; each shot plays its own part of it. */
function TrailerDrawing({ t }: { t: number }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const { jade, ink, gold } = useContext(TrailerPalette);
  const cam = cameraAt(t);
  const s = cam.s;
  const world = `translate(800 450) scale(${s.toFixed(4)}) translate(${(-cam.x).toFixed(2)} ${(-cam.y).toFixed(2)})`;
  const beat = heartbeat(t) * (1 - smooth(t, 6.5, 7));
  // At the question, a light grows at the chest: the one fact no one has to teach.
  const presence = smooth(t, 1.2, 6.8) * (t < 7 ? 1 : 0);
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
        <circle cx={CHEST[0]} cy={CHEST[1]} r={70 + 90 * presence} fill={`url(#${uid}-jade)`} opacity={Math.min(1, beat * 0.9 + 0.6 * presence)} />
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
        <Options open={options} s={s} />
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

/** The author's name card, shown as he introduces himself. */
const AUTHOR_CARD = { name: "Henok Ghebrechristos", role: "Author, Digital Organism Theory" } as const;
/** The narration's pace, for placing each key word as it is said. */
const SPOKEN_CPS = 13.5;

export function DarkFilmTrailer({ seconds, still = false, tone = "dark", captions = "typed" }: {
  seconds: number; still?: boolean; tone?: FilmTone; captions?: FilmCaptions;
}) {
  const shot = darkTrailerShot(seconds);
  // Reduced motion shows each shot finished, with its last line still on screen.
  const lastLine = DARK_TRAILER_LINES.filter((typed) => typed.shot === shot.kind).at(-1);
  const t = still ? Math.min(shot.end - 0.8, lastLine ? lastLine.until - 0.7 : Infinity) : seconds;
  // The picture runs on its own choreographed clock, stretched so every line can be read.
  const drawingTime = trailerDrawingTime(t);
  // Hold the settled title diagram under reduced motion, before its normal exit fade.
  const d = still && shot.kind === "title" ? Math.min(drawingTime, END - 1) : drawingTime;
  // Separate scenes rise from and return to the stage; the person's shots run on without a break.
  const index = DARK_TRAILER_SHOTS.indexOf(shot);
  const inPerson = (kind?: string) => kind === "turn" || (kind !== undefined && PERSON_SHOTS.includes(kind));
  const opens = !inPerson(shot.kind) || !inPerson(DARK_TRAILER_SHOTS[index - 1]?.kind);
  const closes = !inPerson(shot.kind) || !inPerson(DARK_TRAILER_SHOTS[index + 1]?.kind);
  const fade = (opens ? smooth(t, shot.start, shot.start + 0.7) : 1) * (closes ? 1 - smooth(t, shot.end - 0.7, shot.end) : 1);
  return (
    <TrailerPalette.Provider value={PALETTES[tone]}>
    <section className="dark-trailer" aria-label={shot.label} data-trailer-shot={shot.kind}>
      <p className="sr-only">{shot.description}</p>
      <div className="dark-trailer-scene" style={{ opacity: fade }}>
        {shot.kind === "mark" && <TrailerMark seconds={t} />}
        {shot.kind === "normal" && <TrailerNormal seconds={t} />}
        {PERSON_SHOTS.includes(shot.kind) && <TrailerPerson seconds={t} />}
        {["turn", "design", "pause"].includes(shot.kind) && <TrailerDrawing t={d} />}
        {(shot.kind === "architecture" || shot.kind === "title") && <TrailerArchitecture t={d} />}
      </div>
      <div className="dark-trailer-words">
        {DARK_TRAILER_LINES.map((typed) => {
          if (t < typed.start - 0.3 || t >= typed.until) return null;
          const spoken = captions === "spoken" && typed.role === "line";
          // With the voice, a line shows only its key words, each as it is said; some show none.
          if (spoken) {
            if (!typed.show?.length && !typed.voice) return null;
            const out = 1 - smooth(t, typed.until - 0.5, typed.until);
            return (
              <div key={typed.text} className="dark-trailer-keywords" data-trailer-line={typed.shot} style={{ opacity: out }}>
                {typed.voice && (
                  <span className={`dark-trailer-voice dark-trailer-voice--${typed.voice}`} style={{ opacity: smooth(t, typed.start, typed.start + 0.4) }}>
                    {typed.voice === "dot" ? "DOT proposes" : "The prevailing view"}
                  </span>
                )}
                <p>
                  {(typed.show ?? []).map((word) => {
                    const said = typed.start + 0.15 + typed.text.indexOf(word) / SPOKEN_CPS;
                    const shown = smooth(t, said, said + 0.45);
                    return (
                      <span key={word} className="dark-trailer-keyword" style={{ opacity: shown, transform: `translateY(${((1 - shown) * 0.35).toFixed(3)}em)` }}>
                        {word}
                      </span>
                    );
                  })}
                </p>
              </div>
            );
          }
          // Spoken, a line arrives whole with the voice; typed, it types as you watch.
          const opacity = (spoken ? smooth(t, typed.start, typed.start + 0.45) : smooth(t, typed.start - 0.3, typed.start))
            * (1 - smooth(t, typed.until - 0.5, typed.until));
          const Tag = typed.role === "title" ? "h2" : "p";
          const voiced = typed.voice ? ` dark-trailer-${typed.role}--${typed.voice}` : "";
          return (
            <Tag key={typed.text} className={`dark-trailer-${typed.role}${voiced}${spoken ? " dark-trailer-spoken" : ""}`} style={{ opacity }} data-trailer-line={typed.shot}>
              {/* Whose claim it is, named above it: DOT's proposal or the view it examines. */}
              {typed.voice && (
                <span className={`dark-trailer-voice dark-trailer-voice--${typed.voice}`}>
                  {typed.voice === "dot" ? "DOT proposes" : "The prevailing view"}
                </span>
              )}
              {spoken ? <span>{typed.text}</span> : <TypedText line={typed} time={t} caret={typed.role !== "subtitle"} />}
              {typed.cite && (
                <span className="dark-trailer-cite" style={{ opacity: smooth(t, typed.end + 0.2, typed.end + 0.9) }}>
                  — {typed.cite}
                </span>
              )}
            </Tag>
          );
        })}
        {shot.kind === "author" && (() => {
          // The name card enters on his name, in either caption mode.
          const at = DARK_TRAILER_LINES.find((typed) => typed.text === "My name is Henok.")!;
          const shown = smooth(t, at.start + 0.2, at.start + 1.2) * (1 - smooth(t, at.start + 9, at.start + 10));
          return shown > 0.001 ? (
            <div className="dark-trailer-name-card" style={{ opacity: shown }}>
              <span className="dark-trailer-name-card-rule" style={{ transform: `scaleX(${smooth(t, at.start + 0.2, at.start + 1.6).toFixed(3)})` }} />
              <strong>{AUTHOR_CARD.name}</strong>
              <span>{AUTHOR_CARD.role}</span>
            </div>
          ) : null;
        })()}
      </div>
    </section>
    </TrailerPalette.Provider>
  );
}
