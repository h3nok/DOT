import { useId } from "react";
import { ARCHITECTURE_RADII as R, BIG_C_CENTRE as B, FRAME_CENTRE as F, LOCAL_CENTRE as C } from "./architectureGeometry";
import { ArchitectureSurfaceDefs } from "./ArchitectureSurfaceDefs";
import { HeroArchitectureAvatar } from "./HeroArchitectureExperiencers";

type Layer = "origin" | "big-c" | "reality-frame" | "little-c";

/** The shared relationships remain fixed while the selected concept is emphasized. */
export function ConceptArchitecture({ layer }: { layer: Layer }) {
  const surfacePrefix = `${useId().replaceAll(":", "")}-concept-surface`;
  return (
    <svg className="home-concept-architecture" viewBox="0 0 700 700" aria-hidden="true">
      <defs><ArchitectureSurfaceDefs idPrefix={surfacePrefix} /></defs>
      <g data-active={layer === "origin"} className="home-concept-contour">
        <circle cx={B.x} cy={B.y} r={R.origin} strokeDasharray="1 11" />
      </g>
      <g data-active={layer === "big-c"} className="home-concept-contour">
        <circle className="home-architecture-surface" cx={B.x} cy={B.y} r={R.bigC} fill={`url(#${surfacePrefix}-big-c)`} stroke={`url(#${surfacePrefix}-rim)`} filter={`url(#${surfacePrefix}-shadow)`} />
        <circle cx={B.x} cy={B.y} r={R.membrane} className="home-concept-secondary" />
      </g>
      <g data-active={layer === "reality-frame"} className="home-concept-contour" data-entity="reality-frame">
        <circle className="home-concept-frame-plane" cx={F.x} cy={F.y} r={R.frame} />
        <g data-entity="avatar"><HeroArchitectureAvatar x={F.x} y={F.y} scale={1.15} /></g>
      </g>
      <g data-active={layer === "little-c"} className="home-concept-contour">
        <path className="home-concept-secondary" d="M381 333H438M426 326L438 333L426 340" data-flow="reality-stream" />
        <circle cx={C.x} cy={C.y} r={R.awareness} strokeDasharray="5 9" />
        <circle className="home-architecture-surface" data-entity="little-c" cx={C.x} cy={C.y} r={R.local} fill={`url(#${surfacePrefix}-local)`} stroke={`url(#${surfacePrefix}-rim)`} filter={`url(#${surfacePrefix}-shadow)`} />
        <circle cx={C.x} cy={C.y} r={R.core} className="home-concept-node" />
        <path d="M490 390V462M484 401L490 390L496 401M484 451L490 462L496 451" />
        <rect className="home-concept-frame-plane" x="416" y="476" width="148" height="72" rx="12" data-entity="canvas" />
        <path d="M431 523C455 490 481 547 506 514S532 510 550 528" />
        <path className="home-concept-secondary" d="M411 526C354 579 280 554 255 493M255 507V493L267 499" data-flow="embodied-action" />
      </g>
    </svg>
  );
}
