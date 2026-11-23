import type { CSSProperties } from "react";
import "./explainer.css";

export interface SplitRow {
  /** The sentence up to its turn: who bears it. */
  before: string;
  /** The rest of the sentence: what continues regardless. */
  after: string;
}

/**
 * Sentences that turn on one word, set as two columns: who bears something on the
 * left, what continues regardless on the right, an arrow where each sentence turns.
 * Each row still reads as its whole sentence. Two short sentences head the columns.
 */
export function SplitSentences({ heads, rows, label }: { heads: readonly [string, string]; rows: readonly SplitRow[]; label: string }) {
  return (
    <figure className="explainer-split" aria-label={label}>
      <p className="explainer-split-head" data-side="before">{heads[0]}</p>
      <p className="explainer-split-head" data-side="after">{heads[1]}</p>
      <ul className="explainer-split-rows">
        {rows.map((row, index) => (
          <li key={row.before} style={{ ["--ex-order" as string]: index } as CSSProperties}>
            <span className="explainer-split-before">{row.before}</span>
            <span className="explainer-split-arrow" aria-hidden="true" />{" "}
            <span className="explainer-split-after">{row.after}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
