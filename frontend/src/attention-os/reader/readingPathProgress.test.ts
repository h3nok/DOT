import { beforeEach, describe, expect, it } from "vitest";

import {
  clearReadingPathProgress,
  readReadingPathProgress,
  READING_PATH_PROGRESS_STORAGE_KEY,
  saveReadingPathProgress,
} from "./readingPathProgress";

describe("reading path progress", () => {
  beforeEach(() => window.localStorage.clear());

  it("keeps only the chosen path and current section on this device", () => {
    expect(
      saveReadingPathProgress("start-where-you-live", "the-canvas"),
    ).toEqual({
      pathId: "start-where-you-live",
      sectionSlug: "the-canvas",
    });
    expect(readReadingPathProgress()).toEqual({
      pathId: "start-where-you-live",
      sectionSlug: "the-canvas",
    });
  });

  it("ignores malformed, unknown, and out-of-path records", () => {
    for (const value of [
      "not-json",
      JSON.stringify({ pathId: "unknown", sectionSlug: "preface" }),
      JSON.stringify({
        pathId: "start-where-you-live",
        sectionSlug: "not-a-section",
      }),
    ]) {
      window.localStorage.setItem(READING_PATH_PROGRESS_STORAGE_KEY, value);
      expect(readReadingPathProgress()).toBeNull();
    }
  });

  it("can be cleared without affecting other reader data", () => {
    window.localStorage.setItem("dot.reader-note.v1.book-one.preface", "note");
    saveReadingPathProgress("start-with-the-architecture", "preface");

    clearReadingPathProgress();

    expect(readReadingPathProgress()).toBeNull();
    expect(
      window.localStorage.getItem("dot.reader-note.v1.book-one.preface"),
    ).toBe("note");
  });
});
