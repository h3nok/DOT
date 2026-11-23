import type { InquiryRecord, InquiryTerm } from "./types";

/**
 * Defined terms, each addressable (#term-id), with its source and the
 * foundational concepts it applies. The relation is named in words, never
 * implied by position.
 */
export function Terms({ terms, label, appliesLabel }: {
  terms: ReadonlyArray<InquiryTerm>;
  label: string;
  /** Precedes the list of foundational concepts, e.g. "Applies". */
  appliesLabel: string;
}) {
  return (
    <dl className="inq-terms" aria-label={label}>
      {terms.map((item) => (
        <div key={item.id} id={`term-${item.id}`} className="inq-term">
          <dt>{item.term}</dt>
          <dd>
            <p>{item.definition}</p>
            <p className="inq-source">
              <a href={item.source.href}>{item.source.label}</a>
              {item.applies?.length ? <>
                <span className="inq-term-applies">{appliesLabel}</span>
                {item.applies.map((concept, index) => <span key={concept.href}>
                  <a href={concept.href}>{concept.label}</a>{index < item.applies!.length - 1 ? ", " : ""}
                </span>)}
              </> : null}
            </p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Dated records, oldest first, each linked to the document itself. */
export function Records({ records, label }: { records: ReadonlyArray<InquiryRecord>; label: string }) {
  const ordered = [...records].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ol className="inq-records" aria-label={label}>
      {ordered.map((record) => (
        <li key={record.id} className="inq-record">
          <time dateTime={record.date}>{record.date.slice(0, 4)}</time>
          <div>
            <p className="inq-record-title"><a href={record.href} rel="noopener">{record.title}</a></p>
            <p className="inq-record-issuer">{record.issuer}</p>
            {record.use && <p className="inq-record-use">{record.use}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
