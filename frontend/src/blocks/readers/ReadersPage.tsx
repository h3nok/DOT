import { useEffect } from "react";
import { Link } from "react-router-dom";

import { ESSAYS_PUBLISHED, FEED_URL } from "../../content/essays/essays";
import { ReaderListForm } from "../../dot/ReaderListForm";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

/**
 * The reader list's own address (ADR-0025), so a talk, a podcast, or an essay
 * can send someone to one place to hear again. It is the open door, not the
 * invited circle: nothing here admits anyone to anything.
 */
export default function ReadersPage() {
  useEffect(() => {
    document.title = "The reader list — Digital Organism Theory";
  }, []);

  return (
    <PageShell header={<PageHeader />} footer={<SiteColophon />}>
      <div className="mx-auto max-w-2xl">
        <p className="dot-label">Reader list</p>
        <h1 className="dot-page-heading mt-4">The reader list</h1>
        <ul className="mt-6 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li>Nothing is sent until you confirm your address with a code.</li>
          <li>No tracking pixels, no rewritten links, and no count of readers anywhere.</li>
          <li>Every message carries a link that removes you in one click, with no account.</li>
        </ul>

        <div className="mt-10">
          <ReaderListForm source="front" fallback={<ListNotOpen />} />
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          <Link to="/privacy" className={LINK}>
            How addresses are kept
          </Link>
        </p>
      </div>
    </PageShell>
  );
}

function ListNotOpen() {
  return (
    <section className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-6">
      <h2 className="font-serif text-xl text-foreground">The list is not open yet.</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {ESSAYS_PUBLISHED ? (
          <>
            Until it is, the{" "}
            <a href={FEED_URL} className={LINK}>
              RSS feed
            </a>{" "}
            carries every new essay, with nothing to sign up for.
          </>
        ) : (
          <>
            Until it is, everything published so far is free to read with no
            account, beginning with{" "}
            <Link to="/book/digital-organism-theory" className={LINK}>
              Book One
            </Link>
            .
          </>
        )}
      </p>
    </section>
  );
}
