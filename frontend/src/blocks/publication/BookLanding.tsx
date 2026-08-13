import {
  ArrowRight,
  Download,
  ExternalLink,
  Linkedin,
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
      {/* One quiet opening: the origin, the title, the discipline, one door. */}
      <section className="book-engraved-frontispiece relative flex min-h-[82svh] flex-col items-center justify-center overflow-hidden border-b border-[var(--book-hairline)] px-5 py-12 text-center sm:px-6 sm:py-20">
        <DotEmergenceField className="absolute inset-0" />
        <span className="book-frontispiece-wash absolute inset-0" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="book-frontispiece-copy relative z-10 flex flex-col items-center pt-[64px] sm:pt-[96px]"
        >
          <p className="dot-label">
            {manifest.project.series_title} · Book One
          </p>

          <h1 className="mt-3 text-balance font-serif font-normal leading-[1.08] text-foreground">
            <span className="block text-4xl sm:text-6xl lg:text-7xl">Consciousness</span>
            <span className="mt-2 block text-lg font-normal text-muted-foreground sm:text-xl">
              A Digital Organism
            </span>
          </h1>

          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            title="Henok Ghebrechristos on LinkedIn"
          >
            <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>By {manifest.project.author}</span>
            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
          </a>

          <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-foreground/90 sm:text-xl sm:leading-relaxed">
            DOT models consciousness as a living process: experience changes
            what we carry, consequence teaches, and Love is an epistemic
            necessity—creating the inner freedom to revise what fear would defend.
          </p>
          <p className="mt-3 max-w-xl text-balance text-xs leading-relaxed text-muted-foreground sm:text-sm">
            A construction, not a revelation. We are here to brighten our awareness.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:mt-7">
            <Link
              to={bookSectionRoute(firstSection)}
              className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--organism-accent-strong)] px-5 py-2.5 text-xs font-medium text-background transition-transform active:scale-[0.98]"
            >
              <span>Read the preface</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              to={`${DOT_BOOK_ONE_ROUTE}/copy`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Digital PDF</span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── 1. The Spine (Contents) ─────────────────────────────────── */}
      {/* Primary reading doorway: clean table of contents with reading times */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl px-6 pt-20"
        aria-labelledby="book-contents-title"
      >
        <h2 id="book-contents-title" className="scroll-mt-24 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--book-muted)]">
          Contents
        </h2>
        <ol className="mt-8 border-t border-[var(--book-hairline)]">
          {manifest.sections.map((section) => (
            <li key={section.id}>
              <Link
                to={bookSectionRoute(section)}
                className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-[var(--book-hairline)] px-2 py-5 transition-colors hover:bg-[var(--book-vellum)] sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-6"
              >
                <span className="col-span-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--book-muted)] sm:col-span-1">
                  {sectionLabel(section)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="book-reading-heading block text-lg font-medium text-[var(--book-ink)] transition-colors group-hover:text-[var(--book-cinnabar)]">
                    {section.title}
                  </span>
                  <span className="book-reading-copy mt-1 block text-sm leading-relaxed text-[var(--book-muted)]">
                    {sectionSummary(section)}
                  </span>
                </span>
                <span className="shrink-0 pt-1 font-mono text-[11px] tabular-nums text-[var(--book-muted)] sm:pt-0">
                  {section.reading_time_minutes} min
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </motion.section>

      {/* ── 2. Reading Paths ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-24 max-w-4xl px-6"
        aria-labelledby="reading-paths-title"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--book-muted)]">
          Two ways into one book
        </p>
        <h3 id="reading-paths-title" className="book-reading-heading mt-3 scroll-mt-24 text-2xl font-semibold text-[var(--book-ink)] sm:text-3xl">
          Start with your life, or start with the architecture.
        </h3>
        <div className="mt-6 border-t border-[var(--book-hairline)]">
          {READING_PATHS.map((path) => (
            <Link
              key={path.id}
              to={`${DOT_BOOK_ONE_ROUTE}/${path.steps[0].slug}?path=${path.id}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-[var(--book-hairline)] px-2 py-5 transition-colors hover:bg-[var(--book-vellum)] sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto] sm:items-center sm:px-3"
            >
              <span className="book-reading-heading text-lg font-semibold text-[var(--book-ink)] group-hover:text-[var(--book-cinnabar)]">
                {path.label}
              </span>
              <span className="book-reading-copy col-span-2 text-sm leading-relaxed text-[var(--book-muted)] sm:col-span-1">
                {path.purpose}
              </span>
              <span className="col-start-2 row-start-1 flex items-center gap-2 self-center font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--book-muted)] sm:col-start-3">
                About {path.minutes} min
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* ── 3. Claim Contract & Seams ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mx-auto mt-24 max-w-4xl px-6"
        aria-labelledby="claim-contract-title"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--book-cinnabar)]">
          An argument with its seams showing
        </p>
        <h3
          id="claim-contract-title"
          className="book-reading-heading mt-3 scroll-mt-24 text-2xl font-semibold leading-tight text-[var(--book-ink)] sm:text-3xl"
        >
          Four levels of certainty. Kept separate.
        </h3>
        <p className="book-reading-copy mt-2 text-sm leading-relaxed text-[var(--book-muted)]">
          The practical architecture can be examined now. The stronger cosmological claims remain open to criticism and revision.
        </p>

        <div className="mt-6 grid gap-4 border-y border-[var(--book-hairline)] py-6 sm:grid-cols-2">
          {claimLevels.map((level, index) => (
            <div key={level} className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] text-[var(--book-cinnabar)]">
                0{index + 1}
              </span>
              <div>
                <span className="font-semibold text-[var(--book-ink)] text-sm">{level}: </span>
                <span className="text-xs text-[var(--book-muted)]">
                  {CLAIM_DEFINITIONS[level.toLowerCase()] ?? "Named confidence level."}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 border-l-2 border-[var(--book-hairline)] pl-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <Editable
            id="book.care_note"
            as="p"
            multiline
            text="Some of this touches difficult ground — how fear narrows a life, what conditioning costs, and how little of ourselves we chose. Read at your own pace, and set it down when you need to."
            className="book-reading-copy block max-w-xl italic leading-relaxed text-[var(--book-muted)]"
          />
          <Link
            to="/doctrine/limits-and-debts"
            className="shrink-0 font-medium text-[var(--book-muted)] underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-ink)]"
          >
            Read the open questions
          </Link>
        </div>
      </motion.section>
    </main>
  );
}
