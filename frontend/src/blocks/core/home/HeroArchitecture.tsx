import { useId } from "react";

const BIG_C_RINGS = [286, 297] as const;

const PEER_FRAMES = [
  { x: 218, y: 104, scale: 0.82, depth: "far" },
  { x: 442, y: 108, scale: 0.84, depth: "far" },
  { x: 94, y: 246, scale: 0.94, depth: "mid" },
  { x: 244, y: 574, scale: 1.1, depth: "near" },
  { x: 430, y: 568, scale: 1.08, depth: "near" },
] as const;

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

/** Little c acts, the Frame returns consequence. Glow and stroke share it. */
const THREAD_D =
  "M348 352C292 388 278 448 314 482C352 518 414 495 420 450C426 405 467 396 491 425C520 460 495 501 454 518";

/**
 * Code-native rendering of DOT's proposed containment architecture.
 *
 * This is intentionally separate from the book's state-machine illustration:
 * the cover explains containment, while the book diagram explains transition.
 * Sharing either drawing would make a future editorial change to one silently
 * alter the meaning of the other.
 */
export function HeroArchitecture() {
  const instanceId = useId().replaceAll(":", "");
  const gridId = `${instanceId}-hero-rf-grid`;
  const arrowId = `${instanceId}-hero-trace-arrow`;
  const pressureArrowId = `${instanceId}-hero-pressure-arrow`;
  const reflectionArrowId = `${instanceId}-hero-reflection-arrow`;
  const fieldWashId = `${instanceId}-hero-field-wash`;
  const frameWashId = `${instanceId}-hero-frame-wash`;
  const localWashId = `${instanceId}-hero-local-wash`;
  const localCoreId = `${instanceId}-hero-local-core`;
  const threadId = `${instanceId}-hero-thread`;
  const frameClipId = `${instanceId}-hero-frame-clip`;
  const captionId = `${instanceId}-hero-architecture-caption`;

  return (
    <figure className="home-hero-architecture" aria-labelledby={captionId}>
      <svg
        className="home-hero-architecture__svg"
        viewBox="30 0 830 700"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <pattern
            id={gridId}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
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
            id={pressureArrowId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path className="home-architecture-pressure-arrow" d="M0 0L6 3L0 6Z" />
          </marker>
          <marker
            id={reflectionArrowId}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path className="home-architecture-reflection-arrow" d="M0 0L6 3L0 6Z" />
          </marker>
          <radialGradient id={fieldWashId} cx="50%" cy="48%" r="52%">
            <stop
              className="home-architecture-field-stop"
              offset="0%"
              stopOpacity="0.14"
            />
            <stop
              className="home-architecture-field-stop"
              offset="58%"
              stopOpacity="0.05"
            />
            <stop
              className="home-architecture-field-stop"
              offset="100%"
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id={frameWashId} cx="50%" cy="52%" r="70%">
            <stop
              className="home-architecture-frame-stop"
              offset="0%"
              stopOpacity="0.2"
            />
            <stop
              className="home-architecture-frame-stop"
              offset="100%"
              stopOpacity="0.04"
            />
          </radialGradient>
          <radialGradient id={localWashId} cx="50%" cy="50%" r="50%">
            <stop
              className="home-architecture-local-stop"
              offset="0%"
              stopOpacity="0.28"
            />
            <stop
              className="home-architecture-local-stop"
              offset="42%"
              stopOpacity="0.1"
            />
            <stop
              className="home-architecture-local-stop"
              offset="100%"
              stopOpacity="0"
            />
          </radialGradient>
          <radialGradient id={localCoreId} cx="34%" cy="28%" r="68%">
            <stop className="home-architecture-core-highlight" offset="0%" />
            <stop className="home-architecture-core-mid" offset="42%" />
            <stop className="home-architecture-core-depth" offset="100%" />
          </radialGradient>

          {/* Runs along the thread so it gathers colour as consequence returns. */}
          <linearGradient
            id={threadId}
            x1="348"
            y1="352"
            x2="454"
            y2="518"
            gradientUnits="userSpaceOnUse"
          >
            <stop className="home-architecture-thread-from" offset="0%" />
            <stop className="home-architecture-thread-mid" offset="52%" />
            <stop className="home-architecture-thread-to" offset="100%" />
          </linearGradient>

          <clipPath id={frameClipId}>
            <circle cx="348" cy="352" r="197" />
          </clipPath>
        </defs>

        <circle
          className="home-architecture-field-wash"
          cx="348"
          cy="352"
          r="314"
          fill={`url(#${fieldWashId})`}
        />

        <g className="home-architecture-style home-architecture-style--cinematic home-architecture-cinematic-field">
          <circle cx="348" cy="352" r="268" />
          <circle cx="348" cy="352" r="238" />
        </g>

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

        <g className="home-architecture-style home-architecture-style--organic home-architecture-organic-rings">
          <circle cx="348" cy="352" r="228" />
          <circle cx="348" cy="352" r="166" />
        </g>

        <g className="home-architecture-style home-architecture-style--neural home-architecture-neural-lattice">
          <path d="M234 120L458 124L561 276M446 584L260 590M110 262L151 352" />
        </g>

        <g className="home-architecture-frame-field" aria-hidden="true">
          {PEER_FRAMES.map(({ x, y, scale, depth }, index) => (
            <g
              key={`${x}-${y}`}
              data-frame={index + 1}
              data-depth={depth}
              className="home-architecture-peer-group"
            >
              <g
                transform={`translate(${x + 16} ${y + 16}) scale(${scale}) translate(${-x - 16} ${-y - 16})`}
              >
                <rect
                className="home-architecture-peer-square"
                x={x}
                y={y}
                width="32"
                height="32"
              />
                <circle
                className="home-architecture-peer-disc"
                cx={x + 16}
                cy={y + 16}
                r="16"
              />
                <path
                className="home-architecture-peer-diamond"
                d={`M${x + 16} ${y - 1}L${x + 33} ${y + 16}L${x + 16} ${y + 33}L${x - 1} ${y + 16}Z`}
              />
                <circle
                className="home-architecture-peer-halo"
                cx={x + 16}
                cy={y + 16}
                r="5"
              />
                <circle
                className="home-architecture-peer-core"
                cx={x + 16}
                cy={y + 16}
                r="2"
              />
              </g>
            </g>
          ))}
        </g>

        <g className="home-architecture-frame">
          <circle
            className="home-architecture-frame-wash"
            cx="348"
            cy="352"
            r="197"
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
          <circle
            className="home-architecture-frame-boundary"
            cx="348"
            cy="352"
            r="197"
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

          <g className="home-architecture-frame-measure">
            <path d="M348 335V319M348 327H545M545 319V335" />
            <text x="462" y="317" textAnchor="middle">AWARENESS RADIUS</text>
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

        <g className="home-architecture-style home-architecture-style--editorial home-architecture-editorial-measure">
          <path d="M151 132V142M348 132V146M545 132V142" />
          <path d="M128 155H138M128 352H142M128 549H138" />
        </g>

        <g className="home-architecture-style home-architecture-style--minimal home-architecture-minimal-axis">
          <path d="M348 126V142M348 562V578M122 352H138M558 352H574" />
          <circle cx="348" cy="352" r="172" />
        </g>

        <g className="home-architecture-style home-architecture-style--cinematic home-architecture-cinematic-depth">
          <circle cx="348" cy="352" r="218" />
        </g>

        <g className="home-architecture-frame-pressure">
          <path
            d="M282 309C298 318 311 328 322 338"
            markerEnd={`url(#${pressureArrowId})`}
            pathLength="1"
          />
          <path
            d="M414 309C398 318 385 328 374 338"
            markerEnd={`url(#${pressureArrowId})`}
            pathLength="1"
          />
        </g>

        <g className="home-architecture-reflection">
          <path
            d="M411 400C397 393 386 383 377 373"
            markerEnd={`url(#${reflectionArrowId})`}
            pathLength="1"
          />
        </g>

        <g className="home-architecture-causal-trace">
          <path
            className="home-architecture-thread-glow"
            d={THREAD_D}
            stroke={`url(#${threadId})`}
            pathLength="1"
          />
          <path
            className="home-architecture-thread"
            d={THREAD_D}
            stroke={`url(#${threadId})`}
            markerEnd={`url(#${arrowId})`}
            pathLength="1"
          />
          <circle cx="454" cy="518" r="3" />
        </g>

        <g className="home-architecture-little-c">
          <circle
            className="home-architecture-local-aura"
            cx="348"
            cy="352"
            r="96"
            fill={`url(#${localWashId})`}
          />
          <circle className="home-architecture-local-field" cx="348" cy="352" r="48" />
          <circle className="home-architecture-local-ring" cx="348" cy="352" r="24" />
          <circle className="home-architecture-local-halo" cx="348" cy="352" r="11" />
          <circle
            className="home-architecture-local-core"
            cx="348"
            cy="352"
            r="6"
            fill={`url(#${localCoreId})`}
          />
        </g>

        <g className="home-architecture-labels">
          <path className="home-architecture-label-caps" d="M654 38H666M654 537H666" />
          <path className="home-architecture-label-spine" d="M660 54V500" />
          <g data-label="field">
            <circle cx="660" cy="54" r="2" />
            <path d="M630 54H660" />
            <path className="home-architecture-label-rule" d="M676 57H692" />
            <text className="home-architecture-label-key" x="676" y="49">E</text>
            <text className="home-architecture-label-description" x="676" y="75">
              Field of possibility
            </text>
          </g>
          <g data-label="big-c">
            <circle cx="660" cy="126" r="2" />
            <path d="M570 151L620 126H660" />
            <path className="home-architecture-label-rule" d="M676 129H692" />
            <text className="home-architecture-label-key" x="676" y="121">BIG C</text>
            <text className="home-architecture-label-description" x="676" y="147">
              Develops Reality Frames
            </text>
          </g>
          <g data-label="reality-frame">
            <circle cx="660" cy="274" r="2" />
            <path d="M533 286L590 274H660" />
            <path className="home-architecture-label-rule" d="M676 277H692" />
            <text className="home-architecture-label-key" x="676" y="269">
              RFᵢ · ONE OF MANY
            </text>
            <text className="home-architecture-label-description" x="676" y="295">
              One local context
            </text>
          </g>
          <g data-label="little-c">
            <circle cx="660" cy="338" r="2" />
            <path d="M392 338H660" />
            <path className="home-architecture-label-rule" d="M676 341H692" />
            <text className="home-architecture-label-key" x="676" y="333">LITTLE c</text>
            <text className="home-architecture-label-description" x="676" y="359">
              Local experiencer
            </text>
          </g>
          <g data-label="intent">
            <circle cx="660" cy="500" r="2" />
            <path d="M458 516L590 500H660" />
            <path className="home-architecture-label-rule" d="M676 503H692" />
            <text className="home-architecture-label-key" x="676" y="495">
              INTENT · ACTION
            </text>
            <text className="home-architecture-label-description" x="676" y="521">
              Little c acts on RFᵢ
            </text>
          </g>
        </g>
      </svg>

      <div className="home-architecture-mobile-key" aria-hidden="true">
        <span>E</span><i>⊃</i><span>Big C</span><i>⊃</i><span>{`{RFᵢ}`}</span>
        <b><span>RFᵢ <i>→</i> Little c</span><em>pressure · consequence</em></b>
        <b><span>Little c <i>→</i> RFᵢ</span><em>intent · action</em></b>
      </div>

      <figcaption id={captionId} className="sr-only">
        E is the field of possibility. Big C emerges from E and develops
        Reality Frames. One local frame is enlarged to show Little c, the
        local experiencer; it is a context for the illustration, not a privileged
        Frame. A thread traces Intent from Little c out into the Frame, where
        action enters the world. Frame conditions press inward on experience,
        and consequence returns to Little c.
      </figcaption>
    </figure>
  );
}

export default HeroArchitecture;
