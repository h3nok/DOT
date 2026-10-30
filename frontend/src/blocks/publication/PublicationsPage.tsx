import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { author } from "../../content/author";
import newsletter from "../../content/newsletter.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";

export default function PublicationsPage() {
  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <Helmet><title>Books — {author.name}</title><meta name="description" content="Books by Henok Ghebrechristos, with links to the complete free edition and letters." /></Helmet>
      <div className="mx-auto max-w-3xl">
        <p className="dot-label">{author.name}</p><h1 className="dot-page-heading mt-3">Books</h1>
        <section aria-labelledby="books-title" className="mt-10 border-t border-border pt-6">
          <h2 id="books-title" className="sr-only">Book editions</h2>
          <div className="border-b border-border/60 py-6">
            <p className="dot-label">Book One · Digital Organism Theory</p>
            <h3 className="mt-2 text-xl font-semibold">
              <Link to="/book/digital-organism-theory" className="hover:underline">
                Consciousness: A Digital Organism
              </Link>
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Foundations, Agency, and Research (Edition v4). The complete web edition and PDF are free to read and keep.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <Link to="/book/digital-organism-theory" className="underline">Read the web edition</Link>
              <Link to="/book/digital-organism-theory/copy" className="underline">Download the free PDF</Link>
            </div>
          </div>
          <div className="border-b border-border/60 py-6"><p className="dot-label">Applied DOT · Book in development</p><h3 className="mt-2 text-xl font-semibold">{newsletter.title}</h3><p className="mt-3 text-sm text-muted-foreground">A separate book applying DOT to the author's analysis of the world and the environment he inhabits.</p><Link to="/amm" className="mt-3 inline-block text-sm underline">Explore the AMM publication</Link></div>
        </section>
        <div className="mt-8 flex flex-wrap gap-5 text-sm"><Link to="/blog" className="underline">All writing</Link><Link to="/readers" className="underline">Reader list</Link></div>
      </div>
    </PageShell>
  );
}
