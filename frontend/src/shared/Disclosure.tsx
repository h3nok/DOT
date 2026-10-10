import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import "./disclosure.css";

interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
  /** Start expensive or moving content only when a reader opens it. */
  mountOnOpen?: boolean;
}

/** Native, initially closed disclosure. Readers control both opening and closing. */
export function Disclosure({ summary, children, className = "", mountOnOpen = false }: DisclosureProps) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className={`dot-disclosure ${className}`}
      onToggle={mountOnOpen ? (event) => setOpen(event.currentTarget.open) : undefined}
    >
      <summary>
        <span>{summary}</span>
        <ChevronDown aria-hidden="true" />
      </summary>
      {(!mountOnOpen || open) && <div className="dot-disclosure__content">{children}</div>}
    </details>
  );
}
