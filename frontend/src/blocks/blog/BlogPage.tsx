import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import newsletter from "../../content/newsletter.json";
import { FEED_URL, essayRoute, fetchEssayIndex, formatEssayDate } from "../../content/essays/essays";
import { fetchReleasedWriting, writingRoute } from "../../services/OrchestratorWritingService";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";

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
  note: string;
}

type BlogState = { status: "loading" } | { status: "ready"; posts: Post[]; unavailable: string[] };

/**
 * One chronological record of the movement's writing (L2, L3): essays released
 * as files and writing released from the Studio, newest first, in finite pages.
 */
export default function BlogPage() {
  const [state, setState] = useState<BlogState>({ status: "loading" });
  const [params] = useSearchParams();
  const requested = Number(params.get("page") ?? "1");

  useEffect(() => {
    document.title = "Blog — Digital Organism Theory";
  }, []);

  useEffect(() => {
    const controller = new AbortController();
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
          note: `Essay · ${essay.readingMinutes} min read`,
        })));
      } else unavailable.push("essays");
      if (writing.status === "fulfilled") {
        posts.push(...writing.value.map((entry) => ({
          key: `writing:${entry.work_id}`,
          title: entry.title,
          summary: entry.summary ?? "",
          date: entry.released_at.slice(0, 10),
          href: writingRoute(entry.work_id),
          note: entry.release_number > 1 ? `Version ${entry.release_number}` : "Writing",
        })));
      } else unavailable.push("writing released from the Studio");
      posts.sort((first, second) => second.date.localeCompare(first.date));
      setState({ status: "ready", posts, unavailable });
    });
    return () => controller.abort();
  }, []);

  const pages = state.status === "ready" ? Math.max(1, Math.ceil(state.posts.length / PAGE_SIZE)) : 1;
  const page = Number.isInteger(requested) && requested >= 1 && requested <= pages ? requested : 1;
  const shown = state.status === "ready" ? state.posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <div className="mx-auto max-w-3xl">
        <p className="dot-label">Blog</p>
        <h1 className="dot-page-heading mt-4 max-w-2xl">Writing from the DOT movement</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Essays, analysis and letters that apply Digital Organism Theory to the
          world, newest first. Each piece states its claim levels. Book One remains
          a fixed edition; nothing here changes it.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href={FEED_URL} className={LINK}>RSS feed</a>
          <Link to="/readers" className={LINK}>Reader list</Link>
          <a href={newsletter.url} className={LINK} rel="noreferrer">{newsletter.title} on LinkedIn</a>
        </p>

        {state.status === "loading" && (
          <p role="status" className="mt-12 text-sm text-muted-foreground">Loading the blog…</p>
        )}

        {state.status === "ready" && state.unavailable.length > 0 && (
          <p role="alert" className="mt-12 text-sm text-muted-foreground">
            Some posts could not be loaded ({state.unavailable.join(" and ")}). Try again in a moment.
          </p>
        )}

        {state.status === "ready" && state.posts.length === 0 && state.unavailable.length === 0 && (
          <p className="mt-12 text-sm text-muted-foreground">
            Nothing has been posted yet. Meanwhile, {" "}
            <Link to="/book/digital-organism-theory" className={LINK}>Book One is complete and free</Link>.
          </p>
        )}

        {shown.length > 0 && (
          <ol aria-label="Posts, newest first" className="mt-12 border-t border-border/70">
            {shown.map((post) => (
              <li key={post.key} className="border-b border-border/70 py-8">
                <p className="dot-label">
                  <time dateTime={post.date}>{formatEssayDate(post.date)}</time> · {post.note}
                </p>
                <h2 className="mt-3 text-xl font-semibold leading-snug text-foreground">
                  <Link to={post.href} className="transition-colors hover:text-[color:var(--organism-accent-strong)]">
                    {post.title}
                  </Link>
                </h2>
                {post.summary && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{post.summary}</p>
                )}
              </li>
            ))}
          </ol>
        )}

        {state.status === "ready" && state.posts.length > 0 && (
          <nav aria-label="Blog pages" className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm">
            {page > 1 ? <Link to={`/blog?page=${page - 1}`} className={LINK}>Newer posts</Link> : <span />}
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            {page < pages ? <Link to={`/blog?page=${page + 1}`} className={LINK}>Older posts</Link> : <span />}
          </nav>
        )}

        {state.status === "ready" && page === pages && state.posts.length > 0 && (
          <p className="mt-10 text-sm text-muted-foreground">
            That is everything posted so far. Nothing is ranked or counted.
          </p>
        )}
      </div>
    </PageShell>
  );
}
