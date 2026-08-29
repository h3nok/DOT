import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  FilePenLine,
  Library,
  List,
  Loader2,
  Maximize2,
  MessageCircleQuestion,
  Minimize2,
  X,
} from "lucide-react";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
import PrivateReaderNote from "../../attention-os/reader/PrivateReaderNote";
import { useReadingFocus } from "../../attention-os/reader/useReadingFocus";
import {
  findPath,
  nextStep,
  positionOf,
  previousStep,
  type ReadingPath,
} from "../../attention-os/reader/readingPaths";
import { saveReadingPathProgress } from "../../attention-os/reader/readingPathProgress";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  fetchDotBookOneManifest,
  fetchDotBookOneSection,
  groupBookSectionsByPart,
  parseBookReferences,
  type BookReference,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { bookConceptsForSection } from "../../content/publications/dotBookConcepts";
import { AppearanceControl } from "../../organism";
import BookCitation from "./BookCitation";
import BookLanding from "./BookLanding";
import { TwinSurface } from "../../dot/TwinSurface";
import { useAuth } from "../../dot/useAuth";
import type { AgentWorkspaceRequest } from "../../dot/AgentWorkspace";

function sectionLabel(section: BookReleaseSection): string {
  if (section.kind === "chapter") return `Chapter ${section.number}`;
  if (section.kind === "preface") return "Preface";
  return "Notes and sources";
}

/**
 * The label a contents entry needs *beside* its title, or null when the title
 * and the part heading already say it.
 *
 * A chapter carries its number in the gutter, so "Chapter 3" stacked above
 * "Architecture of Continuity" spends a line restating what the number gives.
 * References was worse than redundant: the part heading read "Notes and
 * Sources", the label read "Notes and sources", and the title read
 * "References" — one section announcing itself three times, in two casings.
 *
 * The Preface keeps its label. "The Observer Belongs in the Inquiry" is a good
 * title and says nothing about where in the book a reader would be standing.
 */
function contentsLabel(section: BookReleaseSection): string | null {
  return section.kind === "preface" ? "Preface" : null;
}

/**
 * "17 min" — what a chapter costs, said before it is entered.
 *
 * `reading_time_minutes` has been on every section all along and the contents
 * ignored it, so a reader learned a chapter's length only after committing to
 * it. Here that matters more than usual: The Painting runs 6,327 words against
 * the Preface's 1,368, and nothing in the list let you see it coming. Showing
 * the cost up front is L2 — everything has a natural end — applied to the act
 * of choosing rather than to the act of reading.
 */
function readingCost(section: BookReleaseSection): string | null {
  const minutes = section.reading_time_minutes;
  if (typeof minutes !== "number" || minutes < 1) return null;
  return `${Math.round(minutes)} min`;
}

function conceptLabel(concept: string): string {
  return concept
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function citedReferenceCount(content: string): number {
  return new Set(
    Array.from(content.matchAll(/#reference-(\d+)/g), (match) => match[1]),
  ).size;
}

function LoadingState() {
  return (
    <div
      className="book-surface min-h-screen bg-background text-foreground"
      aria-live="polite"
    >
      <header className="appearance-ui-chrome book-chrome h-16 border-b border-[var(--book-hairline)]">
        <div className="mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8">
          <span className="book-dot-link inline-flex items-center gap-2 text-xs font-medium">
            <span className="book-dot-link-mark" aria-hidden="true" />
            DOT · Book One
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[720px] px-5 py-16 sm:px-8 sm:py-24">
        <p className="dot-label text-[var(--book-cinnabar)]">Digital edition</p>
        <h1 className="book-reading-heading mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Consciousness
        </h1>
        <p className="book-reading-copy mt-3 text-lg text-muted-foreground">
          A Digital Organism
        </p>
        <div className="mt-12 flex items-center gap-3 border-y border-[var(--book-hairline)] py-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
          Opening the current edition…
        </div>
      </main>
    </div>
  );
}

function BookContents({
  manifest,
  currentSlug,
  path,
  onNavigate,
}: {
  manifest: DotBookOneManifest;
  currentSlug?: string;
  path?: ReadingPath | null;
  onNavigate?: () => void;
}) {
  const groups = groupBookSectionsByPart(manifest.sections);

  return (
    <nav aria-label="Book contents" className="book-contents">
      {groups.map((group) => (
        <section key={group.part}>
          {/* The part names the structure; the chapters are the content. This
              heading was set in cinnabar over muted titles, which gave the
              louder voice to the smaller idea. */}
          <h2 className="dot-label dot-micro book-contents__part">{group.part}</h2>
          <ol>
            {group.sections.map((section) => {
              const active = section.slug === currentSlug;
              const sectionRoute = bookSectionRoute(section);
              const destination =
                path && positionOf(path, section.slug) >= 0
                  ? `${sectionRoute}?path=${path.id}`
                  : sectionRoute;
              const label = contentsLabel(section);
              const cost = readingCost(section);
              return (
                <li key={section.id}>
                  <Link
                    to={destination}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className="book-contents__entry"
                    data-active={active ? "true" : undefined}
                  >
                    {/* One marker, not two. Every entry carried a left rule and
                        the active one a filled panel as well; a number is the
                        better mark because it also says where you are. */}
                    <span className="book-contents__marker" aria-hidden="true">
                      {section.kind === "chapter" ? section.number : ""}
                    </span>
                    <span className="book-contents__body">
                      {label && (
                        <span className="book-contents__label">{label}</span>
                      )}
                      <span className="book-contents__title">
                        {section.title}
                      </span>
                      {cost && (
                        <span className="book-contents__cost">{cost}</span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </nav>
  );
}

function BookReader({
  manifest,
  section,
  content,
  onOpenMinty,
  companionOpen,
  focusMode,
  path,
  references,
}: {
  manifest: DotBookOneManifest;
  section: BookReleaseSection;
  content: string;
  onOpenMinty: (request?: AgentWorkspaceRequest) => void;
  companionOpen: boolean;
  focusMode: boolean;
  path: ReadingPath | null;
  references: ReadonlyMap<number, BookReference>;
}) {
  const bySlug = (slug: string | undefined) =>
    slug ? (manifest.sections.find((entry) => entry.slug === slug) ?? null) : null;

  const index = manifest.sections.findIndex((candidate) => candidate.id === section.id);

  // A chosen path reorders the encounter; without one the book's own order stands.
  const previous = path
    ? bySlug(previousStep(path, section.slug)?.slug)
    : index > 0
      ? manifest.sections[index - 1]
      : null;
  const next = path
    ? bySlug(nextStep(path, section.slug)?.slug)
    : index < manifest.sections.length - 1
      ? manifest.sections[index + 1]
      : null;

  const step = (target: BookReleaseSection) =>
    path ? `${bookSectionRoute(target)}?path=${path.id}` : bookSectionRoute(target);
  const sourceCount = citedReferenceCount(content);
  const pathPosition = path ? positionOf(path, section.slug) : -1;
  const readingPosition = pathPosition >= 0 ? pathPosition + 1 : index + 1;
  const readingTotal = pathPosition >= 0 ? path?.steps.length ?? 1 : manifest.sections.length;
  const readingProgress = Math.max(
    0,
    Math.min(100, (readingPosition / readingTotal) * 100),
  );
  const readingSequenceLabel = pathPosition >= 0 && path ? path.label : "Complete edition";

  return (
    <>
      <div
        className="book-reading-grid mx-auto grid w-full px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:justify-center"
        data-layout={focusMode ? "focus" : companionOpen ? "companion" : "reader"}
      >
        <article id="book-main" className="book-reader min-w-0">
          {/* Everything between a chapter's title and its first sentence is
              competing with the act of starting to read.
             
              This carried the chapter number, the part, the word count and the
              reading time — each of which the contents rail now states — above
              a progress bar reading "Complete edition · 2 / 8" while the rail
              said "Chapter 1". Both were true (chapter 1 is the second section)
              and they read as a contradiction.
             
              What is left is what a reader opening a chapter actually needs:
              which chapter, how long it will take, and the title. */}
          <header className="book-chapter-header">
            <div className="book-chapter-header__meta flex flex-wrap items-center justify-center gap-x-4 gap-y-1 dot-label text-[var(--book-muted)]">
              <span className="text-[var(--book-cinnabar)]">{sectionLabel(section)}</span>
              <span aria-hidden="true">/</span>
              <span>About {section.reading_time_minutes} min</span>
            </div>
            <h1 className="book-reading-heading mx-auto mt-6 max-w-2xl text-balance text-4xl font-medium leading-[1.06] tracking-[-0.025em] text-foreground sm:text-5xl">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="book-reading-copy mx-auto mt-5 max-w-2xl text-balance text-xl italic leading-relaxed text-muted-foreground">
                {section.subtitle}
              </p>
            )}
            {/* Only on a curated path. Following one is the case where position
                is genuinely not obvious — the rail lists the whole book, not
                the route the reader chose through it. On the complete edition
                the rail already says where you are, and a second counter that
                numbers sections while the rail numbers chapters only invites
                the reader to reconcile them. */}
            {pathPosition >= 0 && path && (
              <div className="book-reading-progress mt-8">
                <div className="mb-2 flex items-center justify-between gap-4 dot-label">
                  <span>{readingSequenceLabel}</span>
                  <span className="tabular-nums">
                    {readingPosition} / {readingTotal}
                  </span>
                </div>
                <div
                  className="h-0.5 overflow-hidden rounded-full bg-[var(--book-hairline)]"
                  role="progressbar"
                  aria-label={`${readingSequenceLabel}, section ${readingPosition} of ${readingTotal}`}
                  aria-valuemin={1}
                  aria-valuemax={readingTotal}
                  aria-valuenow={readingPosition}
                >
                  <span
                    className="block h-full rounded-full bg-[var(--book-cinnabar)] transition-[width] duration-500 ease-out"
                    style={{ width: `${readingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </header>

          <BookMarkdown
            content={content}
            concepts={bookConceptsForSection(section)}
            references={references}
            variant={section.kind === "references" ? "references" : "chapter"}
          />

          <footer className="book-coda book-focus-hidden print:hidden">
            {section.kind === "references" && (
              <div className="book-coda__completion">
                <div className="flex items-start gap-3">
                  <span className="book-coda__completion-mark">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h2 className="book-reading-heading text-xl text-foreground">
                      You have reached the end of this edition.
                    </h2>
                    <p className="book-reading-copy mt-1 text-sm leading-relaxed text-muted-foreground">
                      The reading path stops here. Return to the book when you
                      are ready; nothing will begin automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reaching the end of a chapter should first reveal the next
                deliberate move. The optional apparatus follows it, so the
                reader can finish without walking through a small dashboard. */}
            <nav
              aria-label="Chapter navigation"
              className="book-coda__navigation"
            >
              {previous ? (
                <Link
                  to={step(previous)}
                  className="book-coda__previous group"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                  <span>
                    <span className="dot-label dot-micro">Previous</span>
                    <span className="mt-1 block text-sm font-normal leading-tight text-muted-foreground">
                      {previous.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}

              {next ? (
                <Link
                  to={step(next)}
                  className="book-coda__next group"
                >
                  <span>
                    <span className="dot-label dot-micro">
                      {path ? path.label : "Continue"}
                    </span>
                    <span className="mt-1 block text-base font-semibold leading-tight text-foreground">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--organism-accent-strong)] transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  to={DOT_BOOK_ONE_ROUTE}
                  className="book-coda__next group"
                >
                  Return to the book
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </nav>

            {/* Moved out from between the title and the first sentence. A
                reader arriving at a chapter is trying to start, and a toolbar
                there is something to get past first. Minty stays one click away
                in the header throughout, so nothing became harder to reach — it
                simply stopped standing in the doorway. */}
            <nav
              aria-label="Reading tools"
              className="book-coda__tools"
            >
              <button
                type="button"
                onClick={() => onOpenMinty()}
                className="book-coda__tool book-coda__tool--primary"
              >
                <span className="book-coda__tool-mark">
                  <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <strong>Ask about this chapter</strong>
                  <small>Open Minty with this chapter in context.</small>
                </span>
              </button>
              <Link
                to={`${DOT_BOOK_ONE_ROUTE}/references${path ? `?path=${path.id}` : ""}`}
                className="book-coda__tool"
              >
                <span className="book-coda__tool-mark">
                  <Library className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>
                  <strong>
                    {sourceCount > 0
                      ? `${sourceCount} ${sourceCount === 1 ? "note" : "notes"}`
                      : "Notes & sources"}
                  </strong>
                  <small>Review the evidence and source record.</small>
                </span>
              </Link>
            </nav>

            <PrivateReaderNote
              key={section.slug}
              storageId={`${manifest.release.id}.${section.slug}`}
            />

            {section.related_concepts.length > 0 ? (
              <section
                className="book-coda__section"
                aria-labelledby="book-related-concepts-title"
              >
                <header className="book-coda__section-heading">
                  <h2
                    id="book-related-concepts-title"
                    className="book-coda__section-title"
                  >
                    Related concepts
                  </h2>
                  <p className="book-coda__section-purpose">
                    Terms this chapter develops or depends on.
                  </p>
                </header>

                <div className="book-coda__section-body">
                  <div className="book-coda__concepts">
                    {section.related_concepts.map((concept) => (
                      <Link
                        key={concept}
                        to={`/doctrine/${encodeURIComponent(concept)}`}
                        className="book-coda__concept"
                      >
                        {conceptLabel(concept)}
                      </Link>
                    ))}
                  </div>
                  <Link to="/doctrine" className="book-coda__text-link">
                    Explore the complete concept graph
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </section>
            ) : null}

            <BookCitation manifest={manifest} section={section} />
          </footer>
        </article>

      </div>
    </>
  );
}

export default function BookOnePage() {
  const { sectionSlug } = useParams<{ sectionSlug?: string }>();
  const location = useLocation();
  // A reader who chose a path keeps it while they walk it.
  const activePath = useMemo(
    () => findPath(new URLSearchParams(location.search).get("path") ?? ""),
    [location.search],
  );
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion() ?? false;
  const { isOwner } = useAuth();
  const [manifest, setManifest] = useState<DotBookOneManifest | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);
  const readingFocus = useReadingFocus();
  const [references, setReferences] = useState<Map<number, BookReference>>(new Map());
  // Minty stays one door away while you read — the field-state surface, opened
  // from the chrome, never a widget floating over the text.
  const [mintyOpen, setMintyOpen] = useState(false);
  const [mintyRequest, setMintyRequest] = useState<
    (AgentWorkspaceRequest & { id: number }) | null
  >(null);
  const contentsPanelRef = useRef<HTMLElement | null>(null);
  const contentsReturnFocusRef = useRef<HTMLElement | null>(null);

  const openContents = () => {
    contentsReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setContentsOpen(true);
  };

  const closeContents = () => setContentsOpen(false);

  const enterFocusMode = async () => {
    setContentsOpen(false);
    setMintyOpen(false);
    await readingFocus.enter();
  };

  const exitFocusMode = () => readingFocus.exit();

  const openMinty = (request?: AgentWorkspaceRequest) => {
    if (request) {
      setMintyRequest({ ...request, id: Date.now() });
    }
    setMintyOpen(true);
  };

  const section = useMemo(
    () =>
      sectionSlug
        ? manifest?.sections.find((candidate) => candidate.slug === sectionSlug)
        : undefined,
    [manifest, sectionSlug],
  );

  useEffect(() => {
    if (!activePath || !sectionSlug) return;
    saveReadingPathProgress(activePath.id, sectionSlug);
  }, [activePath, sectionSlug]);

  useEffect(() => {
    const abort = new AbortController();
    fetchDotBookOneManifest(abort.signal)
      .then((nextManifest) => {
        setManifest(nextManifest);
        setError(null);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") {
          setError(reason.message || "The book release could not be loaded.");
        }
      });
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const referencesSection = manifest?.sections.find(
      (candidate) => candidate.kind === "references",
    );
    if (!referencesSection) return;

    const abort = new AbortController();
    fetchDotBookOneSection(referencesSection, abort.signal)
      .then((markdown) => setReferences(parseBookReferences(markdown)))
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setReferences(new Map());
      });
    return () => abort.abort();
  }, [manifest]);

  useEffect(() => {
    if (!manifest || !sectionSlug) {
      setContent(null);
      return;
    }
    if (!section) {
      setError("This section is not part of the current edition.");
      return;
    }

    const abort = new AbortController();
    setContent(null);
    fetchDotBookOneSection(section, abort.signal)
      .then((nextContent) => {
        setContent(nextContent);
        setError(null);
      })
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") {
          setError(reason.message || "The section could not be loaded.");
        }
      });
    return () => abort.abort();
  }, [manifest, section, sectionSlug]);

  useEffect(() => {
    if (!manifest) return;
    const title = section
      ? `${section.title} — ${manifest.project.title}`
      : `${manifest.project.title} — ${manifest.project.author}`;
    document.title = title;
  }, [manifest, section]);

  useEffect(() => {
    if (!sectionSlug) {
      const frame = window.requestAnimationFrame(() => {
        const target = location.hash
          ? document.getElementById(location.hash.slice(1))
          : null;
        if (target) {
          target.scrollIntoView({ block: "start", behavior: "auto" });
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!content) {
      return;
    }
    const target = location.hash
      ? document.getElementById(location.hash.slice(1))
      : null;
    if (target) {
      target.scrollIntoView({ block: "start", behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [content, location.hash, manifest, sectionSlug]);

  useEffect(() => {
    if (!contentsOpen) return;

    const previousOverflow = document.body.style.overflow;
    const returnFocus = contentsReturnFocusRef.current;
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContentsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const panel = contentsPanelRef.current;
      if (!panel) return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleDialogKeys);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeys);
      returnFocus?.focus();
    };
  }, [contentsOpen]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
        <p className="max-w-md text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => navigate(DOT_BOOK_ONE_ROUTE)}
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4"
        >
          Return to the book
        </button>
      </div>
    );
  }

  if (!manifest || (sectionSlug && !content)) return <LoadingState />;

  return (
    // Docking means the page gives up the width, not that Minty is laid over
    // it. Without this inset the sidecar is a fixed panel the reading column
    // knows nothing about: the two only cleared each other at exactly 1440px,
    // and at every narrower width the panel covered the ends of the lines.
    // The width comes from the panel itself via `--minty-sidecar-width`, so
    // widening the dock moves the page in the same gesture; it is 0 when Minty
    // is closed and below `lg`, where the panel covers the page instead.
    <div
      className="book-surface min-h-screen bg-background text-foreground transition-[padding] duration-200"
      data-book-focus={readingFocus.active ? "true" : "false"}
      style={{ paddingRight: "var(--minty-sidecar-width)" }}
    >
      <a
        href="#book-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to book
      </a>
      {section ? (
        <header className="appearance-ui-chrome book-chrome book-focus-hidden sticky top-0 z-30 print:hidden">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="book-dot-link group inline-flex min-w-0 items-center gap-2.5 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="book-dot-link-mark" aria-hidden="true" />
              <span className="truncate">Book One</span>
              <span className="hidden text-[var(--book-hairline)] sm:inline" aria-hidden="true">/</span>
              <span className="hidden max-w-52 truncate text-muted-foreground sm:inline lg:max-w-72">
                {section.title}
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {isOwner && (
                <Link
                  to="/studio"
                  className="appearance-ui-control book-chrome-action hidden h-9 items-center gap-2 border border-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
                  title="Open publication studio"
                >
                  <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
                  Studio
                </Link>
              )}
              <button
                type="button"
                onClick={openContents}
                aria-haspopup="dialog"
                aria-label="Open book contents"
                title="Open book contents"
                className="appearance-ui-control book-chrome-action inline-flex h-9 items-center gap-2 border border-transparent px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Contents</span>
              </button>
              <AppearanceControl placement="inline" />
              <button
                type="button"
                onClick={() => void enterFocusMode()}
                title="Read in fullscreen focus mode — press F"
                aria-label="Enter fullscreen reading mode. Keyboard shortcut: F"
                className="appearance-ui-control book-chrome-action inline-flex h-9 w-9 items-center justify-center border border-transparent text-muted-foreground transition-colors hover:text-foreground"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => openMinty()}
                title="Ask Minty about what you're reading"
                aria-label="Ask Minty about this book"
                className="appearance-ui-control book-chrome-action inline-flex h-9 items-center gap-1.5 border border-transparent px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
              >
                <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Ask Minty</span>
              </button>
            </div>
          </div>
        </header>
      ) : (
        // The cover is the whole page: its controls float instead of sitting in a bar.
        <div className="book-focus-hidden fixed right-6 top-6 z-30 flex h-9 items-center gap-1 rounded-full border border-[var(--book-hairline)] bg-[color-mix(in_oklch,var(--book-paper)_78%,transparent)] px-1.5 backdrop-blur-md print:hidden sm:right-8 sm:top-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>DOT</span>
          </Link>
          <AppearanceControl placement="inline" />
          {isOwner && (
            <Link
              to="/studio"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              title="Open publication studio"
            >
              <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Studio</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => openMinty()}
            title="Ask Minty about this book"
            aria-label="Ask Minty about this book"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ask Minty</span>
          </button>
        </div>
      )}

      {section && content ? (
        <BookReader
          manifest={manifest}
          section={section}
          content={content}
          onOpenMinty={openMinty}
          companionOpen={mintyOpen}
          focusMode={readingFocus.active}
          path={activePath}
          references={references}
        />
      ) : (
        <BookLanding manifest={manifest} />
      )}

      {readingFocus.active && section ? (
        <button
          type="button"
          onClick={() => void exitFocusMode()}
          title="Leave fullscreen reading mode — press F or Escape"
          aria-label="Exit fullscreen reading mode. Keyboard shortcut: F or Escape"
          className="book-focus-exit fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center border border-[var(--book-hairline)] bg-background/90 text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:text-foreground sm:right-6 sm:top-6"
        >
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      {contentsOpen && (
        <div className="book-contents-overlay fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close contents"
            tabIndex={-1}
            onClick={closeContents}
            className="absolute inset-0 bg-background/68 backdrop-blur-sm"
          />
          <aside
            ref={contentsPanelRef}
            className="appearance-ui-panel book-contents-dialog relative h-full w-full max-w-md overflow-y-auto border-l px-6 py-7 sm:px-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-contents-title"
          >
            <div className="mb-9 flex items-start justify-between border-b border-[var(--book-hairline)] pb-6">
              <div>
                <p className="dot-label text-[var(--book-cinnabar)]">Book One</p>
                <h2
                  id="book-contents-title"
                  className="book-reading-heading mt-2 text-3xl font-medium text-foreground"
                >
                  The argument
                </h2>
                <p className="book-reading-copy mt-2 text-sm text-muted-foreground">
                  A finite edition. Choose a section deliberately.
                </p>
              </div>
              <button
                type="button"
                onClick={closeContents}
                aria-label="Close contents"
                autoFocus
                className="rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <BookContents
              manifest={manifest}
              currentSlug={section?.slug}
              path={activePath}
              onNavigate={closeContents}
            />
          </aside>
        </div>
      )}

      {/* Minty, from within the book — a sidecar beside the text, so the passage
          stays in view while you consult it. */}
      <AnimatePresence>
        {mintyOpen && (
          <TwinSurface
            variant="sidecar"
            reducedMotion={reducedMotion}
            initialRequest={mintyRequest}
            // Asking from inside a chapter is asking about it. Without this the
            // reader's "what is this about?" reaches Minty as a sentence with
            // nothing in it to search for.
            reading={
              section ? { section: section.slug, title: section.title } : null
            }
            onClose={() => setMintyOpen(false)}
            onOpenNode={() => setMintyOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
