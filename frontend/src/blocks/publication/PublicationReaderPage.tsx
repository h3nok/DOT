import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  List,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import BookMarkdown from "../../attention-os/reader/BookMarkdown";
import {
  fetchPublicDeliveryManifest,
  fetchSectionBody,
  type PublicationReleaseManifest,
  type PublicationReleaseManifestSection,
} from "../../services/OrchestratorPublicationService";

const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? "https://dotheory.org";

type Manifest = PublicationReleaseManifest;
type Section = PublicationReleaseManifestSection;

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

function sectionSlugOf(section: Section): string {
  return section.meta?.slug ?? slugify(section.title);
}

function sectionLabel(section: Section, index: number): string {
  const kind = section.meta?.kind;
  if (kind === "chapter" && section.meta?.number != null)
    return `Chapter ${section.meta.number}`;
  if (kind === "preface") return "Preface";
  if (kind === "references") return "Notes and sources";
  return `Section ${index + 1}`;
}

function sectionRoute(manifest: Manifest, section: Section): string {
  return `/read/${manifest.project.owner_id}/${manifest.project.slug}/${sectionSlugOf(section)}`;
}

function bookRoute(manifest: Manifest): string {
  return `/read/${manifest.project.owner_id}/${manifest.project.slug}`;
}

function groupByPart(
  sections: Section[],
): Array<{ part: string; sections: Section[] }> {
  const groups = new Map<string, Section[]>();
  for (const section of sections) {
    const part = section.meta?.part ?? "Contents";
    const entries = groups.get(part) ?? [];
    entries.push(section);
    groups.set(part, entries);
  }
  return Array.from(groups, ([part, groupedSections]) => ({
    part,
    sections: groupedSections,
  }));
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value,
  );
}

function LoadingState() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="sr-only">Loading the publication</span>
    </div>
  );
}

function ProvenancePanel({ manifest }: { manifest: Manifest }) {
  const { release, project } = manifest;
  const publishedAt = release.published_at
    ? new Date(release.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const sha = project.meta?.source?.sha256;

  return (
    <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          Sealed release
        </span>
      </div>
      <dl className="mt-4 space-y-2 font-mono text-[11px] text-muted-foreground">
        <div className="flex justify-between gap-4">
          <dt>Version</dt>
          <dd className="text-foreground">v{release.version}</dd>
        </div>
        {publishedAt && (
          <div className="flex justify-between gap-4">
            <dt>Published</dt>
            <dd className="text-foreground">{publishedAt}</dd>
          </div>
        )}
        {sha && (
          <div className="flex justify-between gap-4">
            <dt>Source checksum</dt>
            <dd className="truncate text-foreground" title={sha}>
              {sha.slice(0, 12)}…
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        This edition is immutable. Once published, its text cannot change —
        revisions only ever appear as a new, clearly numbered version.
      </p>
    </div>
  );
}

function ReaderContents({
  manifest,
  currentSlug,
  onNavigate,
}: {
  manifest: Manifest;
  currentSlug?: string;
  onNavigate?: () => void;
}) {
  const groups = groupByPart(manifest.sections);
  let runningIndex = -1;

  return (
    <nav aria-label="Contents" className="space-y-7">
      {groups.map((group) => (
        <section key={group.part}>
          <h2 className="mb-2 dot-label">
            {group.part}
          </h2>
          <ol className="space-y-1">
            {group.sections.map((section) => {
              runningIndex += 1;
              const slug = sectionSlugOf(section);
              const active = slug === currentSlug;
              return (
                <li key={section.id}>
                  <Link
                    to={sectionRoute(manifest, section)}
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
                        {sectionLabel(section, runningIndex)}
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

function ReaderLanding({ manifest }: { manifest: Manifest }) {
  const meta = manifest.project.meta;
  const firstSection = manifest.sections[0];
  const extent = meta?.extent;
  const claims = meta?.reader_contract?.claim_levels ?? [];

  return (
    <main
      id="reader-main"
      className="mx-auto w-full max-w-6xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24"
    >
      <section className="grid gap-14 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
        <div>
          {meta?.series_title && (
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              {meta.series_title}
            </p>
          )}
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-6xl">
            {manifest.project.title}
          </h1>
          {meta?.subtitle && (
            <p className="mt-5 font-serif text-xl italic leading-relaxed text-muted-foreground sm:text-2xl">
              {meta.subtitle}
            </p>
          )}
          {meta?.author && (
            <p className="mt-6 text-sm font-medium text-muted-foreground">
              by <span className="text-foreground">{meta.author}</span>
            </p>
          )}

          {extent && (
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] text-muted-foreground">
              {extent.chapters != null && (
                <div>
                  <dt className="uppercase tracking-[0.16em] opacity-70">
                    Chapters
                  </dt>
                  <dd className="mt-1 text-base text-foreground">
                    {extent.chapters}
                  </dd>
                </div>
              )}
              {extent.words != null && (
                <div>
                  <dt className="uppercase tracking-[0.16em] opacity-70">
                    Words
                  </dt>
                  <dd className="mt-1 text-base text-foreground">
                    {formatNumber(extent.words)}
                  </dd>
                </div>
              )}
              {extent.equations != null && (
                <div>
                  <dt className="uppercase tracking-[0.16em] opacity-70">
                    Equations
                  </dt>
                  <dd className="mt-1 text-base text-foreground">
                    {extent.equations}
                  </dd>
                </div>
              )}
              {extent.references != null && (
                <div>
                  <dt className="uppercase tracking-[0.16em] opacity-70">
                    References
                  </dt>
                  <dd className="mt-1 text-base text-foreground">
                    {extent.references}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {claims.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {claims.map((level) => (
                <span
                  key={level}
                  className="rounded-full border border-border/50 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted-foreground"
                >
                  {level}
                </span>
              ))}
            </div>
          )}

          {firstSection && (
            <Link
              to={sectionRoute(manifest, firstSection)}
              className="group mt-12 inline-flex items-center gap-3 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.04] px-6 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.08]"
            >
              Begin reading
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Finite reading path · nothing plays automatically
          </p>
        </div>

        <aside className="space-y-8">
          <ProvenancePanel manifest={manifest} />
          <ReaderContents manifest={manifest} />
        </aside>
      </section>
    </main>
  );
}

function SectionReader({
  manifest,
  section,
  content,
  onOpenContents,
}: {
  manifest: Manifest;
  section: Section;
  content: string;
  onOpenContents: () => void;
}) {
  const index = manifest.sections.findIndex((c) => c.id === section.id);
  const previous = index > 0 ? manifest.sections[index - 1] : null;
  const next =
    index < manifest.sections.length - 1
      ? manifest.sections[index + 1]
      : null;
  const isLast = next === null;
  const words = section.meta?.word_count;
  const minutes = section.meta?.reading_time_minutes;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-24 pt-10 sm:px-8 lg:grid-cols-[260px_minmax(0,760px)] lg:justify-center lg:gap-16">
      <aside className="hidden lg:block">
        <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
          <Link
            to={bookRoute(manifest)}
            className="mb-7 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" />
            About this edition
          </Link>
          <ReaderContents
            manifest={manifest}
            currentSlug={sectionSlugOf(section)}
          />
        </div>
      </aside>

      <article id="reader-main" className="min-w-0">
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
            <p className="dot-label">
              {sectionLabel(section, index)}
              {section.meta?.part ? ` · ${section.meta.part}` : ""}
            </p>
            {words != null && minutes != null && (
              <p className="dot-label">
                {formatNumber(words)} words · about {minutes} min
              </p>
            )}
          </div>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-5xl">
            {section.title}
          </h1>
          {section.meta?.subtitle && (
            <p className="mt-4 font-serif text-xl italic leading-relaxed text-muted-foreground">
              {section.meta.subtitle}
            </p>
          )}
        </header>

        <BookMarkdown content={content} />

        <footer className="border-t border-border/60 pt-8">
          {isLast && (
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
                    The reading path stops here. Return whenever you are
                    ready; nothing will begin automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-stretch justify-between gap-4">
            {previous ? (
              <Link
                to={sectionRoute(manifest, previous)}
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
                to={sectionRoute(manifest, next)}
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
                to={bookRoute(manifest)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--organism-accent-soft)] bg-foreground/[0.04] px-4 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/[0.08]"
              >
                Return to the edition
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <p className="mt-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
            <Lock className="h-3 w-3" aria-hidden />
            v{manifest.release.version} · immutable release · published{" "}
            {manifest.release.published_at
              ? new Date(manifest.release.published_at).toLocaleDateString()
              : "—"}
          </p>
        </footer>
      </article>
    </div>
  );
}

export default function PublicationReaderPage() {
  const { ownerId, slug, sectionSlug } = useParams<{
    ownerId: string;
    slug: string;
    sectionSlug?: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);

  const section = useMemo(
    () =>
      sectionSlug && manifest
        ? manifest.sections.find((c) => sectionSlugOf(c) === sectionSlug)
        : undefined,
    [manifest, sectionSlug],
  );

  useEffect(() => {
    if (!ownerId || !slug) {
      navigate("/");
      return;
    }
    const abort = new AbortController();
    fetchPublicDeliveryManifest(ownerId, slug, { signal: abort.signal })
      .then((data) => {
        if (data) {
          data.sections.sort((a, b) => a.order - b.order);
          setManifest(data);
          setError(null);
        } else {
          setError("This publication could not be found, or no edition has been released yet.");
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") {
          setError(reason.message || "The publication could not be loaded.");
        }
      });
    return () => abort.abort();
  }, [ownerId, slug, navigate]);

  useEffect(() => {
    if (!manifest || !sectionSlug) {
      setContent(null);
      return;
    }
    if (!section) {
      setError("This section is not part of the current edition.");
      return;
    }
    const ref = section.body_ref;
    if (!ref) {
      setContent("");
      return;
    }
    if (!ref.startsWith("releases/")) {
      setContent(ref);
      return;
    }
    setContent(null);
    fetchSectionBody(ref)
      .then((body) => {
        setContent(body ?? "");
        setError(null);
      })
      .catch(() => setError("The section could not be loaded."));
  }, [manifest, section, sectionSlug]);

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
        <Helmet>
          <title>Not Found · DOT</title>
        </Helmet>
        <p className="max-w-md text-sm text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4"
        >
          Return home
        </button>
      </div>
    );
  }

  if (!manifest || (sectionSlug && content === null)) return <LoadingState />;

  const meta = manifest.project.meta;
  const canonicalBase = `${SITE_URL}/read/${manifest.project.owner_id}/${manifest.project.slug}`;
  const canonicalUrl = section
    ? `${canonicalBase}/${sectionSlugOf(section)}`
    : canonicalBase;
  const pageTitle = section
    ? `${section.title} — ${manifest.project.title}`
    : meta?.author
      ? `${manifest.project.title} — ${meta.author}`
      : manifest.project.title;
  const description = section
    ? `${sectionLabel(section, manifest.sections.indexOf(section))} of "${manifest.project.title}"${meta?.author ? ` by ${meta.author}` : ""}.`
    : `${manifest.project.title}${meta?.subtitle ? ` — ${meta.subtitle}` : ""}. An immutable v${manifest.release.version} edition.`;

  return (
    <div className="book-surface min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="book" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="DOT" />
        {meta?.author && (
          <meta property="book:author" content={meta.author} />
        )}
        {manifest.release.published_at && (
          <meta
            property="article:published_time"
            content={manifest.release.published_at}
          />
        )}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={description} />
      </Helmet>

      <a
        href="#reader-main"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-transparent bg-transparent backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            DOT
          </Link>
          <Link
            to={bookRoute(manifest)}
            className="min-w-0 text-center"
            aria-label="Edition home"
          >
            <span className="block truncate font-serif text-sm font-semibold text-foreground">
              {manifest.project.title}
            </span>
            <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
              {meta?.label ?? `Version ${manifest.release.version}`}
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

      {section && content !== null ? (
        <SectionReader
          manifest={manifest}
          section={section}
          content={content}
          onOpenContents={() => setContentsOpen(true)}
        />
      ) : (
        <ReaderLanding manifest={manifest} />
      )}

      {contentsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reader-contents-title"
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
                <p className="dot-label">
                  Finite reading path
                </p>
                <h2
                  id="reader-contents-title"
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
            <ReaderContents
              manifest={manifest}
              currentSlug={section ? sectionSlugOf(section) : undefined}
              onNavigate={() => setContentsOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
