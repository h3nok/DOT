import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DotWordmark } from "./DotWordmark";

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
    <header className="sticky top-0 z-30 border-b border-transparent bg-transparent backdrop-blur-md">
      <div className="dot-page-container flex h-14 items-center justify-between gap-4">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel === "DOT" ? (
            <DotWordmark className="font-mono uppercase tracking-[0.14em]" />
          ) : (
            <span>{backLabel}</span>
          )}
        </Link>
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
  className?: string;
  wide?: boolean;
}

export function PageShell({
  children,
  header,
  className = "",
  wide = false,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {header}
      <main className={`dot-page-container pb-24 pt-12 sm:pt-16 ${wide ? "dot-page-wide" : ""} ${className}`}>
        {children}
      </main>
    </div>
  );
}
