import type { ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import "./explainer.css";

export interface FlowTier {
  id: string;
  label: string;
  detail?: string;
  chips?: readonly string[];
  /** strong = inverted (the power at the top), accent = the person the story is about, dashed = the informal layer. */
  tone?: "strong" | "plain" | "dashed" | "accent";
}
export interface FlowLink {
  id: string;
  /** Sits between these two consecutive tiers. */
  after: string;
  items: readonly { direction: "down" | "up"; label: string }[];
}
export interface FlowRail {
  id: string;
  label: string;
  note?: string;
}

/**
 * A layered map of who sits above whom and what passes between them, with an
 * optional rail for a flow that bypasses the middle layers. Lit parts are named
 * by id; when nothing is lit, everything reads at full strength.
 */
export function FlowMap({ tiers, links = [], rail, lit = [] }: {
  tiers: readonly FlowTier[];
  links?: readonly FlowLink[];
  rail?: FlowRail;
  lit?: readonly string[];
}) {
  const state = (id: string) => (lit.length === 0 ? undefined : lit.includes(id) ? "lit" : "dim");
  const rows: ReactNode[] = [];
  for (const tier of tiers) {
    rows.push(
      <div key={tier.id} className={`explainer-tier explainer-tier--${tier.tone ?? "plain"}`} data-state={state(tier.id)}>
        <p className="explainer-tier-label">{tier.label}</p>
        {tier.detail && <p className="explainer-tier-detail">{tier.detail}</p>}
        {tier.chips && <ul>{tier.chips.map(chip => <li key={chip}>{chip}</li>)}</ul>}
      </div>,
    );
    for (const link of links.filter(item => item.after === tier.id)) {
      rows.push(
        <div key={link.id} className="explainer-link" data-state={state(link.id)}>
          {link.items.map(item => <p key={item.label}>{item.direction === "down" ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}<span className="explainer-visually-hidden">{item.direction === "down" ? "Down:" : "Up:"} </span>{item.label}</p>)}
        </div>,
      );
    }
  }
  return (
    <div className={`explainer-flowmap${rail ? " explainer-flowmap--rail" : ""}`}>
      <div className="explainer-flowmap-stack">{rows}</div>
      {rail && (
        <div className="explainer-rail" data-state={state(rail.id)}>
          <ArrowUp aria-hidden="true" />
          <p>{rail.label}</p>
          {rail.note && <span>{rail.note}</span>}
        </div>
      )}
    </div>
  );
}
