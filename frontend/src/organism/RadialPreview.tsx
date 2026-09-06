import { radialField } from "./radialField";

const { core, points } = radialField(64, 40, 0.3);

/** The same mesh as the page, simplified for the appearance thumbnails. */
export function RadialPreview({ color }: { color: string }) {
  return (
    <g stroke={color} fill={color}>
      {points.map((ring, index) => (
        <polygon key={index} points={ring.map(({ x, y }) => `${x},${y}`).join(" ")}
          fill="none" strokeWidth="0.35" strokeOpacity="0.3" />
      ))}
      {points[0].map((_, spoke) => (
        <polyline key={spoke} points={points.map((ring) => `${ring[spoke].x},${ring[spoke].y}`).join(" ")}
          fill="none" strokeWidth="0.35" strokeOpacity="0.3" />
      ))}
      {points.flatMap((ring, index) => ring.map(({ x, y }, spoke) => (
        <circle key={`${index}-${spoke}`} cx={x} cy={y} r="0.45" stroke="none" opacity="0.65" />
      )))}
      <circle cx="32" cy="20" r={core} stroke="none" opacity="0.7" />
    </g>
  );
}
