import type { CSSProperties } from "react";
import "./explainer.css";

/** How long each broken piece runs, so the breaks look irregular rather than ruled. */
const PIECES = [2.4, 1.1, 1.8, 0.8, 1.5, 1, 1.7, 1.2];

/**
 * One span of a mind drawn twice: a thought carried whole, and the same span broken
 * into a few seconds at a time by what interrupts it. The figure is named by the
 * sentence it pictures; its words are that sentence's own.
 */
export function InterruptedThread({ whole, broken, interruptions, label }: {
  /** What the unbroken line is, e.g. "a thought across years". */
  whole: string;
  /** What the broken line is, e.g. "the next few seconds of your mind". */
  broken: string;
  /** What breaks it, in the source's order. */
  interruptions: readonly string[];
  /** The sentence the figure pictures, read in place of the drawing. */
  label: string;
}) {
  return (
    <figure className="explainer-thread" aria-label={label}>
      <div className="explainer-thread-row" data-kind="whole">
        <p className="explainer-thread-label">{whole}</p>
        <span className="explainer-thread-line" aria-hidden="true" />
      </div>
      <div className="explainer-thread-row" data-kind="broken">
        <ol className="explainer-thread-cuts">
          {interruptions.map((word, index) => (
            <li key={word} style={{ ["--ex-order" as string]: index, ["--piece" as string]: `${PIECES[index % PIECES.length]}rem` } as CSSProperties}>
              <span className="explainer-thread-piece" aria-hidden="true" />
              <span className="explainer-thread-cut">{word}</span>
            </li>
          ))}
        </ol>
        <p className="explainer-thread-label">{broken}</p>
      </div>
    </figure>
  );
}
