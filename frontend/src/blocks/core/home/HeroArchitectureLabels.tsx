import type { ReactNode } from "react";

/**
 * Each name is written once and drawn twice: visibly, and into the mask that
 * cuts its protected gap through the drawing. The gap follows the actual
 * glyphs at every responsive size, so no ring, tick, or node runs through text.
 */
const LABEL_TEXT = {
  origin: <text x="131" y="101" textAnchor="middle">T · E</text>,
  "big-c": <text x="535" y="138" textAnchor="middle">Big C</text>,
  "reality-frame": (
    <text x="187" y="244" textAnchor="middle">
      <tspan>RF</tspan>
      <tspan className="home-architecture-label-subscript">0</tspan>
    </text>
  ),
  "awareness-radius": (
    <text x="300" y="470" textAnchor="middle" aria-label="Your awareness radius">
      <tspan x="300">Awareness</tspan>
      {/* A zero-width word space keeps the accessible name while both lines centre on their glyphs. */}
      <tspan className="home-architecture-label-space"> </tspan>
      <tspan x="300" dy="1.15em">radius</tspan>
    </text>
  ),
  "little-c": <text x="430" y="361" textAnchor="start">Little c</text>,
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
      <g className="home-architecture-ring-label" data-layer="awareness-radius">
        <circle className="home-architecture-awareness-callout-dot" cx="348" cy="424" r="2.2" />
        <path className="home-architecture-awareness-callout" d="M348 427V438H300V445" />
        {LABEL_TEXT["awareness-radius"]}
      </g>
      <g className="home-architecture-ring-label" data-layer="little-c">
        <line className="home-architecture-label-leader" x1="378" y1="352" x2="422" y2="352" />
        <a href="#little-c" aria-label="Little c — read about the local experiencer">
          {LABEL_TEXT["little-c"]}
        </a>
      </g>
    </g>
  );
}
