import { describe, expect, it } from "vitest";
import {
  DEFAULT_BOTTOM_GAP_DEG,
  isInBottomGap,
  orderedRadialSlots,
} from "./radialOrder";

describe("ring geometry (doc 12 §6.1)", () => {
  it("starts the sequence at 12 o'clock", () => {
    for (const count of [1, 2, 3, 5, 8]) {
      expect(orderedRadialSlots(count)[0].angleDeg).toBe(-90);
    }
  });

  it("proceeds clockwise", () => {
    const angles = orderedRadialSlots(5).map((slot) => slot.angleDeg);

    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]).toBeGreaterThan(angles[i - 1]);
    }
  });

  it("never places a node under the nucleus label", () => {
    for (let count = 1; count <= 24; count++) {
      const offending = orderedRadialSlots(count)
        .map((slot) => slot.angleDeg)
        .filter((angle) => isInBottomGap(angle));
      expect(offending, `count=${count}`).toEqual([]);
    }
  });

  it("places the first slot directly above the centre", () => {
    const [first] = orderedRadialSlots(5);

    expect(first.ux).toBeCloseTo(0, 6);
    expect(first.uy).toBeCloseTo(-1, 6);
  });

  it("returns unit vectors", () => {
    for (const slot of orderedRadialSlots(7)) {
      expect(Math.hypot(slot.ux, slot.uy)).toBeCloseTo(1, 6);
    }
  });

  it("spaces slots evenly along the available arc", () => {
    const count = 6;
    const step = (360 - DEFAULT_BOTTOM_GAP_DEG) / count;
    const slots = orderedRadialSlots(count);

    for (let i = 1; i < slots.length; i++) {
      const delta = slots[i].angleDeg - slots[i - 1].angleDeg;
      // Consecutive slots are one step apart, except across the reserved arc.
      const even = Math.abs(delta - step) < 1e-9;
      const acrossGap = Math.abs(delta - (step + DEFAULT_BOTTOM_GAP_DEG)) < 1e-9;
      expect(even || acrossGap, `delta=${delta}`).toBe(true);
    }
  });

  it("has nothing to place for an empty ring", () => {
    expect(orderedRadialSlots(0)).toEqual([]);
  });
});
