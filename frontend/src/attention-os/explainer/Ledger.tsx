import { useId, type ReactNode } from "react";
import "./explainer.css";

export interface LedgerEntry {
  id: string;
  icon?: ReactNode;
  /** What is supplied. */
  term: string;
  /** What it becomes. */
  becomes: string;
}

/** What one party supplies and what each contribution becomes for another, under one line that names the exchange. */
export function Ledger({ entries, title }: { entries: readonly LedgerEntry[]; title: string }) {
  const caption = useId();
  return (
    <figure className="explainer-ledger" aria-labelledby={caption}>
      <figcaption id={caption}>{title}</figcaption>
      <ol>
        {entries.map(entry => (
          <li key={entry.id}>
            {entry.icon && <span className="explainer-ledger-icon" aria-hidden="true">{entry.icon}</span>}
            <strong>{entry.term}</strong>
            <span className="explainer-ledger-becomes">{entry.becomes}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
