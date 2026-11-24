import { describe, expect, it } from "vitest";
import theme from "../content/theme.json";
import { DEFAULT_CONFIG, SIGNATURE_THEME, resolveOrganismConfig } from "./types";

describe("one signature theme (ADR-0061)", () => {
  it("starts every reader in the signature: rust radial field, neural surface, the theme's own paper", () => {
    expect(DEFAULT_CONFIG).toMatchObject({
      preset: "radial",
      uiStyle: "neural",
      tint: theme.accentHue,
      paperTone: "neutral",
      enabled: true,
      showMembrane: true,
      fieldScale: 1,
      fieldSpeed: 1,
      fieldContrast: 1,
    });
  });

  it("opens long-form reading at the composed defaults, moving gently", () => {
    expect(DEFAULT_CONFIG).toMatchObject({
      readingFont: "serif",
      readingScale: 1,
      readingMeasure: "standard",
      readingLeading: "standard",
      readingAlign: "justify",
      paragraphStyle: "spaced",
      contrast: "standard",
      stillness: false,
    });
  });

  it("brings a configuration saved under a retired environment into the signature, keeping its reading choices", () => {
    const midnight = {
      palette: "classic",
      preset: "flow",
      uiStyle: "cinematic",
      tint: 212,
      intensity: 0.62,
      paperTone: "cool",
      fieldScale: 1.4,
      readingFont: "humanist",
      readingScale: 1.26,
      readingLeading: "loose",
      contrast: "high",
    };
    const restored = resolveOrganismConfig(midnight);
    expect(restored).toMatchObject(SIGNATURE_THEME);
    expect(restored).toMatchObject({
      readingFont: "humanist",
      readingScale: 1.26,
      readingLeading: "loose",
      contrast: "high",
    });
    expect(restored).not.toHaveProperty("palette");
  });

  it.each([
    { stillness: true },
    { enabled: false },
    { showMembrane: false },
    { preset: "off" },
    { fieldSpeed: 0 },
  ])("keeps the page still for a saved appearance with %j", (saved) => {
    expect(resolveOrganismConfig(saved)).toMatchObject({ ...SIGNATURE_THEME, stillness: true });
  });

  it("starts a reader with no saved preferences in motion", () => {
    expect(resolveOrganismConfig({}).stillness).toBe(false);
  });
});
