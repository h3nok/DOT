import { describe, expect, it } from "vitest";
import {
  findPath,
  isFinalStep,
  nextStep,
  positionOf,
  previousStep,
  READING_PATHS,
} from "./readingPaths";

/** Slugs released in the v1 manifest. A path may not point outside the canon. */
const CANON_SLUGS = new Set([
  "preface",
  "the-digital-organism",
  "the-decoupling-principle",
  "architecture-of-continuity",
  "reality-frames",
  "the-canvas",
  "the-painting",
  "references",
]);

describe("reading paths", () => {
  it("only ever points at released sections", () => {
    const stray = READING_PATHS.flatMap((path) =>
      path.steps.filter((step) => !CANON_SLUGS.has(step.slug)).map((s) => `${path.id}/${s.slug}`),
    );
    expect(stray).toEqual([]);
  });

  it("never repeats a section within a path", () => {
    for (const path of READING_PATHS) {
      const slugs = path.steps.map((step) => step.slug);
      expect(new Set(slugs).size, path.id).toBe(slugs.length);
    }
  });

  it("says why each step comes where it does", () => {
    const silent = READING_PATHS.flatMap((path) =>
      path.steps.filter((step) => !step.why.trim()).map((s) => `${path.id}/${s.slug}`),
    );
    expect(silent).toEqual([]);
  });

  it("offers a path that reaches the reader's own life before the architecture", () => {
    const path = findPath("start-where-you-live")!;

    expect(positionOf(path, "the-canvas")).toBeLessThan(
      positionOf(path, "the-digital-organism"),
    );
  });

  it("keeps the written order available", () => {
    const path = findPath("start-with-the-architecture")!;

    expect(path.steps.map((step) => step.slug)).toEqual([
      "preface",
      "the-digital-organism",
      "the-decoupling-principle",
      "architecture-of-continuity",
      "reality-frames",
      "the-canvas",
      "the-painting",
      "references",
    ]);
  });

  it("ends rather than continuing", () => {
    for (const path of READING_PATHS) {
      const last = path.steps[path.steps.length - 1];
      expect(nextStep(path, last.slug), path.id).toBeNull();
      expect(isFinalStep(path, last.slug), path.id).toBe(true);
    }
  });

  it("has a beginning with nothing before it", () => {
    for (const path of READING_PATHS) {
      expect(previousStep(path, path.steps[0].slug), path.id).toBeNull();
    }
  });

  it("walks forward and back through the middle", () => {
    const path = findPath("start-where-you-live")!;

    expect(nextStep(path, "the-canvas")?.slug).toBe("the-painting");
    expect(previousStep(path, "the-painting")?.slug).toBe("the-canvas");
  });

  it("reports nothing for a section outside the path", () => {
    const path = findPath("start-where-you-live")!;

    expect(positionOf(path, "not-a-section")).toBe(-1);
    expect(nextStep(path, "not-a-section")).toBeNull();
  });

  it("has no path for an unknown id", () => {
    expect(findPath("nope")).toBeNull();
  });
});
