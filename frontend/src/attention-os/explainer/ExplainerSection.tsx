import type { ReactNode } from "react";
import "./explainer.css";

/**
 * One scene of a visual explainer: a number, a claim as its title, an optional
 * lead, then the picture that carries it. Scenes are finite and read in order.
 */
export function ExplainerSection({ id, number, title, lead, children, className = "" }: {
  id: string;
  number?: string;
  title: string;
  /** A sentence, or a primitive such as a quote, that opens the scene. */
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`explainer-section ${className}`.trim()} id={id} aria-labelledby={`${id}-title`}>
      <header className="explainer-section-header">
        {number && <p className="explainer-number" aria-hidden="true">{number}</p>}
        <h2 id={`${id}-title`}>{title}</h2>
        {lead && (typeof lead === "string" ? <p className="explainer-lead">{lead}</p> : <div className="explainer-lead">{lead}</div>)}
      </header>
      <div className="explainer-section-body">{children}</div>
    </section>
  );
}
