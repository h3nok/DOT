import type { ReactNode } from "react";
import { C1_TRANSFORM } from "./architectureGeometry";

/**
 * Layers are named on one vertical axis, each centred in its own region;
 * c₁'s own measures hang from c₁.
 */
const LABEL_TEXT = {
  origin: <text x="348" y="26" textAnchor="middle">T · E</text>,
  "big-c": <text x="348" y="120" textAnchor="middle">Big C</text>,
  "reality-frame": (
    <text x="348" y="192" textAnchor="middle">
      <tspan>RF</tspan>
      <tspan className="home-architecture-label-subscript">0</tspan>
    </text>
  ),
  "awareness-radius": (
    <text x="348" y="462" textAnchor="middle" aria-label="Your awareness radius">
      <tspan x="348">Awareness</tspan>
      {/* A zero-width word space keeps the accessible name while both lines centre on their glyphs. */}
      <tspan className="home-architecture-label-space"> </tspan>
      <tspan x="348" dy="1.15em">radius</tspan>
    </text>
  ),
  "little-c": (
    <text x="430" y="361" textAnchor="start">
      <tspan>Little c</tspan>
      <tspan className="home-architecture-label-subscript">1</tspan>
      <tspan className="home-architecture-label-you" x="430" dy="1.55em">— you</tspan>
    </text>
  ),
} satisfies Record<string, ReactNode>;

export function HeroArchitectureLabelGaps() {
  return (
    <g className="home-architecture-label-gaps" aria-hidden="true">
      {Object.entries(LABEL_TEXT).map(([layer, text]) => (
        <g key={layer} className="home-architecture-label-gap" data-layer={layer}>
          {text}
        </g>
      ))}
    </g>
  );
}

export function HeroArchitectureLabels() {
  return (
    <g className="home-architecture-ring-labels">
      <g className="home-architecture-ring-label" data-layer="origin">
        <a href="#possibility-field" aria-label="T · E — read about continuity and possibility">
          {LABEL_TEXT.origin}
        </a>
      </g>
      <g className="home-architecture-ring-label" data-layer="big-c">
        <a href="#big-c" aria-label="Big C — read about the first conscious organism">
          {LABEL_TEXT["big-c"]}
        </a>
      </g>
      <g className="home-architecture-ring-label" data-layer="reality-frame">
        <a href="#reality-frame" aria-label="RF₀ — read about the physical universe as a Reality Frame">
          {LABEL_TEXT["reality-frame"]}
        </a>
      </g>
      <g className="home-architecture-ring-label" data-layer="awareness-radius" transform={C1_TRANSFORM}>
        <circle className="home-architecture-awareness-callout-dot" cx="348" cy="424" r="2.2" />
        <path className="home-architecture-awareness-callout" d="M348 427V440" />
        {LABEL_TEXT["awareness-radius"]}
      </g>
      <g className="home-architecture-ring-label" data-layer="little-c" transform={C1_TRANSFORM}>
        <line className="home-architecture-label-leader" x1="378" y1="352" x2="422" y2="352" />
        <a href="#little-c" aria-label="Little c₁ — you. Read about the local experiencer">
          {LABEL_TEXT["little-c"]}
        </a>
      </g>
    </g>
  );
}
