import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { NucleusMark } from "../../dot/NucleusMark";
import { EXPERIENCE_LOOP_STEPS, type ExperienceLoopStep } from "./experienceLoopModel";

/**
 * The Experience Loop — a still figure the reader drives.
 *
 * It used to advance itself every eight seconds and carry a playback control
 * to stop it. A diagram embedded in a chapter that moves while you read it is
 * autoplay inside a reading surface, which the release's own reader contract
 * declares false and ADR-0004 forbids outright. The loop is legible standing
 * still: click a state, or use the arrows.
 */
function indexForStep(step: ExperienceLoopStep): number {
  const index = EXPERIENCE_LOOP_STEPS.findIndex((candidate) => candidate.label === step);
  return index >= 0 ? index : 0;
}

export function ExperienceLoop({
  initialStep = "Reality Stream",
}: {
  initialStep?: ExperienceLoopStep;
}) {
  const instanceId = useId().replaceAll(":", "");
  const coreId = `book-loop-core-${instanceId}`;
  const stateButtons = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(() => indexForStep(initialStep));
  const activeStep = EXPERIENCE_LOOP_STEPS[activeIndex];

  const selectIndex = (index: number, moveFocus = false) => {
    setActiveIndex(index);
    if (moveFocus) stateButtons.current[index]?.focus();
  };

  const move = (delta: number, moveFocus = false) => {
    const nextIndex =
      (activeIndex + delta + EXPERIENCE_LOOP_STEPS.length) % EXPERIENCE_LOOP_STEPS.length;
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
      className="book-experience"
      data-active-step={activeStep.label.toLowerCase().replaceAll(" ", "-")}
      role="group"
      aria-label="The Experience Loop"
      aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
      onKeyDown={handleKeyDown}
    >
      <div className="book-experience-orbit">
        <svg
          className="book-experience-orbit-art"
          viewBox="0 0 1000 680"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="book-experience-field-ring book-experience-field-ring-outer"
            d="M 500 28 C 790 28 950 150 950 340 C 950 530 790 652 500 652 C 210 652 50 530 50 340 C 50 150 210 28 500 28 Z"
          />
          <path
            className="book-experience-field-ring book-experience-field-ring-inner"
            d="M 500 118 C 700 118 820 205 820 340 C 820 475 700 562 500 562 C 300 562 180 475 180 340 C 180 205 300 118 500 118 Z"
          />
          <path
            className="book-experience-orbit-line"
            d="M 500 70 C 735 70 880 160 880 340 C 880 520 735 610 500 610 C 265 610 120 520 120 340 C 120 160 265 70 500 70 Z"
          />
          {/* Clockwise open-chevron direction cues at 3-o'clock (down) and 9-o'clock (up) */}
          <path className="book-experience-orbit-arrow" d="M 873,333 L 880,344 L 887,333" />
          <path className="book-experience-orbit-arrow" d="M 113,347 L 120,336 L 127,347" />
        </svg>

        {EXPERIENCE_LOOP_STEPS.map((step, index) => (
          <button
            key={step.label}
            ref={(node) => {
              stateButtons.current[index] = node;
            }}
            type="button"
            className={`book-experience-node book-experience-node-${index} ${index === activeIndex ? "is-active" : ""}`}
            onClick={() => selectIndex(index)}
            aria-pressed={index === activeIndex}
            aria-controls={coreId}
            aria-label={`${String(index + 1).padStart(2, "0")} ${step.everydayTitle}. DOT term: ${step.label}`}
            title={step.everydayTitle}
          >
            <span className="book-experience-node-icon">
              <step.Icon aria-hidden="true" />
              <small>{String(index + 1).padStart(2, "0")}</small>
            </span>
            <span className="book-experience-node-copy">
              <strong>{step.orbitTitle}</strong>
            </span>
          </button>
        ))}

        <div
          id={coreId}
          className="book-experience-core"
          aria-live="polite"
        >
          <div className="book-experience-mark-group">
            <NucleusMark size={62} reducedMotion className="book-experience-core-mark" />
            <span className="book-experience-you-label">You</span>
          </div>
          <div className="book-experience-core-content">
            <span className="book-experience-core-step">
              {String(activeIndex + 1).padStart(2, "0")} / {activeStep.role}
            </span>
            <h3>{activeStep.everydayTitle}</h3>
            <p>{activeStep.description}</p>
            <small className="book-experience-core-term">DOT · {activeStep.label}</small>
            {activeStep.label === "Intent" ? (
              <small className="book-experience-decision-label">
                Those options together are the Decision Space.
              </small>
            ) : null}
          </div>
          <div className="book-experience-controls" aria-label="Explore loop states">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous state"
              title="Previous state"
            >
              <ChevronLeft />
            </button>
            <span>{activeIndex + 1}/{EXPERIENCE_LOOP_STEPS.length}</span>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next state"
              title="Next state"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div className="book-experience-memory">
        <RotateCcw aria-hidden="true" />
        <div>
          <strong>Consequence becomes context.</strong>
          <span>The Canvas carries what changed; the next moment begins differently.</span>
        </div>
      </div>

      <p className="book-experience-limit">
        A reading aid, not a proof. Claims about Little c beyond the body remain hypotheses.
      </p>
    </div>
  );
}

export default ExperienceLoop;
