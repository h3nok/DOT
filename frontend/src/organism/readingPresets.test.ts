import { describe, expect, it } from "vitest";

import { READING_PRESETS, matchReadingPreset } from "./readingPresets";
import { DEFAULT_CONFIG } from "./types";

describe("reading presets", () => {
  it("opens on the balanced editorial arrangement", () => {
    expect(matchReadingPreset(DEFAULT_CONFIG)).toBe("editorial");
  });

  it("recognises every complete arrangement", () => {
    for (const preset of READING_PRESETS) {
      expect(matchReadingPreset({ ...DEFAULT_CONFIG, ...preset.config })).toBe(preset.id);
    }
  });

  it("stops naming an arrangement after a reader refines it", () => {
    expect(matchReadingPreset({ ...DEFAULT_CONFIG, readingScale: 1.26 })).toBeNull();
  });

  it("keeps every arrangement within a readable line length", () => {
    expect(READING_PRESETS.every((preset) => preset.config.readingMeasure !== "wide")).toBe(
      true,
    );
  });
});
