import { Link } from "react-router-dom";

import { authorByline } from "../content/author";
import { ESSAYS_PUBLISHED, FEED_URL } from "../content/essays/essays";
import { DotWordmark } from "./DotWordmark";

const LINK =
  "text-muted-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The closing line of every public page that ends (ADR-0033): who wrote it, and
 * the few places a reader can go next. Plain text links in a fixed order —
 * nothing counted, nothing ranked, and no funding ask (ADR-0022).
 *
 * The Essays and RSS links appear only once an essay is released, so the site
 * never points at an empty page.
 */
export function SiteColophon({
  essaysPublished = ESSAYS_PUBLISHED,
}: {
  essaysPublished?: boolean;
}) {
  return (
    <footer className="dot-page-container py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <DotWordmark className="font-mono text-sm uppercase tracking-[0.14em] text-muted-foreground/40" />
        <p className="text-xs leading-relaxed text-muted-foreground/50">
          Written by {authorByline} · offered as a construction, not a revelation.
          No ads, no profiling, no data sales.
        </p>
        <nav
          aria-label="Site"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
        >
          <Link to="/about" className={LINK}>
            About
          </Link>
          {essaysPublished && (
            <Link to="/essays" className={LINK}>
              Essays
            </Link>
          )}
          {essaysPublished && (
            <a href={FEED_URL} className={LINK}>
              RSS
            </a>
          )}
          <Link to="/readers" className={LINK}>
            Reader list
          </Link>
          <Link to="/privacy" className={LINK}>
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default SiteColophon;
