import type { DotBookOneManifest } from "../../content/publications/dotBookOne";
import { NucleusMark } from "../../dot/NucleusMark";

interface BookOneCoverProps {
  manifest?: DotBookOneManifest;
  className?: string;
}

const RELEASED_COVER = {
  seriesTitle: "Digital Organism Theory",
  title: "Consciousness: A Digital Organism",
  subtitle: "Foundations, Agency, and Research",
  author: "Henok Ghebrechristos",
  edition: "Digital Edition",
  version: 4,
} as const;

/**
 * The canonical Book One cover.
 *
 * The graphic is intentionally native geometry rather than a raster image: the
 * field and the shared nucleus mark stay legible at thumbnail and full-cover
 * scale. The branded edition keeps its ink-and-jade jacket in either reading
 * theme; the cover mark is still, like its Word/PDF counterpart.
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
        <g className="book-one-cover-traces">
          <circle cx="420" cy="300" r="210" />
          <circle cx="420" cy="300" r="330" />
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
          <div className="book-one-cover-mark">
            <NucleusMark size="100%" reducedMotion />
          </div>
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
