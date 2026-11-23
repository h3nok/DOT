import type { ClaimLevel } from "./types";

/**
 * How strongly a claim is held, as a mark and a word. The shape carries the
 * rank (filled, half, ring, dashed ring), so the level reads without colour,
 * and the word is always present for assistive technology.
 */
export function LevelMark({ level, hideLabel = false }: { level: ClaimLevel; hideLabel?: boolean }) {
  return (
    <span className="inq-level" data-rank={level.rank}>
      <span className="inq-level-mark" aria-hidden="true" />
      <span className={hideLabel ? "sr-only" : "inq-level-label"}>{level.label}</span>
    </span>
  );
}

/** The levels a work uses, in rank order, each with its own definition and source. */
export function LevelKey({ levels, label }: { levels: ReadonlyArray<ClaimLevel>; label: string }) {
  const ordered = [...levels].sort((a, b) => a.rank - b.rank);
  return (
    <dl className="inq-level-key" aria-label={label}>
      {ordered.map((level) => (
        <div key={level.id} className="inq-level-key-row">
          <dt><LevelMark level={level} /></dt>
          {level.definition && (
            <dd>
              <p>{level.definition}</p>
              {level.source && <p className="inq-source"><a href={level.source.href}>{level.source.label}</a></p>}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
