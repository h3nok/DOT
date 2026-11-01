/** Shared proportions for the main architecture and its concept details. */
export const ARCHITECTURE_RADII = {
  origin: 318,
  bigC: 298,
  membrane: 306,
  frame: 150,
  awareness: 80,
  local: 42,
  core: 6,
} as const;

/** Model relationships share one coordinate system; boundaries are not physical locations. */
export const BIG_C_CENTRE = { x: 348, y: 352 } as const;
export const FRAME_CENTRE = { x: 235, y: 371 } as const;
export const LOCAL_CENTRE = { x: 490, y: 333 } as const;
export const C1_OFFSET = { x: LOCAL_CENTRE.x - BIG_C_CENTRE.x, y: LOCAL_CENTRE.y - BIG_C_CENTRE.y } as const;
export const C1_TRANSFORM = `translate(${C1_OFFSET.x} ${C1_OFFSET.y})`;

/** Further Frames are hypothesized, not observed; they share Big C without enclosing Little c. */
export const OTHER_FRAMES = [
  { index: "1", x: 186, y: 196, rules: "lattice" },
  { index: "2", x: 348, y: 174, rules: "polar" },
  { index: "n", x: 510, y: 196, rules: "unknown" },
] as const;
export const OTHER_FRAME_RADIUS = 24;

/** A grown, gently irregular membrane. Organisms get this; the built Frame never does. */
export function membranePath(
  cx: number,
  cy: number,
  radius: number,
  { amplitude, lobes, phase = 0 }: { amplitude: number; lobes: number; phase?: number },
) {
  const steps = 96;
  const points = Array.from({ length: steps }, (_, step) => {
    const t = (step / steps) * Math.PI * 2;
    const r = radius + amplitude * (
      0.7 * Math.sin(lobes * t + phase) + 0.3 * Math.sin((lobes + 3) * t + phase * 1.7)
    );
    return `${(cx + Math.cos(t) * r).toFixed(2)} ${(cy + Math.sin(t) * r).toFixed(2)}`;
  });
  return `M${points.join("L")}Z`;
}
