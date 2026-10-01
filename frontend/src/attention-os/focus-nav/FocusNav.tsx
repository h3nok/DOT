import { useId, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./focus-nav.css";

type Destination = { to: string; href?: never } | { href: string; to?: never };

export type FocusAction = Destination & {
  label: string;
  icon?: ReactNode;
  endIcon?: ReactNode;
};

interface FocusNavProps {
  label: string;
  /** Required and singular: each navigation surface has one primary intention. */
  primary: FocusAction & { description?: string };
  secondary?: FocusAction[];
  className?: string;
}

/** P3: one immediately available action, with quiet, reader-directed alternatives. */
export function FocusNav({ label, primary, secondary = [], className = "" }: FocusNavProps) {
  const id = useId();
  const primaryContent = (
    <>
      {primary.icon && <span className="dot-focus-nav__icon" aria-hidden="true">{primary.icon}</span>}
      <span className="dot-focus-nav__copy">
        <strong id={`${id}-title`}>{primary.label}</strong>
        {primary.description && <span id={`${id}-description`}>{primary.description}</span>}
      </span>
      <span className="dot-focus-nav__icon" aria-hidden="true">{primary.endIcon ?? <ArrowRight />}</span>
    </>
  );
  const primaryProps = {
    className: "dot-reading-action dot-focus-nav__primary",
    "aria-labelledby": `${id}-title`,
    "aria-describedby": primary.description ? `${id}-description` : undefined,
  };

  return (
    <nav aria-label={label} className={`dot-focus-nav ${className}`}>
      {primary.to !== undefined
        ? <Link to={primary.to} {...primaryProps}>{primaryContent}</Link>
        : <a href={primary.href} {...primaryProps}>{primaryContent}</a>}
      {secondary.map((action) => {
        const content = (
          <>
            {action.icon && <span className="dot-focus-nav__icon" aria-hidden="true">{action.icon}</span>}
            <span>{action.label}</span>
            {action.endIcon && <span className="dot-focus-nav__icon" aria-hidden="true">{action.endIcon}</span>}
          </>
        );
        return action.to !== undefined
          ? <Link key={action.to} to={action.to} className="dot-focus-nav__secondary">{content}</Link>
          : <a key={action.href} href={action.href} className="dot-focus-nav__secondary">{content}</a>;
      })}
    </nav>
  );
}
