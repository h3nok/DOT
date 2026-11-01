import { useId } from "react";
import { ARCHITECTURE_RADII as R, BIG_C_CENTRE as B, FRAME_CENTRE as F, LOCAL_CENTRE as C } from "./architectureGeometry";
import { ArchitectureSurfaceDefs } from "./ArchitectureSurfaceDefs";
import { HeroArchitectureAvatar } from "./HeroArchitectureExperiencers";

type Layer = "origin" | "big-c" | "reality-frame" | "little-c";

/** The shared relationships remain fixed while the selected concept is emphasized. */
export function ConceptArchitecture({ layer }: { layer: Layer }) {
  const surfacePrefix = `${useId().replaceAll(":", "")}-concept-surface`;
  const focused = layer === "little-c";
  const arrowId = `${surfacePrefix}-arrow`;
  return (
    <svg className="home-concept-architecture" data-focus={layer} viewBox={focused ? "65 180 565 435" : "0 0 700 700"} aria-hidden="true">
      <defs>
        <ArchitectureSurfaceDefs idPrefix={surfacePrefix} />
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M1 1L8 5L1 9" className="home-concept-arrowhead" />
        </marker>
      </defs>
      <g data-active={layer === "origin"} className="home-concept-contour" />
      <g data-active={layer === "big-c"} className="home-concept-contour">
        {!focused && <circle className="home-architecture-surface" cx={B.x} cy={B.y} r={R.bigC} fill={`url(#${surfacePrefix}-big-c)`} stroke={`url(#${surfacePrefix}-rim)`} filter={`url(#${surfacePrefix}-shadow)`} />}
      </g>
      <g data-active={layer === "reality-frame"} className="home-concept-contour" data-entity="reality-frame">
        <circle className="home-concept-frame-plane" cx={F.x} cy={F.y} r={R.frame} />
        <g data-entity="avatar"><HeroArchitectureAvatar x={F.x} y={F.y} scale={1.15} /></g>
      </g>
      <g data-active={layer === "little-c"} className="home-concept-contour">
        <path className="home-concept-exchange" d="M381 333H438" data-flow="reality-stream" markerEnd={`url(#${arrowId})`} />
        <circle className="home-architecture-surface" data-entity="little-c" cx={C.x} cy={C.y} r={R.local} fill={`url(#${surfacePrefix}-local)`} stroke={`url(#${surfacePrefix}-rim)`} filter={`url(#${surfacePrefix}-shadow)`} />
        <circle cx={C.x} cy={C.y} r={R.core} className="home-concept-node" />
        <path className="home-concept-exchange" d="M490 392V462" data-flow="access-update" markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`} />
        <rect className="home-concept-frame-plane" x="416" y="476" width="148" height="72" rx="12" data-entity="canvas" />
        <path className="home-concept-secondary" d="M430 534Q447 524 464 534T498 534T532 534" />
        <path className="home-concept-exchange" d="M411 526C354 579 280 554 255 493" data-flow="embodied-action" markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`} />
      </g>
      <g className="home-concept-labels">
        {!focused && <text className="home-concept-label" x="348" y="172" textAnchor="middle">Big C</text>}
        {layer !== "origin" && <>
          <text className="home-concept-label home-concept-label--world" x={F.x} y="298" textAnchor="middle">RF₀</text>
          <text className="home-concept-label home-concept-label--local" x={C.x} y="223" textAnchor="middle">Little c</text>
        </>}
        {(layer === "reality-frame" || focused) && <text className="home-concept-label home-concept-label--detail" x={F.x} y="481" textAnchor="middle">Living body</text>}
        {focused && <>
          <text className="home-concept-label home-concept-label--flow" x="410" y="273" textAnchor="middle">
            <tspan x="410">Reality</tspan><tspan x="410" dy="34">Stream</tspan>
          </text>
          <text className="home-concept-label home-concept-label--canvas" x="490" y="507" textAnchor="middle">Canvas</text>
          <text className="home-concept-label home-concept-label--flow" x="340" y="596" textAnchor="middle">Body ↔ Canvas</text>
        </>}
      </g>
    </svg>
  );
}
