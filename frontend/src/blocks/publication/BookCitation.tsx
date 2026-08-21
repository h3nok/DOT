import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

import {
  formatBibTeX,
  formatReference,
} from "../../content/publications/citation";
import type {
  BookReleaseSection,
  DotBookOneManifest,
} from "../../content/publications/dotBookOne";

type CitationFormat = "reference" | "bibtex";

const FORMATS: Array<{ id: CitationFormat; label: string }> = [
  { id: "reference", label: "Reference" },
  { id: "bibtex", label: "BibTeX" },
];

/**
 * The citation a reader needs while they are still holding the passage.
 *
 * Book One ships versions, so quoting it without the version leaves the quote
 * pointing at prose that may since have moved. Both formats carry the edition
 * and version; the printed copy carries it too, because a printed chapter
 * leaves the site entirely.
 */
export default function BookCitation({
  manifest,
  section,
}: {
  manifest: DotBookOneManifest;
  section: BookReleaseSection | null;
}) {
  const [format, setFormat] = useState<CitationFormat>("reference");
  const [copied, setCopied] = useState(false);

  // One retrieval date per visit: BibTeX's urldate should not change while a
  // reader looks at it.
  const accessed = useMemo(() => new Date(), []);
  const reference = formatReference(manifest, section);
  const citation =
    format === "reference" ? reference : formatBibTeX(manifest, section, accessed);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
    } catch {
      // Clipboard access can be refused; the text stays selectable either way.
      setCopied(false);
    }
  };

  const what = section ? "this chapter" : "this edition";

  return (
    <>
      <section
        id="section-citation"
        className="book-citation book-coda__section scroll-mt-24 print:hidden"
        aria-labelledby="section-citation-title"
      >
        <header className="book-coda__section-heading">
          <h2 className="book-coda__section-title" id="section-citation-title">
            Cite {what}
          </h2>
          <p className="book-coda__section-purpose">
            Digital edition · version {manifest.release.version}
          </p>
        </header>

        <div className="book-coda__section-body">
          <div
            className="book-citation__formats"
            role="group"
            aria-label="Citation format"
          >
            {FORMATS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFormat(entry.id)}
                aria-pressed={format === entry.id}
                className="book-citation__format"
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="book-citation__text">
            <pre className="min-w-0 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[var(--book-ink)]">
            {citation}
            </pre>
          </div>

          <button
            type="button"
            onClick={copy}
            className="book-citation__copy"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied
              ? "Copied"
              : `Copy ${format === "bibtex" ? "BibTeX" : "reference"}`}
          </button>
          <p aria-live="polite" className="sr-only">
            {copied ? "Citation copied to the clipboard." : ""}
          </p>
        </div>
      </section>

      {/* A printed chapter has to say where it came from. */}
      <p className="hidden font-mono dot-micro leading-relaxed print:block">
        {reference}
      </p>
    </>
  );
}
