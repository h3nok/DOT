import { Link } from "react-router-dom";

import { authorByline, authorProfiles } from "../content/author";
import { ESSAYS_PUBLISHED, FEED_URL } from "../content/essays/essays";
import newsletter from "../content/newsletter.json";
import { DotWordmark } from "./DotWordmark";

const LINK =
  "text-muted-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline";

/**
 * The closing line of every public page that ends (ADR-0033): who wrote it, and
 * the few places a reader can go next. Plain text links in a fixed order —
 * nothing counted, nothing ranked, and no funding ask (ADR-0022).
 *
 * Blog is the common writing archive. RSS carries writing released here.
 */
export function SiteColophon({
  essaysPublished = ESSAYS_PUBLISHED,
  variant = "publication",
}: {
  essaysPublished?: boolean;
  variant?: "publication" | "personal";
}) {
  return (
    <footer className="site-colophon dot-page-container py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
        <DotWordmark className="font-mono text-sm uppercase tracking-[0.14em] text-muted-foreground/40" />
        <p className="text-xs leading-relaxed text-muted-foreground/50">
          {variant === "personal" ? (
            <>{authorByline} · Independent builder.</>
          ) : (
            <>Written by {authorByline} · offered as a construction, not a revelation.
            No ads, no profiling, no data sales.</>
          )}
        </p>
        <nav
          aria-label="Site"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
        >
          <Link to="/about" className={LINK}>
            About
          </Link>
          <Link to="/blog" className={LINK}>Blog</Link>
          <Link to="/contact" className={LINK}>Contact</Link>
          <Link to="/publications" className={LINK}>Books</Link>
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
          <Link to="/terms" className={LINK}>
            Terms
          </Link>
        </nav>
        <nav
          aria-label="Elsewhere"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs"
        >
          {authorProfiles().map((profile) => (
            <a key={profile.href} href={profile.href} className={LINK} rel="noreferrer me">
              {profile.label}
            </a>
          ))}
          <a href={newsletter.url} className={LINK} rel="noreferrer">
            {newsletter.title}
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default SiteColophon;
