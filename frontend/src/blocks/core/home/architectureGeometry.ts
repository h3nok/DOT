/** Shared proportions for the main architecture and its concept details. */
export const ARCHITECTURE_RADII = {
  origin: 318,
  bigC: 298,
  membrane: 306,
  frame: 197,
  awareness: 84,
  local: 26,
  core: 6,
} as const;

/** RF₀'s own coordinate origin. */
export const FRAME_CENTRE = { x: 348, y: 352 } as const;

/** c₁ sits off RF₀'s origin: the Frame is not centred on any experiencer. */
export const C1_OFFSET = { x: -34, y: -20 } as const;
export const C1_TRANSFORM = `translate(${C1_OFFSET.x} ${C1_OFFSET.y})`;

/**
 * Other Reality Frames Big C may develop, each under its own rules. Hypothesized and
 * unobserved, so they are drawn dashed; RF₀ is drawn large only because we live in it.
 */
export const OTHER_FRAMES = [
  { index: "1", angle: -38, rules: "lattice" },
  { index: "2", angle: 215, rules: "polar" },
  { index: "n", angle: 162, rules: "unknown" },
] as const;
export const OTHER_FRAME_ORBIT = (ARCHITECTURE_RADII.frame + ARCHITECTURE_RADII.bigC) / 2;
export const OTHER_FRAME_RADIUS = 30;

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
