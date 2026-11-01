import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Download,
  Film,
  Network,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  findPath,
  positionOf,
} from "../../attention-os/reader/readingPaths";
import { readReadingPathProgress } from "../../attention-os/reader/readingPathProgress";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  groupBookSectionsByPart,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { Editable } from "../../content/editable";
import bookLanding from "../../content/publications/bookLanding.json";
import { DotButton } from "../../shared/DotButton";
import BookCitation from "./BookCitation";
import BookOneCover from "./BookOneCover";
import "./book-reading-page.css";

/**
 * BookLanding — the frontispiece.
 *
 * Not a promotional page about the book: the book's own opening threshold.
 * Cover and proposition form one composition, followed by the reader contract,
 * a finite index, and publication apparatus. There is one primary door in.
 */

function sectionLabel(section: BookReleaseSection): string {
  if (section.kind === "chapter") return `Chapter ${section.number}`;
  if (section.kind === "preface") return "Preface";
  if (section.kind === "coda") return "Coda";
  if (section.kind === "appendix") return "Appendix";
  if (section.kind === "glossary") return "Glossary";
  return "Sources";
}

// The book's four levels, worded as the book's own Table 1 defines them.
// The v3 names stay so an older manifest still reads correctly.
const CLAIM_DEFINITIONS: Record<string, string> = {
  observation: "What is encountered or measured without accepting DOT.",
  "external model": "An account developed in another field, used within its scope.",
  "dot derivation": "An inference from declared postulates and bridge premises.",
  "speculative extension": "A possibility not yet adequately derived or tested.",
  model: "A representation that makes relationships easier to inspect.",
  hypothesis: "A proposed explanation that still requires stronger tests.",
  speculation: "A possibility kept visible without being presented as fact.",
};

function readingPathHref(pathId: string, sectionSlug: string): string {
  return `${DOT_BOOK_ONE_ROUTE}/${sectionSlug}?path=${pathId}`;
}

export default function BookLanding({ manifest }: { manifest: DotBookOneManifest }) {
  const firstSection = manifest.sections[0];
  const claimLevels = manifest.reader_contract.claim_levels;
  const sectionGroups = groupBookSectionsByPart(manifest.sections);
  const illustrations = manifest.figures ?? [];
  const reduceMotion = useReducedMotion();
  const [savedProgress] = useState(readReadingPathProgress);
  const savedPath = savedProgress ? findPath(savedProgress.pathId) : null;
  const savedPosition =
    savedPath && savedProgress
      ? positionOf(savedPath, savedProgress.sectionSlug)
      : -1;
  const savedPathComplete =
    savedPath !== null && savedPosition === savedPath.steps.length - 1;
  const livedExperiencePath = findPath("start-where-you-live");
  const writtenOrderPath = findPath("start-with-the-architecture");
  const primaryHref =
    savedPath && savedProgress
      ? readingPathHref(savedPath.id, savedProgress.sectionSlug)
      : livedExperiencePath
        ? readingPathHref(livedExperiencePath.id, firstSection.slug)
        : bookSectionRoute(firstSection);
  const writtenOrderHref = writtenOrderPath
    ? readingPathHref(writtenOrderPath.id, firstSection.slug)
    : bookSectionRoute(firstSection);
  const entrySection = savedPath && savedProgress
    ? manifest.sections.find(section => section.slug === savedProgress.sectionSlug)
    : firstSection;

  return (
    <main id="book-main" className="book-volume book-volume--reading w-full pb-24">
      <section
        className="book-volume-hero relative flex items-center overflow-hidden border-b border-[var(--book-hairline)] px-5 py-24 sm:px-8"
        aria-labelledby="book-landing-title"
      >
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="book-volume-hero__layout relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[minmax(20rem,0.82fr)_minmax(28rem,1.18fr)] lg:gap-20"
        >
          <div className="book-volume-hero__cover flex justify-center lg:justify-end">
            <BookOneCover
              manifest={manifest}
              className="w-[min(21rem,72vw)] sm:w-[min(23rem,54vw)] lg:w-full lg:max-w-[23rem]"
            />
          </div>

          <div className="book-volume-hero__copy max-w-2xl text-left">
            <p className="dot-label book-volume-kicker text-[var(--book-cinnabar)]">
              Book One · {manifest.release.label} · v{manifest.release.version}
            </p>
            <h1
              id="book-landing-title"
              className="book-reading-heading mt-5 text-[clamp(2.7rem,5vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.035em] text-[var(--book-ink)]"
            >
              {manifest.project.title}
            </h1>
            <p className="book-volume-proposition book-reading-copy mt-5 max-w-xl text-xl leading-relaxed text-[var(--book-ink)]">
              {bookLanding.heading}
            </p>
            <p className="book-volume-description book-reading-copy mt-4 max-w-xl text-base leading-relaxed text-[var(--book-muted)] sm:text-lg">
              How do the body, experience, and inherited beliefs shape a life?
              Book One develops DOT’s proposed answer, with its assumptions and
              open questions visible.
            </p>

            <div className="book-volume-actions mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <DotButton
                to={primaryHref}
                label={
                  savedPath
                    ? savedPathComplete
                      ? "Review your path"
                      : "Continue reading"
                    : "Begin with lived experience"
                }
                icon={<BookOpen />}
                endIcon={<ArrowRight />}
              />
              <Link
                to={`${DOT_BOOK_ONE_ROUTE}/copy`}
                className="dot-label inline-flex min-h-11 items-center gap-2 text-[var(--book-muted)] transition-colors hover:text-[var(--book-ink)]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Free PDF edition
              </Link>
            </div>
            <p className="book-volume-reading-note mt-3 text-sm leading-relaxed text-[var(--book-muted)]">
              Free to read · No account needed
              {entrySection && ` · ${sectionLabel(entrySection)}, about ${entrySection.reading_time_minutes} minutes`}
            </p>
            {!savedPath && (
              <p className="book-volume-written-order book-reading-copy mt-4 text-sm text-[var(--book-muted)]">
                Alternative path:{" "}
                <Link
                  to={writtenOrderHref}
                  className="text-[var(--book-ink)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
                >
                  Read in written order.
                </Link>
              </p>
            )}

            <nav className="book-volume-orientation" aria-label="Explore the book">
              <a href="#volume-contents">Browse the chapters <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
              <Link to="/academy/films"><Film className="h-3.5 w-3.5" aria-hidden="true" /> Visual introduction</Link>
            </nav>
            <p className="book-volume-author mt-6 text-sm text-[var(--book-muted)]">By {manifest.project.author}</p>
          </div>
        </motion.div>

      </section>

      <div className="book-volume-body">
        <motion.section
          id="volume-contents"
          initial={false}
          className="book-volume-contents relative z-10 mx-auto max-w-6xl scroll-mt-20 border-y border-[var(--book-hairline)] px-6 py-20 md:px-8 lg:py-28"
          aria-labelledby="book-contents-title"
        >
          <div className="grid gap-8 md:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="dot-label text-[var(--book-cinnabar)]">Book One</p>
              <h2 id="book-contents-title" className="book-reading-heading mt-4 text-4xl font-medium leading-tight text-[var(--book-ink)] sm:text-5xl">
                Contents
              </h2>
              <p className="book-reading-copy mt-5 max-w-sm text-base leading-relaxed text-[var(--book-muted)]">
                Follow the book in order, or open the question closest to your
                life. Technical passages are available within each chapter when
                you choose to open them.
              </p>
              <p className="dot-label mt-6 text-[var(--book-muted)]">
                {manifest.extent.chapters} chapters · {manifest.extent.references} sources
              </p>
              {illustrations.length > 0 && (
                <p className="book-reading-copy mt-5 max-w-sm text-sm leading-relaxed text-[var(--book-muted)]">
                  Illustrations appear beside the passages they explain. Open a
                  figure directly from the chapter list.
                </p>
              )}
            </div>

            <div className="book-volume-index">
            {sectionGroups.map((group, groupIndex) => (
              <section
                key={group.part}
                className="book-volume-part"
                aria-label={group.part}
              >
                <div className="book-volume-part__heading grid grid-cols-[4rem_minmax(0,1fr)] gap-4 border-b border-[var(--book-hairline)] pb-3">
                  <span className="dot-label tabular-nums text-[var(--book-muted)]">
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <h3 className="dot-label text-[var(--book-ink)]">{group.part}</h3>
                </div>
                <ol>
                  {group.sections.map((section) => (
                    <li key={section.id}>
                      <Link
                        to={bookSectionRoute(section)}
                        className="book-volume-section group grid grid-cols-[4rem_minmax(0,1fr)_auto] items-baseline gap-4 border-b border-[var(--book-hairline)] py-5 transition-colors"
                      >
                        <span className="book-volume-section__number font-mono text-[11px] tabular-nums text-[var(--book-muted)]">
                          {section.kind === "chapter"
                            ? String(section.number).padStart(2, "0")
                            : section.kind === "preface"
                              ? "P"
                              : section.kind === "coda"
                                ? "C"
                                : section.kind === "appendix"
                                  ? "A"
                                  : section.kind === "glossary"
                                    ? "G"
                                    : "S"}
                        </span>
                        <span className="min-w-0">
                          <span className="book-reading-heading block text-lg font-medium leading-snug text-[var(--book-ink)] transition-colors group-hover:text-[var(--book-cinnabar)] sm:text-xl">
                            {section.title}
                          </span>
                          <span className="mt-1 block text-xs text-[var(--book-muted)] sm:hidden">
                            {sectionLabel(section)} · {section.reading_time_minutes} min
                          </span>
                        </span>
                        <span className="hidden items-center gap-3 dot-label tabular-nums text-[var(--book-muted)] sm:inline-flex">
                          {section.reading_time_minutes} min
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </span>
                      </Link>
                      {illustrations.some(figure => figure.section === section.slug) && (
                        <ul className="book-volume-illustrations" aria-label={`Illustrations in ${section.title}`}>
                          {illustrations.filter(figure => figure.section === section.slug).map(figure => (
                            <li key={figure.id}>
                              <Link to={`${bookSectionRoute(section)}#figure-${figure.id}`}>
                                <span className="book-volume-illustrations__label">Figure {figure.number}</span>{" "}
                                <span>{figure.title}</span>
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          id="volume-guide"
          initial={false}
          className="book-volume-guide relative z-10 mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-6 py-20 md:grid-cols-[0.72fr_1.28fr] md:px-8 lg:gap-20 lg:py-28"
          aria-labelledby="volume-guide-title"
        >
          <div>
            <p className="dot-label text-[var(--book-cinnabar)]">Claim levels</p>
            <h2
              id="volume-guide-title"
              className="book-reading-heading mt-4 text-3xl font-medium leading-tight text-[var(--book-ink)] sm:text-4xl"
            >
              How claims are labelled
            </h2>
            <p className="book-reading-copy mt-5 text-base leading-relaxed text-[var(--book-muted)]">
              {manifest.reader_contract.claim_levels.join(", ").replace(/, ([^,]*)$/, ", and $1")}{" "}
              are labelled throughout the edition.
            </p>
            <p className="book-reading-copy mt-5 text-base italic leading-relaxed text-[var(--book-ink)]">{bookLanding.position}</p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <Link
                to="/doctrine"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--book-ink)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
              >
                <Network className="h-3.5 w-3.5" aria-hidden="true" />
                Open the concept map
              </Link>
              <Link
                to="/doctrine/limits-and-debts"
                className="text-sm text-[var(--book-muted)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-ink)]"
              >
                Open questions
              </Link>
            </div>
          </div>

          <dl className="book-volume-claims grid border-t border-[var(--book-hairline)] sm:grid-cols-2">
            {claimLevels.map((level, index) => (
              <div key={level} className="book-volume-claim border-b border-[var(--book-hairline)] py-5 sm:px-5 sm:[&:nth-child(odd)]:border-r">
                <dt className="flex items-baseline gap-3">
                  <span className="dot-label tabular-nums text-[var(--book-cinnabar)]">
                    0{index + 1}
                  </span>
                  <span className="text-sm font-semibold text-[var(--book-ink)]">
                    {level}
                  </span>
                </dt>
                <dd className="mt-2 pl-8 text-sm leading-relaxed text-[var(--book-muted)]">
                  {CLAIM_DEFINITIONS[level.toLowerCase()] ?? "Named confidence level."}
                </dd>
              </div>
            ))}
          </dl>
        </motion.section>

        <section
          className="book-volume-apparatus relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[0.72fr_1.28fr] md:px-8 lg:gap-20 lg:py-28"
          aria-label="A note before reading, and how to cite Book One"
        >
          <div>
            <p className="dot-label text-[var(--book-cinnabar)]">A note before reading</p>
            <p className="book-reading-copy mt-4 max-w-md text-base leading-relaxed text-[var(--book-muted)]">{bookLanding.description}</p>
            <Editable
              id="book.care_note"
              as="p"
              multiline
              text="Some chapters discuss fear, conditioning, and personal history."
              className="book-reading-copy mt-4 block max-w-md text-base italic leading-relaxed text-[var(--book-muted)]"
            />
          </div>
          <BookCitation manifest={manifest} section={null} />
        </section>

        <section
          className="book-volume-end relative z-10 mx-auto max-w-6xl border-t border-[var(--book-hairline)] px-6 pb-8 pt-16 md:px-8"
          aria-labelledby="book-landing-end-title"
        >
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="dot-label text-[var(--book-cinnabar)]">Book One</p>
              <h2 id="book-landing-end-title" className="book-reading-heading mt-3 max-w-xl text-3xl font-medium leading-tight text-[var(--book-ink)] sm:text-4xl">
                Start reading
              </h2>
            </div>
            <DotButton
              to={bookSectionRoute(firstSection)}
              label="Open the Preface"
              icon={<BookOpen />}
              endIcon={<ArrowRight />}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
