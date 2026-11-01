/** The labels name model relationships and link to their existing explanations. */
export function HeroArchitectureLabels() {
  return (
    <g className="home-architecture-ring-labels">
      <g className="home-architecture-ring-label" data-layer="origin">
        <a href="#possibility-field" aria-label="T × E · Speculation — read about primordial Time and unformed information">
          <text x="348" y="26" textAnchor="middle">T × E<tspan className="home-architecture-label-you"> · Speculation</tspan></text>
        </a>
      </g>
      <g className="home-architecture-ring-label" data-layer="big-c">
        <a href="#big-c" aria-label="Big C — read about the proposed conscious process">
          <text x="348" y="120" textAnchor="middle">Big C</text>
        </a>
      </g>
      <g className="home-architecture-ring-label" data-layer="reality-frame">
        <a href="#reality-frame" aria-label="RF₀ — the physical universe, proposed as an experience laboratory">
          <text x="235" y="264" textAnchor="middle">RF<tspan className="home-architecture-label-subscript">0</tspan></text>
        </a>
      </g>
      <text className="home-architecture-small-label home-architecture-frame-purpose" x="235" y="298" textAnchor="middle">
        <tspan x="235">Experience</tspan><tspan x="235" dy="1.15em">laboratory</tspan>
      </text>
      <g className="home-architecture-ring-label" data-layer="little-c">
        <a href="#little-c" aria-label="Little c — the local experiencer, embodied through an Avatar">
          <text x="490" y="241" textAnchor="middle">Little c</text>
        </a>
      </g>
      <g className="home-architecture-ring-label" data-layer="awareness-radius">
        <path className="home-architecture-awareness-callout" d="M548 389L565 407V415" />
        <text x="566" y="442" textAnchor="middle" aria-label="Local scope: available access and action">Scope</text>
      </g>
    </g>
  );
}
