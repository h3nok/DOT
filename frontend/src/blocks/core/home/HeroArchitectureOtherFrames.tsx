import { OTHER_FRAME_ORBIT, OTHER_FRAME_RADIUS, OTHER_FRAMES } from "./architectureGeometry";

const centreOf = (angle: number) => ({
  x: 348 + Math.cos((angle * Math.PI) / 180) * OTHER_FRAME_ORBIT,
  y: 352 + Math.sin((angle * Math.PI) / 180) * OTHER_FRAME_ORBIT,
});

/** Chords of three line families at 60°: a lattice RF₀'s square grid does not share. */
function latticeChords(cx: number, cy: number, r: number) {
  const chords: string[] = [];
  for (const direction of [0, 60, 120]) {
    const t = (direction * Math.PI) / 180;
    const [dx, dy, nx, ny] = [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)];
    for (let offset = -r + 6; offset < r; offset += 9) {
      const half = Math.sqrt(r * r - offset * offset);
      const [ox, oy] = [cx + nx * offset, cy + ny * offset];
      chords.push(`M${(ox - dx * half).toFixed(1)} ${(oy - dy * half).toFixed(1)}L${(ox + dx * half).toFixed(1)} ${(oy + dy * half).toFixed(1)}`);
    }
  }
  return chords.join("");
}

function polarRules(cx: number, cy: number, r: number) {
  const spokes = Array.from({ length: 6 }, (_, index) => {
    const t = (index * 60 * Math.PI) / 180;
    return `M${cx} ${cy}L${(cx + Math.cos(t) * r).toFixed(1)} ${(cy + Math.sin(t) * r).toFixed(1)}`;
  }).join("");
  return (
    <>
      <circle cx={cx} cy={cy} r={r * 0.38} />
      <circle cx={cx} cy={cy} r={r * 0.72} />
      <path d={spokes} />
    </>
  );
}

/**
 * Big C is proposed to develop more than one Reality Frame. RF₀ is drawn large
 * only because we live in it; the others are hypotheses with their own rules.
 */
export function HeroArchitectureOtherFrames() {
  const inner = OTHER_FRAME_RADIUS - 4;
  return (
    <g className="home-architecture-other-frames" aria-hidden="true">
      {OTHER_FRAMES.map(({ index, angle, rules }) => {
        const { x, y } = centreOf(angle);
        return (
          <g key={index} className="home-architecture-other-frame" data-rules={rules}>
            <circle className="home-architecture-other-frame-zone" cx={x} cy={y} r={OTHER_FRAME_RADIUS} />
            <g className="home-architecture-other-frame-rules">
              {rules === "lattice" && <path d={latticeChords(x, y, inner)} />}
              {rules === "polar" && polarRules(x, y, inner)}
            </g>
            <circle className="home-architecture-other-frame-boundary" cx={x} cy={y} r={OTHER_FRAME_RADIUS} />
            <text className="home-architecture-other-frame-label" x={x} y={y + 6} textAnchor="middle">
              <tspan>RF</tspan>
              <tspan className="home-architecture-label-subscript">{index}</tspan>
            </text>
          </g>
        );
      })}
    </g>
  );
}
