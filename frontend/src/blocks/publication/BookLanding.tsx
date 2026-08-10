import {
  ArrowRight,
  BookOpen,
  ShoppingBag,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import NucleusMark from "../../dot/NucleusMark";
import BookEditionMap from "./BookEditionMap";
import { BookAction, BookCard } from "./BookPrimitives";
import BookPurchase from "./BookPurchase";
import ExperienceLoop from "./ExperienceLoop";
import { EXPERIENCE_LOOP_STEPS } from "./experienceLoopModel";
import MovementSupportInvitation from "./MovementSupportInvitation";

const FRAMEWORK_VOCABULARY = [
  {
    name: "Big C",
    definition:
      "DOT's central hypothesis: consciousness as a fundamental, self-preserving informational process — the Digital Organism that persisted.",
  },
  {
    name: "Little c",
    definition:
      "The local experiencer: the individuated process that receives experience, forms Intent, participates in action, and changes through consequence.",
  },
  {
    name: "Reality Frame",
    definition:
      "A rule-bound environment in which action meets consequence. The physical universe we inhabit is RF₀.",
  },
  {
    name: "Canvas",
    definition:
      "The persistent capacity to carry forward the effects of experience — the evolving substrate on which tendencies, associations, and expectations accumulate.",
  },
  {
    name: "Painting",
    definition:
      "What has accumulated on the Canvas: the interpretation each new moment is read through. The Canvas carries; the Painting interprets; Character acts.",
  },
];

function formatWordCount(words: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(words);
}

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

function DimensionalBookObject() {
  return (
    <div className="book-hero-stage" aria-hidden="true">
      <div className="book-depth-grid" />
      <div className="book-hero-ring book-hero-ring-outer" />
      <div className="book-hero-ring book-hero-ring-inner" />

      <div className="book-manuscript">
        <div className="book-manuscript-plane">
          <div className="book-manuscript-face">
            <NucleusMark size={142} reducedMotion className="book-manuscript-mark" />
          </div>
        </div>
      </div>

      {EXPERIENCE_LOOP_STEPS.map((step, index) => (
        <span
          key={step.label}
          className={`book-loop-node book-loop-node-${index}`}
          style={{ "--step-color": step.color } as CSSProperties}
        >
          <span className="book-loop-node-orb">
            <step.Icon className="book-loop-node-icon" />
          </span>
          <span className="book-loop-node-text">{step.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function BookLanding({ manifest }: { manifest: DotBookOneManifest }) {
  const firstSection = manifest.sections[0];

  return (
    <main id="book-main" className="w-full pb-24">
      <section className="book-frontispiece relative overflow-hidden border-b border-[var(--book-hairline)] px-5 sm:px-8">
        <div className="book-depth-field" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-3 py-8 sm:min-h-[min(40rem,calc(100svh-8rem))] sm:grid-cols-[minmax(0,0.84fr)_minmax(300px,0.95fr)] sm:items-center sm:gap-8 sm:py-10 md:grid-cols-[minmax(0,0.84fr)_minmax(320px,0.95fr)] md:gap-10 md:py-12 xl:grid-cols-[minmax(0,0.82fr)_minmax(360px,0.95fr)] xl:gap-14">
          <div className="book-hero-copy max-w-xl">
            <div className="book-hero-masthead">
              <span className="book-seal">
                <span className="h-2 w-2 rounded-full bg-[var(--organism-accent-strong)]" />
                {manifest.project.series_title}
              </span>
              <span className="book-label-pill">
                {manifest.release.label}
              </span>
            </div>

            <p className="book-overline">Book One / The Painting and the Painter</p>
            <h1 className="book-hero-title" aria-label={manifest.project.title}>
              <span className="book-hero-title-main" aria-hidden="true">Consciousness</span>
              <span className="book-hero-wordmark" aria-hidden="true">
                <span className="book-hero-title-article">A</span>
                <span className="book-hero-title-digital">Digital</span>
                <span className="book-hero-title-organism">Organism</span>
              </span>
            </h1>
            <p className="book-hero-thesis">
              Love is the condition in which Fear no longer governs you.
            </p>
            <p className="book-hero-sub">
              A framework for consciousness, conditioning, and conscious
              authorship: how a life is painted by experience, and how you move
              from being painted to becoming the painter.
            </p>
            <p className="book-hero-byline">By {manifest.project.author}</p>

            <div className="book-hero-actions mt-7 flex flex-wrap items-center gap-4">
              <BookAction asChild>
                <Link to={bookSectionRoute(firstSection)}>
                  Begin reading
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </BookAction>
              <BookAction asChild variant="secondary">
                <a href="#own-the-edition">
                  Own the edition
                  <ShoppingBag className="h-3.5 w-3.5" />
                </a>
              </BookAction>
            </div>
            <p className="book-hero-assurance">
              Read the complete edition online · No account required
            </p>
          </div>

          <DimensionalBookObject />
        </div>

        <div className="book-edition-ribbon relative z-10 mx-auto grid max-w-7xl grid-cols-3 gap-px overflow-hidden border border-[var(--book-hairline)] bg-[var(--book-hairline)]">
          <div>
            <span>Extent</span>
            <strong>{formatWordCount(manifest.extent.words)} words</strong>
          </div>
          <div>
            <span>Structure</span>
            <strong>{manifest.extent.chapters} chapters</strong>
          </div>
          <div>
            <span>Grounding</span>
            <strong>{manifest.extent.references} sources</strong>
          </div>
        </div>
      </section>

      <BookPurchase />

      <section
        id="book-model"
        className="book-model-threshold mx-auto mt-16 max-w-7xl px-5 sm:px-8"
      >
        <div className="book-model-intro">
          <p className="book-overline">The core model</p>
          <h2 className="book-section-title">
            The Experience Loop
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--book-muted)]">
            Experience does not move straight through us. What we carry shapes
            what we notice; what we do changes what we carry next.
          </p>
        </div>

        <div className="mt-8">
          <ExperienceLoop />
        </div>
      </section>

      <section className="book-vocab-section mx-auto mt-20 max-w-7xl px-5 sm:px-8" aria-labelledby="book-vocab-title">
        <div className="book-section-heading">
          <div>
            <p className="book-overline">01 / Define the terms</p>
            <h2 id="book-vocab-title" className="book-section-title">
              Five words carry the whole framework
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--book-muted)]">
            DOT names its parts exactly, so its claims can be examined rather
            than absorbed. These are the handles the book will use.
          </p>
        </div>

        <dl className="book-vocab-grid">
          {FRAMEWORK_VOCABULARY.map((term, index) => (
            <BookCard key={term.name} asChild variant="accent">
              <div className="book-vocab-term">
                <dt>
                  <span className="book-vocab-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="book-vocab-name">{term.name}</span>
                </dt>
                <dd>{term.definition}</dd>
              </div>
            </BookCard>
          ))}
        </dl>
      </section>

      <section className="book-entry-section mx-auto mt-20 max-w-7xl px-5 sm:px-8">
        <div className="book-section-heading">
          <div>
            <p className="book-overline">02 / Choose an entry</p>
            <h2 className="book-section-title">
              Where do you want to enter?
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--book-muted)]">
            The text is fixed; the door is yours. Start from your own
            conditioning, or from the architecture that explains it.
          </p>
        </div>

        <div className="book-reading-paths grid gap-5 md:grid-cols-2">
          {READING_PATHS.map((path) => (
            <BookCard key={path.id} asChild variant="interactive">
              <Link
                to={`${DOT_BOOK_ONE_ROUTE}/${path.steps[0].slug}?path=${path.id}`}
                className="book-path-card group"
              >
                <header className="book-path-card-head">
                <span className="book-path-card-icon">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3>{path.label}</h3>
                  <p>{path.purpose}</p>
                </div>
                <span className="book-path-card-meta">
                  <strong>{path.minutes}</strong>
                  min
                </span>
                </header>

                <ol className="book-path-card-steps">
                {path.steps.slice(0, 3).map((step, index) => (
                  <li key={step.slug}>
                    <span className="book-path-step-dot">{index + 1}</span>
                    <span className="book-path-step-text">{step.why}</span>
                  </li>
                ))}
                {path.steps.length > 3 && (
                  <li className="book-path-step-more">
                    <span className="book-path-step-dot" aria-hidden="true">
                      ⋮
                    </span>
                    <span className="book-path-step-text">
                      {path.steps.length - 3} more steps to the end
                    </span>
                  </li>
                )}
                </ol>

                <footer className="book-path-card-foot">
                <span>Enter this path</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </footer>
              </Link>
            </BookCard>
          ))}
        </div>
      </section>

      <section className="book-chapter-depth mx-auto mt-20 max-w-7xl px-5 sm:px-8" aria-labelledby="book-argument-title">
        <div className="book-section-heading mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--book-hairline)] pb-6">
          <div>
            <p className="book-overline">03 / Follow the argument</p>
            <h2 id="book-argument-title" className="book-section-title">
              Six chapters, one descent into authorship
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--book-muted)]">
            The structure reads like depth: from method, to architecture, to the
            human capacity to revise the interpreter.
          </p>
        </div>

        <ol className="book-chapter-stack">
          {manifest.sections.map((section, index) => (
            <li key={section.id}>
              <BookCard asChild variant="row">
                <Link to={bookSectionRoute(section)} className="book-chapter-plane">
                  <span className="book-chapter-sequence">{String(index + 1).padStart(2, "0")}</span>
                  <span className="book-chapter-label">{sectionLabel(section)}</span>
                  <strong>{section.title}</strong>
                  <p>{sectionSummary(section)}</p>
                  <ArrowRight className="book-chapter-arrow" aria-hidden="true" />
                </Link>
              </BookCard>
            </li>
          ))}
        </ol>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <BookEditionMap manifest={manifest} />
        <MovementSupportInvitation />
      </div>
    </main>
  );
}
