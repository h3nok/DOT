import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Download,
  Network,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { siteConfig } from "../../content/site.config";
import { Editable } from "../../content/editable";
import { AutomataLoop } from "./AutomataLoop";
import BookCitation from "./BookCitation";
import BookSubstrate from "./BookSubstrate";

/**
 * BookLanding — the frontispiece.
 *
 * Not a landing page about the book: the book's own opening leaf. The origin, the
 * title, its plain-language proposition, and one door in. Below the fold the
 * practical model appears before the claim contract, and the argument ends as a
 * finite spine — a table of contents, not a pitch deck.
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

const CLAIM_DEFINITIONS: Record<string, string> = {
  observation: "What can be examined in experience or public evidence.",
  model: "A representation that makes relationships easier to inspect.",
  hypothesis: "A proposed explanation that still requires stronger tests.",
  speculation: "A possibility kept visible without being presented as fact.",
};

/** The title's first word rotates because the three names share one referent. */
const TITLE_SUBJECTS = ["Consciousness", "You", "Little c"] as const;

function readingPathHref(pathId: string, sectionSlug: string): string {
  return `${DOT_BOOK_ONE_ROUTE}/${sectionSlug}?path=${pathId}`;
}

function pathSectionTitle(
  manifest: DotBookOneManifest,
  sectionSlug: string,
): string {
  const section = manifest.sections.find(
    (candidate) => candidate.slug === sectionSlug,
  );
  if (section?.kind === "preface") return "Preface";
  if (section?.kind === "references") return "Sources";
  if (section) return section.title;

  return sectionSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function BookLanding({ manifest }: { manifest: DotBookOneManifest }) {
  const firstSection = manifest.sections[0];
  const claimLevels = manifest.reader_contract.claim_levels;
  const sectionGroups = groupBookSectionsByPart(manifest.sections);
  const reduceMotion = useReducedMotion();
  const [savedProgress] = useState(readReadingPathProgress);
  const [subjectIndex, setSubjectIndex] = useState(0);
  const subject = reduceMotion ? TITLE_SUBJECTS[0] : TITLE_SUBJECTS[subjectIndex];
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

  useEffect(() => {
    if (reduceMotion) {
      setSubjectIndex(0);
      return;
    }

    const timer = window.setInterval(
      () => setSubjectIndex((index) => (index + 1) % TITLE_SUBJECTS.length),
      3600,
    );
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <main id="book-main" className="w-full pb-24">
      {/* ── Frontispiece: The Codex ─────────────────────────────────── */}
      <section className="book-opening-volume e-field relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden border-b border-[var(--book-hairline)] px-5 py-16">
        {/* One light source behind the architecture, in whichever theme is active */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 52% 42% at 50% 47%, color-mix(in oklch, var(--book-cinnabar) 10%, transparent) 0%, transparent 72%),
              radial-gradient(ellipse 96% 74% at 50% 47%, color-mix(in oklch, var(--book-paper) 94%, var(--foreground)) 0%, var(--book-paper) 78%)
            `,
          }}
          aria-hidden="true"
        />

        {/* Edge vignette, so the cover reads as a bounded object */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 82% 72% at 50% 50%, transparent 45%, color-mix(in oklch, var(--book-paper) 82%, var(--foreground)) 100%)",
          }}
          aria-hidden="true"
        />

        {/* E is not a frame around the book. E is the book's own boundary. */}
        <div className="book-e-boundary" aria-hidden="true">
          <BookSubstrate />
          <span className="book-e-gutter" />
        </div>
        <span className="pointer-events-none absolute left-6 top-6 z-10 flex h-9 items-center font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--book-muted)] sm:left-8 sm:top-8">
          E<span className="hidden sm:inline"> · the field of possibility</span>
        </span>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1, ease: [0.16, 1, 0.3, 1] }}
          className="book-open-spread relative z-10 grid w-full max-w-none items-center gap-8 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-0"
        >
          {/* ── The naming ──────────────────────────────────────────────── */}
          <div className="book-open-spread-copy order-1 flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.span
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.6 }}
              className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--book-muted)]"
            >
              {manifest.project.series_title} · Book One
            </motion.span>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.35, duration: reduceMotion ? 0 : 0.7 }}
              className="mt-4"
            >
              <span className="sr-only">{manifest.project.title}</span>
              <span aria-hidden="true">
                <span className="relative block h-10 w-full">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={subject}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute inset-0 flex items-center justify-center whitespace-nowrap font-mono text-2xl font-semibold uppercase tracking-[0.18em] text-[var(--book-cinnabar)] drop-shadow-[0_0_12px_color-mix(in_oklch,var(--book-cinnabar)_55%,transparent)] sm:text-3xl lg:justify-start lg:text-[2rem]"
                    >
                      {subject}:
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span className="mt-1 block font-serif text-4xl font-medium leading-[1.06] text-[var(--book-ink)] sm:text-5xl lg:text-[3.25rem]">
                  A Digital Organism
                </span>
              </span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.45, duration: reduceMotion ? 0 : 0.6 }}
              className="mt-3 font-serif text-sm italic text-[var(--book-muted)]"
            >
              Three names. One thing.
            </motion.p>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.55, duration: reduceMotion ? 0 : 0.6 }}
              className="mt-6 max-w-md border-l-2 border-[var(--book-cinnabar)] pl-4 text-left font-serif text-lg leading-relaxed text-[var(--book-ink)] sm:text-xl"
            >
              What you are. What shaped you.
              <br />
              What you can still author.
            </motion.p>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.65, duration: reduceMotion ? 0 : 0.6 }}
              className="mt-5 max-w-md text-balance font-serif text-base italic leading-relaxed text-[var(--book-muted)]"
            >
              A life is shaped, acts, and is shaped again.
            </motion.p>

            {/* Action cluster */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.85, duration: reduceMotion ? 0 : 0.6 }}
              className="book-open-spread-actions mt-8 flex flex-col items-center gap-4 sm:flex-row"
            >
              <Link
                to={primaryHref}
                className="book-frontispiece-action dot-reading-action group inline-flex min-h-12 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-7 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] sm:mr-1"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>
                  {savedPath
                    ? savedPathComplete
                      ? "Review your path"
                      : "Continue reading"
                    : "Begin reading"}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>

              <a
                href="#ways-in"
                className="dot-label inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[var(--book-muted)] transition-colors hover:text-[var(--book-ink)] sm:mx-3"
              >
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Entrances</span>
              </a>

              <Link
                to={`${DOT_BOOK_ONE_ROUTE}/copy`}
                className="dot-label inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[var(--book-muted)] transition-colors hover:text-[var(--book-ink)] sm:ml-1"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>PDF edition</span>
              </Link>
            </motion.div>

            {/* Extent, so the cover promises something finite */}
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.95, duration: reduceMotion ? 0 : 0.6 }}
              className="dot-label mt-6 text-[var(--book-muted)]"
            >
              Book One · {manifest.extent.chapters} chapters · {manifest.extent.references}{" "}
              sources
            </motion.p>
          </div>

          {/* ── The architecture ────────────────────────────────────────── */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: reduceMotion ? 0 : 0.6,
              duration: reduceMotion ? 0 : 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="book-open-spread-model order-2 flex w-full justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <AutomataLoop />
          </motion.div>

          {/* Attribution follows the model on small screens, and the title on wide ones. */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduceMotion ? 0 : 1, duration: reduceMotion ? 0 : 0.6 }}
            className="book-open-spread-colophon order-3 mx-auto flex w-full max-w-md flex-col items-center gap-1.5 border-t border-[var(--book-hairline)] pt-4 lg:col-start-1 lg:row-start-2 lg:mx-0 lg:items-start"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 lg:justify-start">
              <a
                href={siteConfig.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--book-ink)] transition-colors hover:text-[var(--book-cinnabar)]"
              >
                {manifest.project.author}
              </a>
              <span className="dot-label text-[var(--book-muted)]">
                {manifest.release.label} · v{manifest.release.version}
              </span>
            </div>
            <p className="font-serif text-sm italic text-[var(--book-muted)]">
              A construction, not a revelation.
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom scroll indicator */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 1.2, duration: reduceMotion ? 0 : 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-[var(--architecture-line)] to-transparent" />
        </motion.div>
      </section>

      <div className="book-landing-body">
        <div className="book-landing-spine" aria-hidden="true">
          <span className="book-landing-spine-stop book-landing-spine-stop--entrance">
            Entry
          </span>
          <span className="book-landing-spine-stop book-landing-spine-stop--structure">
            Structure
          </span>
          <span className="book-landing-spine-stop book-landing-spine-stop--contract">
            Claim
          </span>
          <span className="book-landing-spine-stop book-landing-spine-stop--source">
            Source
          </span>
        </div>

        {/* ── 2. Entrances ───────────────────────────────────────────── */}
        <motion.section
          id="ways-in"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto scroll-mt-24 max-w-3xl px-6 pt-20"
          aria-labelledby="reading-paths-title"
        >
        <p className="dot-label text-[var(--book-muted)]">Choose an entrance</p>
        <h2
          id="reading-paths-title"
          className="mt-2 font-serif text-2xl font-medium text-[var(--book-ink)] sm:text-3xl"
        >
          Read the argument or explore its structure.
        </h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-[1.12fr_0.88fr]">
          <Link
            to={primaryHref}
            className="book-entrance book-entrance--primary group grid min-h-36 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 rounded-lg border p-5 transition-all"
          >
            <span className="book-entrance-icon flex h-9 w-9 items-center justify-center rounded-full border text-[var(--book-cinnabar)]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-lg font-medium text-[var(--book-ink)] group-hover:text-[var(--book-cinnabar)]">
                {savedPath ? "Continue Book One" : "Read Book One"}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-[var(--book-muted)]">
                {savedPath && savedProgress
                  ? savedPathComplete
                    ? "Return to the sources at the end of your saved route."
                    : `${savedPath.label}, section ${savedPosition + 1} of ${savedPath.steps.length}: ${pathSectionTitle(manifest, savedProgress.sectionSlug)}.`
                  : "The complete foundational text, beginning with the Preface."}
              </span>
            </span>
            <ArrowRight className="mt-2 h-4 w-4 text-[var(--book-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--book-cinnabar)]" aria-hidden="true" />
          </Link>

          <Link
            to="/doctrine"
            className="book-entrance book-entrance--secondary group grid min-h-36 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 rounded-lg border p-5 transition-all"
          >
            <span className="book-entrance-icon flex h-9 w-9 items-center justify-center rounded-full border text-[var(--book-cinnabar)]">
              <Network className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-lg font-medium text-[var(--book-ink)] group-hover:text-[var(--book-cinnabar)]">
                Concept Map
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-[var(--book-muted)]">
                Core terms, relationships, and claim boundaries in one explorable view.
              </span>
            </span>
            <ArrowRight className="mt-2 h-4 w-4 text-[var(--book-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--book-cinnabar)]" aria-hidden="true" />
          </Link>
        </div>
        </motion.section>

        {/* ── 3. The Spine (Contents) ─────────────────────────────────── */}
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto mt-24 max-w-4xl px-6"
          aria-labelledby="book-contents-title"
        >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="dot-label text-[var(--book-muted)]">
              The complete argument
            </p>
            <h2 id="book-contents-title" className="book-reading-heading mt-3 scroll-mt-24 text-3xl font-semibold text-[var(--book-ink)] sm:text-4xl">
              Contents
            </h2>
          </div>
          <p className="dot-label text-[var(--book-muted)]">
            {manifest.extent.chapters} chapters · {manifest.extent.references} sources
          </p>
        </div>
          <div className="book-contents-groups mt-9">
            {sectionGroups.map((group, groupIndex) => (
              <section key={group.part} className="book-contents-part">
                <div className="book-contents-part-heading flex items-baseline gap-4">
                  <span className="dot-label tabular-nums text-[var(--book-cinnabar)]">
                    Part {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <h3 className="book-reading-heading text-xl font-medium text-[var(--book-ink)]">
                    {group.part}
                  </h3>
                </div>
                <ol className="mt-4 border-t border-[var(--book-hairline)]">
                  {group.sections.map((section) => (
                    <li key={section.id}>
                      <Link
                        to={bookSectionRoute(section)}
                        className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-[var(--book-hairline)] px-2 py-5 transition-colors hover:bg-[var(--book-vellum)] sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-6"
                      >
                        <span className="col-span-2 dot-label text-[var(--book-muted)] sm:col-span-1">
                          {sectionLabel(section)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="book-reading-heading block text-lg font-medium text-[var(--book-ink)] transition-colors group-hover:text-[var(--book-cinnabar)]">
                            {section.title}
                          </span>
                          <span className="book-reading-copy mt-1 block text-base leading-relaxed text-[var(--book-muted)]">
                            {sectionSummary(section)}
                          </span>
                        </span>
                        <span className="shrink-0 pt-1 dot-label tabular-nums text-[var(--book-muted)] sm:pt-0">
                          {section.reading_time_minutes} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </motion.section>

        {/* ── 4. Claim Contract ───────────────────────────────────────── */}
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto mt-24 max-w-4xl px-6"
          aria-labelledby="claim-contract-title"
        >
        <p className="dot-label text-[var(--book-cinnabar)]">
          How to read the argument
        </p>
        <h3
          id="claim-contract-title"
          className="book-reading-heading mt-3 scroll-mt-24 text-2xl font-semibold leading-tight text-[var(--book-ink)] sm:text-3xl"
        >
          Not every claim carries the same weight.
        </h3>
        <p className="book-reading-copy mt-3 max-w-2xl text-base leading-relaxed text-[var(--book-muted)]">
          Important claims are marked so you can distinguish lived observation
          from working model, hypothesis, and open speculation.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {claimLevels.map((level, index) => (
            <div key={level} className="dot-surface flex gap-3 rounded-xl border border-[var(--book-hairline)] p-4">
              <span className="dot-label shrink-0 tabular-nums text-[var(--book-cinnabar)]">
                0{index + 1}
              </span>
              <div>
                <span className="block text-sm font-semibold text-[var(--book-ink)]">{level}</span>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--book-muted)] sm:text-base">
                  {CLAIM_DEFINITIONS[level.toLowerCase()] ?? "Named confidence level."}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--book-hairline)] bg-foreground/[0.02] p-5">
          <Editable
            id="book.care_note"
            as="p"
            multiline
            text="Some of this touches difficult ground — how fear narrows a life, what conditioning costs, and how little of ourselves we chose. Read at your own pace, and set it down when you need to."
            className="book-reading-copy block max-w-2xl text-sm italic leading-relaxed text-[var(--book-muted)]"
          />
          <Link
            to="/doctrine/limits-and-debts"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--book-muted)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-ink)]"
          >
            Read the open questions
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        </motion.section>

        {/* ── 5. Citing this edition ─────────────────────────────────── */}
        <section className="relative z-10 mx-auto mt-20 max-w-4xl px-6 pb-8">
          <BookCitation manifest={manifest} section={null} />
        </section>

        {/* ── 6. A finite threshold ──────────────────────────────────── */}
        <section
          className="book-landing-end relative z-10 mx-auto mt-16 max-w-3xl px-6 pb-24 text-center"
          aria-labelledby="book-landing-end-title"
        >
          <span className="book-landing-end-mark" aria-hidden="true" />
          <p className="dot-label mt-8 text-[var(--book-cinnabar)]">
            The threshold is complete
          </p>
          <h2
            id="book-landing-end-title"
            className="book-reading-heading mt-3 text-3xl font-semibold text-[var(--book-ink)] sm:text-4xl"
          >
            Begin where the observer enters.
          </h2>
          <p className="book-reading-copy mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--book-muted)]">
            The Preface opens the inquiry by placing subjective experience back
            inside the evidence.
          </p>
          <Link
            to={bookSectionRoute(firstSection)}
            className="book-frontispiece-action group mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-full px-7 text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>Begin with the Preface</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </section>
      </div>
    </main>
  );
}
