import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Compass,
  ExternalLink,
  Library,
  Linkedin,
  List,
  Loader2,
  MessageCircleQuestion,
  NotebookPen,
  Sparkles,
  X,
} from "lucide-react";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
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
  parseBookReferences,
  type BookReference,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import { siteConfig } from "../../content/site.config";
import { AppearanceControl } from "../../organism";
import BookLanding from "./BookLanding";
import ExperienceLoop from "./ExperienceLoop";
import { TwinSurface } from "../../dot/TwinSurface";

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

const PRACTICE_PROMPTS: Record<string, string> = {
  preface:
    "Name one belief you protect as identity. What evidence would you permit to revise it?",
  "the-digital-organism":
    "Notice one moment when new information changes your state. What persists, and what adapts?",
  "the-decoupling-principle":
    "Before one ordinary action, notice the intention, the body's execution, and the consequence as separate events.",
  "architecture-of-continuity":
    "Across one change today, ask what continuity you are preserving and what the change is teaching you.",
  "reality-frames":
    "Choose one environment you inhabit. List one constraint, one consequence, and one real possibility it permits.",
  "the-canvas":
    "When a strong response appears, distinguish the bodily signal from the interpretation already painted onto it.",
  "the-painting":
    "Find one inherited conclusion in a recurring reaction. What wider choice becomes possible once you can see it?",
  references:
    "Choose one source that matters to the argument and read beyond the citation before deciding what it supports.",
};

function citedReferenceCount(content: string): number {
  return new Set(
    Array.from(content.matchAll(/#reference-(\d+)/g), (match) => match[1]),
  ).size;
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
          <h2 className="mb-2 dot-label">
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
  onOpenMinty,
  path,
  references,
}: {
  manifest: DotBookOneManifest;
  section: BookReleaseSection;
  content: string;
  onOpenMinty: () => void;
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
  const practicePrompt = PRACTICE_PROMPTS[section.slug] ?? PRACTICE_PROMPTS.preface;

  return (
    <>
      <div className="mx-auto grid w-full max-w-[88rem] gap-10 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[230px_minmax(0,700px)] lg:justify-center lg:gap-14 xl:grid-cols-[230px_minmax(0,700px)_220px] xl:gap-12">
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Book overview
            </Link>
            <BookContents manifest={manifest} currentSlug={section.slug} />
          </div>
        </aside>

        <article id="book-main" className="book-reader min-w-0">
          <div className="mb-8 lg:hidden">
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Overview
            </Link>
          </div>

          <header className="book-chapter-header border-b pb-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="dot-label">
                {sectionLabel(section)} · {section.part}
              </p>
              <p className="dot-label">
                {formatWordCount(section.word_count)} words · about{" "}
                {section.reading_time_minutes} min
              </p>
            </div>
            <h1 className="book-reading-heading mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="book-reading-copy mt-4 text-xl italic leading-relaxed text-muted-foreground">
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

          <div className="book-reader-quick-tools flex items-center gap-1 border-b border-[var(--book-hairline)] py-3 xl:hidden">
            <button
              type="button"
              onClick={onOpenMinty}
              className="inline-flex min-h-10 items-center gap-2 px-2 text-xs font-semibold text-foreground transition-colors hover:text-[var(--book-cinnabar)]"
            >
              <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
              Ask Minty
            </button>
            <span className="h-5 w-px bg-border/60" aria-hidden="true" />
            <a
              href="#section-practice"
              className="inline-flex min-h-10 items-center gap-2 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <NotebookPen className="h-4 w-4" aria-hidden="true" />
              Practice
            </a>
            <span className="h-5 w-px bg-border/60" aria-hidden="true" />
            <Link
              to="/book/digital-organism-theory/references"
              className="inline-flex min-h-10 items-center gap-2 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Library className="h-4 w-4" aria-hidden="true" />
              {sourceCount > 0 ? `${sourceCount} sources` : "Sources"}
            </Link>
          </div>

          <BookMarkdown
            content={content}
            references={references}
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
              <div className="mb-8 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.03] p-6">
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

            <div id="section-practice" className="book-reflection mb-10 scroll-mt-24 border-y px-1 py-8 sm:py-10">
              <p className="dot-label">
                Practice the frame
              </p>
              <h2 className="book-reading-heading mt-3 max-w-xl text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                {practicePrompt}
              </h2>
              <p className="book-reading-copy mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                Treat this as observation, not a test you can fail. The framework
                becomes useful when it changes what you can notice and choose.
              </p>
            </div>

            {section.related_concepts.length > 0 ? (
              <div className="mb-10 border-b border-border/60 pb-8">
                <p className="dot-label">
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

            <a
              href={siteConfig.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
              Henok Ghebrechristos · author profile and résumé
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </footer>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-8 border-l border-[var(--book-hairline)] pl-6">
            <section>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--book-cinnabar)]">
                Reading companion
              </p>
              <p className="book-reading-copy mt-3 text-sm leading-relaxed text-muted-foreground">
                Keep the claim boundary intact. Open a citation without losing
                your place, or ask Minty to trace the passage through Book One.
              </p>
              <button
                type="button"
                onClick={onOpenMinty}
                className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-foreground underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-[var(--book-cinnabar)]"
              >
                <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
                Ask Minty
              </button>
            </section>

            <section className="border-t border-[var(--book-hairline)] pt-6">
              <p className="dot-label">
                Evidence trail
              </p>
              <p className="book-reading-heading mt-3 text-lg text-foreground">
                {sourceCount > 0
                  ? `${sourceCount} external ${sourceCount === 1 ? "source" : "sources"} cited here`
                  : "No external sources cited in this section"}
              </p>
              <Link
                to="/book/digital-organism-theory/references"
                className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-foreground"
              >
                <Library className="h-3.5 w-3.5" aria-hidden="true" />
                Open Notes and Sources
              </Link>
            </section>

            <section className="border-t border-[var(--book-hairline)] pt-6">
              <p className="dot-label">
                Try it
              </p>
              <p className="book-reading-copy mt-3 text-base italic leading-relaxed text-[var(--book-ink)]">
                {practicePrompt}
              </p>
              <a
                href="#section-practice"
                className="mt-3 inline-flex text-xs text-muted-foreground underline decoration-[var(--book-hairline)] underline-offset-4 transition-colors hover:text-foreground"
              >
                Carry this into practice
              </a>
            </section>
          </div>
        </aside>
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
  const [references, setReferences] = useState<Map<number, BookReference>>(new Map());
  // Minty stays one door away while you read — the field-state surface, opened
  // from the chrome, never a widget floating over the text.
  const [mintyOpen, setMintyOpen] = useState(false);
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

  const section = useMemo(
    () =>
      sectionSlug
        ? manifest?.sections.find((candidate) => candidate.slug === sectionSlug)
        : undefined,
    [manifest, sectionSlug],
  );

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
    // Matches the sidecar's own `lg:w-[26rem]` — change them together.
    <div
      className={`book-surface min-h-screen bg-background text-foreground transition-[padding] duration-200 ${
        mintyOpen ? "lg:pr-[26rem]" : ""
      }`}
    >
      <a
        href="#book-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to book
      </a>
      <header className="book-chrome sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="book-dot-link inline-flex items-center gap-2 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="book-dot-link-mark" aria-hidden="true" />
            <span>DOT</span>
          </Link>
          <div className="flex items-center gap-3">
            <AppearanceControl />
            <button
              type="button"
              onClick={() => setMintyOpen(true)}
              title="Ask Minty about what you're reading"
              aria-label="Ask Minty about this book"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Ask Minty
            </button>
            {section ? (
              <button
                type="button"
                onClick={openContents}
                className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:invisible"
              >
                <List className="h-3.5 w-3.5" />
                Contents
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {section && content ? (
        <BookReader
          manifest={manifest}
          section={section}
          content={content}
          onOpenMinty={() => setMintyOpen(true)}
          path={activePath}
          references={references}
        />
      ) : (
        <BookLanding manifest={manifest} />
      )}

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
            onClose={() => setMintyOpen(false)}
            onOpenNode={() => setMintyOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
