import { useId, useRef } from "react";
import { useInView } from "framer-motion";
import { useOrganismFieldAnchor } from "../../../organism/OrganismContext";

import { ARCHITECTURE_RADII as R, C1_TRANSFORM } from "./architectureGeometry";
import { useArchitectureFocus } from "./architectureFocus";
import type { ArchitecturePartId } from "./heroData";
import { HeroArchitectureDefs, type HeroArchitectureIds } from "./HeroArchitectureDefs";
import { HeroArchitectureExperiencers } from "./HeroArchitectureExperiencers";
import { HeroArchitectureLabels } from "./HeroArchitectureLabels";
import { HeroArchitectureOtherFrames } from "./HeroArchitectureOtherFrames";

const BIG_C_RINGS = [R.bigC, R.membrane] as const;

const FIELD_CONTOURS = [R.origin + 8, R.origin + 20] as const;
/* The top-centre stays open for the T × E label. */
const FIELD_ARCS = [[202, 256], [284, 338]] as const;
const FIELD_RAYS = [-142, -108, -74, -40, 34, 68, 102, 136] as const;
const MEMBRANE_BANDS = [R.bigC - 28, R.bigC - 16] as const;
/* Big C's inner membrane, just inside its edge. */
const INNER_MEMBRANE = R.bigC - 8;

const BIG_C_MEMBRANE_NODES = [-116, -72, -28, 18, 64, 112, 158, 204].map(
  (angle, index) => {
    const radians = (angle * Math.PI) / 180;
    const innerRadius = INNER_MEMBRANE;
    const outerRadius = R.bigC;

    return {
      angle,
      radius: index % 3 === 0 ? 3.2 : 2.4,
      x1: 348 + Math.cos(radians) * innerRadius,
      y1: 352 + Math.sin(radians) * innerRadius,
      x2: 348 + Math.cos(radians) * outerRadius,
      y2: 352 + Math.sin(radians) * outerRadius,
    };
  },
);

const BIG_C_ORGANELLE_NODES = [
  -138, -94, -50, -6, 41, 88, 135, 181, 227,
].map((angle, index) => {
  const radians = (angle * Math.PI) / 180;
  const radius = R.membrane;
  return {
    angle,
    r: index % 2 === 0 ? 2 : 1.4,
    x: 348 + Math.cos(radians) * radius,
    y: 352 + Math.sin(radians) * radius,
  };
});

/** Cardinal points of the Frame circle, where its radius meets the boundary. */
const RETICLES = [
  { x: 348, y: 155 },
  { x: 545, y: 352 },
  { x: 348, y: 549 },
  { x: 151, y: 352 },
] as const;

const POLAR_TICKS = Array.from({ length: 24 }, (_, index) => {
  const angle = index * 15;
  const radians = (angle * Math.PI) / 180;
  const major = angle % 90 === 0;
  const intermediate = angle % 45 === 0;
  const outerRadius = 207;
  const innerRadius = major ? 195 : intermediate ? 198 : 201;

  return {
    angle,
    major,
    x1: 348 + Math.cos(radians) * innerRadius,
    y1: 352 + Math.sin(radians) * innerRadius,
    x2: 348 + Math.cos(radians) * outerRadius,
    y2: 352 + Math.sin(radians) * outerRadius,
  };
});

const polar = (radius: number, angleDeg: number) => ({
  x: 348 + Math.cos((angleDeg * Math.PI) / 180) * radius,
  y: 352 + Math.sin((angleDeg * Math.PI) / 180) * radius,
});

const arcPath = (radius: number, startDeg: number, endDeg: number) => {
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  return `M${start.x} ${start.y}A${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

/** A long clockwise arc (over 180°), used for the process loops. */
const loopPath = (radius: number, startDeg: number, endDeg: number) => {
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A${radius} ${radius} 0 1 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
};
/* Big C's outer loop runs between its membrane and T × E, open at the top for the label. */
const OUTER_LOOP = loopPath((R.membrane + R.origin) / 2, -70, 250);
/* c₁'s inner loop sits between its constraints and its awareness radius, open where its label and Intent leave. */
const INNER_LOOP = loopPath(52, 70, 350);

/**
 * Code-native rendering of DOT's proposed layered architecture.
 *
 * This is intentionally separate from the book's state-machine illustration:
 * the hero identifies the hypothesis, while the book diagram explains transition.
 * Sharing either drawing would make a future editorial change to one silently
 * alter the meaning of the other.
 */
export function HeroArchitecture() {
  const figure = useRef<HTMLElement>(null);
  const visible = useInView(figure, { once: true, amount: 0.3 });
  const fieldAnchor = useOrganismFieldAnchor({
    kind: "architecture",
    coreRatio: R.core / R.origin,
  });
  const instanceId = useId().replaceAll(":", "");
  const ids: HeroArchitectureIds = {
    gridId: `${instanceId}-hero-rf-grid`,
    arrowId: `${instanceId}-hero-trace-arrow`,
    optionArrowId: `${instanceId}-hero-option-arrow`,
    constraintArrowId: `${instanceId}-hero-constraint-arrow`,
    couplingArrowId: `${instanceId}-hero-coupling-arrow`,
    radiusArrowId: `${instanceId}-hero-radius-arrow`,
    fieldWashId: `${instanceId}-hero-field-wash`,
    frameWashId: `${instanceId}-hero-frame-wash`,
    localWashId: `${instanceId}-hero-local-wash`,
    threadId: `${instanceId}-hero-thread`,
    frameClipId: `${instanceId}-hero-frame-clip`,
    surfacePrefix: `${instanceId}-hero-surface`,
    outerLoopArrowId: `${instanceId}-hero-outer-loop-arrow`,
    innerLoopArrowId: `${instanceId}-hero-inner-loop-arrow`,
  };
  const {
    gridId, fieldWashId, frameWashId, frameClipId, surfacePrefix,
  } = ids;
  const titleId = `${instanceId}-hero-architecture-title`;
  const { focus, request } = useArchitectureFocus();

  return (
    <figure ref={figure} className="home-hero-architecture" data-emergence={visible ? "ready" : "waiting"} aria-labelledby={titleId}>
      {/* Pointer shortcut only: the concept slideshow names each part for every reader. */}
      <svg
        className="home-hero-architecture__svg"
        viewBox="0 0 700 700"
        aria-labelledby={titleId}
        focusable="false"
        data-focus={focus ?? undefined}
        onClick={(event) => {
          const target = event.target as Element;
          if (target.closest("a")) return;
          const part = target.closest("[data-part]")?.getAttribute("data-part") as ArchitecturePartId | null;
          if (part) request(part);
        }}
      >
        <title id={titleId}>DOT diagram</title>
        <HeroArchitectureDefs ids={ids} />

        <g data-part="te">
        <circle
          className="home-architecture-field-wash"
          cx="348"
          cy="352"
          r={R.origin - 4}
          fill={`url(#${fieldWashId})`}
        />

        <circle ref={fieldAnchor} className="home-architecture-origin-boundary" cx="348" cy="352" r={R.origin} />

        <g className="home-architecture-field-contours" aria-hidden="true">
          {FIELD_CONTOURS.flatMap((radius) => FIELD_ARCS.map(([start, end]) => (
            <path key={`${radius}-${start}`} d={arcPath(radius, start, end)} />
          )))}
          {FIELD_RAYS.map((angle) => {
            const start = polar(R.origin + 2, angle);
            const end = polar(R.origin + 18, angle);
            return <line key={angle} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
          })}
        </g>
        </g>

        <g data-part="big-c">
        <circle
          className="home-architecture-big-c-zone home-architecture-surface"
          cx="348"
          cy="352"
          r={R.bigC}
          fill={`url(#${surfacePrefix}-big-c)`}
          stroke={`url(#${surfacePrefix}-rim)`}
          filter={`url(#${surfacePrefix}-shadow)`}
        />

        <g className="home-architecture-big-c">
          {BIG_C_RINGS.map((radius, index) => (
            <circle
              key={radius}
              data-contour={index + 1}
              cx="348"
              cy="352"
              r={radius}
            />
          ))}
        </g>

        <g className="home-architecture-organism-membrane" aria-hidden="true">
          <g className="home-architecture-membrane-bands">
            {MEMBRANE_BANDS.map((radius) => (
              <path key={radius} d={arcPath(radius, 38, 142)} />
            ))}
          </g>
          <circle
            className="home-architecture-organism-inner-membrane"
            cx="348"
            cy="352"
            r={INNER_MEMBRANE}
          />
          {BIG_C_MEMBRANE_NODES.map(({ angle, radius, x1, y1, x2, y2 }) => (
            <g key={angle} className="home-architecture-organism-node">
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
              <circle cx={x2} cy={y2} r={radius} />
              <circle
                cx={x2}
                cy={y2}
                r={Math.max(1, radius * 0.42)}
                className="home-architecture-organism-node-core"
              />
            </g>
          ))}
          {BIG_C_ORGANELLE_NODES.map(({ angle, r, x, y }) => (
            <circle
              key={angle}
              className="home-architecture-organelle-node"
              cx={x}
              cy={y}
              r={r}
            />
          ))}
        </g>
        </g>

        <HeroArchitectureOtherFrames />

        <g data-part="rf0">
        <g className="home-architecture-frame">
          {/* RF₀ is structure, not an organism: a flat plane, never the living surface material. */}
          <circle
            className="home-architecture-frame-zone"
            cx="348" cy="352" r={R.frame}
          />
          <circle
            className="home-architecture-frame-wash"
            cx="348"
            cy="352"
            r={R.frame}
            fill={`url(#${frameWashId})`}
          />
          <rect
            className="home-architecture-grid"
            x="151"
            y="155"
            width="394"
            height="394"
            fill={`url(#${gridId})`}
            clipPath={`url(#${frameClipId})`}
          />
          <g className="home-architecture-frame-contours" clipPath={`url(#${frameClipId})`}>
            <circle cx="348" cy="352" r="154" />
            <circle cx="348" cy="352" r="128" />
          </g>
          <circle
            className="home-architecture-frame-boundary"
            cx="348"
            cy="352"
            r={R.frame}
          />
          {/* Built, not grown: a perfect machined bezel no organism carries. */}
          <circle
            className="home-architecture-frame-bezel"
            cx="348"
            cy="352"
            r={R.frame - 3}
          />
          <circle
            className="home-architecture-frame-inset"
            cx="348"
            cy="352"
            r="191"
          />

          <g className="home-architecture-coordinate-axis" clipPath={`url(#${frameClipId})`}>
            <line x1="151" y1="352" x2="545" y2="352" />
            <line x1="348" y1="155" x2="348" y2="549" />
          </g>

          {/* RF₀'s own origin: no experiencer occupies it. */}
          <g className="home-architecture-frame-origin" aria-hidden="true">
            <line x1="340" y1="352" x2="356" y2="352" />
            <line x1="348" y1="344" x2="348" y2="360" />
            <circle cx="348" cy="352" r="3.5" />
          </g>

          <g className="home-architecture-projection-marks" aria-hidden="true">
            <path d="M151 352L143 364M545 352L537 364M348 549L340 561" />
            <circle cx="143" cy="364" r="2" />
            <circle cx="537" cy="364" r="2" />
            <circle cx="340" cy="561" r="2" />
          </g>

          <g className="home-architecture-polar-scale">
            {POLAR_TICKS.map(({ angle, major, x1, y1, x2, y2 }) => (
              <line
                key={angle}
                data-major={major ? "true" : undefined}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
              />
            ))}
          </g>

          <g className="home-architecture-reticles">
            {RETICLES.map(({ x, y }) => (
              <g key={`${x}-${y}`} className="home-architecture-reticle">
                <line x1={x - 4} y1={y} x2={x + 4} y2={y} />
                <line x1={x} y1={y - 4} x2={x} y2={y + 4} />
              </g>
            ))}
          </g>
        </g>

        {/* Survey furniture: the one canonical rendering's measure marks. */}
        <g className="home-architecture-measure-marks" aria-hidden="true">
          <path d="M151 132V142M348 132V146M545 132V142" />
          <path d="M128 155H138M128 352H142M128 549H138" />
        </g>
        </g>

        <g data-part="little-c">
          <g className="home-architecture-experiencer-stage">
          <HeroArchitectureExperiencers ids={ids} />
          </g>
        </g>

        {/* Shown with the Process concept: Big C's outer loop and c₁'s inner one. */}
        <g className="home-architecture-process-loops" aria-hidden="true">
          {/* A halo under each loop lifts it off the ring it travels along. */}
          <g className="home-architecture-process-loop-stage" data-loop="outer">
          <path className="home-architecture-process-loop-halo" d={OUTER_LOOP} />
          <path className="home-architecture-process-loop home-architecture-process-loop--outer" d={OUTER_LOOP} markerEnd={`url(#${ids.outerLoopArrowId})`} />
          </g>
          <g className="home-architecture-process-loop-stage" data-loop="inner">
          <path className="home-architecture-process-loop-halo" d={INNER_LOOP} transform={C1_TRANSFORM} />
          <path className="home-architecture-process-loop home-architecture-process-loop--inner" d={INNER_LOOP} transform={C1_TRANSFORM} markerEnd={`url(#${ids.innerLoopArrowId})`} />
          </g>
        </g>

        <HeroArchitectureLabels />
      </svg>


    </figure>
  );
}

export default HeroArchitecture;
