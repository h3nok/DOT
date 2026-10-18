import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";

import { BookMarkdown } from "../../attention-os/reader";
import { author, authorContact } from "../../content/author";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import {
  fetchEssayIndex,
  fetchEssayText,
  formatEssayDate,
  type EssaySummary,
  ESSAY_FORMAT_LABELS,
} from "../../content/essays/essays";
import { bookConceptDefinitions } from "../../content/publications/dotBookConcepts";
import { DOT_BOOK_ONE_ROUTE } from "../../content/publications/dotBookOne";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { ClaimLevels } from "./ClaimLevels";
import { PublicationSharing } from "../publication/components/PublicationSharing";
import AMM from "../../content/amm.json";
import { AmmShell } from "../amm/AmmIdentity";
import { AmmEditionEnd, AmmReadingBar } from "../amm/AmmEditionFrame";
import { fetchReleasedWriting } from "../../services/OrchestratorWritingService";
import { managedEssay, replacesEssay } from "../publication/writing/publicationBridge";
import NativeWritingPage from "../publication/NativeWritingPage";
import MOVES from "../../content/essays/moves.json";
import { OwnerEditLink } from "../publication/components/OwnerEditLink";
import "./essay.css";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

// The reader's own measure (Appearance panel), shared with Book One.
const COLUMN: CSSProperties = { maxWidth: "var(--reading-measure)" };

type EssayState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "failed" }
  | { status: "native"; workId: string }
  | { status: "ready"; essay: EssaySummary; text: string };

/**
 * One essay, read in the Reader primitive (P2) with Book One's type and
 * concept definitions.
 *
 * It ends where the text ends: the concepts it builds on, a way to object, and
 * the way back. No recommended "read next", no related rail (L2, L3). An AMM
 * part names the next part of its manuscript, in the author's fixed order.
 */
export default function EssayPage({ preview = false }: { preview?: boolean }) {
  const { slug = "" } = useParams();
  const { hash } = useLocation();
  // A piece that became part of a chapter keeps its address: it opens at that
  // section, and a deep link to one of its headings keeps its anchor.
  const moved = (MOVES as Record<string, { route: string; anchor: string }>)[slug];
  if (moved) return <Navigate replace to={`${moved.route}${hash || `#${moved.anchor}`}`} />;
  return <EssayContent slug={slug} preview={preview} />;
}

function EssayContent({ slug, preview }: { slug: string; preview: boolean }) {
  const [state, setState] = useState<EssayState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    Promise.all([fetchEssayIndex(controller.signal, preview), fetchEssayText(slug, controller.signal, preview), !preview && managedEssay(slug) ? fetchReleasedWriting(controller.signal, true) : Promise.resolve([])])
      .then(([essays, text, writing]) => {
        if (controller.signal.aborted) return;
        const native = writing.find(entry => replacesEssay(entry, slug));
        if (native) { setState({ status: "native", workId: native.work_id }); return; }
        const essay = essays.find((candidate) => candidate.slug === slug);
        setState(essay && text !== null ? { status: "ready", essay, text } : { status: "missing" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [slug, attempt, preview]);

  useEffect(() => {
    if (!preview) return;
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.append(tag);
    return () => tag.remove();
  }, [preview]);

  const title = state.status === "ready" ? state.essay.title : null;
  const isAmm = state.status === "ready" ? state.essay.series === AMM.series : !!managedEssay(slug);
  useEffect(() => {
    document.title = title ? `${title} — ${isAmm ? AMM.title : author.name}` : `Essays — ${author.name}`;
  }, [title, isAmm]);

  if (state.status === "native") return <NativeWritingPage sourceWorkId={state.workId} sourcePath={`/essays/${slug}`} />;

  return (
    <EssayShell amm={isAmm}>
      {!preview && managedEssay(slug) && <OwnerEditLink to={`/studio/writing?series=amm&source=${encodeURIComponent(slug)}`} label={slug.startsWith("amm-chapter-") ? "Edit this chapter" : "Edit this piece"} />}
      {preview && <aside className="post-preview-note"><strong>Local preview</strong><span>Changes here do not publish the post.</span><Link to="/_preview/essays" className={LINK}>All local posts</Link></aside>}
      {state.status === "loading" && (
        <p className="mx-auto text-sm text-muted-foreground" style={COLUMN} role="status">
          Loading the essay…
        </p>
      )}
      {state.status === "missing" && (
        <Notice title="No essay has this address.">
          The link may be incomplete, or the essay is not published.{" "}
          <Link to="/blog" className={LINK}>
            All writing
          </Link>
          .
        </Notice>
      )}
      {state.status === "failed" && (
        <Notice title="The essay could not be loaded.">
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className={`min-h-11 ${LINK}`}>
            Try again
          </button>
        </Notice>
      )}
      {state.status === "ready" && <Essay essay={state.essay} text={state.text} preview={preview} />}
    </EssayShell>
  );
}

function EssayShell({ amm, children }: { amm: boolean; children: ReactNode }) {
  return amm ? <AmmShell reading>{children}</AmmShell> : <PageShell wide className="essay-page" header={<PageHeader backTo="/blog" backLabel="Blog" />} footer={<SiteColophon />}>{children}</PageShell>;
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto" style={COLUMN}>
      <p className="dot-label">Essays</p>
      <h1 className="dot-page-heading mt-4">{title}</h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Essay({ essay, text, preview }: { essay: EssaySummary; text: string; preview: boolean }) {
  const contact = authorContact();
  const isAmm = essay.series === AMM.series;
  const concepts = essay.concepts.flatMap((id) => {
    const node = doctrineNodes.find((candidate) => candidate.id === id);
    return node ? [node] : [];
  });

  return (
    <article className="book-surface post-article">
      {isAmm && <AmmReadingBar slug={essay.slug} />}
      <header className="post-heading">
        <p className="dot-label post-kicker">
          {ESSAY_FORMAT_LABELS[essay.format ?? "essay"]}
          {essay.series && <><span aria-hidden="true"> · </span><span>{essay.series}</span></>}
        </p>
        <h1 className="post-title">{essay.title}</h1>
        <p className="post-summary">{essay.summary}</p>
        <div className="post-byline">
          <Link to="/about" className={LINK}>{author.name}</Link>
          <span><time dateTime={essay.published}>{formatEssayDate(essay.published)}</time>{" · "}{essay.readingMinutes} min read</span>
        </div>
        <ClaimLevels levels={essay.levels} className="post-claims" />
        {essay.updated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Revised <time dateTime={essay.updated}>{formatEssayDate(essay.updated)}</time>
          </p>
        )}
      </header>

      {essay.cover && <figure className="post-cover">
        <img src={essay.cover.src} alt={essay.cover.alt} width={essay.cover.width} height={essay.cover.height} fetchPriority="high" decoding="async" />
        {essay.cover.caption && <figcaption>{essay.cover.caption}</figcaption>}
      </figure>}

      <div className="post-reading-column">
      <BookMarkdown content={text} concepts={bookConceptDefinitions(essay.concepts)} variant="post" images={essay.images} />

      <footer className="border-t border-border/60 pt-10">
        <p className="dot-label">End of {ESSAY_FORMAT_LABELS[essay.format ?? "essay"].toLowerCase()}</p>

        {isAmm && !preview && <AmmEditionEnd slug={essay.slug} />}

        {concepts.length > 0 && (
          <section aria-labelledby="essay-concepts" className="mt-8">
            <h2 id="essay-concepts" className="text-base font-semibold text-foreground">
              Builds on
            </h2>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed">
              {concepts.map((node) => (
                <li key={node.id}>
                  <Link to={`/doctrine/${node.id}`} className={LINK}>
                    {node.title}
                  </Link>{" "}
                  <span className="text-muted-foreground">— {node.oneLine}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="essay-respond" className="mt-8">
          <h2 id="essay-respond" className="text-base font-semibold text-foreground">
            Respond
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Objections and corrections are welcome. Send them via{" "}
            <a href={contact.href} className={LINK} rel="noreferrer">
              {contact.label}
            </a>
            .
          </p>
        </section>

        <nav
          aria-label="After this essay"
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm"
        >
          <Link to={isAmm ? "/amm/editions" : "/blog"} className={`inline-flex items-center gap-2 ${LINK}`}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {isAmm ? "All AMM editions" : "All writing"}
          </Link>
          {!isAmm && <Link to={DOT_BOOK_ONE_ROUTE} className={`inline-flex items-center gap-2 ${LINK}`}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Book One
          </Link>}
        </nav>
        {!preview && <div className="mt-8">
          <PublicationSharing title={essay.title} path={`/essays/${essay.slug}`} />
        </div>}
      </footer>
      </div>
    </article>
  );
}
