import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENVIRONMENT,
  THEME_PRESETS,
  defaultConfigFor,
  matchThemePreset,
  themePreset,
} from "./themePresets";
import { DEFAULT_CONFIG, ORGANISM_PRESETS } from "./types";

describe("default environment", () => {
  it("has a default for each base, and it belongs to that base", () => {
    for (const base of ["light", "dark"] as const) {
      expect(themePreset(DEFAULT_ENVIRONMENT[base]).base).toBe(base);
    }
  });

  it("lands a first-time reader inside a named environment, not on 'Custom'", () => {
    // The panel shows "Custom" whenever the config matches no preset. On a
    // first visit that would describe a choice the reader never made.
    for (const base of ["light", "dark"] as const) {
      expect(matchThemePreset(defaultConfigFor(base), base)).toBe(
        DEFAULT_ENVIRONMENT[base],
      );
    }
  });

  it("leaves the reading settings at their neutral values", () => {
    // An environment speaks for light, ground, and surface. Measure, size,
    // leading, and alignment are reading decisions and are not its business.
    for (const base of ["light", "dark"] as const) {
      const cfg = defaultConfigFor(base);
      expect(cfg.readingScale).toBe(DEFAULT_CONFIG.readingScale);
      expect(cfg.readingMeasure).toBe(DEFAULT_CONFIG.readingMeasure);
      expect(cfg.readingLeading).toBe(DEFAULT_CONFIG.readingLeading);
      expect(cfg.readingAlign).toBe(DEFAULT_CONFIG.readingAlign);
      expect(cfg.paragraphStyle).toBe(DEFAULT_CONFIG.paragraphStyle);
      expect(cfg.fieldScale).toBe(1);
      expect(cfg.fieldSpeed).toBe(1);
      expect(cfg.fieldContrast).toBe(1);
    }
  });

  it("defaults to Current, the Reality Stream drawn as a quiet field", () => {
    // Current gives the first visit motion with a direction rather than
    // scattered marks to decode. The reading probe still damps the field while
    // a chapter is open, so the default can feel alive without competing with
    // the prose.
    for (const base of ["light", "dark"] as const) {
      expect(defaultConfigFor(base).preset).toBe("flow");
    }
    expect(ORGANISM_PRESETS[defaultConfigFor("light").preset].label).toBe("Current");
  });

  it("defaults to long-form type and never to a forced high contrast", () => {
    for (const base of ["light", "dark"] as const) {
      const cfg = defaultConfigFor(base);
      expect(cfg.readingFont).toBe("serif");
      // High contrast is an accessibility choice, not a look to impose.
      expect(cfg.contrast).toBe("standard");
      // The organism should be alive on arrival, but never forced into motion
      // for someone who asked their system for less of it.
      expect(cfg.enabled).toBe(true);
      expect(cfg.stillness).toBe(false);
    }
  });

  it("gives the dark default a pinned accent", () => {
    // An unpinned accent has a lower chroma floor, and a dark ground shows
    // colour less readily — "auto" at night drifts toward grey.
    expect(defaultConfigFor("dark").tint).toBe(212);
    expect(defaultConfigFor("light").tint).toBe("auto");
  });

  it("keeps both defaults on the surface the project is named for", () => {
    for (const base of ["light", "dark"] as const) {
      expect(defaultConfigFor(base).uiStyle).toBe("neural");
    }
  });

  it("still offers an environment on the other side of every default", () => {
    // A default is a starting point, not the only answer: each base needs at
    // least one genuinely different alternative to move to.
    for (const base of ["light", "dark"] as const) {
      const others = THEME_PRESETS.filter(
        (p) => p.base === base && p.id !== DEFAULT_ENVIRONMENT[base],
      );
      expect(others.length).toBeGreaterThanOrEqual(2);
    }
  });
});
