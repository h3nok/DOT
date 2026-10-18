import type { CSSProperties } from "react";
import "./story-rail.css";

/**
 * The steps of a scroll story as a short menu: where the reader is, what is done, what is ahead, and how
 * far into the current step they have read. Choosing a step goes there; nothing moves by itself.
 */
export function StoryRail({ label, items, active, progress, onSelect }: {
  label: string;
  items: readonly { id: string; label: string }[];
  active: number;
  /** How far into the current step, from 0 to 1. */
  progress: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav className="story-rail" aria-label={label}>
      <ol>
        {items.map((item, index) => {
          const state = index < active ? "past" : index === active ? "current" : "next";
          const fill = state === "past" ? 1 : state === "current" ? progress : 0;
          return (
            <li key={item.id} data-state={state}>
              <button type="button" onClick={() => onSelect(index)} aria-current={state === "current" ? "step" : undefined}>
                <span className="story-rail-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="story-rail-label">{item.label}</span>
                <i aria-hidden="true" style={{ "--story-rail-fill": fill } as CSSProperties} />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
