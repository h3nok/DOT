import { CONCEPT_FILMS, type ConceptFilm } from "./conceptFilms";
import type { ConceptTextBeats } from "./ConceptFrame";

/** The preface's opening, before the first concept. */
export const TOUR_OPENING_SECONDS = 6;
/** Each concept's share of the film. */
export const TOUR_CONCEPT_SECONDS = 10;
/** The closing title. */
export const TOUR_CLOSING_SECONDS = 5;
/** How long one part takes to give way to the next. */
export const TOUR_CROSSFADE_SECONDS = 0.5;
/**
 * Each motif plays its sixteen-second study faster inside a ten-second part. Every motif's
 * motion settles by about 12.6 seconds, so 1.3× finishes the motion without rushing it.
 */
export const TOUR_MOTIF_SPEED = 1.3;

/** Text timing inside one concept's part of the tour. */
export const TOUR_CONCEPT_BEATS: ConceptTextBeats = {
  name: 0.3,
  definition: 1.8,
  wordStep: 0.07,
  source: 5,
};

export type TourPart =
  | { kind: "opening"; start: number; end: number }
  | { kind: "concept"; start: number; end: number; film: ConceptFilm; position: number }
  | { kind: "closing"; start: number; end: number };

function buildTour(): TourPart[] {
  const parts: TourPart[] = [{ kind: "opening", start: 0, end: TOUR_OPENING_SECONDS }];
  CONCEPT_FILMS.forEach((film, index) => {
    const start = TOUR_OPENING_SECONDS + index * TOUR_CONCEPT_SECONDS;
    parts.push({ kind: "concept", start, end: start + TOUR_CONCEPT_SECONDS, film, position: index + 1 });
  });
  const closingStart = TOUR_OPENING_SECONDS + CONCEPT_FILMS.length * TOUR_CONCEPT_SECONDS;
  parts.push({ kind: "closing", start: closingStart, end: closingStart + TOUR_CLOSING_SECONDS });
  return parts;
}

/** One silent film through every concept in the Concept Map, in the map's order. */
export const CONCEPT_TOUR: readonly TourPart[] = buildTour();

export const CONCEPT_TOUR_SECONDS = CONCEPT_TOUR[CONCEPT_TOUR.length - 1].end;

/** Where each concept begins, for marks on the timeline. */
export const CONCEPT_TOUR_NOTCHES = CONCEPT_TOUR.filter((part) => part.kind === "concept").map(
  (part) => part.start,
);

/** The part playing at a film second; the end of the film belongs to the closing title. */
export function tourPartAt(seconds: number): TourPart {
  return (
    CONCEPT_TOUR.find((part) => seconds >= part.start && seconds < part.end) ??
    CONCEPT_TOUR[CONCEPT_TOUR.length - 1]
  );
}

/** How visible a part is at a film second: it fades in at its start and out at its end. */
export function tourPartOpacity(part: TourPart, seconds: number): number {
  const fadeIn = part.start === 0 ? 1 : Math.min(1, (seconds - part.start) / TOUR_CROSSFADE_SECONDS);
  const fadeOut = part.end >= CONCEPT_TOUR_SECONDS ? 1 : Math.min(1, (part.end - seconds) / TOUR_CROSSFADE_SECONDS);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

/** A spoken position on the timeline, e.g. "Concept 3 of 17: The Big C Hypothesis". */
export function describeTourTime(seconds: number): string {
  const part = tourPartAt(seconds);
  if (part.kind === "opening") return "Opening";
  if (part.kind === "closing") return "Closing title";
  return `Concept ${part.position} of ${CONCEPT_FILMS.length}: ${part.film.node.title}`;
}
