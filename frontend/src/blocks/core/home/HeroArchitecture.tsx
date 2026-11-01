import { useId, useRef } from "react";
import { useInView } from "framer-motion";
import { useOrganismFieldAnchor } from "../../../organism/OrganismContext";

import { ARCHITECTURE_RADII as R, C1_TRANSFORM, FRAME_CENTRE as F } from "./architectureGeometry";
import { HeroArchitectureDefs, type HeroArchitectureIds } from "./HeroArchitectureDefs";
import { HeroArchitectureAvatar, HeroArchitectureExperiencers } from "./HeroArchitectureExperiencers";
import { HeroArchitectureLabels } from "./HeroArchitectureLabels";
import { HeroArchitectureOtherFrames } from "./HeroArchitectureOtherFrames";

/* Big C's edge is a single rim; its process loop circles just outside it. */
const BIG_C_RINGS = [R.bigC] as const;

/** Each part of the figure opens the homepage section that explains it. */
const ARCHITECTURE_SECTIONS = {
  te: "possibility-field",
  "big-c": "big-c",
  rf0: "reality-frame",
  rfn: "reality-frame",
  "little-c": "little-c",
} as const;

type ArchitecturePartId = keyof typeof ARCHITECTURE_SECTIONS;

const FIELD_RAYS = [-142, -108, -74, -40, 34, 68, 102, 136] as const;
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

const POLAR_TICKS = Array.from({ length: 24 }, (_, index) => {
  const angle = index * Math.PI / 12;
  const major = index % 6 === 0;
  const inner = R.frame + (major ? 2 : 5);
  const outer = R.frame + 10;
  return { angle, major,
    x1: F.x + Math.cos(angle) * inner, y1: F.y + Math.sin(angle) * inner,
    x2: F.x + Math.cos(angle) * outer, y2: F.y + Math.sin(angle) * outer,
  };
});

const polar = (radius: number, angleDeg: number) => ({
  x: 348 + Math.cos((angleDeg * Math.PI) / 180) * radius,
  y: 352 + Math.sin((angleDeg * Math.PI) / 180) * radius,
});

/** A long clockwise arc (over 180°), used for the process loops. */
const loopPath = (radius: number, startDeg: number, endDeg: number) => {
  const start = polar(radius, startDeg);
  const end = polar(radius, endDeg);
  return `M${start.x.toFixed(1)} ${start.y.toFixed(1)}A${radius} ${radius} 0 1 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
};
/* Big C's outer loop runs between its membrane and T × E, open at the top for the label. */
const OUTER_LOOP = loopPath((R.membrane + R.origin) / 2, -70, 250);
/* c₁'s inner loop sits between its constraints and its awareness radius, open where its label and Intent leave. */
const INNER_LOOP = loopPath(56, 70, 350);

/**
 * Code-native rendering of DOT's proposed layered architecture.
 *
 * This is intentionally separate from the book's state-machine illustration:
 * the hero identifies the hypothesis, while the book diagram explains transition.
 * Sharing either drawing would make a future editorial change to one silently
 * alter the meaning of the other.
 */
export function HeroArchitecture({ embedded = false }: {
  /**
   * Drawn inside another surface, such as the film's closing: it emerges at once and leaves
   * the living background anchored to the homepage's own diagram.
   */
  embedded?: boolean;
} = {}) {
  const figure = useRef<HTMLElement>(null);
  const inView = useInView(figure, { once: true, amount: 0.3 });
  const processVisible = useInView(figure, { amount: 0.15 });
  const visible = embedded || inView;
  const homeFieldAnchor = useOrganismFieldAnchor({
    kind: "architecture",
    coreRatio: R.core / R.origin,
  });
  // An embedded copy leaves the living background anchored to the homepage's own diagram.
  const fieldAnchor = embedded ? undefined : homeFieldAnchor;
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
  const descriptionId = `${instanceId}-hero-architecture-description`;
  const partAt = (target: EventTarget) =>
    ((target as Element).closest("[data-part]")?.getAttribute("data-part") as ArchitecturePartId | null) ?? null;

  return (
    <figure ref={figure} className="home-hero-architecture" data-emergence={visible ? "ready" : "waiting"} data-process-visible={!embedded && processVisible ? "true" : undefined} aria-labelledby={titleId}>
      {/* Pointer shortcut only: the hero's "Explore the architecture" link and the
          page map reach the same sections from the keyboard. */}
      <svg
        className="home-hero-architecture__svg"
        viewBox="0 0 700 700"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        focusable="false"
        onClick={(event) => {
          if ((event.target as Element).closest("a")) return;
          const part = partAt(event.target);
          if (part) document.getElementById(ARCHITECTURE_SECTIONS[part])?.scrollIntoView({ block: "start" });
        }}
      >
        <title id={titleId}>DOT diagram</title>
        <desc id={descriptionId}>DOT’s proposed relationships, not measured physical locations. T × E is Speculation: the preexisting conditions outside Big C. Big C contains RF₀ and Little c. RF₀ is an experience laboratory shared through living Avatars. Little c is outside RF₀ and embodied by an Avatar inside it. The Reality Stream runs from RF₀ to Little c. The Canvas carries and updates local state; embodied action returns through the Avatar. The dashed scope marks available access and action. Broken arrows around Big C and Little c indicate process. Other Frames are hypotheses.</desc>
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
          <g className="home-architecture-frame" data-entity="reality-frame">
            <circle className="home-architecture-frame-zone" cx={F.x} cy={F.y} r={R.frame} />
            <circle className="home-architecture-frame-wash" cx={F.x} cy={F.y} r={R.frame} fill={`url(#${frameWashId})`} />
            <rect className="home-architecture-grid" x={F.x - R.frame} y={F.y - R.frame} width={R.frame * 2} height={R.frame * 2} fill={`url(#${gridId})`} clipPath={`url(#${frameClipId})`} />
            <circle className="home-architecture-frame-boundary" cx={F.x} cy={F.y} r={R.frame} />
            <circle className="home-architecture-frame-bezel" cx={F.x} cy={F.y} r={R.frame - 3} />
            <g className="home-architecture-coordinate-axis" clipPath={`url(#${frameClipId})`}>
              <line x1={F.x - R.frame} y1="406" x2={F.x + R.frame} y2="406" />
              <line x1="148" y1={F.y - R.frame} x2="148" y2={F.y + R.frame} />
              <line x1="322" y1={F.y - R.frame} x2="322" y2={F.y + R.frame} />
            </g>
            <g className="home-architecture-polar-scale">
              {POLAR_TICKS.map(({ angle, major, x1, y1, x2, y2 }) => (
                <line key={angle} data-major={major || undefined} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
            </g>
            <g data-entity="avatar" data-avatar="primary">
              <HeroArchitectureAvatar x={235} y={385} scale={.74} />
            </g>
            <g data-entity="avatar" data-avatar="other">
              <HeroArchitectureAvatar x={160} y={390} scale={.52} secondary />
              <HeroArchitectureAvatar x={310} y={390} scale={.52} secondary />
            </g>
            <text className="home-architecture-detail-label" x="235" y="464" textAnchor="middle">Avatar</text>
            <text className="home-architecture-small-label" x="235" y="496" textAnchor="middle">Living body</text>
          </g>
        </g>

        <g data-part="little-c">
          <g className="home-architecture-experiencer-stage">
          <HeroArchitectureExperiencers ids={ids} />
          </g>
        </g>

        {/* Broken arrows flow gently to distinguish ongoing process from a fixed boundary. */}
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
