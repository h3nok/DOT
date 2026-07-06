export interface RadialSlot {
  /** Unit vector from the centre (x right, y down — screen coordinates). */
  ux: number;
  uy: number;
  /** Angle in degrees, measured from the top, clockwise. */
  angleDeg: number;
}

/**
 * Even radial placement of `n` nodes around the centre, starting from the top.
 * A single node sits directly above the nucleus; more than one spreads evenly.
 * Returns unit vectors; the component multiplies by a responsive radius.
 */
export function radialSlots(n: number, startDeg = -90): RadialSlot[] {
  if (n <= 0) return [];
  return Array.from({ length: n }, (_, i) => {
    const angleDeg = startDeg + (360 / n) * i;
    const a = (angleDeg * Math.PI) / 180;
    return { ux: Math.cos(a), uy: Math.sin(a), angleDeg };
  });
}
