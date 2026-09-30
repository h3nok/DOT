import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { BookMarkdown } from "../../attention-os/reader";
import { author, authorContact } from "../../content/author";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import {
  ESSAYS_ROUTE,
  fetchEssayIndex,
  fetchEssayText,
  formatEssayDate,
  type EssaySummary,
} from "../../content/essays/essays";
import { bookConceptDefinitions } from "../../content/publications/dotBookConcepts";
import { DOT_BOOK_ONE_ROUTE } from "../../content/publications/dotBookOne";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { ClaimLevels } from "./ClaimLevels";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

// The reader's own measure (Appearance panel), shared with Book One.
const COLUMN: CSSProperties = { maxWidth: "var(--reading-measure)" };

type EssayState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "failed" }
  | { status: "ready"; essay: EssaySummary; text: string };

/**
 * One essay, read in the Reader primitive (P2) with Book One's type and
 * concept definitions.
 *
 * It ends where the text ends: the concepts it builds on, a way to object, and
 * the way back. No "read next", no related rail (L2, L3).
 */
export default function EssayPage() {
  const { slug = "" } = useParams();
  const [state, setState] = useState<EssayState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    Promise.all([fetchEssayIndex(controller.signal), fetchEssayText(slug, controller.signal)])
      .then(([essays, text]) => {
        const essay = essays.find((candidate) => candidate.slug === slug);
        setState(essay && text !== null ? { status: "ready", essay, text } : { status: "missing" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [slug]);

  const title = state.status === "ready" ? state.essay.title : null;
  useEffect(() => {
    document.title = title ? `${title} — ${author.name}` : `Essays — ${author.name}`;
  }, [title]);

  return (
    <PageShell
      header={<PageHeader backTo={ESSAYS_ROUTE} backLabel="Essays" />}
      footer={<SiteColophon />}
    >
      {state.status === "loading" && (
        <p className="mx-auto text-sm text-muted-foreground" style={COLUMN} role="status">
          Loading the essay…
        </p>
      )}
      {state.status === "missing" && (
        <Notice title="No essay has this address.">
          The link may be incomplete, or the essay is not published.{" "}
          <Link to={ESSAYS_ROUTE} className={LINK}>
            See every essay
          </Link>
          .
        </Notice>
      )}
      {state.status === "failed" && (
        <Notice title="The essay could not be loaded.">Try again in a moment.</Notice>
      )}
      {state.status === "ready" && <Essay essay={state.essay} text={state.text} />}
    </PageShell>
  );
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

function Essay({ essay, text }: { essay: EssaySummary; text: string }) {
  const contact = authorContact();
  const concepts = essay.concepts.flatMap((id) => {
    const node = doctrineNodes.find((candidate) => candidate.id === id);
    return node ? [node] : [];
  });

  return (
    <article className="book-surface mx-auto" style={COLUMN}>
      <header>
        <p className="dot-label">
          Essay · <time dateTime={essay.published}>{formatEssayDate(essay.published)}</time>
          {" · "}
          {essay.readingMinutes} min read
        </p>
        <h1 className="dot-page-heading mt-4 text-balance">{essay.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{essay.summary}</p>
        <ClaimLevels levels={essay.levels} className="mt-5" />
        {essay.updated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Revised <time dateTime={essay.updated}>{formatEssayDate(essay.updated)}</time>
          </p>
        )}
      </header>

      <BookMarkdown content={text} concepts={bookConceptDefinitions(essay.concepts)} />

      <footer className="border-t border-border/60 pt-10">
        <p className="dot-label">End of essay</p>

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
          <Link to={ESSAYS_ROUTE} className={`inline-flex items-center gap-2 ${LINK}`}>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All essays
          </Link>
          <Link to={DOT_BOOK_ONE_ROUTE} className={`inline-flex items-center gap-2 ${LINK}`}>
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Book One
          </Link>
        </nav>
      </footer>
    </article>
  );
}
