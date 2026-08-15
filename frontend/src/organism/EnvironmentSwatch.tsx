import React from "react";
import type { ThemePreset } from "./themePresets";

/**
 * An environment, drawn small.
 *
 * The cards used to show a ground, an accent rule, and three grey lines —
 * enough to tell Vellum from Midnight by colour, and nothing at all about what
 * the page would actually feel like. An environment is mostly its field: the
 * thing moving behind the text is the difference between Synapse and Nocturne,
 * and colour alone cannot say which is which.
 *
 * So each card draws its own field's grammar over its own ground — blooms for
 * Painting, scattered bits for Canvas, contours for Topology — in the preset's
 * colours rather than the live accent, because a card has to describe the
 * environment it offers, not the one currently running.
 *
 * Decorative throughout; the panel supplies the accessible name.
 */
export const EnvironmentSwatch: React.FC<{ preset: ThemePreset }> = ({ preset }) => {
  const { surface, ink, accent } = preset.swatch;
  const field = preset.config.preset;
  // Gradients live in the document, so ids must not collide between cards.
  const id = `env-${preset.id}`;

  return (
    <svg
      viewBox="0 0 64 40"
      className="block h-11 w-full rounded-lg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-bloom`}>
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width="64" height="40" rx="6" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect x="0" y="0" width="64" height="40" fill={surface} />

        {field === "aurora" && (
          <>
            <circle cx="14" cy="10" r="20" fill={`url(#${id}-bloom)`} opacity="0.7" />
            <circle cx="52" cy="32" r="22" fill={`url(#${id}-bloom)`} opacity="0.45" />
          </>
        )}

        {field === "field" && (
          <g fill={accent}>
            {[
              [7, 8, 0.5], [19, 5, 0.32], [30, 11, 0.42], [44, 7, 0.3],
              [56, 13, 0.38], [11, 20, 0.34], [25, 26, 0.3], [38, 21, 0.44],
              [51, 27, 0.28], [16, 33, 0.26], [33, 35, 0.34], [59, 34, 0.24],
            ].map(([x, y, o]) => (
              <rect key={`${x}-${y}`} x={x} y={y} width="1.6" height="1.6" fillOpacity={o} />
            ))}
          </g>
        )}

        {field === "dots" && (
          <g fill={accent}>
            {[
              [10, 9, 1, 0.4], [22, 15, 1, 0.5], [36, 8, 1, 0.35], [50, 19, 1, 0.45],
              [15, 27, 1, 0.32], [42, 31, 1, 0.4], [57, 10, 1, 0.3], [28, 33, 1, 0.35],
            ].map(([x, y, r, o]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fillOpacity={o} />
            ))}
            {/* One centre brighter than the rest — the reader among many. */}
            <circle cx="32" cy="21" r="2.1" fillOpacity="0.95" />
          </g>
        )}

        {field === "topology" && (
          <g stroke={accent} fill="none" strokeLinecap="round" strokeWidth="1">
            <path d="M-2 12 Q14 5, 32 12 T66 9" strokeOpacity="0.5" />
            <path d="M-2 20 Q18 12, 32 20 T66 17" strokeOpacity="0.38" />
            <path d="M-2 28 Q16 21, 32 28 T66 25" strokeOpacity="0.28" />
            <path d="M-2 36 Q20 29, 34 36 T66 33" strokeOpacity="0.18" />
          </g>
        )}

        {field === "ink" && (
          <g stroke={accent} fill="none" strokeLinecap="round">
            <path d="M6 30 Q20 6, 34 18 T58 11" strokeOpacity="0.55" strokeWidth="2.4" />
            <path d="M10 36 Q26 22, 44 30" strokeOpacity="0.25" strokeWidth="1.2" />
          </g>
        )}

        {field === "lattice" && (
          <g stroke={accent} fill="none" strokeWidth="0.7" strokeOpacity="0.4">
            {[8, 20, 32, 44, 56].map((x, i) => (
              <path key={`v${x}`} d={`M${x} -2 Q${x + (i % 2 ? 3 : -3)} 20, ${x} 42`} />
            ))}
            {[8, 20, 32].map((y, i) => (
              <path key={`h${y}`} d={`M-2 ${y} Q32 ${y + (i % 2 ? 3 : -3)}, 66 ${y}`} />
            ))}
          </g>
        )}

        {/* Three lines of text, so every card reads as a page. */}
        <g stroke={ink} strokeLinecap="round" strokeWidth="1.6">
          <line x1="10" y1="14" x2="40" y2="14" strokeOpacity="0.5" />
          <line x1="10" y1="21" x2="54" y2="21" strokeOpacity="0.34" />
          <line x1="10" y1="28" x2="33" y2="28" strokeOpacity="0.24" />
        </g>

        {/* The accent rule, kept as the one saturated mark on the page. */}
        <line
          x1="10"
          y1="7"
          x2="26"
          y2="7"
          stroke={accent}
          strokeWidth="2"
          strokeLinecap="round"
        />

        <rect
          x="0.5"
          y="0.5"
          width="63"
          height="39"
          rx="5.5"
          fill="none"
          stroke={ink}
          strokeOpacity="0.16"
        />
      </g>
    </svg>
  );
};
