import {
  ArrowRight,
  BookOpen,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { siteConfig } from "../../content/site.config";
import { Editable } from "../../content/editable";
import BookCitation from "./BookCitation";
import DotEmergenceField from "./DotEmergenceField";

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

export default function BookLanding({ manifest }: { manifest: DotBookOneManifest }) {
  const firstSection = manifest.sections[0];
  const claimLevels = manifest.reader_contract.claim_levels;

  return (
    <main id="book-main" className="w-full pb-24">
      {/* ── Frontispiece ─────────────────────────────────────────────── */}
      <section className="book-engraved-frontispiece relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden border-b border-[var(--book-hairline)] px-5 py-8 text-center sm:px-6 sm:py-16">
        <DotEmergenceField className="absolute inset-0" />
        <span className="book-frontispiece-wash absolute inset-0" aria-hidden="true" />

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="book-frontispiece-copy relative z-10 flex w-full max-w-3xl flex-col items-center pt-4 sm:pt-14"
        >
          <h1 className="text-balance font-serif font-normal leading-[1.04] text-foreground">
            <span className="block text-5xl sm:text-6xl lg:text-7xl">Consciousness</span>
            <span className="mt-3 block text-xl font-normal text-muted-foreground sm:text-2xl">
              A Digital Organism
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-balance font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
            A life is shaped, acts, and is shaped again.
          </p>

          <div className="mt-10 mx-auto grid max-w-lg gap-0 text-left">
            {[
              { step: "Shaped", line: "You were shaped before you could choose." },
              { step: "Filtered", line: "What you carry shapes what you see." },
              { step: "Acted", line: "What you do meets consequence." },
              { step: "Changed", line: "Consequence changes what you carry." },
            ].map(({ step, line }, i) => (
              <div key={step} className="flex items-baseline gap-3 border-l-2 border-[var(--book-hairline)] py-2 pl-4">
                <span className="dot-label shrink-0 tabular-nums text-[var(--book-cinnabar)]">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-foreground/85 sm:text-base">
                  <span className="font-semibold text-foreground">{step}.</span> {line}
                </p>
              </div>
            ))}
            <div className="ml-4 mt-1">
              <span className="dot-label text-[var(--book-cinnabar)]">↩ The loop begins again</span>
            </div>
          </div>
          <p className="mt-6 max-w-lg text-balance text-center text-sm leading-relaxed text-muted-foreground/80 sm:text-base">
            DOT asks whether this repeating process belongs to a larger living
            architecture of consciousness — and whether understanding it can give
            us more freedom in how we live.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            <Link
              to={bookSectionRoute(firstSection)}
              className="book-frontispiece-action group inline-flex min-h-11 items-center gap-2 px-6 py-3 text-sm font-semibold"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>Begin with the preface</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#ways-in"
              className="book-frontispiece-secondary-action inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline decoration-1 underline-offset-4"
            >
              <span>Choose another entrance</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <Link
              to={`${DOT_BOOK_ONE_ROUTE}/copy`}
              className="book-frontispiece-download-action inline-flex min-h-11 items-center gap-1.5 text-sm font-medium"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>PDF edition</span>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-[var(--book-hairline)] pt-4 text-muted-foreground">
            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="dot-label inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              {manifest.project.author}
            </a>
            <span className="dot-label opacity-40" aria-hidden="true">·</span>
            <span className="dot-label">
              v{manifest.release.version} · A construction, not a revelation
            </span>
          </div>
        </motion.div>
      </section>

      {/* ── 2. Reading Paths ────────────────────────────────────────── */}
      <motion.section
        id="ways-in"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto scroll-mt-24 max-w-4xl px-6 pt-20"
        aria-labelledby="reading-paths-title"
      >
        <p className="dot-label text-[var(--book-muted)]">
          Choose your entrance
        </p>
        <h2 id="reading-paths-title" className="book-reading-heading mt-3 text-3xl font-semibold text-[var(--book-ink)] sm:text-4xl">
          One book. Two honest ways in.
        </h2>
        <p className="book-reading-copy mt-3 max-w-2xl text-base leading-relaxed text-[var(--book-muted)]">
          The text does not change. Only the order of encounter does. Every path
          is finite and ends in the sources.
        </p>
        <div className="mt-8 border-t border-[var(--book-hairline)]">
          {READING_PATHS.map((path) => (
            <Link
              key={path.id}
              to={`${DOT_BOOK_ONE_ROUTE}/${path.steps[0].slug}?path=${path.id}`}
              className="book-reading-path group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-[var(--book-hairline)] px-2 py-6 transition-colors hover:bg-[var(--book-vellum)] sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)_auto] sm:items-center sm:px-3"
            >
              <span className="book-reading-heading text-xl font-semibold text-[var(--book-ink)] group-hover:text-[var(--book-cinnabar)]">
                {path.label}
              </span>
              <span className="book-reading-copy col-span-2 text-sm leading-relaxed text-[var(--book-muted)] sm:col-span-1">
                {path.purpose}
              </span>
              <span className="col-start-2 row-start-1 flex items-center gap-2 self-center dot-label text-[var(--book-muted)] sm:col-start-3">
                {path.minutes} min
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── 3. The Spine (Contents) ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-24 max-w-4xl px-6"
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
        <ol className="mt-8 border-t border-[var(--book-hairline)]">
          {manifest.sections.map((section) => (
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
      </motion.section>

      {/* ── 4. Claim Contract ───────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-24 max-w-4xl px-6"
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
      <section className="mx-auto mt-20 max-w-4xl px-6 pb-8">
        <BookCitation manifest={manifest} section={null} />
      </section>
    </main>
  );
}
