import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  List,
  Loader2,
  X,
} from "lucide-react";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
import {
  DOT_BOOK_ONE_ROUTE,
  bookSectionRoute,
  fetchDotBookOneManifest,
  fetchDotBookOneSection,
  groupBookSectionsByPart,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../../content/publications/dotBookOne";

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

function BookLanding({ manifest }: { manifest: DotBookOneManifest }) {
  const firstSection = manifest.sections[0];
  const groups = groupBookSectionsByPart(manifest.sections);

  return (
    <main
      id="book-main"
      className="mx-auto w-full max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <section className="grid items-center gap-14 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--organism-accent-strong)] shadow-[0_0_22px_var(--organism-accent-soft)]" />
              {manifest.project.series_title}
            </span>
            <span className="rounded-full border border-border/60 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {manifest.release.label}
            </span>
          </div>

          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Book One · Chapters 1–{manifest.extent.chapters}
          </p>
          <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl">
            {manifest.project.title}
          </h1>
          <p className="mt-6 text-base text-muted-foreground">
            By {manifest.project.author}
          </p>

          <blockquote className="mt-10 max-w-2xl border-l border-[var(--organism-accent-soft)] pl-6 font-serif text-xl leading-relaxed text-foreground/80 sm:text-2xl">
            “I offer DOT as a construction, not a revelation.”
          </blockquote>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to={bookSectionRoute(firstSection)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--organism-accent-soft)] bg-foreground/[0.07] px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.11]"
            >
              Begin with the preface
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/doctrine"
              className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              Open the companion concept graph
            </Link>
          </div>
        </div>

        <aside className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
          <span
            className="absolute h-[88%] w-[88%] rounded-full border border-[var(--organism-accent-soft)] opacity-30"
            aria-hidden="true"
          />
          <span
            className="absolute h-[62%] w-[62%] rounded-full border border-border/60"
            aria-hidden="true"
          />
          <div className="relative flex h-44 w-44 flex-col items-center justify-center rounded-full border border-[var(--organism-accent-soft)] bg-background/70 text-center shadow-[0_0_80px_var(--organism-accent-soft)] backdrop-blur-xl">
            <span className="h-4 w-4 rounded-full bg-[var(--organism-accent-strong)]" />
            <span className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              The observer
            </span>
            <span className="mt-1 font-serif text-lg text-foreground">
              belongs inside
            </span>
          </div>
        </aside>
      </section>

      <section className="mt-24 grid gap-8 border-y border-border/60 py-10 md:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            The epistemic contract
          </p>
          <p className="mt-3 max-w-sm font-serif text-2xl leading-snug text-foreground">
            Feeling must be treated as data, but feeling is not automatically
            truth.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-4">
          {manifest.reader_contract.claim_levels.map((level) => (
            <div key={level} className="bg-background px-4 py-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {level}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20" aria-labelledby="contents-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Finite reading path
            </p>
            <h2
              id="contents-title"
              className="mt-2 font-serif text-4xl font-semibold text-foreground"
            >
              Contents
            </h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {formatWordCount(manifest.extent.words)} words ·{" "}
            {manifest.extent.equations} equations ·{" "}
            {manifest.extent.references} sources
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          {groups.map((group) => (
            <section key={group.part}>
              <h3 className="mb-3 border-b border-border/60 pb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {group.part}
              </h3>
              <ol className="space-y-2">
                {group.sections.map((section) => (
                  <li key={section.id}>
                    <Link
                      to={bookSectionRoute(section)}
                      className="group flex items-start justify-between gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-foreground/[0.04]"
                    >
                      <span>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                          {sectionLabel(section)}
                        </span>
                        <span className="mt-1 block font-serif text-lg leading-tight text-foreground group-hover:text-[var(--organism-accent-strong)]">
                          {section.title}
                        </span>
                      </span>
                      <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function BookReader({
  manifest,
  section,
  content,
  onOpenContents,
}: {
  manifest: DotBookOneManifest;
  section: BookReleaseSection;
  content: string;
  onOpenContents: () => void;
}) {
  const index = manifest.sections.findIndex((candidate) => candidate.id === section.id);
  const previous = index > 0 ? manifest.sections[index - 1] : null;
  const next = index < manifest.sections.length - 1 ? manifest.sections[index + 1] : null;

  return (
    <>
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[260px_minmax(0,760px)] lg:justify-center lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <Link
              to={DOT_BOOK_ONE_ROUTE}
              className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <BookOpen className="h-3.5 w-3.5" />
              About this edition
            </Link>
            <BookContents manifest={manifest} currentSlug={section.slug} />
          </div>
        </aside>

        <article id="book-main" className="min-w-0">
          <button
            type="button"
            onClick={onOpenContents}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <List className="h-3.5 w-3.5" />
            Contents
          </button>

          <header className="border-b border-border/60 pb-10">
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
            <div className="mt-7 flex flex-wrap gap-2">
              {manifest.reader_contract.claim_levels.map((level) => (
                <span
                  key={level}
                  className="rounded-full border border-border/50 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {level}
                </span>
              ))}
            </div>
          </header>

          <BookMarkdown content={content} />

          <footer className="border-t border-border/60 pt-8">
            {section.kind === "references" && (
              <div className="mb-8 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.03] p-6">
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

            <div className="flex items-stretch justify-between gap-4">
              {previous ? (
                <Link
                  to={bookSectionRoute(previous)}
                  className="group flex max-w-[48%] items-center gap-3 rounded-2xl border border-border/60 px-4 py-4 text-left transition-colors hover:bg-foreground/[0.04]"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
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
                  to={bookSectionRoute(next)}
                  className="group flex max-w-[48%] items-center justify-end gap-3 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.04] px-4 py-4 text-right transition-colors hover:bg-foreground/[0.08]"
                >
                  <span>
                    <span className="block font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
                      Continue
                    </span>
                    <span className="mt-1 block text-sm font-semibold leading-tight text-foreground">
                      {next.title}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <Link
                  to={DOT_BOOK_ONE_ROUTE}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.04] px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.08]"
                >
                  Return to the book
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}

export default function BookOnePage() {
  const { sectionSlug } = useParams<{ sectionSlug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<DotBookOneManifest | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);

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
    if (!content || !sectionSlug) {
      if (!sectionSlug) window.scrollTo({ top: 0, behavior: "auto" });
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
  }, [content, location.hash, sectionSlug]);

  useEffect(() => {
    if (!contentsOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setContentsOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
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
    <div className="book-surface min-h-screen bg-background text-foreground">
      <a
        href="#book-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to book
      </a>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Stay
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
          {section ? (
            <button
              type="button"
              onClick={() => setContentsOpen(true)}
              className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground lg:invisible"
            >
              <List className="h-3.5 w-3.5" />
              Contents
            </button>
          ) : (
            <span className="w-14" aria-hidden="true" />
          )}
        </div>
      </header>

      {section && content ? (
        <BookReader
          manifest={manifest}
          section={section}
          content={content}
          onOpenContents={() => setContentsOpen(true)}
        />
      ) : (
        <BookLanding manifest={manifest} />
      )}

      {contentsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="book-contents-title"
        >
          <button
            type="button"
            aria-label="Close contents"
            onClick={() => setContentsOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <aside className="relative h-full w-full max-w-sm overflow-y-auto border-l border-border/60 bg-background px-6 py-7 shadow-2xl">
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
                onClick={() => setContentsOpen(false)}
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
              onNavigate={() => setContentsOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
