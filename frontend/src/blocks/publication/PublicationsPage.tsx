import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { author } from "../../content/author";
import newsletter from "../../content/newsletter.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { ReleasedWritingList } from "./ReleasedWritingList";

export default function PublicationsPage() {
  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <Helmet><title>Publications — {author.name}</title><meta name="description" content="Books, essays, analysis, and letters by Henok Ghebrechristos." /><link rel="canonical" href={`${import.meta.env.VITE_SITE_URL || "https://dotheory.org"}/publications`} /></Helmet>
      <div className="mx-auto max-w-3xl">
        <p className="dot-label">{author.name}</p><h1 className="mt-3 font-serif text-3xl">Publications</h1>
        <section aria-labelledby="books-title" className="mt-10 border-t border-border pt-6">
          <h2 id="books-title" className="font-serif text-2xl">Books</h2>
          <div className="border-b border-border/60 py-6"><p className="dot-label">Book One · Theory</p><h3 className="mt-2 text-xl font-semibold"><Link to="/book/digital-organism-theory" className="hover:underline">Digital Organism Theory</Link></h3><p className="mt-3 text-sm text-muted-foreground">The complete web edition is free to read.</p></div>
          <div className="border-b border-border/60 py-6"><p className="dot-label">Applied DOT · Book in development</p><h3 className="mt-2 text-xl font-semibold">{newsletter.title}</h3><p className="mt-3 text-sm text-muted-foreground">A separate book applying DOT to the author's analysis of the world and the environment he inhabits.</p><Link to="/essays" className="mt-3 inline-block text-sm underline">Published letters and newsletter</Link></div>
        </section>
        <ReleasedWritingList />
        <div className="mt-8 flex flex-wrap gap-5 text-sm"><Link to="/essays" className="underline">Essay archive and newsletter</Link><Link to="/readers" className="underline">Reader list</Link><Link to="/studio" className="underline">Author Studio</Link></div>
      </div>
    </PageShell>
  );
}