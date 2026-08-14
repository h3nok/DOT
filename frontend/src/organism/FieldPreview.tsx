import React from "react";
import type { OrganismPreset } from "./types";

/**
 * A field's grammar, drawn at thumbnail size.
 *
 * Each preview shows the actual rule the field obeys — blooms, nearest-neighbour
 * pairs, an orthogonal grid — so the choice is made by looking, not by reading a
 * label. Purely decorative; the panel supplies the accessible name.
 */
export const FieldPreview: React.FC<{ field: OrganismPreset }> = ({ field }) => {
  const stroke = "var(--organism-accent-strong)";
  const dot = "var(--organism-accent-strong)";

  return (
    <svg
      viewBox="0 0 48 32"
      className="h-8 w-full max-w-12 shrink-0 rounded-md bg-foreground/[0.04]"
      aria-hidden="true"
    >
      {field === "aurora" && (
        <>
          <defs>
            <radialGradient id="fp-a1">
              <stop offset="0%" stopColor={dot} stopOpacity="0.75" />
              <stop offset="100%" stopColor={dot} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="fp-a2">
              <stop offset="0%" stopColor={dot} stopOpacity="0.45" />
              <stop offset="100%" stopColor={dot} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="11" cy="9" r="14" fill="url(#fp-a1)" />
          <circle cx="38" cy="25" r="16" fill="url(#fp-a2)" />
        </>
      )}

      {field === "dots" && (
        <g fill={dot}>
          {/* Many small dots — each a Little c */}
          {[
            [8, 8, 1, 0.4], [16, 14, 1, 0.5], [28, 9, 1, 0.35],
            [38, 18, 1, 0.45], [12, 22, 1, 0.3], [32, 25, 1, 0.4],
            [22, 20, 1, 0.5], [42, 10, 1, 0.3], [6, 16, 1, 0.35],
            /* "You" — brighter and larger */
            [24, 14, 2, 0.9],
          ].map(([x, y, r, o]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fillOpacity={o} />
          ))}
        </g>
      )}

      {field === "topology" && (
        <g stroke={stroke} fill="none" strokeLinecap="round">
          <path d="M4 10 Q12 6, 24 10 T44 8" strokeOpacity="0.5" strokeWidth="0.8" />
          <path d="M4 16 Q16 12, 24 16 T44 14" strokeOpacity="0.4" strokeWidth="0.8" />
          <path d="M4 22 Q14 18, 24 22 T44 20" strokeOpacity="0.3" strokeWidth="0.8" />
          <path d="M4 28 Q18 24, 28 28 T44 26" strokeOpacity="0.2" strokeWidth="0.8" />
        </g>
      )}

      {field === "ink" && (
        <g stroke={stroke} fill="none" strokeLinecap="round">
          <path d="M8 22 Q16 8, 24 14 T40 10" strokeOpacity="0.6" strokeWidth="1.5" />
          <path d="M12 28 Q22 18, 36 20" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      )}

      {field === "lattice" && (
        <g stroke={stroke} strokeOpacity="0.4">
          {[8, 18, 28, 38].map((x) => (
            <line key={`v${x}`} x1={x} y1="4" x2={x} y2="28" />
          ))}
          {[7, 16, 25].map((y) => (
            <line key={`h${y}`} x1="6" y1={y} x2="42" y2={y} />
          ))}
        </g>
      )}

      {field === "field" && (
        <g
          fill={dot}
          fontFamily="ui-monospace, monospace"
          fontSize="7"
          textAnchor="middle"
        >
          {[
            [9, 11, "0", 0.7],
            [19, 8, "1", 0.9],
            [30, 13, "0", 0.5],
            [40, 9, "1", 0.75],
            [13, 24, "1", 0.55],
            [26, 26, "0", 0.85],
            [37, 22, "1", 0.45],
          ].map(([x, y, b, o]) => (
            <text key={`${x}-${y}`} x={x} y={y} opacity={o}>
              {b}
            </text>
          ))}
        </g>
      )}

      {field === "off" && (
        <line
          x1="14"
          y1="22"
          x2="34"
          y2="10"
          stroke="currentColor"
          strokeOpacity="0.3"
        />
      )}
    </svg>
  );
};
