import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { RELATION_PHRASE, type DotRelation } from "./relations";

/**
 * Typed exits, the threshold, and the end mark (doc 12 §4–§5).
 *
 * Movement is offered in relation language rather than as a menu, so every step
 * has a stated reason. Exits appear only after a short threshold: a member
 * cannot bounce out before arriving. It is a threshold, never a lock — any key
 * opens it immediately, and stopping is always offered beside continuing.
 */

export interface RelationExit {
  id: string;
  label: string;
  relation?: DotRelation;
}

interface RelationExitsProps {
  exits: RelationExit[];
  onFollow: (id: string) => void;
  /** The explicit stop. Finishing is a success state, not an abandonment. */
  onStop: () => void;
  thresholdMs?: number;
  reducedMotion?: boolean;
}

export const THRESHOLD_MS = 700;

export const RelationExits: React.FC<RelationExitsProps> = ({
  exits,
  onFollow,
  onStop,
  thresholdMs = THRESHOLD_MS,
  reducedMotion = false,
}) => {
  const [arrived, setArrived] = useState(reducedMotion || thresholdMs <= 0);

  useEffect(() => {
    if (arrived) return;
    const timer = window.setTimeout(() => setArrived(true), thresholdMs);
    const open = () => setArrived(true);
    window.addEventListener("keydown", open, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", open);
    };
  }, [arrived, thresholdMs]);

  return (
    <div
      data-arrived={arrived}
      className={[
        "mt-10 border-t border-border/40 pt-6",
        reducedMotion ? "" : "transition-opacity duration-500",
        arrived ? "opacity-100" : "opacity-0",
      ].join(" ")}
      aria-hidden={!arrived}
    >
      <p className="font-mono dot-micro uppercase tracking-[0.2em] text-muted-foreground/70">
        {exits.length > 0 ? "where this leads" : "this is an end"}
      </p>

      {exits.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {exits.map((exit) => (
            <li key={exit.id}>
              <button
                type="button"
                tabIndex={arrived ? 0 : -1}
                onClick={() => onFollow(exit.id)}
                className="group flex w-full items-baseline gap-2 text-left"
              >
                <span className="dot-micro font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
                  {RELATION_PHRASE[exit.relation ?? "leads-to"]}
                </span>
                <span className="text-base font-medium text-foreground/90 transition-colors group-hover:text-foreground">
                  {exit.label}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 self-center text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        tabIndex={arrived ? 0 : -1}
        onClick={onStop}
        className="mt-6 font-mono dot-micro uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors hover:text-foreground"
      >
        stop here
      </button>
    </div>
  );
};
