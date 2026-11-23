import type { CSSProperties } from "react";
import "./explainer.css";

export interface SpiralPhase {
  /** A short name for the stretch of the spiral, shown beside its first turn. */
  label: string;
  /** What the person says in this stretch, earliest first. */
  voices: readonly string[];
  /** How far the stretch has gone: the person's own reasons, their demands on others, or the end of it. */
  kind: "carry" | "enforce" | "end";
}

const TURN = 100, POINTS = 36;

/**
 * A person worn down over time, drawn as a coil that narrows as it descends: each turn
 * is a round of the same arrangement, the line thinner and more broken than the turn
 * before. Beside each turn is what the person says by then, so the drawing reads as a
 * life, top to bottom. The words are an ordered list; the coil only pictures them.
 */
export function ErosionSpiral({ phases, who, label }: { phases: readonly SpiralPhase[]; who: string; label: string }) {
  const rows = phases.flatMap((phase) => phase.voices.map((voice, index) => ({ voice, phase, first: index === 0 })));
  const n = rows.length;
  // One ring of a narrowing helix per row, seen from slightly above: the far half of each
  // ring (left, over the top, to the right) is faint; the near half (back under) is drawn over it.
  const loop = (turn: number, half: "far" | "near") => {
    const points: string[] = [];
    const from = turn + (half === "far" ? -0.25 : 0.25);
    for (let step = 0; step <= POINTS / 2; step += 1) {
      const t = from + step / POINTS;
      const radius = 46 * (1 - 0.8 * Math.max(0, t) / n);
      const angle = 2 * Math.PI * t;
      points.push(`${(50 + radius * Math.sin(angle)).toFixed(2)} ${(TURN * t + 25 - 24 * Math.cos(angle)).toFixed(2)}`);
    }
    return `M${points.join("L")}`;
  };
  return (
    <figure className="explainer-spiral" aria-label={label} style={{ ["--spiral-rows" as string]: n } as CSSProperties}>
      <p className="explainer-spiral-who" aria-hidden="true">{who}</p>
      {/* The coil takes the list's height, one ring per row, rather than setting it. */}
      <span className="explainer-spiral-coil" aria-hidden="true"><svg viewBox={`0 0 100 ${n * TURN}`} preserveAspectRatio="none" focusable="false">
        {rows.map((_, turn) => {
          // Erosion: each turn thinner, fainter, and more broken than the last.
          const worn = turn / Math.max(1, n - 1);
          const style = { strokeWidth: 3.4 - 2.4 * worn, opacity: 1 - 0.55 * worn, strokeDasharray: worn < 0.3 ? undefined : `${(9 - 7 * worn).toFixed(1)} ${(1 + 6 * worn).toFixed(1)}` };
          return <g key={turn}>
            <path className="explainer-spiral-far" d={loop(turn, "far")} style={style} />
            <path className="explainer-spiral-near" d={loop(turn, "near")} style={style} />
          </g>;
        })}
      </svg></span>
      <ol className="explainer-spiral-voices">
        {rows.map((row, index) => (
          <li key={row.voice} data-kind={row.phase.kind} style={{ ["--ex-order" as string]: index } as CSSProperties}>
            <span className="explainer-spiral-phase">{row.first ? row.phase.label : ""}</span>
            <span className="explainer-spiral-voice">{row.voice}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
