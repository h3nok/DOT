import { useState } from "react";

/**
 * A citation the reader can copy exactly. If the clipboard is unavailable the
 * text stays selectable on the page, so nothing depends on the copy button.
 */
export function CiteThis({ citations, labels }: {
  citations: ReadonlyArray<{ id: string; label: string; text: string }>;
  labels: { copy: string; copied: string; unavailable: string };
}) {
  const [status, setStatus] = useState("");
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(labels.copied);
    } catch {
      setStatus(labels.unavailable);
    }
  };
  return (
    <div className="inq-cite">
      <ul>
        {citations.map((citation) => (
          <li key={citation.id}>
            <p className="inq-cite-label">{citation.label}</p>
            <p className="inq-cite-text">{citation.text}</p>
            <button type="button" className="inq-button inq-button--quiet" onClick={() => copy(citation.text)}
              aria-label={`${labels.copy}: ${citation.label}`}>{labels.copy}</button>
          </li>
        ))}
      </ul>
      <p className="inq-status" role="status" aria-live="polite">{status}</p>
    </div>
  );
}
