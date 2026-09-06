/** A circular centre opening into a curved, rectangular mesh at the edges. */
export function radialField(width: number, height: number, density = 1) {
  const short = Math.min(width, height);
  const core = short * 0.047;
  const count = Math.round(96 * density);
  const rings = Math.round(30 * density);
  const extent = Math.hypot(width, height);
  const points = Array.from({ length: rings }, (_, ring) => {
    const progress = ring / (rings - 1);
    const radius = core * 1.2 * Math.pow(extent / (core * 1.2), progress);
    const power = 2 + 5 * progress ** 3;
    return Array.from({ length: count }, (_, spoke) => {
      const angle = (spoke / count) * Math.PI * 2;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const stretch = 1 / Math.pow(Math.abs(c) ** power + Math.abs(s) ** power, 1 / power);
      return {
        x: width / 2 + radius * c * stretch,
        y: height / 2 + radius * s * stretch,
      };
    });
  });
  return { core, points };
}
