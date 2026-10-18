import type { ReactNode } from "react";
import "./explainer.css";

/** A line from the source text, always with where it comes from. `loud` closes a scene. */
export function PullQuote({ children, source, tone = "quiet" }: { children: ReactNode; source?: ReactNode; tone?: "quiet" | "loud" }) {
  return (
    <blockquote className={`explainer-quote explainer-quote--${tone}`}>
      <p>{children}</p>
      {source && <cite>{source}</cite>}
    </blockquote>
  );
}
