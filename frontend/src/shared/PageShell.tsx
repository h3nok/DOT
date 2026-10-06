import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DotWordmark } from "./DotWordmark";
import { SiteNav } from "./SiteNav";

interface PageHeaderProps {
  backTo?: string;
  backLabel?: string;
  right?: ReactNode;
}

export function PageHeader({
  backTo = "/",
  backLabel = "DOT",
  right,
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
}

export function PageShell({
  children,
  header,
  footer,
  className = "",
  wide = false,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header}
      <main className={`dot-page-container pb-24 pt-12 sm:pt-16 ${wide ? "dot-page-wide" : ""} ${className}`}>
        {children}
      </main>
      {footer}
    </div>
  );
}
