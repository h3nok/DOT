import {
  ARCHITECTURE_RADII as R, LOCAL_CENTRE as C, membranePath,
} from "./architectureGeometry";
import type { HeroArchitectureIds } from "./HeroArchitectureDefs";

const CELL = membranePath(C.x, C.y, R.local, { amplitude: 2.5, lobes: 4, phase: .4 });
const INNER = membranePath(C.x, C.y, R.local - 8, { amplitude: 1.6, lobes: 4, phase: 2.4 });

/** The Avatar is the living body inside RF₀, through which Little c participates. */
export function HeroArchitectureAvatar({ x, y, scale = 1, secondary = false }: {
  x: number; y: number; scale?: number; secondary?: boolean;
}) {
  return (
    <g className="home-architecture-avatar" data-secondary={secondary || undefined} transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cy="-34" r="11" />
      <path d="M-8-20C-18-17-21-8-22 9L-23 25Q-23 31-18 31L-14 5L-13 24L-14 56H-4L0 28L4 56H14L13 24L14 5L18 31Q23 31 23 25L22 9C21-8 18-17 8-20Z" />
      <circle className="home-architecture-avatar-state" cy="-10" r="2.5" />
    </g>
  );
}

/** Little c receives RF₀'s Stream while remaining outside that Frame, within Big C. */
export function HeroArchitectureExperiencers({ ids }: { ids: HeroArchitectureIds }) {
  const { surfacePrefix, localWashId, arrowId, couplingArrowId, threadId } = ids;
  return (
    <>
      <g className="home-architecture-awareness-radius">
        <circle className="home-architecture-awareness-ring" cx={C.x} cy={C.y} r={R.awareness} />
      </g>
      <g className="home-architecture-little-c" data-entity="little-c">
        <circle className="home-architecture-local-aura" cx={C.x} cy={C.y} r={R.awareness} fill={`url(#${localWashId})`} />
        <path className="home-architecture-surface" d={CELL} fill={`url(#${surfacePrefix}-local)`} stroke={`url(#${surfacePrefix}-rim)`} filter={`url(#${surfacePrefix}-shadow)`} />
        <path className="home-architecture-local-ring" d={CELL} />
        <path className="home-architecture-local-inner" d={INNER} />
        <circle className="home-architecture-local-core" cx={C.x} cy={C.y} r={R.core} />
        <circle className="home-architecture-local-pin" cx={C.x} cy={C.y} r="2.25" />
      </g>
      <g className="home-architecture-exchange home-architecture-social-relations">
        <path className="home-architecture-stream" data-flow="reality-stream" d="M379 333H436" markerEnd={`url(#${couplingArrowId})`} />
        <text className="home-architecture-flow-label home-architecture-stream-label" x="393" y="254" textAnchor="middle">
          <tspan x="393">Reality</tspan><tspan x="393" dy="1.1em">Stream</tspan>
        </text>
        <path className="home-architecture-canvas-link" data-flow="access-update" d="M490 392V461" markerStart={`url(#${couplingArrowId})`} markerEnd={`url(#${couplingArrowId})`} />
        <g className="home-architecture-canvas" data-entity="canvas">
          <rect x="416" y="476" width="148" height="72" rx="12" />
          <text x="490" y="509" textAnchor="middle">Canvas</text>
          <path className="home-architecture-painting" d="M432 540C452 509 470 553 491 532S527 519 548 538M432 528C458 548 477 514 497 536S531 544 548 526" />
        </g>
      </g>
      <g className="home-architecture-causal-trace">
        <path className="home-architecture-awareness-trace" data-flow="embodied-action" d="M411 526C365 571 372 525 338 465" stroke={`url(#${threadId})`} markerEnd={`url(#${arrowId})`} pathLength="1" />
        <text className="home-architecture-flow-label" x="334" y="587" textAnchor="middle">Embodied action</text>
      </g>
    </>
  );
}
