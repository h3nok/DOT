import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import "./disclosure.css";

interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Native, initially closed disclosure. Readers control both opening and closing. */
export function Disclosure({ summary, children, className = "" }: DisclosureProps) {
  return (
    <details className={`dot-disclosure ${className}`}>
      <summary>
        <span>{summary}</span>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="dot-disclosure__content">{children}</div>
    </details>
  );
}
