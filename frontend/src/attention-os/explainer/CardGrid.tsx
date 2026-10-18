import type { ReactNode } from "react";
import "./explainer.css";

export interface ExplainerCard {
  id: string;
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  meta?: string;
  /** The question or claim the card leaves with the reader. */
  emphasis?: string;
  /** Detail that stays folded until a reader asks for it. */
  more?: { label: string; body: readonly { heading?: string; text: string }[] };
}

/** A row of comparable cases, each with its detail on request. */
export function CardGrid({ cards, label }: { cards: readonly ExplainerCard[]; label: string }) {
  return (
    <ol className="explainer-cards" aria-label={label}>
      {cards.map(card => (
        <li key={card.id} id={card.id}>
          {card.icon && <span className="explainer-cards-icon" aria-hidden="true">{card.icon}</span>}
          {card.eyebrow && <p className="explainer-eyebrow">{card.eyebrow}</p>}
          <h3>{card.title}</h3>
          {card.meta && <p className="explainer-cards-meta">{card.meta}</p>}
          {card.emphasis && <strong>{card.emphasis}</strong>}
          {card.more && <Disclosure summary={card.more.label}>{card.more.body.map(part => <div key={part.text}>{part.heading && <p className="explainer-eyebrow">{part.heading}</p>}<p>{part.text}</p></div>)}</Disclosure>}
        </li>
      ))}
    </ol>
  );
}

/** Detail on request: closed by default, a native disclosure. */
export function Disclosure({ summary, children, id, className = "" }: { summary: string; children: ReactNode; id?: string; className?: string }) {
  return (
    <details className={`explainer-disclosure ${className}`.trim()} id={id}>
      <summary>{summary}</summary>
      <div>{children}</div>
    </details>
  );
}
