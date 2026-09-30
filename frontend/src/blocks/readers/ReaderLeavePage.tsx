import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { authorContact } from "../../content/author";
import { leaveReaderList } from "../../dot/useReaderList";
import { PageHeader, PageShell } from "../../shared/PageShell";

const LINK =
  "text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-[color:var(--organism-accent-strong)]";

/** The server accepts 16–128 characters; issued tokens are 64 hex digits. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

/**
 * Where the link in every reader-list message lands (ADR-0025).
 *
 * Messages link to `/readers/leave#<token>`. The token rides in the fragment,
 * which browsers never send to a server, so it reaches neither the static
 * host's logs nor the page-view counter. Opening the link is the one click:
 * the page leaves the list on arrival, with no account, no reason asked, and
 * no second confirmation. A mail scanner that fetches the link without running
 * the page removes no one, because leaving is a POST the page makes.
 */
function readToken(): string | null {
  const token = window.location.hash.slice(1);
  return TOKEN_PATTERN.test(token) ? token : null;
}

type LeaveState = "leaving" | "left" | "failed" | "no-token";

export default function ReaderLeavePage() {
  const contact = authorContact();
  const [state, setState] = useState<LeaveState>(() => (readToken() ? "leaving" : "no-token"));
  const sent = useRef(false);

  useEffect(() => {
    document.title = "Leave the reader list — Digital Organism Theory";
  }, []);

  useEffect(() => {
    const token = readToken();
    // StrictMode mounts effects twice in development; leave exactly once.
    if (!token || sent.current) return;
    sent.current = true;
    // The token has done its job; keep it out of history and screenshots.
    window.history.replaceState(null, "", window.location.pathname);
    void leaveReaderList(token).then((ok) => setState(ok ? "left" : "failed"));
  }, []);

  return (
    <PageShell header={<PageHeader />}>
      <div className="mx-auto max-w-xl" role="status" aria-live="polite">
        <p className="dot-label">Reader list</p>
        {state === "leaving" && <h1 className="dot-page-heading mt-4">Removing you from the list…</h1>}
        {state === "left" && (
          <>
            <h1 className="dot-page-heading mt-4">You have left the reader list.</h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Nothing more will be sent to that address. If this was a mistake,
              you can{" "}
              <Link to="/readers" className={LINK}>
                join again
              </Link>
              .
            </p>
          </>
        )}
        {state === "failed" && (
          <>
            <h1 className="dot-page-heading mt-4">That did not go through.</h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              The server could not be reached. Open the link from the message
              again later, or reach the author via{" "}
              <a href={contact.href} className={LINK} rel="noreferrer">
                {contact.label}
              </a>{" "}
              and you will be removed by hand.
            </p>
          </>
        )}
        {state === "no-token" && (
          <>
            <h1 className="dot-page-heading mt-4">This link is incomplete.</h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Use the link at the end of any message from the list, or reach
              the author via{" "}
              <a href={contact.href} className={LINK} rel="noreferrer">
                {contact.label}
              </a>{" "}
              and you will be removed by hand.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
