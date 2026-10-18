import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEssayIndex, type EssaySummary } from "../../content/essays/essays";
import { PageHeader, PageShell } from "../../shared/PageShell";

/** Imported only in the development router. This is a local file preview, not a CMS. */
export default function EssayDraftsPage() {
  const [posts, setPosts] = useState<EssaySummary[]>([]);
  const [status, setStatus] = useState("Loading local posts…");
  useEffect(() => {
    const controller = new AbortController();
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.append(tag);
    void fetchEssayIndex(controller.signal, true).then((items) => {
      setPosts(items);
      setStatus(items.length ? "" : "No local posts yet. Create a draft to begin.");
    }).catch(() => { if (!controller.signal.aborted) setStatus("A post could not be read. Run pnpm post:check in frontend for the file and error."); });
    return () => { controller.abort(); tag.remove(); };
  }, []);
  return <PageShell header={<PageHeader backTo="/blog" backLabel="Blog" />}>
    <p className="dot-label">Local writing workspace</p>
    <h1 className="dot-page-heading mt-4">Preview your posts.</h1>
    <p className="mt-5 text-muted-foreground">Drafts and published files use the same reading design. This page is available only on the development server.</p>
    <p className="mt-4 text-sm">Create: <code>pnpm post:new my-post</code> · Check: <code>pnpm post:check</code></p>
    {status && <p role="status" className="mt-8">{status}</p>}
    <ul className="mt-8 divide-y divide-border">
      {posts.map((post) => <li key={post.slug} className="py-5">
        <Link className="inline-flex min-h-11 items-center text-lg underline underline-offset-4" to={`/_preview/essays/${post.slug}`}>{post.title}</Link>
        <p className="text-sm text-muted-foreground">{post.draft ? "Draft" : "Marked for publication"} · {post.slug}.md</p>
      </li>)}
    </ul>
  </PageShell>;
}
