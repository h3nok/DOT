import { ARCHITECTURE_RADII as R } from "./architectureGeometry";

type Layer = "origin" | "big-c" | "reality-frame" | "little-c";
const PARTICLES = Array.from({ length: 48 }, (_, index) => {
  const angle = index * Math.PI / 24;
  return { x: Math.cos(angle) * R.origin, y: Math.sin(angle) * R.origin };
});

/** The same nested architecture, with the current concept brought forward. */
export function ConceptArchitecture({ layer }: { layer: Layer }) {
  return (
    <svg className="home-concept-architecture" viewBox="0 0 700 700" aria-hidden="true">
      <g transform="translate(348 352)">
        <g data-active={layer === "origin"} className="home-concept-contour">
          <circle r={R.origin} strokeDasharray="1 11" />
          {PARTICLES.filter((_, i) => i % 3 === 0).map(({ x, y }, i) => (
            <circle key={i} cx={x} cy={y} r="3" className="home-concept-node" />
          ))}
        </g>
        <g data-active={layer === "big-c"} className="home-concept-contour">
          <circle r={R.bigC} />
          <circle r={R.membrane} className="home-concept-secondary" />
          {[-116, -72, -28, 18, 64, 112, 158, 204].map((angle) => (
            <circle key={angle} cx={Math.cos(angle * Math.PI / 180) * R.bigC}
              cy={Math.sin(angle * Math.PI / 180) * R.bigC} r="4" className="home-concept-node" />
          ))}
        </g>
        <g data-active={layer === "reality-frame"} className="home-concept-contour">
          <circle r={R.frame} />
          {[-120, -80, -40, 0, 40, 80, 120].flatMap((x) =>
            [-120, -80, -40, 0, 40, 80, 120].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" className="home-concept-node home-concept-secondary" />
            )),
          )}
          {[0, 90, 180, 270].map((angle) => (
            <path key={angle} transform={`rotate(${angle})`} d={`M0 ${R.frame - 7}v20`} />
          ))}
        </g>
        <g data-active={layer === "little-c"} className="home-concept-contour">
          <circle r={R.awareness} strokeDasharray="5 9" />
          <circle r={R.local} />
          <path d="M-58 58L-18 18M54 -54L70 -70M-54 -54L-70 -70" />
          <circle r={R.core} className="home-concept-node" />
        </g>
      </g>
    </svg>
  );
}
