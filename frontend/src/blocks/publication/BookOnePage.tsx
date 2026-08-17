import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ExternalLink,
  Library,
  Linkedin,
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
import { siteConfig } from "../../content/site.config";
import { AppearanceControl } from "../../organism";
import BookCitation from "./BookCitation";
import BookLanding from "./BookLanding";
import { TwinSurface } from "../../dot/TwinSurface";
import type { AgentWorkspaceRequest } from "../../dot/AgentWorkspace";

function sectionLabel(section: BookReleaseSection): string {
  if (section.kind === "chapter") return `Chapter ${section.number}`;
  if (section.kind === "preface") return "Preface";
  return "Notes and sources";
}

function formatWordCount(words: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(words);
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
      <header className="book-chrome h-16 border-b border-[var(--book-hairline)]">
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
    <nav aria-label="Book contents" className="space-y-6">
      {groups.map((group) => (
        <section key={group.part}>
          <h2 className="mb-3 dot-label text-[var(--book-cinnabar)]">
            {group.part}
          </h2>
          <ol className="space-y-0.5">
            {group.sections.map((section) => {
              const active = section.slug === currentSlug;
              const sectionRoute = bookSectionRoute(section);
              const destination =
                path && positionOf(path, section.slug) >= 0
                  ? `${sectionRoute}?path=${path.id}`
                  : sectionRoute;
              return (
                <li key={section.id}>
                  <Link
                    to={destination}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex flex-col rounded-lg border-l-2 px-3 py-2.5 transition-colors ${
                      active
                        ? "border-[var(--book-cinnabar)] bg-foreground/[0.05] text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                    }`}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
                      {sectionLabel(section)}
                    </span>
                    <span className="mt-0.5 text-[13px] font-medium leading-snug">
                      {section.title}
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
        className="book-reading-grid mx-auto grid w-full gap-10 px-5 pb-24 pt-10 sm:px-8 lg:justify-center lg:gap-14"
        data-layout={focusMode ? "focus" : companionOpen ? "companion" : "contents"}
      >
        <aside
          className={
            companionOpen || focusMode ? "hidden" : "book-focus-hidden hidden print:hidden lg:block"
          }
        >
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Book overview
            </Link>
            <BookContents
              manifest={manifest}
              currentSlug={section.slug}
              path={path}
            />
          </div>
        </aside>

        <article id="book-main" className="book-reader min-w-0">
          <div className="book-focus-hidden mb-8 print:hidden lg:hidden">
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Overview
            </Link>
          </div>

          <header className="book-chapter-header border-b pb-9 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              <p className="dot-label">
                {sectionLabel(section)} · {section.part}
              </p>
              <span
                className="hidden h-1 w-1 rounded-full bg-[var(--book-cinnabar)] opacity-55 sm:block"
                aria-hidden="true"
              />
              <p className="dot-label">
                {formatWordCount(section.word_count)} words · about{" "}
                {section.reading_time_minutes} min
              </p>
            </div>
            <h1 className="book-reading-heading mx-auto mt-5 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="book-reading-copy mx-auto mt-4 max-w-2xl text-xl italic leading-relaxed text-muted-foreground">
                {section.subtitle}
              </p>
            )}
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
          </header>

          <nav
            aria-label="Reading tools"
            className="book-focus-hidden book-reader-quick-tools flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-[var(--book-hairline)] bg-foreground/[0.02] px-4 py-3 print:hidden"
          >
            <button
              type="button"
              onClick={() => onOpenMinty()}
              className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-foreground transition-colors hover:text-[var(--book-cinnabar)]"
            >
              <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
              Ask about this chapter
            </button>
            <Link
              to={`${DOT_BOOK_ONE_ROUTE}/references${path ? `?path=${path.id}` : ""}`}
              className="inline-flex min-h-10 items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Library className="h-4 w-4" aria-hidden="true" />
              {sourceCount > 0
                ? `${sourceCount} ${sourceCount === 1 ? "note" : "notes"}`
                : "Notes & sources"}
            </Link>
          </nav>

          <BookMarkdown
            content={content}
            concepts={bookConceptsForSection(section)}
            references={references}
            variant={section.kind === "references" ? "references" : "chapter"}
          />

          <footer className="book-focus-hidden border-t border-border/60 pt-8">
            {section.kind === "references" && (
              <div className="dot-surface mb-8 rounded-xl border border-[var(--organism-accent-soft)] bg-foreground/[0.03] p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--organism-accent-soft)]">
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

            <div className="mb-10">
              <PrivateReaderNote
                key={section.slug}
                storageId={`${manifest.release.id}.${section.slug}`}
              />
            </div>

            {section.related_concepts.length > 0 ? (
              <div className="mb-10 border-b border-border/60 pb-8">
                <p className="dot-label">
                  Related concepts
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                  {section.related_concepts.map((concept) => (
                    <span
                      key={concept}
                      className="book-concept text-sm text-muted-foreground"
                    >
                      {conceptLabel(concept)}
                    </span>
                  ))}
                </div>
                <Link
                  to="/doctrine"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[var(--organism-accent-strong)]"
                >
                  Explore these ideas in the concept graph
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : null}

            <div className="mb-10">
              <BookCitation manifest={manifest} section={section} />
            </div>

            <nav
              aria-label="Chapter navigation"
              className="grid rounded-xl border border-[var(--book-hairline)] overflow-hidden print:hidden sm:grid-cols-2"
            >
              {previous ? (
                <Link
                  to={step(previous)}
                  className="group flex min-h-20 items-center gap-3 border-b px-4 py-4 text-left transition-all hover:bg-foreground/[0.03] sm:border-b-0 sm:border-r sm:border-[var(--book-hairline)]"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                  <span>
                    <span className="dot-label text-muted-foreground">
                      Previous
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-tight text-foreground">
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
                  className="group flex min-h-20 items-center justify-end gap-3 px-4 py-4 text-right transition-all hover:bg-foreground/[0.03]"
                >
                  <span>
                    <span className="dot-label text-muted-foreground">
                      {path ? path.label : "Continue"}
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-tight text-foreground">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  to={DOT_BOOK_ONE_ROUTE}
                  className="inline-flex min-h-20 items-center justify-end gap-2 px-4 py-4 text-sm font-semibold text-foreground transition-all hover:bg-foreground/[0.03]"
                >
                  Return to the book
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </nav>

            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground print:hidden"
            >
              <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
              Henok Ghebrechristos · author profile and résumé
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
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
        <header className="book-chrome book-focus-hidden sticky top-0 z-30 print:hidden">
          <div className="mx-auto grid h-14 max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-8">
            <Link
              to="/"
              className="book-dot-link inline-flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="book-dot-link-mark" aria-hidden="true" />
              <span>DOT</span>
            </Link>
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="hidden truncate text-center font-mono dot-micro uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground md:block"
            >
              Book One · {section.title}
            </Link>
            <div className="flex items-center gap-3 justify-self-end">
              <AppearanceControl placement="inline" />
              <button
                type="button"
                onClick={() => void enterFocusMode()}
                title="Read in fullscreen focus mode"
                aria-label="Enter fullscreen reading mode"
                className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => openMinty()}
                title="Ask Minty about what you're reading"
                aria-label="Ask Minty about this book"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Ask Minty</span>
              </button>
              <button
                type="button"
                onClick={openContents}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:invisible"
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Contents</span>
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
          title="Leave fullscreen reading mode"
          aria-label="Exit fullscreen reading mode"
          className="book-focus-exit fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center border border-[var(--book-hairline)] bg-background/90 text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:text-foreground sm:right-6 sm:top-6"
        >
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}

      {contentsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close contents"
            tabIndex={-1}
            onClick={closeContents}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <aside
            ref={contentsPanelRef}
            className="relative h-full w-full max-w-sm overflow-y-auto border-l border-border/60 bg-background px-6 py-7 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-contents-title"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="dot-label">
                  Finite reading path
                </p>
                <h2
                  id="book-contents-title"
                  className="book-reading-heading mt-1 text-2xl text-foreground"
                >
                  Contents
                </h2>
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
