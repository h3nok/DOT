import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { author } from "../../content/author";
import newsletter from "../../content/newsletter.json";
import { essayRoute, fetchEssayIndex, formatEssayDate } from "../../content/essays/essays";
import { fetchReleasedWriting, writingRoute } from "../../services/OrchestratorWritingService";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { AppearanceControl } from "../../organism/AppearanceControl";
import { BlogReadingLinks } from "./BlogReadingLinks";
import "./blog.css";

const PAGE_SIZE = 10;
const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

interface Post {
  key: string;
  title: string;
  summary: string;
  /** YYYY-MM-DD */
  date: string;
  href: string;
  note: string | null;
}

type BlogState = { status: "loading" } | { status: "ready"; posts: Post[]; unavailable: string[] };

/**
 * One chronological record of the movement's writing (L2, L3): essays released
 * as files and writing released from the Studio, newest first, in finite pages.
 */
export default function BlogPage() {
  const [state, setState] = useState<BlogState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [params] = useSearchParams();
  const requestedPage = params.get("page") ?? "1";
  const requested = Number(requestedPage);
  const archiveHeading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(requestedPage);

  useEffect(() => {
    if (previousPage.current === requestedPage) return;
    previousPage.current = requestedPage;
    archiveHeading.current?.focus({ preventScroll: true });
    archiveHeading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [requestedPage]);

  useEffect(() => {
    document.title = "Blog — Digital Organism Theory";
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    void Promise.allSettled([
      fetchEssayIndex(controller.signal),
      fetchReleasedWriting(controller.signal),
    ]).then(([essays, writing]) => {
      if (controller.signal.aborted) return;
      const posts: Post[] = [];
      const unavailable: string[] = [];
      if (essays.status === "fulfilled") {
        posts.push(...essays.value.map((essay) => ({
          key: `essay:${essay.slug}`,
          title: essay.title,
          summary: essay.summary,
          date: essay.published,
          href: essayRoute(essay.slug),
          note: `${essay.readingMinutes} min read`,
        })));
      } else unavailable.push("essays");
      if (writing.status === "fulfilled") {
        posts.push(...writing.value.map((entry) => ({
          key: `writing:${entry.work_id}`,
          title: entry.title,
          summary: entry.summary ?? "",
          date: entry.released_at.slice(0, 10),
          href: writingRoute(entry.work_id),
          note: entry.release_number > 1 ? `Version ${entry.release_number}` : null,
        })));
      } else unavailable.push("writing released from the Studio");
      posts.sort((first, second) => second.date.localeCompare(first.date));
      setState({ status: "ready", posts, unavailable });
    });
    return () => controller.abort();
  }, [attempt]);

  const pages = state.status === "ready" ? Math.max(1, Math.ceil(state.posts.length / PAGE_SIZE)) : 1;
  const page = Number.isInteger(requested) && requested >= 1 && requested <= pages ? requested : 1;
  const shown = state.status === "ready" ? state.posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  return (
    <PageShell
      wide
      className="blog-page"
      header={<PageHeader controls={<AppearanceControl placement="inline" />} />}
      footer={<SiteColophon />}
    >
      <header className="blog-masthead">
        <p className="dot-label">Blog</p>
        <h1 className="dot-page-heading blog-title">Essays &amp; letters</h1>
        <div className="blog-introduction">
          <p className="blog-description">
            Essays, analysis and letters that apply Digital Organism Theory to the world.
          </p>
          <p className="blog-byline">By <Link to="/about" className={LINK}>{author.name}</Link></p>
        </div>
      </header>

      <div className="blog-layout">
        <div className="blog-archive">
          <section aria-labelledby="latest-writing">
            <header className="blog-section-heading">
              <h2 id="latest-writing" ref={archiveHeading} tabIndex={-1} className="dot-label">Latest writing</h2>
              <span className="blog-order">Newest first</span>
            </header>

            {state.status === "loading" && (
              <div className="blog-state"><p role="status">Loading the writing…</p></div>
            )}

            {state.status === "ready" && state.unavailable.length > 0 && (
              <div className="blog-state blog-state-error">
                <p role="alert">Some writing could not be loaded.</p>
                <button type="button" onClick={() => setAttempt((value) => value + 1)} className={`min-h-11 ${LINK}`}>
                  Try again <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {state.status === "ready" && state.posts.length === 0 && state.unavailable.length === 0 && (
              <div className="blog-state">
                <p className="blog-state-title">Nothing has been posted here yet.</p>
                <p>New essays and letters will appear here when published.</p>
              </div>
            )}

            {shown.length > 0 && (
              <ol aria-label="Posts, newest first" className="blog-posts">
                {shown.map((post) => (
                  <li key={post.key}>
                    <article className="blog-post">
                      <p className="blog-post-meta">
                        <time dateTime={post.date}>{formatEssayDate(post.date)}</time>
                        {post.note && <><span aria-hidden="true"> · </span><span>{post.note}</span></>}
                      </p>
                      <h3 className="dot-section-heading blog-post-title">
                        <Link to={post.href}>
                          <span>{post.title}</span>
                          <ArrowRight className="blog-post-arrow" aria-hidden="true" />
                        </Link>
                      </h3>
                      {post.summary && <p className="blog-post-summary">{post.summary}</p>}
                    </article>
                  </li>
                ))}
              </ol>
            )}

            {state.status === "ready" && pages > 1 && (
              <nav aria-label="Blog pages" className="blog-pagination">
                {page > 1 ? <Link to={`/blog?page=${page - 1}`} className={LINK}>Newer posts</Link> : <span />}
                <span>Page {page} of {pages}</span>
                {page < pages ? <Link to={`/blog?page=${page + 1}`} className={LINK}>Older posts</Link> : <span />}
              </nav>
            )}

            {state.status === "ready" && state.unavailable.length === 0 && page === pages && state.posts.length > 0 && (
              <p className="blog-completion">That is everything posted here so far.</p>
            )}
          </section>

          {newsletter.editions.length > 0 && (
            <section aria-labelledby="external-letters" className="blog-external">
              <header className="blog-section-heading">
                <h2 id="external-letters" className="dot-label">Letters on LinkedIn</h2>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </header>
              <p className="blog-external-note">From {newsletter.title}. These letters open on LinkedIn.</p>
              <ul aria-label="Letters on LinkedIn" className="blog-posts">
                {newsletter.editions.map((edition) => (
                  <li key={edition.url}>
                    <article className="blog-post">
                      <p className="blog-post-meta">Read on LinkedIn</p>
                      <h3 className="dot-section-heading blog-post-title">
                        <a href={edition.url} rel="noreferrer">
                          <span>{edition.title}</span>
                          <ArrowUpRight className="blog-post-arrow" aria-hidden="true" />
                        </a>
                      </h3>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <BlogReadingLinks />
      </div>
    </PageShell>
  );
}
