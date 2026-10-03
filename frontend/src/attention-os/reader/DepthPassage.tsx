import { Children, type ReactNode } from "react";

/**
 * A depth passage in the digital edition: closed until the reader asks.
 *
 * Native `<details>` keeps it keyboard- and screen-reader-operable and working
 * without JavaScript. There is no animation to reduce, no count of what is
 * left unread, and no prompt to open it — the summary states what the passage
 * covers and what it costs in time, and the reader decides (L1, L10).
 */
export function DepthPassage({
  children,
  completeEditionHref,
}: {
  children?: ReactNode;
  completeEditionHref?: string;
}) {
  // remarkDepthPassages always emits the summary first.
  const [summary, ...body] = Children.toArray(children);
  return (
    <details className="book-depth">
      {summary}
      <div className="book-depth__body">
        {body}
        <p className="book-depth__edition">
          The Complete Edition prints this passage inline.
          {completeEditionHref ? (
            <>
              {" "}
              <a href={completeEditionHref}>Read the Complete Edition</a>.
            </>
          ) : null}
        </p>
      </div>
    </details>
  );
}

export function DepthSummary({
  children,
  minutes,
}: {
  children?: ReactNode;
  minutes?: number | string;
}) {
  return (
    <summary className="book-depth__summary">
      <span className="book-depth__kicker">In depth</span>
      <span className="book-depth__label">{children}</span>
      {minutes ? <span className="book-depth__time">{minutes} min</span> : null}
    </summary>
  );
}
