import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface ReadingPathwayCardProps {
  label?: string;
  badge?: ReactNode;
  title: ReactNode;
  context?: string;
  href?: string;
  to?: string;
  rel?: string;
  target?: string;
  icon?: ReactNode;
  className?: string;
  themeLayer?: string;
  tone?: "dot" | "external" | "next";
}

/**
 * Reusable Reading Pathway Card.
 *
 * Keeps all labels, titles, contextual citations, and action affordances
 * strictly inside the card boundary with consistent spatial rhythm.
 */
export function ReadingPathwayCard({
  label,
  badge,
  title,
  context,
  href,
  to,
  rel = "noopener noreferrer",
  target = "_blank",
  icon,
  className = "",
  themeLayer,
  tone = "dot",
}: ReadingPathwayCardProps) {
  const content = (
    <>
      <div className="dot-pathway-card__body flex min-w-0 flex-1 flex-col justify-center gap-1">
        {(label || badge) && (
          <div className="dot-pathway-card__meta dot-card-kicker">
            {badge}
            {label && (
              <>
                <span className="dot-mark" data-tone="quiet" aria-hidden="true" />
                <span className="dot-pathway-card__label dot-label dot-micro">
                  {label}
                </span>
              </>
            )}
          </div>
        )}
        <div className="dot-pathway-card__title-group">
          <span className="dot-pathway-card__title font-serif text-[1.02rem] font-semibold leading-snug text-foreground transition-colors group-hover:text-[color:var(--pathway-hover-color,var(--foreground))]">
            {title}
          </span>
          {context && (
            <p className="dot-pathway-card__context mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {context}
            </p>
          )}
        </div>
      </div>
      <div className="dot-pathway-card__action flex shrink-0 items-center justify-center pl-2">
        {icon ? (
          icon
        ) : href ? (
          <ExternalLink
            className="h-4 w-4 text-muted-foreground/70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            aria-hidden="true"
          />
        ) : (
          <ArrowRight
            className="h-4 w-4 text-muted-foreground/70 transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground"
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );

  const containerClasses = `dot-card dot-pathway-card group flex min-h-[4rem] items-center justify-between gap-3 p-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`;

  const styleProps = themeLayer
    ? ({ "--pathway-layer": themeLayer } as React.CSSProperties)
    : undefined;

  if (to) {
    return (
      <Link to={to} className={containerClasses} style={styleProps} data-tone={tone}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={target ?? (href.startsWith("http") ? "_blank" : undefined)}
        rel={rel ?? (href.startsWith("http") ? "noopener noreferrer" : undefined)}
        className={containerClasses}
        style={styleProps}
        data-tone={tone}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={containerClasses} style={styleProps} data-tone={tone}>
      {content}
    </div>
  );
}
