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

/** Degrees the crown spreads across, centred on 12 o'clock. */
export const DEFAULT_CROWN_SPREAD_DEG = 120;

function slotAt(angleDeg: number): RadialSlot {
  const radians = (angleDeg * Math.PI) / 180;
  return { ux: Math.cos(radians), uy: Math.sin(radians), angleDeg };
}

/**
 * Slots arranged as a crown: spread evenly across an arc centred on 12 o'clock,
 * still in clockwise reading order.
 *
 * The ring reserves a bottom arc sized for a one-line nucleus label. The root
 * field's nucleus carries a masthead instead — mark, title, thesis, and the one
 * action into the canon — which is several hundred pixels tall and as wide as
 * the thesis. No bottom gap makes a *ring* clear of that, and a small ring
 * distributed clockwise from 12 also sits lopsided, weighted to one side.
 *
 * A crown keeps the field above the masthead and symmetrical about it, which is
 * what a small number of limbs needs. Deeper levels keep the ring: their centre
 * is a mark and a short label, so it can be orbited.
 */
export function crownSlots(
  count: number,
  spreadDeg: number = DEFAULT_CROWN_SPREAD_DEG,
): RadialSlot[] {
  if (count <= 0) return [];
  if (count === 1) return [slotAt(TOP)];
  const step = spreadDeg / (count - 1);
  return Array.from({ length: count }, (_, index) =>
    slotAt(TOP - spreadDeg / 2 + index * step),
  );
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
