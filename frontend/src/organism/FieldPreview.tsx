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

      {field === "neural" && (
        <g stroke={stroke} fill={dot}>
          {/* Nodes with pulsing connections — a living network. */}
          <line x1="8" y1="10" x2="20" y2="16" strokeOpacity="0.5" />
          <line x1="20" y1="16" x2="34" y2="10" strokeOpacity="0.35" />
          <line x1="20" y1="16" x2="18" y2="26" strokeOpacity="0.4" />
          <line x1="34" y1="10" x2="40" y2="22" strokeOpacity="0.3" />
          <line x1="18" y1="26" x2="34" y2="24" strokeOpacity="0.25" />
          {[
            [8, 10, 2],
            [20, 16, 2.5],
            [34, 10, 2],
            [18, 26, 1.8],
            [40, 22, 1.5],
            [34, 24, 1.5],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} stroke="none" fillOpacity="0.8" />
          ))}
        </g>
      )}

      {field === "breath" && (
        <g stroke={stroke} fill="none">
          <circle cx="24" cy="16" r="5" strokeOpacity="0.6" />
          <circle cx="24" cy="16" r="10" strokeOpacity="0.35" />
          <circle cx="24" cy="16" r="15" strokeOpacity="0.15" />
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
