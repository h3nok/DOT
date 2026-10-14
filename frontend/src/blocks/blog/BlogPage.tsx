import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, PenLine } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { author } from "../../content/author";
import blog from "../../content/blog.json";
import newsletter from "../../content/newsletter.json";
import { essayRoute, fetchEssayIndex, formatEssayDate, ESSAY_FORMAT_LABELS, type EssayCover } from "../../content/essays/essays";
import { fetchReleasedWriting, writingRoute } from "../../services/OrchestratorWritingService";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { PageIntro, Surface, TextLink } from "../../shared/design-system/Editorial";
import { AppearanceControl } from "../../organism/AppearanceControl";
import { DOT_BOOK_ONE_ROUTE } from "../../content/publications/dotBookOne";
import BookOneCover from "../publication/BookOneCover";
import { BlogReadingLinks } from "./BlogReadingLinks";
import { BlogPostArtwork, BlogSeriesArtwork } from "./BlogArtwork";
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
  cover?: EssayCover;
  label?: string;
}

type BlogState = { status: "loading" } | { status: "ready"; posts: Post[]; unavailable: string[] };

/**
 * The author's chronological archive (L2, L3): essays released
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
    document.title = `${blog.title} — ${author.name}`;
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
          cover: essay.cover,
          label: essay.series ?? ESSAY_FORMAT_LABELS[essay.format ?? "essay"],
        })));
      } else unavailable.push("essays");
      if (writing.status === "fulfilled") {
        posts.push(...writing.value.map((entry) => ({
          key: `writing:${entry.work_id}`,
          title: entry.title,
          summary: entry.summary ?? "",
          date: entry.released_at.slice(0, 10),
          href: writingRoute(entry.work_id),
          cover: entry.cover ?? undefined,
          label: entry.presentation?.series || ESSAY_FORMAT_LABELS[entry.presentation?.format ?? "essay"],
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
      footer={<SiteColophon variant="personal" />}
    >
      <header className="blog-masthead">
        <div className="blog-masthead-line">
          <p className="dot-label">{blog.title}</p>
          <p className="blog-byline">By <Link to="/about" className={LINK}>{author.name}</Link></p>
        </div>
        <div className="blog-hero">
          <PageIntro className="blog-hero-copy" titleClassName="blog-title" title={blog.heading.map((line) => <span key={line}>{line}</span>)} />
          <div className="blog-hero-note">
            <p className="blog-description">{blog.description}</p>
            <a href="#latest-writing" className="blog-jump">Latest writing <ArrowDown aria-hidden="true" /></a>
          </div>
        </div>
      </header>

      <div id="start-reading" className="blog-bookshelf">
        <Surface as="section" tone="forest" aria-labelledby="blog-book-title" className="blog-feature blog-book">
          <Link to={DOT_BOOK_ONE_ROUTE} className="blog-feature-art blog-book-art" aria-label="Open Book One: Consciousness, A Digital Organism">
            <BookOneCover />
          </Link>
          <div className="blog-feature-copy">
            <p className="dot-label">Book One · Free to read</p>
            <h2 id="blog-book-title" className="dot-section-heading">Consciousness: A Digital Organism</h2>
            <TextLink to={DOT_BOOK_ONE_ROUTE}>Read Book One</TextLink>
            <details className="blog-feature-details">
              <summary>Start with a passage</summary>
              <p className="dot-label">{blog.startingPoint.label}</p>
              <p className="blog-passage-title">{blog.startingPoint.title}</p>
              <TextLink to={blog.startingPoint.to}>{blog.startingPoint.linkLabel}</TextLink>
            </details>
          </div>
        </Surface>
        <Surface as="section" tone="copper" aria-labelledby="manifesto-title" className="blog-feature blog-series">
          <a href={newsletter.url} className="blog-feature-art blog-series-art" aria-label={`Open ${newsletter.title} on LinkedIn`}>
            <div className="blog-series-cover" aria-hidden="true">
              <span className="blog-cover-kicker">Applied DOT</span>
              <BlogSeriesArtwork />
              <span className="blog-cover-name"><span>The American</span>Millennial<span>Manifesto</span></span>
            </div>
          </a>
          <div className="blog-feature-copy">
            <p className="dot-label">A series · On LinkedIn</p>
            <h2 id="manifesto-title" className="dot-section-heading">{newsletter.title}</h2>
            <TextLink href={newsletter.url}>Explore the series on LinkedIn</TextLink>
            {newsletter.editions.length > 0 && <details className="blog-feature-details">
              <summary>Read a letter</summary>
              <ul aria-label="Letters on LinkedIn" className="blog-series-letters">
                {newsletter.editions.map((edition) => (
                  <li key={edition.url}>
                    <a href={edition.url} rel="noreferrer">
                      <span>{edition.title}</span>
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </details>}
          </div>
        </Surface>
      </div>

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
              <div className="blog-state blog-state-empty">
                <div className="blog-empty-art" aria-hidden="true"><span /><span /><PenLine /></div>
                <div>
                  <p className="blog-state-title">{blog.emptyTitle}</p>
                  <p>{blog.emptyDescription}</p>
                </div>
              </div>
            )}

            {shown.length > 0 && (
              <ol aria-label="Posts, newest first" className="blog-posts">
                {shown.map((post, index) => (
                  <li key={post.key}>
                    <article className="blog-post">
                      <div className="blog-post-art">{post.cover ? <img src={post.cover.src} alt="" width={post.cover.width} height={post.cover.height} loading="lazy" decoding="async" /> : <BlogPostArtwork variant={index % 3} />}</div>
                      <div className="blog-post-copy">
                        <p className="blog-post-meta">
                          {post.label && <><span>{post.label}</span><span aria-hidden="true"> · </span></>}
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
                      </div>
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
        </div>

        <BlogReadingLinks />
      </div>
    </PageShell>
  );
}
