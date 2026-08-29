import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Download,
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
import BookCitation from "./BookCitation";
import BookOneCover from "./BookOneCover";
import BookSubstrate from "./BookSubstrate";

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
  return "Sources";
}

const CLAIM_DEFINITIONS: Record<string, string> = {
  observation: "What can be examined in experience or public evidence.",
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
  const reduceMotion = useReducedMotion();
  const [savedProgress] = useState(readReadingPathProgress);
  const savedPath = savedProgress ? findPath(savedProgress.pathId) : null;
  const savedPosition =
    savedPath && savedProgress
      ? positionOf(savedPath, savedProgress.sectionSlug)
      : -1;
  const savedPathComplete =
    savedPath !== null && savedPosition === savedPath.steps.length - 1;
  const primaryHref =
    savedPath && savedProgress
      ? readingPathHref(savedPath.id, savedProgress.sectionSlug)
      : bookSectionRoute(firstSection);

  return (
    <main id="book-main" className="book-volume w-full pb-24">
      <section
        className="book-volume-hero e-field relative flex min-h-[100svh] items-center overflow-hidden border-b border-[var(--book-hairline)] px-5 py-24 sm:px-8"
        aria-labelledby="book-landing-title"
      >
        <div className="book-cover-threshold-field" aria-hidden="true">
          <BookSubstrate />
        </div>
        <span className="pointer-events-none absolute left-6 top-6 z-10 flex h-9 items-center font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--book-muted)] sm:left-8 sm:top-8">
          E<span className="hidden sm:inline"> · the field of possibility</span>
        </span>

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
            <p className="dot-label text-[var(--book-cinnabar)]">
              Digital Organism Theory · Book One
            </p>
            <h1
              id="book-landing-title"
              className="book-reading-heading mt-5 text-[clamp(2.7rem,5vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.035em] text-[var(--book-ink)]"
            >
              A foundational architecture of reality.
            </h1>
            <p className="book-reading-copy mt-7 max-w-xl text-lg leading-relaxed text-[var(--book-muted)] sm:text-xl">
              DOT begins with consciousness, places physical law and biology as
              downstream layers of a Reality Frame, and follows consequence
              into conditioning and conscious authorship.
            </p>

            <div className="book-volume-position mt-8 grid max-w-xl grid-cols-[auto_minmax(0,1fr)] gap-4 border-y border-[var(--book-hairline)] py-5">
              <span className="dot-label pt-1 text-[var(--book-cinnabar)]">Position</span>
              <p className="book-reading-copy text-base italic leading-relaxed text-[var(--book-ink)]">
                One architecture. Every downstream layer must be derived.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                to={primaryHref}
                className="book-frontispiece-action dot-reading-action group inline-flex min-h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-7 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>
                  {savedPath
                    ? savedPathComplete
                      ? "Review your path"
                      : "Continue reading"
                    : "Begin with the Preface"}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                to={`${DOT_BOOK_ONE_ROUTE}/copy`}
                className="dot-label inline-flex min-h-11 items-center gap-2 text-[var(--book-muted)] transition-colors hover:text-[var(--book-ink)]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                PDF edition
              </Link>
            </div>

            <div className="book-volume-facts mt-8 flex flex-wrap gap-x-7 gap-y-2 dot-label text-[var(--book-muted)]">
              <span>{manifest.extent.chapters} chapters</span>
              <span>{manifest.extent.references} sources</span>
              <span>{manifest.project.author}</span>
            </div>
          </div>
        </motion.div>

        <motion.a
          href="#volume-guide"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 1.2, duration: reduceMotion ? 0 : 0.8 }}
          className="book-volume-scroll absolute bottom-7 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 dot-label text-[var(--book-muted)] transition-colors hover:text-[var(--book-ink)]"
        >
          Read the volume
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </motion.a>
      </section>

      <div className="book-volume-body">
        <motion.section
          id="volume-guide"
          initial={false}
          className="book-volume-guide relative z-10 mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-6 py-20 md:grid-cols-[0.72fr_1.28fr] md:px-8 lg:gap-20 lg:py-28"
          aria-labelledby="volume-guide-title"
        >
          <div>
            <p className="dot-label text-[var(--book-cinnabar)]">Reader contract</p>
            <h2
              id="volume-guide-title"
              className="book-reading-heading mt-4 text-3xl font-medium leading-tight text-[var(--book-ink)] sm:text-4xl"
            >
              Read the claim at the level it earns.
            </h2>
            <p className="book-reading-copy mt-5 text-base leading-relaxed text-[var(--book-muted)]">
              Observation, model, hypothesis, and speculation remain visibly
              distinct throughout the edition.
            </p>
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

        <motion.section
          id="volume-contents"
          initial={false}
          className="book-volume-contents relative z-10 mx-auto max-w-6xl scroll-mt-20 border-y border-[var(--book-hairline)] px-6 py-20 md:px-8 lg:py-28"
          aria-labelledby="book-contents-title"
        >
          <div className="grid gap-8 md:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="dot-label text-[var(--book-cinnabar)]">The complete argument</p>
              <h2 id="book-contents-title" className="book-reading-heading mt-4 text-4xl font-medium leading-tight text-[var(--book-ink)] sm:text-5xl">
                A finite sequence.
              </h2>
              <p className="book-reading-copy mt-5 max-w-sm text-base leading-relaxed text-[var(--book-muted)]">
                Preface, six chapters, and a source record. Nothing autoplays;
                every section has an end.
              </p>
              <p className="dot-label mt-6 text-[var(--book-muted)]">
                {manifest.extent.chapters} chapters · {manifest.extent.references} sources
              </p>
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
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            </div>
          </div>
        </motion.section>

        <section
          className="book-volume-apparatus relative z-10 mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[0.72fr_1.28fr] md:px-8 lg:gap-20 lg:py-28"
          aria-label="A note before reading, and how to cite Book One"
        >
          <div>
            <p className="dot-label text-[var(--book-cinnabar)]">A note before reading</p>
            <Editable
              id="book.care_note"
              as="p"
              multiline
              text="Some of this touches difficult ground — how fear narrows a life, what conditioning costs, and how little of ourselves we chose. Read at your own pace, and set it down when you need to."
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
                Begin where the observer enters.
              </h2>
            </div>
            <Link
              to={bookSectionRoute(firstSection)}
              className="book-frontispiece-action group inline-flex min-h-12 shrink-0 items-center gap-2.5 rounded-full px-7 text-sm font-semibold"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Open the Preface</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
