import { useId } from "react";
import "./explainer.css";

export interface BarRow {
  id: string;
  label: string;
  value: number;
  /** The value as it should read, with its unit. */
  display: string;
}

/** Magnitudes side by side, each bar measured from zero against the largest. */
export function BarList({ rows, title, note }: { rows: readonly BarRow[]; title: string; note?: string }) {
  const caption = useId();
  const max = Math.max(...rows.map(row => row.value), 0) || 1;
  return (
    <figure className="explainer-bars" aria-labelledby={caption}>
      <figcaption id={caption} className="explainer-eyebrow">{title}</figcaption>
      <ul>
        {rows.map(row => (
          <li key={row.id}>
            <span className="explainer-bars-label">{row.label}</span>
            <span className="explainer-bars-track" aria-hidden="true"><i style={{ width: `${(row.value / max) * 100}%` }} /></span>
            <strong>{row.display}</strong>
          </li>
        ))}
      </ul>
      {note && <p className="explainer-bars-note">{note}</p>}
    </figure>
  );
}
