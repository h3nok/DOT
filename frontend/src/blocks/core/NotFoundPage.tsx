import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

import { author } from "../../content/author";
import { PageHeader, PageShell } from "../../shared/PageShell";

/** A finite dead end with two honest ways back into the public work. */
export default function NotFoundPage() {
  useEffect(() => {
    document.title = `Page not found — ${author.name}`;
  }, []);

  return (
    <PageShell header={<PageHeader />} className="flex min-h-[70svh] items-center">
      <section className="w-full max-w-2xl" aria-labelledby="not-found-title">
        <p className="dot-label text-[color:var(--organism-accent-strong)]">
          404 · No page here
        </p>
        <h1 id="not-found-title" className="dot-page-heading mt-4 text-balance">
          This path ends here.
        </h1>
        <p className="dot-lede mt-5 max-w-xl">
          The address may have changed, or it may point beyond the current
          edition. Nothing else will open automatically.
        </p>

        <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            to="/book/digital-organism-theory"
            className="dot-reading-action group inline-flex min-h-12 items-center gap-2.5 rounded-lg px-6 text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Open Book One
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            Return to DOT
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
