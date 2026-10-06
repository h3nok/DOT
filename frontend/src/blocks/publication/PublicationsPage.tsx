import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { author } from "../../content/author";
import newsletter from "../../content/newsletter.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";

export default function PublicationsPage() {
  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <Helmet><title>Books — {author.name}</title><meta name="description" content="Books by Henok Ghebrechristos, with links to the complete free edition and letters." /><link rel="canonical" href={`${import.meta.env.VITE_SITE_URL || "https://dotheory.org"}/publications`} /></Helmet>
      <div className="mx-auto max-w-3xl">
        <p className="dot-label">{author.name}</p><h1 className="dot-page-heading mt-3">Books</h1>
        <section aria-labelledby="books-title" className="mt-10 border-t border-border pt-6">
          <h2 id="books-title" className="sr-only">Book editions</h2>
          <div className="border-b border-border/60 py-6"><p className="dot-label">Book One · Theory</p><h3 className="mt-2 text-xl font-semibold"><Link to="/book/digital-organism-theory" className="hover:underline">Digital Organism Theory</Link></h3><p className="mt-3 text-sm text-muted-foreground">The complete web edition is free to read.</p></div>
          <div className="border-b border-border/60 py-6"><p className="dot-label">Applied DOT · Book in development</p><h3 className="mt-2 text-xl font-semibold">{newsletter.title}</h3><p className="mt-3 text-sm text-muted-foreground">A separate book applying DOT to the author's analysis of the world and the environment he inhabits.</p><Link to="/blog" className="mt-3 inline-block text-sm underline">Letters and essays</Link></div>
        </section>
        <div className="mt-8 flex flex-wrap gap-5 text-sm"><Link to="/blog" className="underline">All writing</Link><Link to="/readers" className="underline">Reader list</Link></div>
      </div>
    </PageShell>
  );
}
