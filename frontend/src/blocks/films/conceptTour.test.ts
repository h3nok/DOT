import { describe, expect, it } from "vitest";

import filmsData from "../../content/films.json";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import { conceptTyping } from "./conceptFilms";
import {
  CLOSING_TYPING,
  CONCEPT_TOUR,
  CONCEPT_TOUR_KEYSTROKES,
  CONCEPT_TOUR_NOTCHES,
  CONCEPT_TOUR_SECONDS,
  TOUR_OPENING_SECONDS,
  TOUR_CONCEPT_BEATS,
  TOUR_CONCEPT_SECONDS,
  TOUR_CROSSFADE_SECONDS,
  describeTourTime,
  sceneTyping,
  tourPartAt,
  tourPartDrift,
  tourPartOpacity,
  tourPictureOpacity,
  tourPlace,
} from "./conceptTour";

const scenes = filmsData.conceptTour.scenes;

describe("concept tour", () => {
  it("opens on four scenes, then passes through every concept once, in the Concept Map's order, to a close", () => {
    expect(CONCEPT_TOUR.slice(0, scenes.length).map((part) => (part.kind === "scene" ? part.scene.id : part.kind)))
      .toEqual(["struggle", "cultural-trap", "setup", "turn"]);
    expect(CONCEPT_TOUR[scenes.length].start).toBe(TOUR_OPENING_SECONDS);
    expect(CONCEPT_TOUR.at(-1)!.kind).toBe("closing");
    const concepts = CONCEPT_TOUR.flatMap((part) => (part.kind === "concept" ? [part.film.id] : []));
    expect(concepts).toEqual(doctrineNodes.map((node) => node.id));
    expect(CONCEPT_TOUR_NOTCHES).toHaveLength(doctrineNodes.length);
  });

  it("runs as one unbroken, finite timeline", () => {
    CONCEPT_TOUR.forEach((part, index) => {
      expect(part.end).toBeGreaterThan(part.start);
      if (index > 0) expect(part.start).toBe(CONCEPT_TOUR[index - 1].end);
    });
    expect(CONCEPT_TOUR[0].start).toBe(0);
    expect(CONCEPT_TOUR_SECONDS).toBe(CONCEPT_TOUR.at(-1)!.end);
    expect(CONCEPT_TOUR_SECONDS).toBeLessThan(5 * 60);
  });

  it("names the part at any second and passes between parts through a fade", () => {
    const bigC = CONCEPT_TOUR.find((part) => part.kind === "concept" && part.film.id === "big-c")!;
    const middle = bigC.start + TOUR_CONCEPT_SECONDS / 2;
    expect(tourPartAt(middle)).toBe(bigC);
    expect(describeTourTime(middle)).toBe(`Concept 3 of ${doctrineNodes.length}: The Big C Hypothesis`);
    expect(tourPartOpacity(bigC, middle)).toBe(1);
    expect(tourPartDrift(bigC, middle)).toBe(0);
    expect(tourPartOpacity(bigC, bigC.start)).toBe(0);
    expect(tourPartOpacity(bigC, bigC.end)).toBe(0);
    expect(tourPartDrift(bigC, bigC.start)).toBeGreaterThan(0);
    expect(tourPartDrift(bigC, bigC.end)).toBeLessThan(0);

    expect(describeTourTime(0)).toBe("Opening: The struggle");
    expect(tourPartOpacity(CONCEPT_TOUR[0], 0)).toBe(1);
    // The opening's drawing runs unbroken from scene to scene; only its words change.
    const trap = CONCEPT_TOUR[1];
    expect(tourPartOpacity(trap, trap.start)).toBe(0);
    expect(tourPictureOpacity(trap, trap.start)).toBe(1);
    expect(tourPictureOpacity(CONCEPT_TOUR[scenes.length - 1], TOUR_OPENING_SECONDS)).toBe(0);
    expect(describeTourTime(CONCEPT_TOUR_SECONDS)).toBe("Closing title");
    expect(tourPartOpacity(CONCEPT_TOUR.at(-1)!, CONCEPT_TOUR_SECONDS)).toBe(1);
  });

  it("finishes typing every part's words with time left to read them", () => {
    const fadeOut = TOUR_CONCEPT_SECONDS - TOUR_CROSSFADE_SECONDS;
    for (const part of CONCEPT_TOUR) {
      if (part.kind !== "concept") continue;
      const typing = conceptTyping(part.film, TOUR_CONCEPT_BEATS, tourPlace(part.position));
      expect(typing.definition.text).toBe(part.film.node.oneLine);
      expect(fadeOut - typing.analogy.end, part.film.id).toBeGreaterThanOrEqual(2.5);
    }
    for (const scene of scenes) {
      expect(scene.seconds - TOUR_CROSSFADE_SECONDS - sceneTyping(scene).note.end, scene.id).toBeGreaterThanOrEqual(2.5);
    }
    expect(CLOSING_TYPING.links).toBeLessThan(CONCEPT_TOUR.at(-1)!.end - CONCEPT_TOUR.at(-1)!.start);
  });

  it("types in time with the words: keys only while words are typed, one bell as each concept's words end", () => {
    const times = CONCEPT_TOUR_KEYSTROKES.map((key) => key.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[0]).toBeGreaterThan(0);
    expect(times.at(-1)!).toBeLessThan(CONCEPT_TOUR_SECONDS);
    const bells = CONCEPT_TOUR_KEYSTROKES.filter((key) => key.kind === "bell");
    expect(bells).toHaveLength(scenes.length + doctrineNodes.length + 1);

    // The last stretch of each concept, after its words are done, is quiet.
    for (const part of CONCEPT_TOUR) {
      if (part.kind !== "concept") continue;
      const typing = conceptTyping(part.film, TOUR_CONCEPT_BEATS, tourPlace(part.position));
      const quietFrom = part.start + typing.analogy.end + 0.2;
      expect(CONCEPT_TOUR_KEYSTROKES.some((key) => key.at > quietFrom && key.at < part.end)).toBe(false);
    }
  });
});
