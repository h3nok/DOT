import "./explainer.css";

export interface MarkPart {
  label: string;
  /** The screen that shows this part. */
  href?: string;
}

/**
 * Which part of a short series this screen shows: the series' name, then every part,
 * this one marked and the others linked. It orients; it never counts progress or asks
 * the reader to finish anything (Manifesto L6).
 */
export function PartMark({ label, parts, current }: { label: string; parts: readonly MarkPart[]; current: number }) {
  return (
    <p className="explainer-partmark">
      <span className="explainer-partmark-label">{label}</span>
      {parts.map((part, index) => index === current
        ? <span key={part.label} className="explainer-partmark-part" aria-current="true">{part.label}</span>
        : part.href
          ? <a key={part.label} className="explainer-partmark-part" href={part.href}>{part.label}</a>
          : <span key={part.label} className="explainer-partmark-part">{part.label}</span>)}
    </p>
  );
}
