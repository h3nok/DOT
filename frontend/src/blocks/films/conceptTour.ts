import filmsData from "../../content/films.json";
import { CONCEPT_FILMS, CONCEPT_MOTIFS, conceptTyping, type ConceptFilm, type ConceptTextBeats } from "./conceptFilms";
import { typeInSequence, type TypedLine } from "./filmTime";
import type { Keystroke } from "./TypewriterSound";

const TOUR = filmsData.conceptTour;

/** One scene of the opening, before the first concept. */
export type TourScene = (typeof TOUR.scenes)[number];

/** The opening's four scenes: the struggle, the cultural trap, the setup, the turn. */
export const TOUR_OPENING_SECONDS = TOUR.scenes.reduce((total, scene) => total + scene.seconds, 0);
/** How long the opening's drawing (TourOpening) spends on each scene, on its own clock. */
export const TOUR_OPENING_DRAWN_SECONDS = [11, 12, 12, 7] as const;
/** How fast a first-time reader reads, in characters a second. */
export const TOUR_READING_CPS = 20;
/** Time to look at a concept's picture once its words are read, and to pass to the next. */
export const TOUR_LOOK_SECONDS = 4;
/** No concept is shorter than its picture's motion. */
export const TOUR_MIN_CONCEPT_SECONDS = 13;
/** The closing title. */
export const TOUR_CLOSING_SECONDS = 6;
/** How long one part takes to give way to the next. */
export const TOUR_CROSSFADE_SECONDS = 0.5;
/** How far a part rises as it arrives and leaves, in pixels. */
const TOUR_DRIFT_PX = 14;
/**
 * Each motif plays its sixteen-second study a little faster, so its motion settles by about
 * 12.5 seconds, within even the shortest part.
 */
export const TOUR_MOTIF_SPEED = 1.25;

/** How a concept's words are typed inside its part of the tour. */
export const TOUR_CONCEPT_BEATS: ConceptTextBeats = {
  name: 0.2,
  definition: 0,
  charsPerSecond: 34,
};

export type TourPart =
  | { kind: "scene"; start: number; end: number; scene: TourScene; index: number }
  | { kind: "concept"; start: number; end: number; film: ConceptFilm; position: number }
  | { kind: "closing"; start: number; end: number };

/**
 * A concept's share of the film: long enough for a first-time reader to read its title,
 * definition, and analogy, and then look at its picture.
 */
export function tourConceptSeconds(film: ConceptFilm): number {
  const words = film.node.title.length + film.node.oneLine.length + CONCEPT_MOTIFS[film.id].analogy.length;
  return Math.max(TOUR_MIN_CONCEPT_SECONDS, Math.ceil(words / TOUR_READING_CPS + TOUR_LOOK_SECONDS));
}

function buildTour(): TourPart[] {
  const parts: TourPart[] = [];
  let at = 0;
  TOUR.scenes.forEach((scene, index) => {
    parts.push({ kind: "scene", start: at, end: at + scene.seconds, scene, index });
    at += scene.seconds;
  });
  CONCEPT_FILMS.forEach((film, index) => {
    const seconds = tourConceptSeconds(film);
    parts.push({ kind: "concept", start: at, end: at + seconds, film, position: index + 1 });
    at += seconds;
  });
  parts.push({ kind: "closing", start: at, end: at + TOUR_CLOSING_SECONDS });
  return parts;
}

/** One film through every concept in the Concept Map, in the map's order. */
export const CONCEPT_TOUR: readonly TourPart[] = buildTour();

export const CONCEPT_TOUR_SECONDS = CONCEPT_TOUR[CONCEPT_TOUR.length - 1].end;

/** Where each concept begins, for marks on the timeline. */
export const CONCEPT_TOUR_NOTCHES = CONCEPT_TOUR.filter((part) => part.kind === "concept").map(
  (part) => part.start,
);

/** Where to step to: the opening as a whole, each concept, and the close. */
export const CONCEPT_TOUR_STARTS = CONCEPT_TOUR.filter((part) => part.kind !== "scene" || part.start === 0).map(
  (part) => part.start,
);

/** "Concept 7 of 17": a concept's place in the tour. */
export const tourPlace = (position: number) => `Concept ${position} of ${CONCEPT_FILMS.length}`;

/** The frame shown before Play: the struggle, fully drawn, with its words typed. */
export const TOUR_POSTER_SECONDS = TOUR.scenes[0].seconds - 0.6;

/**
 * The opening's drawing keeps its own clock, scene by scene; each scene's stretch of it
 * plays at the pace that fills the scene.
 */
export function openingDrawingTime(seconds: number): number {
  let sceneStart = 0;
  let drawnStart = 0;
  for (let i = 0; i < TOUR.scenes.length; i++) {
    const length = TOUR.scenes[i].seconds;
    const drawn = TOUR_OPENING_DRAWN_SECONDS[i];
    if (seconds < sceneStart + length || i === TOUR.scenes.length - 1) {
      return drawnStart + Math.min(length, Math.max(0, seconds - sceneStart)) * (drawn / length);
    }
    sceneStart += length;
    drawnStart += drawn;
  }
  return drawnStart;
}

/** A scene's words, typed on the scene's own clock. */
export function sceneTyping(scene: TourScene) {
  const [eyebrow, title, note] = typeInSequence(
    [
      { text: scene.eyebrow, charsPerSecond: 68 },
      { text: scene.title, charsPerSecond: 28, delay: 0.3 },
      { text: scene.note, charsPerSecond: 32, delay: 0.5 },
    ],
    0.3,
  );
  return { eyebrow, title, note, source: note.end + 0.3 };
}

/** The closing title's words, typed on the part's own clock. */
export const CLOSING_TYPING = (() => {
  const [eyebrow, title] = typeInSequence(
    [
      { text: TOUR.closing.eyebrow, charsPerSecond: 68 },
      { text: TOUR.closing.title, charsPerSecond: 30, delay: 0.3 },
    ],
    0.3,
  );
  return { eyebrow, title, source: title.end + 0.3, links: title.end + 0.8 };
})();

/** The part playing at a film second; the end of the film belongs to the closing title. */
export function tourPartAt(seconds: number): TourPart {
  return (
    CONCEPT_TOUR.find((part) => seconds >= part.start && seconds < part.end) ??
    CONCEPT_TOUR[CONCEPT_TOUR.length - 1]
  );
}

function fades(part: TourPart, seconds: number) {
  const fadeIn = part.start === 0 ? 1 : Math.min(1, (seconds - part.start) / TOUR_CROSSFADE_SECONDS);
  const fadeOut = part.end >= CONCEPT_TOUR_SECONDS ? 1 : Math.min(1, (part.end - seconds) / TOUR_CROSSFADE_SECONDS);
  return { fadeIn: Math.max(0, fadeIn), fadeOut: Math.max(0, fadeOut) };
}

/** How visible a part is at a film second: it fades in at its start and out at its end. */
export function tourPartOpacity(part: TourPart, seconds: number): number {
  const { fadeIn, fadeOut } = fades(part, seconds);
  return Math.min(fadeIn, fadeOut);
}

/**
 * How visible a part's picture is. The opening is one continuous drawing, so its picture
 * fades only as the opening gives way to the first concept.
 */
export function tourPictureOpacity(part: TourPart, seconds: number): number {
  if (part.kind !== "scene") return tourPartOpacity(part, seconds);
  if (part.end < TOUR_OPENING_SECONDS) return 1;
  return Math.min(1, Math.max(0, (part.end - seconds) / TOUR_CROSSFADE_SECONDS));
}

/** How far a part sits from rest: it rises into place as it arrives and rises away as it leaves. */
export function tourPartDrift(part: TourPart, seconds: number): number {
  const { fadeIn, fadeOut } = fades(part, seconds);
  return (1 - fadeIn) * TOUR_DRIFT_PX - (1 - fadeOut) * TOUR_DRIFT_PX;
}

/** A spoken position on the timeline, e.g. "Concept 3 of 17: The Big C Hypothesis". */
export function describeTourTime(seconds: number): string {
  const part = tourPartAt(seconds);
  if (part.kind === "scene") return `Opening: ${part.scene.name}`;
  if (part.kind === "closing") return "Closing title";
  return `${tourPlace(part.position)}: ${part.film.node.title}`;
}

/** Every key the film types, in film seconds, ending each concept's words with a bell. */
function buildKeystrokes(): Keystroke[] {
  const keys: Keystroke[] = [];
  const type = (lines: readonly TypedLine[], offset: number) => {
    for (const line of lines) {
      for (let i = 0; i < line.text.length; i++) {
        keys.push({ at: offset + line.start + (i + 1) / line.charsPerSecond, kind: line.text[i] === " " ? "space" : "key" });
      }
    }
  };
  for (const part of CONCEPT_TOUR) {
    if (part.kind === "scene") {
      const typing = sceneTyping(part.scene);
      type([typing.eyebrow, typing.title, typing.note], part.start);
      keys.push({ at: part.start + typing.note.end + 0.1, kind: "bell" });
    } else if (part.kind === "closing") {
      type([CLOSING_TYPING.eyebrow, CLOSING_TYPING.title], part.start);
      keys.push({ at: part.start + CLOSING_TYPING.title.end + 0.1, kind: "bell" });
    } else {
      const typing = conceptTyping(part.film, TOUR_CONCEPT_BEATS, tourPlace(part.position));
      type([typing.eyebrow, typing.name, typing.definition, typing.analogy], part.start);
      keys.push({ at: part.start + typing.analogy.end + 0.1, kind: "bell" });
    }
  }
  return keys.sort((a, b) => a.at - b.at);
}

export const CONCEPT_TOUR_KEYSTROKES: readonly Keystroke[] = buildKeystrokes();
