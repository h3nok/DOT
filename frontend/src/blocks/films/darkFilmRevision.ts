import {
  CONCEPT_TOUR_KEYSTROKES,
  CONCEPT_TOUR_SECONDS,
  CONCEPT_TOUR_STARTS,
  TOUR_OPENING_SECONDS,
  describeTourTime,
} from "./conceptTour";
import type { TypedLine } from "./filmTime";
import type { Keystroke } from "./TypewriterSound";
import filmsData from "../../content/films.json";

/**
 * Reading pace for the trailer's words. Each line types at a calm speed, then holds long
 * enough to be read twice, and every line is followed by a moment with no words at all.
 * L1/L8: calm, and honest about what each line claims; L10: one line at a time.
 */
export const TRAILER_READING = {
  /** Typing speed, characters per second: slower than reading, so the eye keeps up. */
  charsPerSecond: 15,
  /** How long a typed line stays: a base, plus time for its length, never under the minimum. */
  holdSeconds: 1.2,
  holdPerChar: 0.04,
  minHoldSeconds: 2.5,
  /** The empty pause between one line leaving and the next arriving. */
  gapSeconds: 1,
  /** The picture alone, after a shot's last line, before the next shot. */
  tailSeconds: 1,
} as const;

/** Whose claim a line is: DOT's proposal, or the prevailing view it examines. */
export type TrailerVoice = "dot" | "prevailing";

/** A line with its own voice, or a quotation with its source. */
interface ScriptLine {
  text: string;
  voice?: TrailerVoice;
  cite?: string;
}

interface ShotScript {
  kind: string;
  label: string;
  description: string;
  /** The shortest this shot may run; it stretches to fit the words. */
  design: number;
  /** The part of the drawing's own clock this shot plays. Other shots have their own pictures. */
  drawing?: readonly [number, number];
  /** Picture alone before the first line. */
  lead: number;
  lines: readonly (string | ScriptLine)[];
  /** Marks the shot's lines as one voice, labelled above them, so claims are never confused. */
  voice?: TrailerVoice;
  /** Extra stillness after the last line. */
  linger?: number;
}

/** The trailer's shots, one idea each, kept in content so the site's prerender reads the same words. */
const TRAILER_KINDS = ["mark", "normal", "confused", "health", "unfulfilled", "inherited", "turn", "design", "architecture", "pause", "title"] as const;
export type DarkTrailerShotKind = (typeof TRAILER_KINDS)[number];

const isVoice = (value: unknown): value is TrailerVoice => value === "dot" || value === "prevailing";

/**
 * The opening trailer: the DOT mark, then one person. DOT is about the individual (the AMM is its
 * social application), so the film stays with them: an ordinary day → the pretence → confusion →
 * the body → never enough → what they were given and never taught → where a truthful framework
 * begins → you → your options. The words come from Book One and the author, with DOT's proposals
 * marked (content/films.json).
 */
const SCRIPT: readonly ShotScript[] = filmsData.trailer.shots.map((shot, index) => {
  if (shot.kind !== TRAILER_KINDS[index]) throw new Error(`Trailer shot ${index} must be "${TRAILER_KINDS[index]}", not "${shot.kind}".`);
  const voice = "voice" in shot && isVoice(shot.voice) ? shot.voice : undefined;
  return {
    kind: shot.kind,
    label: shot.label,
    description: shot.description,
    design: shot.design,
    drawing: "drawing" in shot ? (shot.drawing as unknown as readonly [number, number]) : undefined,
    lead: shot.lead,
    linger: "linger" in shot ? shot.linger : undefined,
    voice,
    lines: (shot.lines as readonly (string | { text: string; voice?: string; cite?: string })[]).map((line) =>
      typeof line === "string" ? line : { text: line.text, voice: isVoice(line.voice) ? line.voice : undefined, cite: line.cite },
    ),
  };
});

export interface DarkTrailerShot {
  kind: DarkTrailerShotKind;
  label: string;
  description: string;
  start: number;
  end: number;
  design: number;
  /** Where this shot's drawing begins and how long it runs, on the drawing's own clock. */
  designStart: number;
  drawingLength: number;
}

/** Every word on screen in the trailer, in film seconds. */
export interface TrailerLine extends TypedLine {
  shot: DarkTrailerShotKind;
  /** When the line leaves the screen. */
  until: number;
  role: "line" | "title" | "subtitle";
  voice?: TrailerVoice;
  /** The source of a quotation, shown beneath it once it is typed. */
  cite?: string;
}

function buildTrailer() {
  const { charsPerSecond, holdSeconds, holdPerChar, minHoldSeconds, gapSeconds, tailSeconds } = TRAILER_READING;
  const shots: DarkTrailerShot[] = [];
  const lines: TrailerLine[] = [];
  let at = 0;
  for (const script of SCRIPT) {
    const kind = script.kind as DarkTrailerShotKind;
    const title = kind === "title";
    let cursor = at + script.lead;
    const shotLines: TrailerLine[] = [];
    script.lines.forEach((entry, index) => {
      const { text, voice = script.voice, cite } = typeof entry === "string" ? { text: entry } : entry;
      const start = cursor;
      const end = start + text.length / charsPerSecond;
      // A quotation holds a little longer, so its source can be read too.
      const until = end + Math.max(minHoldSeconds, holdSeconds + holdPerChar * text.length) + (cite ? 1.6 : 0);
      const role = title ? (index === 0 ? "title" : "subtitle") : "line";
      shotLines.push({ shot: kind, text, start, end, charsPerSecond, until, role, voice, cite });
      // The title stays while its subtitle types beneath it; spoken lines take turns.
      cursor = title ? end + gapSeconds : until + gapSeconds;
    });
    // A shot without words holds its picture for its lead, or its choreography, whichever is longer.
    const last = shotLines.at(-1);
    let end = Math.max(at + script.design, last ? last.until + (script.linger ?? 0) + tailSeconds : at + script.lead + tailSeconds);
    // A whole-second hand-off keeps the seventeen concepts on exact film seconds.
    if (title) end = Math.ceil(end);
    if (title) for (const typed of shotLines) typed.until = end;
    lines.push(...shotLines);
    shots.push({ kind, label: script.label, description: script.description, start: at, end, design: script.design, designStart: script.drawing?.[0] ?? 0, drawingLength: script.drawing ? script.drawing[1] - script.drawing[0] : 0 });
    at = end;
  }
  return { shots, lines };
}

const TRAILER = buildTrailer();

export const DARK_TRAILER_SHOTS: readonly DarkTrailerShot[] = TRAILER.shots;
export const DARK_TRAILER_LINES: readonly TrailerLine[] = TRAILER.lines;

/** Lines that finish with a soft bell: the proposal, the pause, and the hand-off. */
const BELL_AFTER = new Set(["Your living body is your interface to a Reality Frame.", "Freedom is participation in the creation of possibility.", "A school of thought for examining experience."]);

export const DARK_OPENING_SECONDS = DARK_TRAILER_SHOTS.at(-1)!.end;
const SHIFT = TOUR_OPENING_SECONDS - DARK_OPENING_SECONDS;
/** Where the concepts and their closing end, and the DOT mark holds to the film's last frame. */
export const DARK_FILM_BODY_END = CONCEPT_TOUR_SECONDS - SHIFT;
export const DARK_CLOSING_MARK_SECONDS = 5;
export const DARK_FILM_SECONDS = DARK_FILM_BODY_END + DARK_CLOSING_MARK_SECONDS;
export const DARK_FILM_STARTS = [0, ...CONCEPT_TOUR_STARTS.filter((at) => at >= TOUR_OPENING_SECONDS).map((at) => at - SHIFT), DARK_FILM_BODY_END];
/** Every section of the film for its progress line: each trailer shot, then each concept. */
export const DARK_FILM_SECTIONS = [...DARK_TRAILER_SHOTS.map((shot) => shot.start), ...DARK_FILM_STARTS.slice(1)];

export const darkTrailerShot = (seconds: number): DarkTrailerShot =>
  DARK_TRAILER_SHOTS.find((shot) => seconds < shot.end) ?? DARK_TRAILER_SHOTS.at(-1)!;

/** The drawing's own clock at a film second: each shot's choreography, stretched to its words. */
export function trailerDrawingTime(seconds: number): number {
  const shot = darkTrailerShot(seconds);
  const local = Math.min(shot.end - shot.start, Math.max(0, seconds - shot.start));
  return shot.designStart + local * (shot.drawingLength / (shot.end - shot.start));
}

/** The film second at which the drawing reaches a moment on its own clock. */
export function trailerFilmTime(designSeconds: number): number {
  const shot = DARK_TRAILER_SHOTS.find((item) => item.drawingLength && designSeconds >= item.designStart && designSeconds < item.designStart + item.drawingLength) ?? DARK_TRAILER_SHOTS.at(-1)!;
  const local = Math.min(shot.drawingLength, Math.max(0, designSeconds - shot.designStart));
  return shot.start + local * ((shot.end - shot.start) / shot.drawingLength);
}

/** The heartbeat under the question, on the drawing's clock, and where each falls in the film. */
export const TRAILER_HEARTBEATS_DESIGN = Array.from({ length: 13 }, (_, beat) => 0.3 + beat * 0.52);
export const DARK_TRAILER_HEARTBEATS = TRAILER_HEARTBEATS_DESIGN.map(trailerFilmTime);

function buildTrailerKeystrokes(): Keystroke[] {
  const keys: Keystroke[] = [];
  for (const typed of DARK_TRAILER_LINES) {
    for (let i = 0; i < typed.text.length; i++) {
      keys.push({ at: typed.start + (i + 1) / typed.charsPerSecond, kind: typed.text[i] === " " ? "space" : "key" });
    }
    if (BELL_AFTER.has(typed.text)) keys.push({ at: typed.end + 0.15, kind: "bell" });
  }
  return keys.sort((a, b) => a.at - b.at);
}

export const DARK_TRAILER_KEYSTROKES: readonly Keystroke[] = buildTrailerKeystrokes();

/** The trailer's few typed words, then every keystroke of the seventeen concepts. */
export const DARK_FILM_KEYSTROKES: readonly Keystroke[] = [
  ...DARK_TRAILER_KEYSTROKES,
  ...CONCEPT_TOUR_KEYSTROKES
    .filter((key) => key.at >= TOUR_OPENING_SECONDS)
    .map((key) => ({ ...key, at: key.at - SHIFT })),
];

export const originalDarkFilmTime = (seconds: number) => Math.min(CONCEPT_TOUR_SECONDS, seconds + SHIFT);
export const describeDarkFilmTime = (seconds: number) => {
  if (seconds < DARK_OPENING_SECONDS) return `Opening: ${darkTrailerShot(seconds).label}`;
  return seconds < DARK_FILM_BODY_END ? describeTourTime(originalDarkFilmTime(seconds)) : "DOT";
};
