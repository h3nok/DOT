import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { author } from "../../content/author";
import {
  FEED_URL,
  essayRoute,
  fetchEssayIndex,
  formatEssayDate,
  type EssaySummary,
} from "../../content/essays/essays";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { ClaimLevels } from "./ClaimLevels";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

type IndexState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; essays: EssaySummary[] };

/**
 * Every released essay, newest first (L3: sought, not served).
 *
 * A finite list with a stated end. No ranking, no "popular", no count, and
 * nothing that loads more on scroll.
 */
export default function EssaysPage() {
  const [state, setState] = useState<IndexState>({ status: "loading" });

  useEffect(() => {
    document.title = `Essays — ${author.name}`;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEssayIndex(controller.signal)
      .then((essays) => setState({ status: "ready", essays }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "failed" });
      });
    return () => controller.abort();
  }, []);

  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <div className="mx-auto max-w-3xl">
        <p className="dot-label">Essays</p>
        <h1 className="dot-page-heading mt-4 max-w-2xl">Writing beyond Book One</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Essays develop consequences, interpretations, and new directions outside
          the book's canon. Each one states the claim levels it uses. None of them
          changes Book One, which remains a fixed edition.
        </p>

        {state.status === "loading" && (
          <p className="mt-12 text-sm text-muted-foreground" role="status">
            Loading the essays…
          </p>
        )}

        {state.status === "failed" && (
          <p className="mt-12 text-sm text-muted-foreground" role="alert">
            The list of essays could not be loaded. Try again in a moment.
          </p>
        )}

        {state.status === "ready" && state.essays.length === 0 && (
          <p className="mt-12 text-sm text-muted-foreground">
            No essay has been published yet. To hear when one is,{" "}
            <Link to="/readers" className={LINK}>
              join the reader list
            </Link>
            .
          </p>
        )}

        {state.status === "ready" && state.essays.length > 0 && (
          <>
            <ol aria-label="Essays, newest first" className="mt-12 border-t border-border/70">
              {state.essays.map((essay) => (
                <li key={essay.slug} className="border-b border-border/70 py-8">
                  <p className="dot-label">
                    <time dateTime={essay.published}>{formatEssayDate(essay.published)}</time>
                    {" · "}
                    {essay.readingMinutes} min read
                  </p>
                  <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground">
                    <Link
                      to={essayRoute(essay.slug)}
                      className="transition-colors hover:text-[color:var(--organism-accent-strong)]"
                    >
                      {essay.title}
                    </Link>
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {essay.summary}
                  </p>
                  <ClaimLevels levels={essay.levels} className="mt-4" />
                </li>
              ))}
            </ol>

            <section className="mt-14">
              <h2 className="text-lg font-semibold text-foreground">That is every essay.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                They are listed newest first, and nothing is ranked. To hear when
                there is another,{" "}
                <Link to="/readers" className={LINK}>
                  join the reader list
                </Link>{" "}
                or follow the{" "}
                <a href={FEED_URL} className={LINK}>
                  RSS feed
                </a>
                .
              </p>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
