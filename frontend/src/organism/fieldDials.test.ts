import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, ORGANISM_PRESETS, resolveDial, type OrganismPreset } from "./types";

describe("background fields", () => {
  it("clamps a stored dial instead of trusting it", () => {
    // A hand-edited or truncated config must not be able to blank the field
    // or drive the point budget somewhere the frame loop cannot afford.
    expect(resolveDial(9, 0.5, 1.6, 1)).toBe(1.6);
    expect(resolveDial(-3, 0.5, 1.6, 1)).toBe(0.5);
    expect(resolveDial(1.2, 0.5, 1.6, 1)).toBe(1.2);
    expect(resolveDial("wide", 0.5, 1.6, 1)).toBe(1);
    expect(resolveDial(Number.NaN, 0.5, 1.6, 1)).toBe(1);
    expect(resolveDial(undefined, 0, 1.6, 1)).toBe(1);
  });

  it("starts every dial at its neutral value", () => {
    // Default must mean "as designed": a reader who never opens the panel
    // should see exactly what the environment presets were tuned against.
    expect(DEFAULT_CONFIG.fieldScale).toBe(1);
    expect(DEFAULT_CONFIG.fieldSpeed).toBe(1);
    expect(DEFAULT_CONFIG.fieldContrast).toBe(1);
  });

  it("gives every field a distinct name and a usable spec", () => {
    const labels = Object.values(ORGANISM_PRESETS).map((field) => field.label);
    expect(new Set(labels).size).toBe(labels.length);

    for (const [id, spec] of Object.entries(ORGANISM_PRESETS)) {
      expect(spec.hint.length).toBeGreaterThan(0);
      expect(spec.alpha).toBeGreaterThanOrEqual(0);
      expect(spec.density).toBeGreaterThanOrEqual(0);
      // "Still" is the one field that is allowed to draw nothing.
      if (id !== "off") expect(spec.alpha).toBeGreaterThan(0);
    }
  });

  it("keeps the new patterns in the roster", () => {
    for (const field of ["interference", "flow", "strata"] as OrganismPreset[]) {
      expect(ORGANISM_PRESETS[field]).toBeDefined();
    }
  });
});
