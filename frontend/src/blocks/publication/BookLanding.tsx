import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { NucleusMark } from "../../dot/NucleusMark";
import BookEditionMap from "./BookEditionMap";

/**
 * BookLanding — the frontispiece.
 *
 * Not a landing page about the book: the book's own opening leaf. The seal, the
 * title, the discipline it holds itself to, and one door in. Below the fold the
 * seams show before the structure (a framework that marks its own hypotheses is
 * the reason to trust it), and the argument is a spine — a table of contents,
 * not a pitch deck.
 */

function sectionLabel(section: BookReleaseSection): string {
  if (section.kind === "chapter") return `Chapter ${section.number}`;
  if (section.kind === "preface") return "Preface";
  return "Sources";
}

function sectionSummary(section: BookReleaseSection): string {
  if (section.kind === "preface") return "The observer belongs in the inquiry.";
  if (section.kind === "references") return "Every claim points back to its sources.";

  switch (section.number) {
    case 1:
      return "A state-bearing, information-sensitive process that works to preserve its coherence across change.";
    case 2:
      return "The experiencing author is Little c — coupled to the body, but not, by hypothesis, produced by it.";
    case 3:
      return "How a process persists across change: T, E, Big C, and the policy DOT names Love.";
    case 4:
      return "World invariants, agency mechanics, and why consequence gives experience weight.";
    case 5:
      return "The Canvas carries; the Painting interprets; Character acts — and Fear can narrow all three.";
    case 6:
      return "Being painted, seeing the Painting, and becoming the painter.";
    default:
      return section.subtitle ?? "A finite step in the argument.";
  }
}

export default function BookLanding({ manifest }: { manifest: DotBookOneManifest }) {
  const firstSection = manifest.sections[0];
  const claimLevels = manifest.reader_contract.claim_levels;

  return (
    <main id="book-main" className="w-full pb-24">
      {/* ── Frontispiece ─────────────────────────────────────────────── */}
      {/* One quiet opening: the seal, the title, the discipline, one door. */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center border-b border-[var(--book-hairline)] px-6 text-center">
        <NucleusMark size={132} className="mb-10" />

        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--book-muted)]">
          {manifest.project.series_title} · Book One
        </p>

        <h1 className="mt-6 font-serif font-semibold leading-[1.05] tracking-tight text-[var(--book-ink)]">
          <span className="block text-4xl sm:text-6xl">Consciousness</span>
          <span className="mt-2 block text-2xl font-medium text-[var(--book-muted)] sm:text-4xl">
            A Digital Organism
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-balance font-serif text-lg italic leading-relaxed text-[var(--book-muted)]">
          A construction, not a revelation — a framework whose observations,
          models, hypotheses, and speculation remain distinguishable.
        </p>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--book-muted)]">
          {manifest.project.author}
        </p>

        <div className="mt-12 flex flex-col items-center gap-5">
          <Link
            to={bookSectionRoute(firstSection)}
            className="book-primary-action inline-flex min-h-12 items-center gap-2.5 px-7 py-3.5 text-sm font-semibold"
          >
            Begin reading
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/doctrine"
            className="text-sm text-[var(--book-muted)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-ink)]"
          >
            Trace the concept map instead
          </Link>
        </div>
      </section>

      {/* ── The seams, first ─────────────────────────────────────────── */}
      {/* The differentiator moves up: this book labels what it knows. */}
      <section className="mx-auto max-w-3xl px-6 pt-24 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--book-cinnabar)]">
          An argument with its seams showing
        </p>
        <p className="mt-6 text-balance font-serif text-xl leading-relaxed text-[var(--book-ink)] sm:text-2xl">
          Every claim in this book is marked as what it is —{" "}
          {claimLevels.map((level, i) => (
            <span key={level}>
              <span className="italic">{level.toLowerCase()}</span>
              {i < claimLevels.length - 2 ? ", " : i === claimLevels.length - 2 ? ", or " : ""}
            </span>
          ))}
          — and where it still owes a debt, the debt is named.
        </p>
        <Link
          to="/doctrine/limits-and-debts"
          className="mt-6 inline-block text-sm text-[var(--book-muted)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-ink)]"
        >
          Read the open questions
        </Link>
      </section>

      {/* ── The spine ────────────────────────────────────────────────── */}
      {/* The argument as a table of contents: lines, not cards. */}
      <section className="mx-auto mt-24 max-w-3xl px-6" aria-label="Contents">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--book-muted)]">
          Contents
        </p>
        <ol className="mt-8 border-t border-[var(--book-hairline)]">
          {manifest.sections.map((section) => (
            <li key={section.id}>
              <Link
                to={bookSectionRoute(section)}
                className="group flex items-baseline gap-5 border-b border-[var(--book-hairline)] py-5 transition-colors hover:bg-[var(--book-vellum)]"
              >
                <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--book-muted)]">
                  {sectionLabel(section)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg font-medium text-[var(--book-ink)] transition-colors group-hover:text-[var(--book-cinnabar)]">
                    {section.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-[var(--book-muted)]">
                    {sectionSummary(section)}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--book-muted)]">
                  {section.reading_time_minutes} min
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Other doors, one quiet line ──────────────────────────────── */}
      <p className="mx-auto mt-24 max-w-3xl px-6 text-center text-sm leading-relaxed text-[var(--book-muted)]">
        The text is fixed; the door is yours.{" "}
        {READING_PATHS.map((path, i) => (
          <span key={path.id}>
            <Link
              to={`${DOT_BOOK_ONE_ROUTE}/${path.steps[0].slug}?path=${path.id}`}
              className="text-[var(--book-ink)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
            >
              {path.label.toLowerCase()}
            </Link>
            {i < READING_PATHS.length - 1 ? ", or " : "."}
          </span>
        ))}
      </p>

      <div className="mx-auto mt-24 max-w-7xl px-5 sm:px-8">
        <BookEditionMap manifest={manifest} />
      </div>
    </main>
  );
}
