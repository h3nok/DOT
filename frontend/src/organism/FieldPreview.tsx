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
      className="h-8 w-12 shrink-0 rounded-md bg-foreground/[0.04]"
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

      {field === "constellation" && (
        <g stroke={stroke} fill={dot}>
          {/* Pairs and one short chain — never a mesh. */}
          <line x1="7" y1="8" x2="16" y2="13" strokeOpacity="0.45" />
          <line x1="16" y1="13" x2="24" y2="7" strokeOpacity="0.45" />
          <line x1="33" y1="20" x2="41" y2="24" strokeOpacity="0.3" />
          {[
            [7, 8, 1.5],
            [16, 13, 1.5],
            [24, 7, 1.5],
            [33, 20, 1.2],
            [41, 24, 1.2],
            [12, 25, 1],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} stroke="none" />
          ))}
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
