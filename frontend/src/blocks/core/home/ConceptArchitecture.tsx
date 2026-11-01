import { useId } from "react";
import { ARCHITECTURE_RADII as R, FRAME_CENTRE, LITTLE_C1 } from "./architectureGeometry";
import { ArchitectureSurfaceDefs } from "./ArchitectureSurfaceDefs";

type Layer = "origin" | "big-c" | "reality-frame" | "little-c";
const PARTICLES = Array.from({ length: 48 }, (_, index) => {
  const angle = index * Math.PI / 24;
  return { x: Math.cos(angle) * R.origin, y: Math.sin(angle) * R.origin };
});

/* Little c sits where the main figure puts it: in Big C, outside RF₀. Coordinates here are RF₀-centred. */
const LITTLE_C = { x: LITTLE_C1.x - FRAME_CENTRE.x, y: LITTLE_C1.y - FRAME_CENTRE.y };
const LITTLE_C_DISTANCE = Math.hypot(LITTLE_C.x, LITTLE_C.y);
const along = (distance: number) => ({
  x: (LITTLE_C.x / LITTLE_C_DISTANCE) * distance,
  y: (LITTLE_C.y / LITTLE_C_DISTANCE) * distance,
});
const STREAM_FROM = along(R.core + 10);
const STREAM_TO = along(LITTLE_C_DISTANCE - R.local - 10);

/** The same nested architecture, with the current concept brought forward. */
export function ConceptArchitecture({ layer }: { layer: Layer }) {
  const surfacePrefix = `${useId().replaceAll(":", "")}-concept-surface`;

  return (
    <svg className="home-concept-architecture" viewBox="0 0 700 700" aria-hidden="true">
      <defs>
        <ArchitectureSurfaceDefs idPrefix={surfacePrefix} />
      </defs>
      <g transform="translate(348 352)">
        <g data-active={layer === "origin"} className="home-concept-contour">
          <circle r={R.origin} strokeDasharray="1 11" />
          {PARTICLES.filter((_, i) => i % 3 === 0).map(({ x, y }, i) => (
            <circle key={i} cx={x} cy={y} r="3" className="home-concept-node" />
          ))}
        </g>
        <g data-active={layer === "big-c"} className="home-concept-contour">
          <circle
            className="home-architecture-surface"
            r={R.bigC}
            fill={`url(#${surfacePrefix}-big-c)`}
            stroke={`url(#${surfacePrefix}-rim)`}
            filter={`url(#${surfacePrefix}-shadow)`}
          />
          <circle r={R.membrane} className="home-concept-secondary" />
          {[-116, -72, -28, 18, 64, 112, 158, 204].map((angle) => (
            <circle key={angle} cx={Math.cos(angle * Math.PI / 180) * R.bigC}
              cy={Math.sin(angle * Math.PI / 180) * R.bigC} r="4" className="home-concept-node" />
          ))}
        </g>
        <g data-active={layer === "reality-frame"} className="home-concept-contour">
          <circle className="home-concept-frame-plane" r={R.frame} />
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
          {/* The body in RF₀, with the awareness and options it gives Little c there. */}
          <circle r={R.awareness + 28} strokeDasharray="2 8" className="home-concept-secondary" />
          <circle r={R.awareness} strokeDasharray="5 9" />
          <path d="M-58 58L-18 18M54 -54L70 -70M-54 -54L-70 -70" />
          <path d="M-24 14L-72 42" />
          <path d="M-72 42L-102 59" strokeDasharray="3 5" className="home-concept-secondary" />
          <circle cx="-72" cy="42" r="2.8" className="home-concept-node" />
          <circle r={R.core} className="home-concept-node" />
          {/* Little c itself, in Big C outside RF₀, fed by RF₀'s Reality Stream through the body. */}
          <path d={`M${STREAM_FROM.x.toFixed(1)} ${STREAM_FROM.y.toFixed(1)}L${STREAM_TO.x.toFixed(1)} ${STREAM_TO.y.toFixed(1)}`} strokeDasharray="6 5" />
          <circle
            className="home-architecture-surface"
            cx={LITTLE_C.x.toFixed(2)}
            cy={LITTLE_C.y.toFixed(2)}
            r={R.local}
            fill={`url(#${surfacePrefix}-local)`}
            stroke={`url(#${surfacePrefix}-rim)`}
            filter={`url(#${surfacePrefix}-shadow)`}
          />
          <circle cx={LITTLE_C.x.toFixed(2)} cy={LITTLE_C.y.toFixed(2)} r={R.core} className="home-concept-node" />
        </g>
      </g>
    </svg>
  );
}
