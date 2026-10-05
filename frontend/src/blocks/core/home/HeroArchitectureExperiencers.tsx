import {
  ARCHITECTURE_RADII as R, C1_OFFSET, C1_TRANSFORM, FRAME_CENTRE, membranePath,
} from "./architectureGeometry";
import type { HeroArchitectureIds } from "./HeroArchitectureDefs";

type Point = { x: number; y: number };

const C1: Point = { x: FRAME_CENTRE.x + C1_OFFSET.x, y: FRAME_CENTRE.y + C1_OFFSET.y };

const polarFrom = (centre: Point, radius: number, angleDeg: number): Point => ({
  x: centre.x + Math.cos((angleDeg * Math.PI) / 180) * radius,
  y: centre.y + Math.sin((angleDeg * Math.PI) / 180) * radius,
});

const arcFrom = (centre: Point, radius: number, startDeg: number, endDeg: number) => {
  const start = polarFrom(centre, radius, startDeg);
  const end = polarFrom(centre, radius, endDeg);
  return `M${start.x} ${start.y}A${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
};

/* c₁'s own drawing uses local coordinates around FRAME_CENTRE, then moves by C1_TRANSFORM. */
const polar = (radius: number, angleDeg: number) => polarFrom(FRAME_CENTRE, radius, angleDeg);

/** c₁'s current awareness & chosen intent (solid line to awareness boundary). */
const AWARENESS_TRACE_D = "M353 358C366 374 378 392 391 410";

/** Awareness potential & causal reach continuing through RF₀ (dotted continuation). */
const POTENTIAL_TRACE_D = "M391 410C408 438 426 474 448 510";

/** Combined causal trajectory. Glow and accessible path share it. */
const THREAD_D = "M353 358C366 374 378 392 391 410C408 438 426 474 448 510";

/** The awareness radius: the region of options c₁ can actually see. */
const AWARENESS_RADIUS = 72;

/** Dotted arcs beyond the current radius: awareness can expand.
 *  Kept in the free quadrant so they never cross an option. */
const AWARENESS_SPOKE_ANGLE = 150;
const AWARENESS_POTENTIAL_RADII = [96, 120] as const;
const AWARENESS_ARC_SPAN = 28;

/** Options RF₀ presents, arriving at the edge of the awareness radius.
 *  Placed between the peers' bearings so no two marks share a direction. */
const OPTION_ANGLES = [192, 256, 286] as const;

const OPTION_ARROWS = OPTION_ANGLES.map((angle) => ({
  angle,
  from: polar(112, angle),
  to: polar(80, angle),
  node: polar(AWARENESS_RADIUS, angle),
}));

/** RF₀'s constraint and consequence press on the body itself, not on awareness. */
const CONSTRAINT_ANGLES = [146, 226, 322] as const;

const CONSTRAINT_ARROWS = CONSTRAINT_ANGLES.map((angle) => ({
  angle,
  from: polar(R.local + 17, angle),
  to: polar(R.local + 5, angle),
}));

/** Where the intent thread crosses the ring: the option c₁ chose. */
const CHOSEN_OPTION = { x: 391, y: 410 } as const;

/**
 * Other experiencers RF₀ hosts, indexed like c₁. Every coupling carries mutual
 * pressure; cooperation is chosen, not imposed, so only one link is drawn as it.
 * cₙ is not yet coupled to c₁, so RF₀ holds more than c₁ sees.
 */
const SOCIAL_CENTRES = [
  { index: "2", x: 413, y: 230, awareness: 15, relation: "cooperation" },
  { index: "3", x: 505, y: 285, awareness: 20, relation: "pressure" },
  { index: "4", x: 236, y: 265, awareness: 12, relation: "pressure" },
  { index: "n", x: 478, y: 462, awareness: 10, relation: "none" },
] as const;

/* Every Little c is a cell: outer membrane, inner membrane, nucleus. */
const cell = (centre: Point, radius: number, phase: number) => ({
  outer: membranePath(centre.x, centre.y, radius, { amplitude: radius * 0.07, lobes: 4, phase }),
  inner: membranePath(centre.x, centre.y, radius * 0.78, { amplitude: radius * 0.05, lobes: 4, phase: phase + 2 }),
});

const C1_CELL = cell(FRAME_CENTRE, R.local, 0.4);

const PEERS = SOCIAL_CENTRES.map((peer, order) => {
  const angle = (Math.atan2(peer.y - C1.y, peer.x - C1.x) * 180) / Math.PI;
  return {
    ...peer,
    angle,
    cell: cell(peer, 7, order * 1.9),
    from: polarFrom(peer, peer.awareness + 4, angle + 180),
    to: polarFrom(C1, AWARENESS_RADIUS + 5, angle),
    brightening: [
      arcFrom(C1, AWARENESS_RADIUS, angle - 7, angle + 7),
      arcFrom(peer, peer.awareness, angle + 180 - 28, angle + 180 + 28),
    ],
    label: { x: peer.x, y: peer.y - peer.awareness - 6 },
  };
});

/** RF₀ hosts many Little c. c₁ is the reader; the rest share the same anatomy. */
export function HeroArchitectureExperiencers({ ids }: { ids: HeroArchitectureIds }) {
  const {
    arrowId, optionArrowId, constraintArrowId, couplingArrowId, localWashId, threadId, surfacePrefix,
  } = ids;

  return (
    <>
      <g className="home-architecture-social-field">
        <g className="home-architecture-social-relations">
          {PEERS.filter((peer) => peer.relation !== "none").map(({ index, relation, from, to, brightening }) => (
            <g key={index} data-relation={relation}>
              {relation === "cooperation" ? (
                <>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
                  {brightening.map((d) => (
                    <path key={d} className="home-architecture-awareness-brightening" d={d} />
                  ))}
                </>
              ) : (
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  markerStart={`url(#${couplingArrowId})`}
                  markerEnd={`url(#${couplingArrowId})`}
                />
              )}
            </g>
          ))}
        </g>
        <g className="home-architecture-peer-centres">
          {PEERS.map(({ index, x, y, awareness, relation, cell: peerCell, label }) => (
            <g
              key={index}
              className="home-architecture-peer-centre"
              data-coupled={relation === "none" ? "false" : "true"}
            >
              <circle className="home-architecture-peer-awareness" cx={x} cy={y} r={awareness} />
              <path className="home-architecture-peer-ring" d={peerCell.outer} />
              <path className="home-architecture-peer-inner" d={peerCell.inner} />
              <circle className="home-architecture-peer-core" cx={x} cy={y} r="2.6" />
              <text className="home-architecture-peer-label" x={label.x} y={label.y} textAnchor="middle">
                c<tspan className="home-architecture-label-subscript">{index}</tspan>
              </text>
            </g>
          ))}
        </g>
      </g>

      <g className="home-architecture-local-experiencer" transform={C1_TRANSFORM}>
        <g className="home-architecture-frame-options">
          {OPTION_ARROWS.map(({ angle, from, to }) => (
            <line
              key={angle}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              markerEnd={`url(#${optionArrowId})`}
            />
          ))}
        </g>

        <g className="home-architecture-frame-constraint">
          {CONSTRAINT_ARROWS.map(({ angle, from, to }) => (
            <line
              key={angle}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              markerEnd={`url(#${constraintArrowId})`}
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
          <path
            className="home-architecture-awareness-trace"
            d={AWARENESS_TRACE_D}
            stroke={`url(#${threadId})`}
            pathLength="1"
          />
          <path
            className="home-architecture-potential-trace"
            d={POTENTIAL_TRACE_D}
            stroke={`url(#${threadId})`}
            markerEnd={`url(#${arrowId})`}
          />
          <circle cx="448" cy="510" r="3" />
        </g>

        <g className="home-architecture-little-c">
          <circle
            className="home-architecture-local-aura"
            cx={FRAME_CENTRE.x}
            cy={FRAME_CENTRE.y}
            r={R.awareness}
            fill={`url(#${localWashId})`}
          />
          <path
            className="home-architecture-surface"
            d={C1_CELL.outer}
            fill={`url(#${surfacePrefix}-local)`}
            stroke={`url(#${surfacePrefix}-rim)`}
            filter={`url(#${surfacePrefix}-shadow)`}
          />
          <path className="home-architecture-local-ring" d={C1_CELL.outer} />
          <path className="home-architecture-local-inner" d={C1_CELL.inner} />
          <circle className="home-architecture-local-core" cx={FRAME_CENTRE.x} cy={FRAME_CENTRE.y} r={R.core} />
          <circle className="home-architecture-local-pin" cx={FRAME_CENTRE.x} cy={FRAME_CENTRE.y} r="2.25" />
        </g>

        <g className="home-architecture-awareness-radius">
          <g className="home-architecture-awareness-potential">
            {AWARENESS_POTENTIAL_RADII.map((radius) => (
              <path
                key={radius}
                d={arcFrom(
                  FRAME_CENTRE,
                  radius,
                  AWARENESS_SPOKE_ANGLE - AWARENESS_ARC_SPAN,
                  AWARENESS_SPOKE_ANGLE + AWARENESS_ARC_SPAN,
                )}
              />
            ))}
          </g>
          <circle
            className="home-architecture-awareness-ring"
            cx={FRAME_CENTRE.x}
            cy={FRAME_CENTRE.y}
            r={AWARENESS_RADIUS}
          />
          {OPTION_ARROWS.map(({ angle, node }) => (
            <circle key={angle} className="home-architecture-option-node" cx={node.x} cy={node.y} r="2.6" />
          ))}
          <circle
            className="home-architecture-option-node"
            data-chosen="true"
            cx={CHOSEN_OPTION.x}
            cy={CHOSEN_OPTION.y}
            r="3.4"
          />
        </g>
      </g>
    </>
  );
}
