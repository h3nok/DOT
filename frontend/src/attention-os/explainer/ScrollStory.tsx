import { useEffect, useRef, useState, type ReactNode } from "react";
import { PullQuote } from "./PullQuote";
import "./explainer.css";

export interface StoryStep {
  id: string;
  title: string;
  text?: string;
  /** A short line above the title naming what the step is about. */
  kicker?: string;
  /** Read before the step by assistive technology only: context the pinned figure shows visually. */
  context?: string;
  /** A line from the source text that the step rests on. */
  quote?: string;
  source?: string;
  /** A question the step leaves with the reader. */
  note?: string;
}

export interface StoryPosition {
  /** How far the reader is through the current step, from 0 to 1. */
  progress: number;
  /** Bring a step into the readable area and move focus to it. */
  goTo: (index: number) => void;
}

/**
 * Which step is being read, and how far into it: the last step whose top has crossed the middle of the
 * screen, measured once per frame while the reader scrolls. Nothing is measured until the steps have
 * a size, so the first step is current before any scrolling.
 */
function readingLine(node: HTMLElement | null, figure: HTMLElement | null) {
  if (!node || !figure) return window.innerHeight / 2;
  const text = node.getBoundingClientRect(), art = figure.getBoundingClientRect();
  // On narrow layouts, read in the space below the pinned figure. Desktop columns do not overlap.
  const stacked = art.right > text.left && art.left < text.right;
  const occupied = stacked && art.top < window.innerHeight / 2 ? Math.min(window.innerHeight * .6, Math.max(0, art.bottom)) : 0;
  return (window.innerHeight + occupied) / 2;
}

function useStoryPosition(nodes: { current: (HTMLLIElement | null)[] }, figure: { current: HTMLElement | null }, count: number) {
  const [position, setPosition] = useState({ index: 0, progress: 0 });
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const middle = readingLine(nodes.current[0], figure.current);
      let index = 0, progress = 0, measured = false;
      nodes.current.forEach((node, i) => {
        const rect = node?.getBoundingClientRect();
        if (!rect || rect.height === 0) return;
        measured = true;
        if (rect.top <= middle) { index = i; progress = Math.min(1, Math.max(0, (middle - rect.top) / rect.height)); }
      });
      if (measured) setPosition(prev => (prev.index === index && Math.abs(prev.progress - progress) < .01 ? prev : { index, progress }));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [nodes, figure, count]);
  return position;
}

const still = () => (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) || document.documentElement.dataset.motion === "still" || document.documentElement.dataset.organism === "off";

/**
 * A figure that holds still while its steps scroll past. The step in the middle
 * of the viewport is the current one, and the figure is drawn for it and for how
 * far the reader is into it. The steps are ordinary text in reading order, so the
 * story is complete without the figure, without motion, and without script.
 * Nothing advances on its own: the reader's scroll is the only clock.
 */
export function ScrollStory<T extends StoryStep>({ steps, label, figure, counted = true, marker }: {
  steps: readonly T[];
  /** Names the figure for assistive technology. */
  label: string;
  figure: (active: T, index: number, position: StoryPosition) => ReactNode;
  /** Show "01 / 05" above each step. */
  counted?: boolean;
  /** Optional decorative identity beside each step's label, replacing the vertical rule. */
  marker?: ReactNode;
}) {
  const nodes = useRef<(HTMLLIElement | null)[]>([]);
  const art = useRef<HTMLElement | null>(null);
  const { index: active, progress } = useStoryPosition(nodes, art, steps.length);
  const goTo = (index: number) => {
    const node = nodes.current[index];
    if (!node) return;
    const bounds = node.getBoundingClientRect();
    const visual = art.current?.getBoundingClientRect();
    const stacked = visual && visual.right > bounds.left && visual.left < bounds.right;
    // A tall step cannot be centered in a phone's remaining space. Start at its first visible line.
    const heading = node.querySelector(".explainer-story-kicker, h3")?.getBoundingClientRect() ?? bounds;
    const pinnedBottom = (art.current ? parseFloat(getComputedStyle(art.current).top) || 0 : 0) + (visual?.height ?? 0);
    const offset = stacked ? heading.top - pinnedBottom - 28 : bounds.top + bounds.height / 2 - readingLine(node, art.current);
    window.scrollTo({ top: window.scrollY + offset, behavior: still() ? "auto" : "smooth" });
    node.focus({ preventScroll: true });
  };
  return (
    <div className={`explainer-story${marker ? " explainer-story--marked" : ""}`}>
      <figure ref={art} className="explainer-story-figure" aria-label={label}>{figure(steps[active], active, { progress, goTo })}</figure>
      <ol className="explainer-story-steps">
        {steps.map((step, index) => (
          <li key={step.id} ref={node => { nodes.current[index] = node; }} tabIndex={-1} data-step={index} data-reading={index < active ? "past" : index === active ? "current" : "next"} data-active={index === active ? "" : undefined} aria-current={index === active ? "step" : undefined}>
            {counted && <p className="explainer-story-count" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p>}
            {step.context && <p className="explainer-visually-hidden">{step.context}</p>}
            {(step.kicker || marker) && <p className="explainer-story-kicker">{marker && <span className="explainer-story-marker" aria-hidden="true">{marker}</span>}{step.kicker}</p>}
            <h3>{step.title}</h3>
            {step.text && <p>{step.text}</p>}
            {step.quote && <PullQuote source={step.source}>{step.quote}</PullQuote>}
            {step.note && <p className="explainer-story-note">{step.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
