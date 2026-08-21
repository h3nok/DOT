import type { DotBookOneManifest } from "../../content/publications/dotBookOne";

interface BookOneCoverProps {
  manifest?: DotBookOneManifest;
  className?: string;
}

const RELEASED_COVER = {
  seriesTitle: "Digital Organism Theory",
  title: "Consciousness: A Digital Organism",
  subtitle: "A Framework for Consciousness, Conditioning, and Conscious Authorship",
  author: "Henok Ghebrechristos",
  edition: "Digital Edition",
  version: 2,
} as const;

/**
 * The canonical Book One cover.
 *
 * The graphic is intentionally native geometry rather than a raster image: the
 * field, state traces, and organism stay legible at thumbnail and full-cover
 * scale, inherit the reader's appearance, and settle cleanly when motion is
 * reduced. Its entrance is finite—the substrate resolves once, then rests.
 */
export default function BookOneCover({
  manifest,
  className = "",
}: BookOneCoverProps) {
  const cover = manifest
    ? {
        seriesTitle: manifest.project.series_title,
        title: manifest.project.title,
        subtitle: manifest.project.subtitle,
        author: manifest.project.author,
        edition: manifest.release.label,
        version: manifest.release.version,
      }
    : RELEASED_COVER;
  const [titleLead, ...titleRemainder] = cover.title.split(":");
  const hasTitleLead = titleRemainder.length > 0;
  const titleBody = hasTitleLead ? titleRemainder.join(":").trim() : cover.title;

  return (
    <figure
      className={`book-one-cover ${className}`}
      aria-label={`${cover.title}, ${cover.seriesTitle} Book One, by ${cover.author}`}
    >
      <svg
        viewBox="0 0 420 600"
        preserveAspectRatio="none"
        className="book-one-cover-substrate"
        aria-hidden="true"
      >
        <g className="book-one-cover-grid">
          {Array.from({ length: 13 }, (_, index) => (
            <path key={`vertical-${index}`} d={`M ${index * 35} 0 V 600`} />
          ))}
          {Array.from({ length: 18 }, (_, index) => (
            <path key={`horizontal-${index}`} d={`M 0 ${index * 35} H 420`} />
          ))}
        </g>

        <g className="book-one-cover-traces">
          <path d="M 0 82 H 74 V 118 H 132" />
          <path d="M 420 116 H 348 V 154 H 314" />
          <path d="M 0 432 H 92 V 398 H 142" />
          <path d="M 420 468 H 346 V 426 H 306" />
          <path d="M 54 0 V 48 H 96 V 76" />
          <path d="M 354 600 V 540 H 320 V 504" />
        </g>

        <g className="book-one-cover-vias">
          <circle cx="74" cy="82" r="3" />
          <circle cx="132" cy="118" r="4" />
          <circle cx="348" cy="116" r="3" />
          <circle cx="314" cy="154" r="4" />
          <circle cx="92" cy="432" r="3" />
          <circle cx="142" cy="398" r="4" />
          <circle cx="346" cy="468" r="3" />
          <circle cx="306" cy="426" r="4" />
        </g>
      </svg>

      <span className="book-one-cover-scan" aria-hidden="true" />
      <span className="book-one-cover-spine" aria-hidden="true" />

      <div className="book-one-cover-content">
        <header className="book-one-cover-header">
          <span>{cover.seriesTitle}</span>
          <span>Book / 01</span>
        </header>

        <div className="book-one-cover-title-lockup">
          <span className="book-one-cover-kicker">
            {hasTitleLead ? `${titleLead}:` : cover.seriesTitle}
          </span>
          <span className="book-one-cover-title">{titleBody}</span>
        </div>

        <div className="book-one-cover-organism" aria-hidden="true">
          <svg viewBox="0 0 240 240">
            <g className="book-one-cover-field-ring">
              <circle cx="120" cy="120" r="96" />
              <circle cx="120" cy="120" r="74" />
              <circle cx="120" cy="120" r="52" />
            </g>
            <g className="book-one-cover-architecture">
              <path d="M120 24 A96 96 0 0 1 203 72" />
              <path d="M216 120 A96 96 0 0 1 168 203" />
              <path d="M120 216 A96 96 0 0 1 37 168" />
              <path d="M24 120 A96 96 0 0 1 72 37" />

              <path d="M120 46 A74 74 0 0 1 184 83" />
              <path d="M194 120 A74 74 0 0 1 157 184" />
              <path d="M120 194 A74 74 0 0 1 56 157" />
              <path d="M46 120 A74 74 0 0 1 83 56" />
            </g>
            <g className="book-one-cover-feedback">
              <path d="M120 55 V78" />
              <path d="M185 120 H162" />
              <path d="M120 185 V162" />
              <path d="M55 120 H78" />
            </g>
            <circle className="book-one-cover-core-boundary" cx="120" cy="120" r="34" />
            <circle className="book-one-cover-core" cx="120" cy="120" r="13" />
            <circle className="book-one-cover-core-seed" cx="120" cy="120" r="4" />
          </svg>
          <span>state persists through change</span>
        </div>

        <footer className="book-one-cover-footer">
          <p>{cover.subtitle}</p>
          <div>
            <strong>{cover.author}</strong>
            <span>{cover.edition} · v{cover.version}</span>
          </div>
        </footer>
      </div>
    </figure>
  );
}
