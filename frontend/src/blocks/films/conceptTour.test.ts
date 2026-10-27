import { describe, expect, it } from "vitest";

import { doctrineNodes } from "../../content/doctrine/doctrineData";
import {
  CONCEPT_TOUR,
  CONCEPT_TOUR_NOTCHES,
  CONCEPT_TOUR_SECONDS,
  TOUR_CONCEPT_SECONDS,
  describeTourTime,
  tourPartAt,
  tourPartOpacity,
} from "./conceptTour";

describe("concept tour", () => {
  it("passes through every concept once, in the Concept Map's order, between an opening and a close", () => {
    expect(CONCEPT_TOUR[0].kind).toBe("opening");
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
    expect(CONCEPT_TOUR_SECONDS).toBeLessThan(4 * 60);
  });

  it("names the part at any second and passes between parts through a fade", () => {
    const bigC = CONCEPT_TOUR.find((part) => part.kind === "concept" && part.film.id === "big-c")!;
    const middle = bigC.start + TOUR_CONCEPT_SECONDS / 2;
    expect(tourPartAt(middle)).toBe(bigC);
    expect(describeTourTime(middle)).toBe(`Concept 3 of ${doctrineNodes.length}: The Big C Hypothesis`);
    expect(tourPartOpacity(bigC, middle)).toBe(1);
    expect(tourPartOpacity(bigC, bigC.start)).toBe(0);
    expect(tourPartOpacity(bigC, bigC.end)).toBe(0);

    expect(describeTourTime(0)).toBe("Opening");
    expect(tourPartOpacity(CONCEPT_TOUR[0], 0)).toBe(1);
    expect(describeTourTime(CONCEPT_TOUR_SECONDS)).toBe("Closing title");
    expect(tourPartOpacity(CONCEPT_TOUR.at(-1)!, CONCEPT_TOUR_SECONDS)).toBe(1);
  });
});
