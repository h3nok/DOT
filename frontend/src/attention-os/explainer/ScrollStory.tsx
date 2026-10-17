import { useEffect, useRef, useState, type ReactNode } from "react";
import { PullQuote } from "./PullQuote";
import "./explainer.css";

export interface StoryStep {
  id: string;
  title: string;
  text: string;
  /** A line from the source text that the step rests on. */
  quote?: string;
  source?: string;
}

/**
 * A figure that holds still while its steps scroll past. The step in the middle
 * of the viewport is the active one, and the figure is drawn for it. The steps
 * are ordinary text in reading order, so the story is complete without the
 * figure, without motion, and without script. Nothing advances on its own.
 */
export function ScrollStory<T extends StoryStep>({ steps, label, figure }: {
  steps: readonly T[];
  /** Names the figure for assistive technology. */
  label: string;
  figure: (active: T, index: number) => ReactNode;
}) {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // A thin band across the middle of the viewport decides which step is being read.
    const observer = new IntersectionObserver(entries => {
      const entered = entries.filter(entry => entry.isIntersecting).map(entry => Number((entry.target as HTMLElement).dataset.step));
      if (entered.length) setActive(Math.max(...entered));
    }, { rootMargin: "-45% 0px -45% 0px" });
    for (const node of nodes.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [steps.length]);
  return (
    <div className="explainer-story">
      <figure className="explainer-story-figure" aria-label={label}>{figure(steps[active], active)}</figure>
      <ol className="explainer-story-steps">
        {steps.map((step, index) => (
          <li key={step.id} ref={node => { nodes.current[index] = node; }} data-step={index} data-active={index === active ? "" : undefined} aria-current={index === active ? "step" : undefined}>
            <p className="explainer-story-count" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}</p>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {step.quote && <PullQuote source={step.source}>{step.quote}</PullQuote>}
          </li>
        ))}
      </ol>
    </div>
  );
}
