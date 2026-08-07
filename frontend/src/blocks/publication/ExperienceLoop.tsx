import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { NucleusMark } from "../../dot/NucleusMark";
import { EXPERIENCE_LOOP_STEPS, type ExperienceLoopStep } from "./experienceLoopModel";

type DiagramPoint = { x: number; y: number };

const INPUT_STEPS: ExperienceLoopStep[] = [
  "Reality Stream",
  "Painting",
];
const ACTION_STEPS: ExperienceLoopStep[] = ["Intent", "Rendering", "Return"];
const DECISION_DRAFTS = ["Leave", "Stay", "Tell the truth", "Focus"] as const;

function arcPositions(
  steps: ExperienceLoopStep[],
  startX: number,
  endX: number,
  baselineY: number,
  arcHeight: number,
): Map<ExperienceLoopStep, DiagramPoint> {
  return new Map(
    steps.map((step, index) => {
      const progress = steps.length === 1 ? 0.5 : index / (steps.length - 1);
      return [
        step,
        {
          x: startX + (endX - startX) * progress,
          y: baselineY + Math.sin(progress * Math.PI) * arcHeight,
        },
      ];
    }),
  );
}

const STEP_POSITIONS = new Map([
  ...INPUT_STEPS.map((step, index) => {
    const progress = INPUT_STEPS.length === 1 ? 0 : index / (INPUT_STEPS.length - 1);
    return [
      step,
      { x: 13 + 37 * progress, y: 29 - 15 * progress },
    ] as const;
  }),
  ...arcPositions(ACTION_STEPS, 84, 16, 72, 16),
]);

const DRAFT_POSITIONS = DECISION_DRAFTS.map((_, index) => {
  const angle = -135 + (360 / DECISION_DRAFTS.length) * index;
  const radians = (angle * Math.PI) / 180;
  return {
    x: 50 + Math.cos(radians) * 52,
    y: 50 + Math.sin(radians) * 14,
  };
});

function pointFor(step: ExperienceLoopStep): DiagramPoint {
  const point = STEP_POSITIONS.get(step);
  if (!point) throw new Error(`Missing Experience Loop position for ${step}`);
  return point;
}

function curvedPath(from: DiagramPoint, to: DiagramPoint, bend = 0): string {
  const firstControlX = from.x + (to.x - from.x) * 0.42;
  const secondControlX = from.x + (to.x - from.x) * 0.58;
  return `M ${from.x} ${from.y} C ${firstControlX} ${from.y + bend} ${secondControlX} ${to.y + bend} ${to.x} ${to.y}`;
}

const LOOP_CONNECTIONS = [
  {
    id: "frame-reality-stream",
    path: curvedPath({ x: 2, y: 35 }, pointFor("Reality Stream")),
    activeFor: "Reality Stream",
    kind: "input",
  },
  {
    id: "reality-stream-painting",
    path: curvedPath(pointFor("Reality Stream"), pointFor("Painting"), -2),
    activeFor: "Painting",
    kind: "input",
  },
  {
    id: "painting-decision-space",
    path: curvedPath(pointFor("Painting"), { x: 50, y: 27 }, 1),
    activeFor: "Painting",
    kind: "input",
    signal: false,
  },
  {
    id: "little-c-intent",
    path: curvedPath({ x: 58, y: 52 }, pointFor("Intent"), 4),
    activeFor: "Intent",
    kind: "agency",
  },
  {
    id: "intent-rendering",
    path: curvedPath(pointFor("Intent"), pointFor("Rendering"), 3),
    activeFor: "Rendering",
    kind: "action",
  },
  {
    id: "rendering-return",
    path: curvedPath(pointFor("Rendering"), pointFor("Return"), 3),
    activeFor: "Return",
    kind: "return",
    signal: false,
  },
  {
    id: "return-little-c",
    path: curvedPath(pointFor("Return"), { x: 42, y: 52 }, -4),
    activeFor: "Return",
    kind: "return",
  },
] satisfies Array<{
  id: string;
  path: string;
  activeFor: ExperienceLoopStep;
  kind: "input" | "agency" | "action" | "return";
  signal?: boolean;
}>;

function indexForStep(step: ExperienceLoopStep): number {
  const index = EXPERIENCE_LOOP_STEPS.findIndex((candidate) => candidate.label === step);
  return index >= 0 ? index : 0;
}

export function ExperienceLoop({
  initialStep = "Intent",
}: {
  initialStep?: ExperienceLoopStep;
}) {
  const instanceId = useId().replaceAll(":", "");
  const inspectorId = `book-loop-inspector-${instanceId}`;
  const gradientId = `book-loop-active-gradient-${instanceId}`;
  const stateButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(() => indexForStep(initialStep));
  const activeStep = EXPERIENCE_LOOP_STEPS[activeIndex];

  const selectIndex = (index: number, moveFocus = false) => {
    setActiveIndex(index);
    if (moveFocus) stateButtons.current[index]?.focus();
  };

  const move = (delta: number, moveFocus = false) => {
    const nextIndex = Math.min(
      EXPERIENCE_LOOP_STEPS.length - 1,
      Math.max(0, activeIndex + delta),
    );
    selectIndex(nextIndex, moveFocus);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      move(-1, true);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      move(1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectIndex(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectIndex(EXPERIENCE_LOOP_STEPS.length - 1, true);
    }
  };

  return (
    <div
      className="book-loop-panel"
      data-active-step={activeStep.label.toLowerCase().replaceAll(" ", "-")}
      role="group"
      aria-label="The Experience Loop"
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
      onKeyDown={handleKeyDown}
    >
      <header className="book-loop-header">
        <div className="book-loop-frame-label">
          <strong>Reality Frame</strong>
          <span>lawful possibility + consequence</span>
        </div>
        <span className="book-loop-input-label">situated input</span>
      </header>

      <div className="book-loop-orbit">
        <span className="book-loop-return-label" aria-hidden="true">
          Frame returns consequence
        </span>
        <div className="book-loop-filter-membrane" aria-hidden="true">
          <span className="book-loop-filter-input">
            <i />
            <i />
            <i />
          </span>
          <span className="book-loop-filter-aperture" />
          <span className="book-loop-filter-output">
            <i />
          </span>
          <em>interpretive filter</em>
        </div>
        <div className="book-loop-decision-space" aria-hidden="true">
          <div className="book-loop-decision-label">
            <strong>Decision Space</strong>
            <span>available pre-Intent drafts</span>
          </div>
          <span className="book-loop-decision-expansion">widens through learning</span>
          {DECISION_DRAFTS.map((draft, index) => (
            <span
              key={draft}
              className={`book-loop-draft book-loop-draft-${index} ${activeStep.label === "Intent" && index === 2 ? "is-selected" : ""}`}
              style={
                {
                  "--draft-x": `${DRAFT_POSITIONS[index].x}%`,
                  "--draft-y": `${DRAFT_POSITIONS[index].y}%`,
                } as CSSProperties
              }
            >
              {draft}
            </span>
          ))}
        </div>
        <svg
          className="book-loop-track"
          viewBox="0 0 100 100"
          role="img"
          aria-label="The Reality Stream passes through the Painting, which filters the possibilities visible across Decision Space. Little c selects a pre-Intent draft, forming Intent. The body renders action, and consequence returns to Little c and updates the Canvas."
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--book-dot)" stopOpacity="0.38" />
              <stop offset="0.55" stopColor="var(--book-dot-bright)" />
              <stop offset="1" stopColor="var(--book-dot)" stopOpacity="0.58" />
            </linearGradient>
          </defs>
          {LOOP_CONNECTIONS.map((connection) => {
            const isActive = connection.activeFor === activeStep.label;
            return (
              <g key={connection.id} data-connection={connection.id}>
                <path
                  className={`book-loop-edge book-loop-edge-${connection.kind} ${isActive ? "is-active" : ""}`}
                  d={connection.path}
                  style={isActive ? { stroke: `url(#${gradientId})` } : undefined}
                />
                {isActive && connection.signal !== false && (
                  <path
                    className="book-loop-flow-signal"
                    d={connection.path}
                    pathLength="1"
                    aria-hidden="true"
                  />
                )}
              </g>
            );
          })}
        </svg>

        <div className="book-loop-core">
          <NucleusMark size={54} reducedMotion className="book-loop-agency-mark" />
          <div className="book-loop-core-copy">
            <span className="book-loop-little-c">Little c</span>
            <strong>selects</strong>
            <small>one visible draft</small>
          </div>
          <div className="book-loop-memory">
            <span>Canvas</span>
            <em>carries deltas</em>
          </div>
        </div>

        <span className="book-loop-agency-label" aria-hidden="true">commits</span>

        {EXPERIENCE_LOOP_STEPS.map((step, index) => {
          const position = pointFor(step.label);
          return (
            <button
              key={step.label}
              ref={(node) => {
                stateButtons.current[index] = node;
              }}
              type="button"
              className={`book-loop-state book-loop-state-${index} ${step.label === "Painting" ? "is-filter" : ""} ${index === activeIndex ? "is-active" : ""}`}
              onClick={() => selectIndex(index)}
              aria-pressed={index === activeIndex}
              aria-controls={inspectorId}
              aria-label={`${String(index + 1).padStart(2, "0")} ${step.label}`}
              style={
                {
                  "--state-x": `${position.x}%`,
                  "--state-y": `${position.y}%`,
                } as CSSProperties
              }
            >
              <span className="book-loop-state-index">{String(index + 1).padStart(2, "0")}</span>
              <step.Icon className="book-loop-state-icon" />
              <span className="book-loop-state-name">{step.label}</span>
              {step.label === "Painting" ? (
                <span className="book-loop-state-function">filters perception</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div id={inspectorId} className="book-loop-inspector" aria-live="polite">
        <div className="book-loop-inspector-head">
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          <activeStep.Icon className="h-4 w-4" />
          <h3>{activeStep.label}</h3>
        </div>
        <p>{activeStep.description}</p>
        <div className="book-loop-inspector-foot">
          <strong>{activeStep.agency}</strong>
          <div className="book-loop-inspector-controls" aria-label="Explore loop states">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={activeIndex === 0}
              aria-label="Previous state"
              title="Previous state"
            >
              <ChevronLeft />
            </button>
            <span>{activeIndex + 1}/{EXPERIENCE_LOOP_STEPS.length}</span>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={activeIndex === EXPERIENCE_LOOP_STEPS.length - 1}
              aria-label="Next state"
              title="Next state"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <p className="book-loop-limit">
        Decision Space is the field, not a step. Little c selects. Intent commits. The body
        renders. Consequence returns.
      </p>
    </div>
  );
}

export default ExperienceLoop;