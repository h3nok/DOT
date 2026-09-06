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

  it("defaults to Radial for both light and dark", () => {
    for (const base of ["light", "dark"] as const) {
      expect(defaultConfigFor(base).preset).toBe("radial");
      expect(ORGANISM_PRESETS[defaultConfigFor(base).preset].label).toBe("Radial");
    }
  });

  it("opens both defaults as gently moving long-form environments", () => {
    for (const base of ["light", "dark"] as const) {
      const config = defaultConfigFor(base);
      expect(config.readingFont).toBe("serif");
      expect(config.contrast).toBe("standard");
      expect(config.stillness).toBe(false);
      expect(config.enabled).toBe(true);
    }
  });

  it("starts with a balanced screen-reading measure", () => {
    for (const base of ["light", "dark"] as const) {
      const config = defaultConfigFor(base);
      expect(config.readingMeasure).toBe("standard");
      expect(config.readingLeading).toBe("standard");
      expect(config.readingAlign).toBe("justify");
    }
  });

  it("starts both bases in monochrome", () => {
    expect(defaultConfigFor("dark").tint).toBe("mono");
    expect(defaultConfigFor("light").tint).toBe("mono");
  });

  it("uses the neural surface for both quiet defaults", () => {
    expect(defaultConfigFor("dark").uiStyle).toBe("neural");
    expect(defaultConfigFor("light").uiStyle).toBe("neural");
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
