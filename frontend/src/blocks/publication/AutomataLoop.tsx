import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";

interface ProcessPhase {
  id: "shaped" | "filtered" | "acted" | "changed";
  phase: string;
  step: "Shaped" | "Filtered" | "Acted" | "Changed";
  line: string;
}

const PROCESS_PHASES: readonly ProcessPhase[] = [
  {
    id: "shaped",
    phase: "Reality Stream",
    step: "Shaped",
    line: "Reality arrives as a stream you did not choose.",
  },
  {
    id: "filtered",
    phase: "The Painting",
    step: "Filtered",
    line: "The Painting interprets the stream before you decide.",
  },
  {
    id: "acted",
    phase: "Intent",
    step: "Acted",
    line: "Intent commits. What you do meets consequence.",
  },
  {
    id: "changed",
    phase: "The Canvas",
    step: "Changed",
    line: "Consequence returns and updates what you carry.",
  },
] as const;

/* ── Geometry ─────────────────────────────────────────────────────────────
 * Scope, drawn to scale in a 640×640 field. E is the page itself; the figure
 * shows what E contains: Big C ⊃ RF₀ ⊃ Little c. Each boundary label sits in
 * a gap cut from its own ring at twelve o'clock, so no label crosses a stroke.
 */
const C = 320;
const R_BIG_C = 288;
const R_FRAME = 224;
const R_LITTLE_C = 156;
const R_PROCESS = 136;
const R_STREAM_OUTER = 220;
const R_STREAM_INNER = 164;

/** Sibling Little c instances, drawn in the band Big C owns. */
const R_SIBLING = 256;
const R_SIBLING_GLYPH = 10;
const SIBLING_ANGLES = [15, 50, 85, 120, 155, 190, 225, 310, 340];

const STREAM_IN_ANGLES = [195, 215, 235, 305, 325, 345];
const STREAM_OUT_ANGLES = [15, 35, 55, 125, 145, 165];

const CONTAINMENT = [
  { key: "big-c", r: R_BIG_C, label: "Big C", gapDeg: 9 },
  { key: "rf", r: R_FRAME, label: "RF₀", gapDeg: 7 },
  { key: "little-c", r: R_LITTLE_C, label: "Little c", gapDeg: 19 },
] as const;

function polar(angleDeg: number, radius: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [C + radius * Math.cos(rad), C + radius * Math.sin(rad)];
}

/** A near-complete ring with a gap at twelve o'clock reserved for its label. */
function ringArc(radius: number, gapHalfDeg: number): string {
  const [x1, y1] = polar(270 + gapHalfDeg, radius);
  const [x2, y2] = polar(270 - gapHalfDeg, radius);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius} ${radius} 0 1 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** The quadrant the process currently occupies, drawn at twelve o'clock and rotated. */
const PROCESS_SWEEP = (() => {
  const [x1, y1] = polar(276, R_PROCESS);
  const [x2, y2] = polar(354, R_PROCESS);
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R_PROCESS} ${R_PROCESS} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
})();

interface AutomataLoopProps {
  variant?: "full" | "hero";
  settled?: boolean;
}

export function AutomataLoop({
  variant = "full",
  settled = false,
}: AutomataLoopProps) {
  const [activeId, setActiveId] = useState<ProcessPhase["id"]>("shaped");
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = settled || Boolean(prefersReducedMotion);
  const paused = userPaused || interactionPaused;

  const activeIndex = Math.max(
    0,
    PROCESS_PHASES.findIndex((p) => p.id === activeId),
  );
  const current = PROCESS_PHASES[activeIndex];

  useEffect(() => {
    if (paused || reducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveId((prev) => {
        const idx = PROCESS_PHASES.findIndex((p) => p.id === prev);
        return PROCESS_PHASES[(idx + 1) % PROCESS_PHASES.length].id;
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <div
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocus={() => setInteractionPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setInteractionPaused(false);
        }
      }}
      data-variant={variant}
      data-motion={reducedMotion ? "still" : "full"}
      className={`automata-loop relative flex w-full flex-col items-center justify-center select-none ${
        variant === "hero" ? "max-w-none" : "max-w-[min(88vw,28rem)]"
      }`}
      aria-label="DOT's proposed architecture: E, Big C, RF₀, and Little c"
    >
      {/* Screen reader transcription of the scope and the process */}
      <div className="sr-only">
        <p>
          This architectural hypothesis treats E as the unbounded field of
          possibility and the background of the diagram. Big C is proposed as
          emerging from E and developing RF₀. RF₀ supplies lawful constraints and
          a situated Reality Stream. Little c interprets, forms Intent, acts
          through the body, encounters consequence, and carries change on the
          Canvas. This architecture is a hypothesis, not an observed finding.
        </p>
        <ul>
          {PROCESS_PHASES.map((p) => (
            <li key={p.id}>
              {p.step} — {p.phase}: {p.line}
            </li>
          ))}
        </ul>
      </div>

      {/* ── The nested architecture ──────────────────────────────────────── */}
      <div className="relative aspect-square w-full">
        <svg
          viewBox="0 0 640 640"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="process-arrow"
              markerWidth="12"
              markerHeight="12"
              refX="9"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 1 1.5 L 9.5 6 L 1 10.5 Z" fill="var(--book-cinnabar)" />
            </marker>
            <marker
              id="stream-in-arrow"
              markerWidth="9"
              markerHeight="9"
              refX="7"
              refY="4.5"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 1 1 L 7.5 4.5 L 1 8 Z" fill="var(--book-cinnabar)" />
            </marker>
            <marker
              id="stream-out-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 1 1 L 6.5 4 L 1 7 Z" fill="var(--architecture-line)" />
            </marker>
          </defs>

          {/* Each scope is a region; the innermost is the one being opened. */}
          <circle
            className="automata-frame-region"
            cx={C}
            cy={C}
            r={R_FRAME}
            fill="var(--architecture-shade)"
          />
          <circle
            className="automata-core-region"
            cx={C}
            cy={C}
            r={R_LITTLE_C}
            fill="var(--architecture-core)"
          />

          {/* Each boundary, gapped at twelve o'clock to seat its own label */}
          {CONTAINMENT.map((ring) => (
            <path
              key={ring.key}
              className="automata-containment-ring"
              data-scope={ring.key}
              d={ringArc(ring.r, ring.gapDeg)}
              pathLength={1}
              fill="none"
              stroke={
                ring.key === "little-c"
                  ? "var(--book-cinnabar)"
                  : "var(--architecture-line)"
              }
              strokeWidth={ring.key === "little-c" ? 1.75 : 1.25}
              strokeLinecap="round"
            />
          ))}

          {/* Boundary names, each seated in the gap of its own ring */}
          {CONTAINMENT.map((ring) => (
            <text
              key={`${ring.key}-label`}
              className="automata-containment-label"
              data-scope={ring.key}
              x={C}
              y={C - ring.r}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={variant === "hero" ? "20" : "15"}
              letterSpacing={variant === "hero" ? "2.2" : "1.8"}
              fontFamily="var(--font-mono, monospace)"
              fill={
                ring.key === "little-c"
                  ? "var(--book-cinnabar)"
                  : "var(--architecture-label)"
              }
            >
              {ring.label}
            </text>
          ))}

          {/* Big C instantiates many Little c. The centre is one of them, opened. */}
          <g className="automata-siblings">
            {SIBLING_ANGLES.map((a) => {
              const [sx, sy] = polar(a, R_SIBLING);
              return (
                <g key={`sibling-${a}`}>
                  <circle
                    cx={sx}
                    cy={sy}
                    r={R_SIBLING_GLYPH}
                    fill="var(--architecture-core)"
                    stroke="var(--architecture-line)"
                    strokeWidth="1.1"
                  />
                  <circle
                    cx={sx}
                    cy={sy}
                    r="2.4"
                    fill="var(--architecture-label)"
                    opacity="0.6"
                  />
                </g>
              );
            })}
          </g>

          {/* The Frame streams reality inward to Little c */}
          <g className="automata-streams" strokeLinecap="round">
            {STREAM_IN_ANGLES.map((a) => {
              const [x1, y1] = polar(a, R_STREAM_OUTER);
              const [x2, y2] = polar(a, R_STREAM_INNER);
              return (
                <line
                  key={`in-${a}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--book-cinnabar)"
                  strokeWidth="2"
                  strokeDasharray="2 9"
                  opacity="0.8"
                  markerEnd="url(#stream-in-arrow)"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-11"
                      dur="1.1s"
                      repeatCount="indefinite"
                    />
                  )}
                </line>
              );
            })}

            {/* Action and consequence return outward into the Frame */}
            {STREAM_OUT_ANGLES.map((a) => {
              const [x1, y1] = polar(a, R_STREAM_INNER);
              const [x2, y2] = polar(a, R_STREAM_OUTER);
              return (
                <line
                  key={`out-${a}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--architecture-line)"
                  strokeWidth="1.5"
                  strokeDasharray="2 11"
                  opacity="0.9"
                  markerEnd="url(#stream-out-arrow)"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-13"
                      dur="1.7s"
                      repeatCount="indefinite"
                    />
                  )}
                </line>
              );
            })}
          </g>

          {/* The process runs inside Little c: a quarter turn per phase. */}
          <circle
            className="automata-process-track"
            cx={C}
            cy={C}
            r={R_PROCESS}
            fill="none"
            stroke="var(--architecture-line)"
            strokeWidth="1"
            strokeDasharray="2 7"
            opacity="0.5"
          />
          <g
            className="automata-process-sweep"
            style={{
              transform: `rotate(${activeIndex * 90}deg)`,
              transformOrigin: `${C}px ${C}px`,
              transition: reducedMotion
                ? undefined
                : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <path
              d={PROCESS_SWEEP}
              fill="none"
              stroke="var(--book-cinnabar)"
              strokeWidth="2.5"
              strokeLinecap="round"
              markerEnd="url(#process-arrow)"
            />
          </g>
        </svg>

        {/* Little c — the phase currently running */}
        <div className="automata-phase-readout pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[28%] text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--book-muted)]">
                {current.phase}
              </span>
              <h3 className="mt-1 font-serif text-xl leading-tight text-[var(--book-ink)] sm:text-2xl">
                {current.step}.
              </h3>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {variant === "full" && (
        <>
          {/* The active state, given room to be read */}
          <div className="mt-6 flex min-h-[5rem] w-full max-w-md flex-col items-center px-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={current.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="text-center font-serif text-base leading-relaxed text-[var(--book-ink)] sm:text-lg"
              >
                {current.line}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Large hit areas preserve the quiet visual rhythm on touch and keyboard. */}
          <div className="mt-1 flex items-center" aria-label="Experience loop controls">
            {PROCESS_PHASES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                aria-label={`${p.step} — ${p.line}`}
                aria-pressed={p.id === activeId}
                className="group inline-flex h-9 w-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--book-cinnabar)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--book-paper)]"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    p.id === activeId
                      ? "w-6 bg-[var(--book-cinnabar)]"
                      : "w-1.5 bg-[var(--architecture-line)] group-hover:bg-[var(--book-muted)]"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((value) => !value)}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--book-muted)] outline-none transition-colors hover:text-[var(--book-ink)] focus-visible:ring-2 focus-visible:ring-[var(--book-cinnabar)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--book-paper)]"
                aria-label={userPaused ? "Resume loop animation" : "Pause loop animation"}
                title={userPaused ? "Resume loop animation" : "Pause loop animation"}
              >
                {userPaused ? (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {/* The movement in plain language; technical scope remains in the figure. */}
          <p className="mt-5 max-w-lg text-center text-[13px] leading-relaxed text-[var(--book-muted)]">
            Experience enters. Interpretation shapes action. Consequence changes
            what returns.
          </p>
        </>
      )}
    </div>
  );
}

export default AutomataLoop;
