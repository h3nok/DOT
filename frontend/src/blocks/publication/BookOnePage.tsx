import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Compass,
  List,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
import ReaderSelectionAction from "../../attention-os/assistant/ReaderSelectionAction";
import type {
  MarginCitation,
  ReaderAgentScope,
} from "../../attention-os/assistant/marginAgent";
import {
  findPath,
  nextStep,
  previousStep,
  type ReadingPath,
} from "../../attention-os/reader/readingPaths";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  fetchDotBookOneManifest,
  fetchDotBookOneSection,
  groupBookSectionsByPart,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import BookLanding from "./BookLanding";
import ExperienceLoop from "./ExperienceLoop";
import MovementSupportInvitation from "./MovementSupportInvitation";

const LumenMargin = lazy(
  () => import("../../attention-os/assistant/LumenMargin"),
);

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

function LoadingState() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="sr-only">Loading the book</span>
    </div>
  );
}

function BookContents({
  manifest,
  currentSlug,
  onNavigate,
}: {
  manifest: DotBookOneManifest;
  currentSlug?: string;
  onNavigate?: () => void;
}) {
  const groups = groupBookSectionsByPart(manifest.sections);

  return (
    <nav aria-label="Book contents" className="space-y-7">
      {groups.map((group) => (
        <section key={group.part}>
          <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {group.part}
          </h2>
          <ol className="space-y-1">
            {group.sections.map((section) => {
              const active = section.slug === currentSlug;
              return (
                <li key={section.id}>
                  <Link
                    to={bookSectionRoute(section)}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      active
                        ? "bg-foreground/[0.07] text-foreground"
                        : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        active
                          ? "bg-[var(--organism-accent-strong)]"
                          : "bg-foreground/20 group-hover:bg-foreground/40"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block font-mono text-[9px] uppercase tracking-[0.16em] opacity-70">
                        {sectionLabel(section)}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium leading-snug">
                        {section.title}
                      </span>
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
  onOpenContents,
  path,
  articleRef,
  readerScope,
  onAskLumen,
}: {
  manifest: DotBookOneManifest;
  section: BookReleaseSection;
  content: string;
  onOpenContents: () => void;
  path: ReadingPath | null;
  articleRef: RefObject<HTMLElement | null>;
  readerScope: ReaderAgentScope;
  onAskLumen: (scope: ReaderAgentScope) => void;
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

  return (
    <>
      <div className="book-reader-layout mx-auto grid w-full max-w-7xl gap-10 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[260px_minmax(0,700px)] lg:justify-center lg:gap-20">
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <Link
              to={DOT_BOOK_ONE_ROUTE + "#edition-map"}
              className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Edition map
            </Link>
            <BookContents manifest={manifest} currentSlug={section.slug} />
          </div>
        </aside>

        <article ref={articleRef} id="book-main" className="book-reader min-w-0">
          <div className="mb-8 flex items-center gap-4 lg:hidden">
            <Link
              to={DOT_BOOK_ONE_ROUTE + "#edition-map"}
              className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Edition map
            </Link>
            <button
              type="button"
              onClick={onOpenContents}
              className="inline-flex min-h-11 items-center gap-2 border-l border-border/60 pl-4 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <List className="h-3.5 w-3.5" />
              Contents
            </button>
          </div>

          <header className="book-chapter-header border-b pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {sectionLabel(section)} · {section.part}
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                {formatWordCount(section.word_count)} words · about{" "}
                {section.reading_time_minutes} min
              </p>
            </div>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="mt-4 font-serif text-xl italic leading-relaxed text-muted-foreground">
                {section.subtitle}
              </p>
            )}
            <Link
              to="/doctrine/limits-and-debts"
              className="mt-7 inline-flex items-center gap-2 border-l-2 border-[var(--book-cinnabar)] pl-3 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Epistemic boundary · claims retain the manuscript's labels
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
            <div className="book-reader-rule mt-8 flex items-center justify-center text-[var(--book-muted)]" aria-hidden="true">
              <Compass className="h-4 w-4" />
            </div>
          </header>

          <BookMarkdown
            content={content}
            afterHeading={
              section.slug === "the-canvas"
                ? {
                    "the-experience-loop": (
                      <div className="book-reader-experience-loop">
                        <ExperienceLoop initialStep="Reality Stream" />
                      </div>
                    ),
                  }
                : undefined
            }
          />

          <footer className="border-t border-border/60 pt-8">
            {section.kind === "references" && (
              <div className="mb-8 rounded-lg border border-[var(--organism-accent-soft)] bg-foreground/[0.03] p-6">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--organism-accent-soft)]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-xl text-foreground">
                      You have reached the end of this edition.
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      The reading path stops here. Return to the book when you
                      are ready; nothing will begin automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {section.kind === "references" && (
              <MovementSupportInvitation compact />
            )}

            <div className="book-reflection mb-10 border-y px-1 py-8 sm:py-10">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Before you continue
              </p>
              <h2 className="mt-3 max-w-xl font-serif text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                What is one idea you want to carry from this section?
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Let the answer settle before choosing the next path.
              </p>
            </div>

            {section.related_concepts.length > 0 ? (
              <div className="mb-10 border-b border-border/60 pb-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  Ideas to carry
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

            <div className="flex items-stretch justify-between gap-4">
              {previous ? (
                <Link
                  to={step(previous)}
                  className="book-path-link group flex max-w-[48%] items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                      Previous
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-tight text-foreground">
                      {previous.title}
                    </span>
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {next ? (
                <Link
                  to={step(next)}
                  className="book-path-link book-path-link-primary group flex max-w-[48%] items-center justify-end gap-3 rounded-lg border px-4 py-4 text-right transition-colors"
                >
                  <span>
                    <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                      {path ? path.label : "Continue"}
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-tight text-foreground">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ) : (
                <Link
                  to={DOT_BOOK_ONE_ROUTE}
                  className="book-path-link book-path-link-primary inline-flex items-center gap-2 rounded-lg border px-4 py-4 text-sm font-semibold text-foreground transition-colors"
                >
                  Return to the book
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </footer>

          <ReaderSelectionAction
            rootRef={articleRef}
            scope={readerScope}
            onAsk={onAskLumen}
          />
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
  const [manifest, setManifest] = useState<DotBookOneManifest | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [marginOpen, setMarginOpen] = useState(false);
  const [marginScope, setMarginScope] = useState<ReaderAgentScope | null>(null);
  const contentsPanelRef = useRef<HTMLElement | null>(null);
  const contentsReturnFocusRef = useRef<HTMLElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);

  const openContents = () => {
    contentsReturnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setContentsOpen(true);
  };

  const closeContents = () => setContentsOpen(false);

  const section = useMemo(
    () =>
      sectionSlug
        ? manifest?.sections.find((candidate) => candidate.slug === sectionSlug)
        : undefined,
    [manifest, sectionSlug],
  );

  const readerScope = useMemo<ReaderAgentScope | null>(() => {
    if (!manifest) return null;
    return {
      releaseId: manifest.release.id,
      editionSlug: manifest.project.slug,
      releaseLabel: `${manifest.release.label} · v${manifest.release.version}`,
      sectionSlug: section?.slug,
      sectionTitle: section?.title,
    };
  }, [manifest, section]);

  const openLumen = (scope: ReaderAgentScope) => {
    setContentsOpen(false);
    setMarginScope(scope);
    setMarginOpen(true);
  };

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

  useEffect(() => {
    if (!marginOpen || !readerScope) return;
    setMarginScope((current) => {
      if (!current) return readerScope;
      if (current.sectionSlug === readerScope.sectionSlug) {
        return { ...readerScope, ...current };
      }
      return readerScope;
    });
  }, [marginOpen, readerScope]);

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
    <div
      className={`book-surface min-h-screen bg-background text-foreground${
        marginOpen ? " book-margin-open" : ""
      }`}
    >
      <a
        href="#book-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to book
      </a>
      <header className="book-chrome sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
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
            className="min-w-0 text-center"
            aria-label="Book home"
          >
            <span className="block truncate font-serif text-sm font-semibold text-foreground">
              {manifest.project.title}
            </span>
            <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
              {manifest.release.label}
            </span>
          </Link>
          <div className="flex items-center justify-end gap-3">
            {readerScope && (
              <button
                type="button"
                onClick={() => openLumen(readerScope)}
                className="book-lumen-trigger"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Lumen
              </button>
            )}
            {section && (
              <button
                type="button"
                onClick={openContents}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Contents</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="book-page-content">
        {section && content && readerScope ? (
          <BookReader
            manifest={manifest}
            section={section}
            content={content}
            onOpenContents={openContents}
            path={activePath}
            articleRef={articleRef}
            readerScope={readerScope}
            onAskLumen={openLumen}
          />
        ) : (
          <BookLanding manifest={manifest} />
        )}
      </div>

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
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  Finite reading path
                </p>
                <h2
                  id="book-contents-title"
                  className="mt-1 font-serif text-2xl text-foreground"
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
              onNavigate={closeContents}
            />
          </aside>
        </div>
      )}

      {marginOpen && marginScope && (
        <Suspense
          fallback={
            <div className="lumen-margin-loading" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Opening Lumen
            </div>
          }
        >
          <LumenMargin
            open={marginOpen}
            scope={marginScope}
            onOpenChange={setMarginOpen}
            onClearSelection={() =>
              setMarginScope((current) =>
                current
                  ? { ...current, selection: undefined }
                  : current,
              )
            }
            onCitation={(citation: MarginCitation) => {
              const locator = citation.locator;
              const targetSection =
                locator && typeof locator.section === "string"
                  ? locator.section
                  : null;
              const targetHeading =
                locator && typeof locator.heading === "string"
                  ? locator.heading
                  : null;
              if (!targetSection) return;
              setMarginOpen(false);
              navigate(
                `${DOT_BOOK_ONE_ROUTE}/${targetSection}${
                  targetHeading ? `#${targetHeading}` : ""
                }`,
              );
              if (targetSection === section?.slug && !targetHeading) {
                window.requestAnimationFrame(() => {
                  window.scrollTo({ top: 0, behavior: "auto" });
                });
              }
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
