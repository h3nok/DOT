import { useId } from "react";
import "./explainer.css";

export interface BarRow {
  id: string;
  label: string;
  value: number;
  /** The value as it should read, with its unit. */
  display: string;
  /** Optional: this bar's own colour, when colour carries meaning across a page. */
  fill?: string;
}

/**
 * Magnitudes side by side, each bar measured from zero against the largest, or
 * against a fixed whole (`max`, e.g. 100 for shares). `emphasis` names the one
 * row the story is about; it takes the accent and the rest stay in ink.
 */
export function BarList({ rows, title, note, max: whole, emphasis }: { rows: readonly BarRow[]; title: string; note?: string; max?: number; emphasis?: string }) {
  const caption = useId();
  const max = whole ?? (Math.max(...rows.map(row => row.value), 0) || 1);
  return (
    <figure className="explainer-bars" aria-labelledby={caption}>
      <figcaption id={caption} className="explainer-eyebrow">{title}</figcaption>
      <ul>
        {rows.map((row, index) => (
          <li key={row.id} data-emphasis={row.id === emphasis ? "" : undefined} style={{ ["--ex-order" as string]: index }}>
            <span className="explainer-bars-label">{row.label}</span>
            <span className="explainer-bars-track" aria-hidden="true"><i style={{ width: `${(row.value / max) * 100}%`, background: row.fill }} /></span>
            <strong>{row.display}</strong>
          </li>
        ))}
      </ul>
      {note && <p className="explainer-bars-note">{note}</p>}
    </figure>
  );
}
