import type { ReactNode } from "react";

export type EpistemicStatus =
  | "assumption"
  | "explanation"
  | "observation"
  | "model"
  | "hypothesis"
  | "speculation"
  | "evidence"
  | "grounded"
  | "proposed"
  | "neutral";

interface EpistemicBadgeProps {
  children: ReactNode;
  status?: EpistemicStatus;
  className?: string;
  prefix?: ReactNode;
  title?: string;
}

/**
 * The claim-level pill of the Academy standard. Colour carries epistemic
 * weight (see .dot-epistemic-badge in organism.css): grounded levels borrow
 * the accent, proposed levels stay quiet.
 */
export function EpistemicBadge({
  children,
  status = "neutral",
  className = "",
  prefix,
  title,
}: EpistemicBadgeProps) {
  return (
    <span
      className={`dot-epistemic-badge dot-label dot-micro inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 ${className}`}
      data-epistemic-status={status}
      title={title}
    >
      {prefix}
      <span>{children}</span>
    </span>
  );
}
