/**
 * Ring geometry for the graph field (doc 12 §6.1).
 *
 * The sequence begins at 12 o'clock and proceeds clockwise, and the bottom arc
 * stays clear for the nucleus label and its single primary action. Positions are
 * computed from child count so the rule holds at every depth of the recursive
 * graph rather than being tuned for one screen.
 */

export interface RadialSlot {
  /** Unit vector, screen coordinates (y grows downward). */
  ux: number;
  uy: number;
  /** Degrees, -90 = 12 o'clock, increasing clockwise. */
  angleDeg: number;
}

/** Degrees of the bottom arc reserved for the nucleus label. */
export const DEFAULT_BOTTOM_GAP_DEG = 88;

const TOP = -90;

/**
 * Walk clockwise from the top, stepping over the reserved bottom arc.
 *
 * `travel` is distance along the available arc; converting it to an angle skips
 * the gap, so no slot can ever land under the nucleus label.
 */
function angleAtTravel(travel: number, gapDeg: number): number {
  const beforeGap = 180 - gapDeg / 2;
  return travel <= beforeGap ? TOP + travel : TOP + travel + gapDeg;
}

export function orderedRadialSlots(
  count: number,
  gapDeg: number = DEFAULT_BOTTOM_GAP_DEG,
): RadialSlot[] {
  if (count <= 0) return [];

  const available = 360 - gapDeg;
  return Array.from({ length: count }, (_, index) => {
    const angleDeg = angleAtTravel((available * index) / count, gapDeg);
    const radians = (angleDeg * Math.PI) / 180;
    return {
      ux: Math.cos(radians),
      uy: Math.sin(radians),
      angleDeg,
    };
  });
}

/** True when an angle falls inside the reserved bottom arc. */
export function isInBottomGap(
  angleDeg: number,
  gapDeg: number = DEFAULT_BOTTOM_GAP_DEG,
): boolean {
  const normalized = ((angleDeg % 360) + 360) % 360;
  const half = gapDeg / 2;
  return normalized > 90 - half && normalized < 90 + half;
}
