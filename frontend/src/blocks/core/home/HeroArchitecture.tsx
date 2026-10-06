import { useId } from "react";
import { useOrganismFieldAnchor } from "../../../organism/OrganismContext";
import { Disclosure } from "../../../shared/Disclosure";

import { ARCHITECTURE_RADII as R, membranePath } from "./architectureGeometry";
import { HeroArchitectureDefs, type HeroArchitectureIds } from "./HeroArchitectureDefs";
import { HeroArchitectureExperiencers } from "./HeroArchitectureExperiencers";
import { HeroArchitectureLabels } from "./HeroArchitectureLabels";
import { HeroArchitectureOtherFrames } from "./HeroArchitectureOtherFrames";

const BIG_C_RINGS = [R.bigC, R.membrane] as const;

/* Big C is grown: each membrane wavers slightly, offset from its neighbour. */
const BIG_C_MEMBRANE = { amplitude: 3.2, lobes: 5 } as const;
const bigCMembrane = (radius: number, phase: number) =>
  membranePath(348, 352, radius, { ...BIG_C_MEMBRANE, phase });

const FIELD_CONTOURS = [326, 338] as const;
/* The top-centre stays open for the T · E label. */
const FIELD_ARCS = [[202, 256], [284, 338]] as const;
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

const polar = (radius: number, angleDeg: number) => ({
  x: 348 + Math.cos((angleDeg * Math.PI) / 180) * radius,
  y: 352 + Math.sin((angleDeg * Math.PI) / 180) * radius,
});

const arcPath = (radius: number, startDeg: number, endDeg: number) => {
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  return `M${start.x} ${start.y}A${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

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
  };
  const {
    gridId, fieldWashId, frameWashId, frameClipId, surfacePrefix,
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
          {FIELD_CONTOURS.flatMap((radius) => FIELD_ARCS.map(([start, end]) => (
            <path key={`${radius}-${start}`} d={arcPath(radius, start, end)} />
          )))}
          {FIELD_RAYS.map((angle) => {
            const start = polar(320, angle);
            const end = polar(336, angle);
            return <line key={angle} x1={start.x} y1={start.y} x2={end.x} y2={end.y} />;
          })}
        </g>

        <path
          className="home-architecture-big-c-zone home-architecture-surface"
          d={bigCMembrane(R.bigC, 0)}
          fill={`url(#${surfacePrefix}-big-c)`}
          stroke={`url(#${surfacePrefix}-rim)`}
          filter={`url(#${surfacePrefix}-shadow)`}
        />

        <g className="home-architecture-big-c">
          {BIG_C_RINGS.map((radius, index) => (
            <path
              key={radius}
              data-contour={index + 1}
              d={bigCMembrane(radius, index * 1.3)}
            />
          ))}
        </g>

        <g className="home-architecture-organism-membrane" aria-hidden="true">
          <g className="home-architecture-membrane-bands">
            {MEMBRANE_BANDS.map((radius) => (
              <path key={radius} d={arcPath(radius, 38, 142)} />
            ))}
          </g>
          <path
            className="home-architecture-organism-inner-membrane"
            d={bigCMembrane(278, 2.6)}
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

        <HeroArchitectureOtherFrames />

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

        <HeroArchitectureExperiencers ids={ids} />

        <HeroArchitectureLabels />
      </svg>

      <figcaption className="home-architecture-caption">
        <span id={captionId} className="sr-only">DOT’s proposed architecture</span>
        <span id={descriptionId} className="sr-only">
          T and E precede Big C; Big C develops Reality Frames. RF₀, our
          physical universe, is one of them: structure rather than a conscious
          process. Other Reality Frames, RF₁, RF₂ and onward to RFₙ, are
          hypothesized, may follow different rules, and have not been observed. RF₀ hosts many
          Little c, indexed c₁, c₂, c₃ and onward; c₁ is you. RF₀ presses on
          you through constraint and consequence and offers options to your
          awareness. Little c meet only through RF₀ and press on one another;
          you cooperate with c₂, which widens both your awareness. The rings
          are conceptual, not spatial. DOT proposes this environment as a
          setting for Little c to live, explore possibilities, and develop.
        </span>
        <Disclosure className="home-architecture-guide" summary="About the diagram">
          <p>
            Conceptual rings, not spatial boundaries. Shading adds visual depth,
            not physical scale. The page-wide curved field suggests continuity and
            possibility, not measured structure outside our universe.
          </p>
          <p>
            Two kinds of process, drawn two ways. Graphite is RF₀, the
            interaction environment: structure and law, not a conscious
            process, so it is drawn flat and centred on no experiencer. The
            accent marks conscious processes: Big C, each Little c, awareness,
            and Intent.
          </p>
          <dl>
            <div><dt>T · E</dt><dd>Continuity and possibility, proposed to precede consciousness.</dd></div>
            <div><dt>Big C</dt><dd>The proposed conscious organism that develops Reality Frames, our world among them.</dd></div>
            <div><dt>RF₁, RF₂ … RFₙ</dt><dd>Other Reality Frames DOT proposes Big C may develop, each under different rules. Hypothesized and unobserved, so drawn small and dashed; their interiors only suggest that the rules differ.</dd></div>
            <div><dt>RF₀</dt><dd>The physical universe: structure and law, not a conscious process, and the one Reality Frame we can measure. Proposed as Big C’s developmental environment for us, hosting many Little c. Generated does not mean unreal; consequences remain real.</dd></div>
            <div><dt>Little c</dt><dd>You, the local experiencer c₁, one among many (c₂, c₃ … cₙ): noticing, choosing, and living with what follows.</dd></div>
            <div><dt>Solid graphite wedges</dt><dd>RF₀’s constraint and consequence, pressing on you directly.</dd></div>
            <div><dt>Open graphite chevrons</dt><dd>Options RF₀ offers, arriving at your awareness radius: the options you can perceive.</dd></div>
            <div><dt>Dotted double arrows</dt><dd>Mutual pressure between Little c. They meet only through RF₀, and each presses on the other.</dd></div>
            <div><dt>Solid accent link</dt><dd>Cooperation, which widens the awareness of both. cₙ lies beyond your awareness for now.</dd></div>
          </dl>
          <p>
            DOT proposes that Big C’s aim is for Little c to cooperate so that
            each can reach its potential. RF₀ does not impose this: will is free.
            It is a high-fidelity, difficult environment in which uplifting one
            another works better than condescension. You choose, act through
            Intent and embodied action, and the world returns constraint and
            consequence.
          </p>
        </Disclosure>
      </figcaption>
    </figure>
  );
}

export default HeroArchitecture;
