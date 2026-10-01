import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DotButton } from "../../shared/DotButton";
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
  return (
    <nav aria-label={label} className={`dot-focus-nav ${className}`}>
      <DotButton
        {...primary}
        className="dot-focus-nav__primary"
        endIcon={primary.endIcon ?? <ArrowRight />}
      />
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
