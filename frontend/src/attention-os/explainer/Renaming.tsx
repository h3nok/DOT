import type { CSSProperties } from "react";
import "./explainer.css";

export interface Rename {
  /** What a thing is. */
  is: string;
  /** What it is called instead. */
  called: string;
}

/**
 * A sentence that renames one thing as another, set so each true word is struck
 * through and its new name stands beside it. It still reads, and copies, as the
 * sentence: "We call exhaustion adulthood, …, and endless accumulation success."
 */
export function Renaming({ lead, pairs }: { lead: string; pairs: readonly Rename[] }) {
  const last = pairs.length - 1;
  return (
    <p className="explainer-rename">
      <span className="explainer-rename-lead">{lead}</span>{" "}
      {pairs.map((pair, index) => (
        <span key={pair.is} className="explainer-rename-pair" style={{ ["--ex-order" as string]: index } as CSSProperties}>
          {index === last && last > 0 && <span className="explainer-rename-joint">and </span>}
          <span className="explainer-rename-is"><span>{pair.is}</span></span>{" "}
          <span className="explainer-rename-called">{pair.called}</span>
          <span className="explainer-rename-joint">{index === last ? "." : ", "}</span>
        </span>
      ))}
    </p>
  );
}
