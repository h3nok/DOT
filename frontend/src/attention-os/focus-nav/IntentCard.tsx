import { useId, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./intent-card.css";

export type IntentTone = "forest" | "copper" | "blue" | "plum";

/** A self-contained P3 destination: one action, named beyond its color. */
export function IntentCard({ to, title, description, label, icon, tone = "forest" }: {
  to: string;
  title: string;
  description: string;
  label: string;
  icon: ReactNode;
  tone?: IntentTone;
}) {
  const id = useId();
  return (
    <Link to={to} className="intent-card" data-tone={tone} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
      <span className="intent-card-symbol" aria-hidden="true">{icon}</span>
      <span className="intent-card-label dot-label">{label}</span>
      <span id={`${id}-title`} className="intent-card-title">{title}</span>
      <span id={`${id}-description`} className="intent-card-description">{description}</span>
      <ArrowUpRight className="intent-card-arrow" aria-hidden="true" />
    </Link>
  );
}
