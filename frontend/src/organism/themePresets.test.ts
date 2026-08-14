import { describe, expect, it } from "vitest";

import { THEME_PRESETS, matchThemePreset, themePreset } from "./themePresets";
import { DEFAULT_CONFIG, ORGANISM_PRESETS, type OrganismConfig } from "./types";

const configFor = (id: Parameters<typeof themePreset>[0]): OrganismConfig => ({
  ...DEFAULT_CONFIG,
  ...themePreset(id).config,
});

describe("theme presets", () => {
  it("names a background that exists", () => {
    for (const preset of THEME_PRESETS) {
      expect(Object.keys(ORGANISM_PRESETS)).toContain(preset.config.preset);
    }
  });

  it("recognises its own environment as current", () => {
    for (const preset of THEME_PRESETS) {
      expect(matchThemePreset(configFor(preset.id), preset.base)).toBe(preset.id);
    }
  });

  it("stops claiming a preset once the reader changes one of its values", () => {
    // A preset is one considered answer, not a mode: adjusting any part of it
    // means the panel is looking at the reader's arrangement, not the preset's.
    const vellum = configFor("vellum");
    expect(matchThemePreset(vellum, "light")).toBe("vellum");
    expect(matchThemePreset({ ...vellum, preset: "lattice" }, "light")).toBeNull();
    expect(matchThemePreset(vellum, "dark")).toBeNull();
  });

  it("leaves the reader's own typography alone", () => {
    // Size, leading, and alignment are chosen while reading, not while
    // choosing a look; a preset that reset them would undo that work.
    const larger: OrganismConfig = {
      ...configFor("midnight"),
      readingScale: 1.26,
      readingLeading: "loose",
      readingAlign: "justify",
    };
    expect(matchThemePreset(larger, "dark")).toBe("midnight");
  });

  it("offers both a light and a dark environment", () => {
    const bases = new Set(THEME_PRESETS.map((preset) => preset.base));
    expect(bases).toEqual(new Set(["light", "dark"]));
  });

  it("keeps the accessible environment free of motion and background", () => {
    const clarity = themePreset("clarity");
    expect(clarity.config.contrast).toBe("high");
    expect(clarity.config.stillness).toBe(true);
    expect(clarity.config.preset).toBe("off");
    expect(clarity.config.showMembrane).toBe(false);
  });
});
