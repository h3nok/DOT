import { ARCHITECTURE_RADII as R } from "./architectureGeometry";
import { ArchitectureSurfaceDefs } from "./ArchitectureSurfaceDefs";

export type HeroArchitectureIds = {
  gridId: string;
  arrowId: string;
  optionArrowId: string;
  constraintArrowId: string;
  couplingArrowId: string;
  radiusArrowId: string;
  fieldWashId: string;
  frameWashId: string;
  localWashId: string;
  threadId: string;
  frameClipId: string;
  surfacePrefix: string;
  outerLoopArrowId: string;
  innerLoopArrowId: string;
};

export function HeroArchitectureDefs({ ids }: { ids: HeroArchitectureIds }) {
  const {
    gridId, arrowId, optionArrowId, constraintArrowId, couplingArrowId, radiusArrowId, fieldWashId,
    frameWashId, localWashId, threadId, frameClipId, surfacePrefix, outerLoopArrowId, innerLoopArrowId,
  } = ids;

  return (
    <defs>
      <ArchitectureSurfaceDefs idPrefix={surfacePrefix} />
      <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
        <circle className="home-architecture-gridpoint" cx="1" cy="1" r="0.75" />
      </pattern>
      <marker
        id={arrowId}
        markerWidth="8"
        markerHeight="8"
        refX="6"
        refY="4"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path className="home-architecture-arrow" d="M0 0L8 4L0 8Z" />
      </marker>
      <marker
        id={optionArrowId}
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        {/* Open chevron: an option offered, not yet an action taken. */}
        <path className="home-architecture-option-arrow" d="M1 0L6 3L1 6" />
      </marker>
      <marker
        id={constraintArrowId}
        markerWidth="6"
        markerHeight="6"
        refX="5"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        {/* Solid wedge: constraint and consequence are applied, not offered. */}
        <path className="home-architecture-constraint-arrow" d="M0 0L6 3L0 6Z" />
      </marker>
      <marker
        id={couplingArrowId}
        markerWidth="6"
        markerHeight="6"
        refX="4.6"
        refY="3"
        orient="auto-start-reverse"
        markerUnits="strokeWidth"
      >
        <path className="home-architecture-coupling-arrow" d="M0.6 0.6L5 3L0.6 5.4Z" />
      </marker>
      <marker
        id={radiusArrowId}
        markerWidth="7"
        markerHeight="7"
        refX="5.2"
        refY="3"
        orient="auto-start-reverse"
        markerUnits="strokeWidth"
      >
        {/* Growth arrowhead: the awareness radius expands. */}
        <path className="home-architecture-radius-arrow" d="M0.6 0.6L5.4 3L0.6 5.4Z" />
      </marker>
      {[
        [outerLoopArrowId, "home-architecture-loop-arrow--outer"],
        [innerLoopArrowId, "home-architecture-loop-arrow--inner"],
      ].map(([id, className]) => (
        <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="5.4" refY="3.5" orient="auto" markerUnits="strokeWidth">
          <path className={className} d="M0.5 0.5L6.5 3.5L0.5 6.5Z" />
        </marker>
      ))}
      <radialGradient id={fieldWashId} cx="50%" cy="48%" r="52%">
        <stop className="home-architecture-field-stop" offset="0%" stopOpacity="0.14" />
        <stop className="home-architecture-field-stop" offset="58%" stopOpacity="0.05" />
        <stop className="home-architecture-field-stop" offset="100%" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={frameWashId} cx="50%" cy="52%" r="70%">
        <stop className="home-architecture-frame-stop" offset="0%" stopOpacity="0.2" />
        <stop className="home-architecture-frame-stop" offset="100%" stopOpacity="0.04" />
      </radialGradient>
      <radialGradient id={localWashId} cx="50%" cy="50%" r="50%">
        <stop className="home-architecture-local-stop" offset="0%" stopOpacity="0.28" />
        <stop className="home-architecture-local-stop" offset="42%" stopOpacity="0.1" />
        <stop className="home-architecture-local-stop" offset="100%" stopOpacity="0" />
      </radialGradient>
      {/* Runs along the thread so it gathers colour as consequence returns. */}
      <linearGradient
        id={threadId}
        x1="348"
        y1="352"
        x2="448"
        y2="510"
        gradientUnits="userSpaceOnUse"
      >
        <stop className="home-architecture-thread-from" offset="0%" />
        <stop className="home-architecture-thread-mid" offset="52%" />
        <stop className="home-architecture-thread-to" offset="100%" />
      </linearGradient>
      <clipPath id={frameClipId}>
        <circle cx="348" cy="352" r={R.frame} />
      </clipPath>
    </defs>
  );
}
