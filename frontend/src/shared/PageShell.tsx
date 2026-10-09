import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DotWordmark } from "./DotWordmark";
import { SiteNav } from "./SiteNav";

interface PageHeaderProps {
  backTo?: string;
  backLabel?: string;
  right?: ReactNode;
  controls?: ReactNode;
}

export function PageHeader({
  backTo = "/",
  backLabel = "DOT",
  right,
  controls,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-background/80 backdrop-blur-md">
      <div className="dot-page-container flex min-h-14 flex-wrap items-center justify-between gap-x-4">
        <Link
          to={backTo}
          className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel === "DOT" ? (
            <DotWordmark className="font-mono uppercase tracking-[0.14em]" />
          ) : (
            <span>{backLabel}</span>
          )}
        </Link>
        <SiteNav className="order-last w-full sm:order-none sm:w-auto" />
        {right && (
          <nav aria-label="Page context" className="flex items-center gap-1">
            {right}
          </nav>
        )}
        {controls && <div className="flex items-center gap-1">{controls}</div>}
      </div>
    </header>
  );
}

interface PageShellProps {
  children: ReactNode;
  header?: ReactNode;
  /** Rendered after <main>, so a page's closing footer is its own landmark. */
  footer?: ReactNode;
  className?: string;
  wide?: boolean;
  /** Pages with their own, more specific skip link turn this one off. */
  skipLink?: boolean;
}

export function PageShell({
  children,
  header,
  footer,
  className = "",
  wide = false,
  skipLink = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header && skipLink && (
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-md bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
      )}
      {header}
      {/* The scroll margin clears the sticky header (two rows on a phone) when
          the skip link or a fragment brings <main> to the top. */}
      <main
        id="main-content"
        className={`dot-page-container scroll-mt-24 pb-24 pt-12 sm:scroll-mt-16 sm:pt-16 ${wide ? "dot-page-wide" : ""} ${className}`}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
