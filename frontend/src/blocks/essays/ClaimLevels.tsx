import type { EssayClaimLevel } from "../../content/essays/essays";
import { EpistemicBadge } from "../../shared/EpistemicBadge";

const ORDER: readonly EssayClaimLevel[] = ["observation", "model", "hypothesis", "speculation"];

const LABEL: Record<EssayClaimLevel, string> = {
  observation: "Observation",
  model: "Model",
  hypothesis: "Hypothesis",
  speculation: "Speculation",
};

/**
 * The claim levels an essay uses, before a reader commits to it (ADR-0030).
 * Always in the same order, weakest burden first, so two essays compare at a
 * glance.
 */
export function ClaimLevels({
  levels,
  className = "",
}: {
  levels: readonly EssayClaimLevel[];
  className?: string;
}) {
  const used = ORDER.filter((level) => levels.includes(level));
  return (
    <ul aria-label="Claim levels used" className={`flex flex-wrap items-center gap-2 ${className}`}>
      {used.map((level) => (
        <li key={level}>
          <EpistemicBadge status={level}>{LABEL[level]}</EpistemicBadge>
        </li>
      ))}
    </ul>
  );
}
