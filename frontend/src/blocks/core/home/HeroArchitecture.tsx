import { useId } from "react";
import { useOrganismFieldAnchor } from "../../../organism/OrganismContext";
import { Disclosure } from "../../../shared/Disclosure";

import { ARCHITECTURE_RADII as R } from "./architectureGeometry";
import { HeroArchitectureDefs, type HeroArchitectureIds } from "./HeroArchitectureDefs";
import { HeroArchitectureLabels } from "./HeroArchitectureLabels";

const BIG_C_RINGS = [R.bigC, R.membrane] as const;

const FIELD_CONTOURS = [326, 338] as const;
const FIELD_RAYS = [-142, -108, -74, -40, 34, 68, 102, 136] as const;
const MEMBRANE_BANDS = [258, 270] as const;

const BIG_C_MEMBRANE_NODES = [-116, -72, -28, 18, 64, 112, 158, 204].map(
  (angle, index) => {
    const radians = (angle * Math.PI) / 180;
    const innerRadius = 278;
    const outerRadius = 286;

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
  const radius = 297;
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

/** Little c's current awareness & chosen intent (solid line to awareness boundary). */
const AWARENESS_TRACE_D = "M353 358C366 374 378 392 391 410";

/** Awareness potential & causal reach extending through RF₀ into the field (dotted continuation). */
const POTENTIAL_TRACE_D = "M391 410C410 440 430 478 454 518";

/** Combined causal trajectory. Glow and accessible path share it. */
const THREAD_D =
  "M353 358C366 374 378 392 391 410C410 440 430 478 454 518";

const polar = (radius: number, angleDeg: number) => ({
  x: 348 + Math.cos((angleDeg * Math.PI) / 180) * radius,
  y: 352 + Math.sin((angleDeg * Math.PI) / 180) * radius,
});

const arcPath = (radius: number, startDeg: number, endDeg: number) => {
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  return `M${start.x} ${start.y}A${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

/** The awareness radius: the region of options Little c can actually see. */
const AWARENESS_RADIUS = 72;

/** The radius is drawn, not implied: a spoke from centre to ring at this angle. */
const AWARENESS_SPOKE_ANGLE = 150;

/** Dotted arcs beyond the current radius: awareness can expand.
 *  Kept in the free quadrant around the spoke so they never cross an option. */
const AWARENESS_POTENTIAL_RADII = [96, 120] as const;
const AWARENESS_ARC_SPAN = 28;

/** Options RF₀ presents, arriving at the edge of the awareness radius. */
const OPTION_ANGLES = [205, 258, 310] as const;

const OPTION_ARROWS = OPTION_ANGLES.map((angle) => ({
  angle,
  from: polar(112, angle),
  to: polar(80, angle),
  node: polar(AWARENESS_RADIUS, angle),
}));

/** Where the intent thread crosses the ring: the option Little c chose. */
const CHOSEN_OPTION = { x: 391, y: 410 } as const;

/** Other Little c centres in RF₀. Their unequal rings make awareness developmental. */
const SOCIAL_CENTRES = [
  { angle: -62, distance: 138, awareness: 15 },
  { angle: 8, distance: 144, awareness: 20 },
  { angle: 218, distance: 142, awareness: 12 },
] as const;

const SOCIAL_RELATIONS = SOCIAL_CENTRES.map((centre) => ({
  ...centre,
  point: polar(centre.distance, centre.angle),
  from: polar(centre.distance - centre.awareness - 4, centre.angle),
  to: polar(AWARENESS_RADIUS + 5, centre.angle),
}));

/**
 * Code-native rendering of DOT's proposed layered architecture.
 *
 * This is intentionally separate from the book's state-machine illustration:
 * the hero identifies the hypothesis, while the book diagram explains transition.
 * Sharing either drawing would make a future editorial change to one silently
 * alter the meaning of the other.
 */
export function HeroArchitecture() {
  const fieldAnchor = useOrganismFieldAnchor({
    kind: "architecture",
    coreRatio: R.core / R.origin,
  });
  const instanceId = useId().replaceAll(":", "");
  const ids: HeroArchitectureIds = {
    gridId: `${instanceId}-hero-rf-grid`,
    arrowId: `${instanceId}-hero-trace-arrow`,
    pressureArrowId: `${instanceId}-hero-pressure-arrow`,
    radiusArrowId: `${instanceId}-hero-radius-arrow`,
    fieldWashId: `${instanceId}-hero-field-wash`,
    frameWashId: `${instanceId}-hero-frame-wash`,
    localWashId: `${instanceId}-hero-local-wash`,
    threadId: `${instanceId}-hero-thread`,
    frameClipId: `${instanceId}-hero-frame-clip`,
    surfacePrefix: `${instanceId}-hero-surface`,
  };
  const {
    gridId, arrowId, pressureArrowId, fieldWashId, frameWashId,
    localWashId, threadId, frameClipId, surfacePrefix,
  } = ids;
  const captionId = `${instanceId}-hero-architecture-caption`;
  const descriptionId = `${instanceId}-hero-architecture-description`;

  return (
    <figure className="home-hero-architecture" aria-labelledby={captionId} aria-describedby={descriptionId}>
      <svg
        className="home-hero-architecture__svg"
        viewBox="0 0 700 700"
        focusable="false"
      >
        <HeroArchitectureDefs ids={ids} />

        <circle
          className="home-architecture-field-wash"
          cx="348"
          cy="352"
          r="314"
          fill={`url(#${fieldWashId})`}
        />

        <circle ref={fieldAnchor} className="home-architecture-origin-boundary" cx="348" cy="352" r={R.origin} />

        <g className="home-architecture-field-contours" aria-hidden="true">
          {FIELD_CONTOURS.map((radius) => (
            <path key={radius} d={arcPath(radius, 202, 338)} />
          ))}
          {FIELD_RAYS.map((angle) => {
            const start = polar(320, angle);
            const end = polar(336, angle);
            return <line key={angle} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
          })}
        </g>

        <circle
          className="home-architecture-big-c-zone home-architecture-surface"
          cx="348" cy="352" r={R.bigC}
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
            r="278"
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

        <g className="home-architecture-frame">
          <circle
            className="home-architecture-frame-zone home-architecture-surface"
            cx="348" cy="352" r={R.frame}
            fill={`url(#${surfacePrefix}-frame)`}
            stroke={`url(#${surfacePrefix}-rim)`}
            filter={`url(#${surfacePrefix}-shadow)`}
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

        <g className="home-architecture-social-field">
          <g className="home-architecture-social-relations">
            {SOCIAL_RELATIONS.map(({ angle, from, to }) => (
              <g key={angle}>
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                <circle cx={to.x} cy={to.y} r="2" />
                <path
                  className="home-architecture-awareness-brightening"
                  d={arcPath(AWARENESS_RADIUS, angle - 7, angle + 7)}
                />
              </g>
            ))}
          </g>
          <g className="home-architecture-peer-centres">
            {SOCIAL_RELATIONS.map(({ angle, point, awareness }) => (
              <g key={angle} className="home-architecture-peer-centre">
                <circle
                  className="home-architecture-peer-awareness"
                  cx={point.x}
                  cy={point.y}
                  r={awareness}
                />
                <circle
                  className="home-architecture-peer-core"
                  cx={point.x}
                  cy={point.y}
                  r="3.2"
                />
              </g>
            ))}
          </g>
        </g>

        <g className="home-architecture-frame-pressure">
          {OPTION_ARROWS.map(({ angle, from, to }) => (
            <line
              key={angle}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              markerEnd={`url(#${pressureArrowId})`}
            />
          ))}
        </g>

        <g className="home-architecture-causal-trace">
          <path
            className="home-architecture-thread-glow"
            d={THREAD_D}
            stroke={`url(#${threadId})`}
            pathLength="1"
          />
          {/* Solid line: Little c's current awareness & chosen intent */}
          <path
            className="home-architecture-awareness-trace"
            d={AWARENESS_TRACE_D}
            stroke={`url(#${threadId})`}
            pathLength="1"
          />
          {/* Dotted continuation: Awareness potential & causal trajectory extending through RF₀ */}
          <path
            className="home-architecture-potential-trace"
            d={POTENTIAL_TRACE_D}
            stroke={`url(#${threadId})`}
            markerEnd={`url(#${arrowId})`}
          />
          <circle cx="454" cy="518" r="3" />
        </g>

        <g className="home-architecture-little-c">
          <circle
            className="home-architecture-local-aura"
            cx="348"
            cy="352"
            r={R.awareness}
            fill={`url(#${localWashId})`}
          />
          <circle
            className="home-architecture-surface"
            cx="348" cy="352" r={R.local}
            fill={`url(#${surfacePrefix}-local)`}
            stroke={`url(#${surfacePrefix}-rim)`}
            filter={`url(#${surfacePrefix}-shadow)`}
          />
          <circle className="home-architecture-local-ring" cx="348" cy="352" r={R.local} />
          <circle className="home-architecture-local-core" cx="348" cy="352" r={R.core} />
          <circle className="home-architecture-local-pin" cx="348" cy="352" r="2.25" />
        </g>

        <g className="home-architecture-awareness-radius">
          <g className="home-architecture-awareness-potential">
            {AWARENESS_POTENTIAL_RADII.map((radius) => (
              <path
                key={radius}
                d={arcPath(
                  radius,
                  AWARENESS_SPOKE_ANGLE - AWARENESS_ARC_SPAN,
                  AWARENESS_SPOKE_ANGLE + AWARENESS_ARC_SPAN,
                )}
              />
            ))}
          </g>
          <circle
            className="home-architecture-awareness-ring"
            cx="348"
            cy="352"
            r={AWARENESS_RADIUS}
          />
          {OPTION_ARROWS.map(({ angle, node }) => (
            <circle
              key={angle}
              className="home-architecture-option-node"
              cx={node.x}
              cy={node.y}
              r="2.6"
            />
          ))}
          <circle
            className="home-architecture-option-node"
            data-chosen="true"
            cx={CHOSEN_OPTION.x}
            cy={CHOSEN_OPTION.y}
            r="3.4"
          />
        </g>

        <HeroArchitectureLabels />
      </svg>

      <figcaption className="home-architecture-caption">
        <span id={captionId} className="sr-only">DOT’s proposed architecture</span>
        <span id={descriptionId} className="sr-only">
          T and E precede Big C; Big C generates RF₀, our physical universe;
          Little c experiences and acts within it. The rings are conceptual,
          not spatial. DOT proposes this environment as a setting for Little c
          to live, explore possibilities, and develop.
        </span>
        <Disclosure className="home-architecture-guide" summary="About the diagram">
          <p>
            Conceptual rings, not spatial boundaries. Shading adds visual depth,
            not physical scale. The page-wide curved field suggests continuity and
            possibility, not measured structure outside our universe.
          </p>
          <p>
            RF₀’s grid and graphite boundaries identify physical structure.
            The accent identifies conscious processes: experiencers, awareness,
            and Intent. Dotted links distinguish offered options and social
            coupling from chosen action.
          </p>
          <dl>
            <div><dt>T · E</dt><dd>Continuity and possibility, proposed to precede consciousness.</dd></div>
            <div><dt>Big C</dt><dd>The proposed conscious organism that generates our world.</dd></div>
            <div><dt>RF₀</dt><dd>The physical universe, proposed as Big C’s developmental environment for Little c. Generated does not mean unreal; consequences remain real.</dd></div>
            <div><dt>Little c</dt><dd>You, the local experiencer: noticing, choosing, and living with what follows.</dd></div>
          </dl>
          <p>
            Your awareness radius marks the options you can perceive. RF₀ is
            also a social environment: other experiencers can broaden that
            awareness. The world returns constraint and consequence; Little c
            reflects, chooses, and acts through Intent and embodied action.
          </p>
        </Disclosure>
      </figcaption>
    </figure>
  );
}

export default HeroArchitecture;
