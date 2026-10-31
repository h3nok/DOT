import type { CSSProperties } from "react";

interface FilmProgressProps {
  /** The film second now playing. */
  seconds: number;
  duration: number;
  /** Where each section begins, from 0; each becomes one segment of the line. */
  sections: readonly number[];
  /** Sections that begin before this second are drawn warm (gold), such as an opening. */
  warmUntil?: number;
  /** The name of the section now playing, shown quietly above the line. */
  label?: string;
  className?: string;
}

/**
 * A film's progress as its structure: one fine segment per section, separated by small
 * breaks like the process loop's broken arrows. Played sections fill softly, the current
 * one fills as it plays, and a small point — Little c's own mark — travels its end.
 * Decorative: the player's slider carries the accessible position. L1/L5: quiet, no counts.
 */
export function FilmProgress({ seconds, duration, sections, warmUntil = 0, label, className = "" }: FilmProgressProps) {
  const starts = sections.length && sections[0] === 0 ? sections : [0, ...sections];
  return (
    <div className={`film-progress ${className}`.trim()} aria-hidden="true">
      {label && <span className="film-progress-label">{label}</span>}
      <div className="film-progress-line">
        {starts.map((start, index) => {
          const end = starts[index + 1] ?? duration;
          const length = Math.max(0.001, end - start);
          const fill = Math.min(1, Math.max(0, (seconds - start) / length));
          const current = seconds >= start && (seconds < end || index === starts.length - 1);
          const style = { flexGrow: length } as CSSProperties;
          return (
            <span
              key={start}
              className="film-progress-segment"
              data-warm={start < warmUntil ? "" : undefined}
              data-current={current ? "" : undefined}
              data-played={fill >= 1 && !current ? "" : undefined}
              style={style}
            >
              <span className="film-progress-fill" style={{ width: `${(fill * 100).toFixed(3)}%` }} />
              {current && <span className="film-progress-point" style={{ left: `${(fill * 100).toFixed(3)}%` }} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

