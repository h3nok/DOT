import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { IntentTone } from "../../attention-os/focus-nav/IntentCard";
import "./editorial.css";

/** Page-specific content with a shared, semantic heading hierarchy. */
export function PageIntro({ eyebrow, title, titleClassName = "", className = "", children }: {
  eyebrow?: string;
  title: ReactNode;
  titleClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  return <header className={`public-masthead ${className}`.trim()}>
    {eyebrow && <p className="dot-label">{eyebrow}</p>}
    <h1 className={`dot-page-heading public-masthead-title ${titleClassName}`.trim()}>{title}</h1>
    {children}
  </header>;
}

export function SectionHeading({ id, eyebrow, title, className = "", children }: {
  id: string;
  eyebrow: string;
  title: string;
  className?: string;
  children?: ReactNode;
}) {
  return <header className={`public-section-heading ${className}`.trim()}>
    <div><p className="dot-label">{eyebrow}</p><h2 id={id} className="dot-section-heading">{title}</h2></div>
    {children}
  </header>;
}

/** A visual surface; it adds no click handler, focus target, or implied action. */
export function Surface({ as: Tag = "div", tone = "forest", className = "", children, ...props }: HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "aside" | "section" | "li";
  tone?: IntentTone;
}) {
  return <Tag {...props} className={`public-surface ${className}`.trim()} data-tone={tone}>{children}</Tag>;
}

type TextLinkProps = { children: ReactNode; icon?: ReactNode } & (
  | (Omit<ComponentProps<typeof Link>, "children"> & { to: string; href?: never })
  | (Omit<ComponentProps<"a">, "children"> & { href: string; to?: never })
);

/** Secondary navigation stays a real link, with a useful name independent of its icon. */
export function TextLink({ children, icon = <ArrowUpRight />, className = "", ...props }: TextLinkProps) {
  const content = <>{children}{icon && <span aria-hidden="true">{icon}</span>}</>;
  const classes = `public-text-link ${className}`.trim();
  return props.to !== undefined
    ? <Link {...props} className={classes}>{content}</Link>
    : <a {...props} className={classes}>{content}</a>;
}
