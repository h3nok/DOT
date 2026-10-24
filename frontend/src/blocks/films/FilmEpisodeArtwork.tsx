import React from "react";

export type FilmArtworkVariant =
  | "introduction"
  | "concepts"
  | "agency"
  | "open-questions"
  | "amm"
  | "amm-power"
  | string;

export const FilmEpisodeArtwork: React.FC<{ variant?: FilmArtworkVariant }> = ({
  variant = "introduction",
}) => {
  return (
    <svg
      viewBox="32 18 576 324"
      className="film-episode-svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`film-glow-${variant}`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="var(--organism-accent-strong)" stopOpacity="0.22" />
          <stop offset="60%" stopColor="var(--organism-accent)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Subtle architectural reticles */}
      <g stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.2" fill="none">
        <path d="M 46 52 L 46 36 L 62 36" />
        <path d="M 594 52 L 594 36 L 578 36" />
        <path d="M 46 308 L 46 324 L 62 324" />
        <path d="M 594 308 L 594 324 L 578 324" />
      </g>

      <circle cx="320" cy="180" r="150" fill={`url(#film-glow-${variant})`} />

      {variant === "introduction" && (
        <g transform="translate(320, 180)" fill="none">
          {/* Big C's own field: T and E are its capacities (Book One v4), not a ring around it. */}
          <circle r="128" stroke="var(--organism-accent-strong)" strokeOpacity="0.4" strokeWidth="1.3" strokeDasharray="3 6" />
          <circle r="112" stroke="var(--organism-accent-strong)" strokeOpacity="0.88" strokeWidth="2" />
          <circle r="76" stroke="var(--identity-rf)" strokeOpacity="0.85" strokeWidth="1.8" />
          <circle r="34" stroke="var(--organism-accent-strong)" strokeOpacity="0.92" strokeWidth="1.6" strokeDasharray="4 4" />
          <circle r="12" fill="var(--organism-accent-strong)" fillOpacity="0.9" />
          <circle r="4" fill="var(--background)" />
          <text y="-86" textAnchor="middle" fill="var(--organism-accent-strong)" fontSize="12" fontFamily="Space Grotesk, sans-serif" fontWeight="700">Big C [T, E]</text>
          <text y="-54" textAnchor="middle" fill="var(--identity-rf)" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">RF₀</text>
        </g>
      )}

      {variant === "concepts" && (
        <g transform="translate(320, 180)" fill="none">
          {/* 4-Step Experience Loop schematic */}
          <rect x="-170" y="-108" width="340" height="216" rx="16" stroke="var(--identity-rf)" strokeOpacity="0.45" strokeWidth="1.3" strokeDasharray="5 6" />
          <line x1="-66" y1="-56" x2="66" y2="-56" stroke="var(--organism-accent-strong)" strokeWidth="1.8" />
          <line x1="104" y1="-18" x2="104" y2="18" stroke="var(--identity-rf)" strokeWidth="1.8" />
          <line x1="66" y1="56" x2="-66" y2="56" stroke="var(--organism-accent-strong)" strokeWidth="1.8" />
          <line x1="-104" y1="18" x2="-104" y2="-18" stroke="var(--organism-accent-strong)" strokeWidth="1.8" />
          {[
            { x: -104, y: -56, label: "Reality", sub: "01 · RF₀" },
            { x: 104, y: -56, label: "Painting", sub: "02 · LENS" },
            { x: 104, y: 56, label: "Intent", sub: "03 · CHOICE" },
            { x: -104, y: 56, label: "Canvas", sub: "04 · RECORD" },
          ].map((node) => (
            <g key={node.label} transform={`translate(${node.x}, ${node.y})`}>
              <circle r="36" fill="var(--card)" stroke="var(--organism-accent-strong)" strokeWidth="1.6" />
              <text y="-4" textAnchor="middle" fill="currentColor" fontSize="11.5" fontFamily="Space Grotesk, sans-serif" fontWeight="700">{node.label}</text>
              <text y="12" textAnchor="middle" fill="var(--identity-rf)" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fontWeight="600">{node.sub}</text>
            </g>
          ))}
          <circle r="16" stroke="var(--organism-accent-strong)" strokeWidth="1.5" />
          <circle r="5" fill="var(--organism-accent-strong)" />
        </g>
      )}

      {variant === "agency" && (
        <g transform="translate(320, 180)" fill="none">
          {/* Fear (High Canvas Entropy) vs Love (Low Canvas Entropy) */}
          <circle cx="-132" cy="0" r="32" stroke="var(--identity-rf)" strokeWidth="1.8" />
          <text x="-132" y="4" textAnchor="middle" fill="var(--identity-rf)" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="700">RF₀</text>
          <path d="M -98 -8 C -52 -8, -48 -56, -12 -56" stroke="var(--identity-rf)" strokeWidth="1.8" />
          <path d="M -98 8 C -52 8, -48 56, -12 56" stroke="var(--organism-accent-strong)" strokeWidth="1.8" />
          <rect x="-10" y="-92" width="184" height="72" rx="10" fill="var(--card)" stroke="var(--identity-rf)" strokeOpacity="0.75" strokeWidth="1.5" />
          <text x="12" y="-64" fill="var(--identity-rf)" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700">FEAR · HIGH ENTROPY</text>
          <text x="12" y="-40" fill="currentColor" fontSize="13" fontFamily="Space Grotesk, sans-serif" fontWeight="700">Fragmented Canvas</text>
          <rect x="-10" y="20" width="184" height="72" rx="10" fill="var(--card)" stroke="var(--organism-accent-strong)" strokeOpacity="0.88" strokeWidth="1.5" />
          <text x="12" y="48" fill="var(--organism-accent-strong)" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700">LOVE · LOW ENTROPY</text>
          <text x="12" y="72" fill="currentColor" fontSize="13" fontFamily="Space Grotesk, sans-serif" fontWeight="700">Coherent Intent</text>
        </g>
      )}

      {variant === "open-questions" && (
        <g transform="translate(320, 180)" fill="none">
          <circle r="116" stroke="var(--organism-accent-strong)" strokeOpacity="0.5" strokeWidth="1.4" strokeDasharray="4 6" />
          <circle r="82" stroke="var(--identity-rf)" strokeOpacity="0.82" strokeWidth="1.8" />
          <line x1="-116" y1="0" x2="116" y2="0" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 5" />
          <line x1="0" y1="-116" x2="0" y2="116" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 5" />
          {[
            { y: -48, label: "01 · OBSERVATION", col: "var(--organism-accent-strong)" },
            { y: -16, label: "02 · EXTERNAL MODEL", col: "var(--organism-accent)" },
            { y: 16, label: "03 · DOT DERIVATION", col: "var(--identity-rf)" },
            { y: 48, label: "04 · SPECULATIVE EXTENSION", col: "var(--identity-origin)" },
          ].map((row) => (
            <g key={row.label} transform={`translate(0, ${row.y})`}>
              <rect x="-118" y="-12" width="236" height="24" rx="12" fill="var(--card)" stroke={row.col} strokeWidth="1.3" />
              <text y="4" textAnchor="middle" fill={row.col} fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700">{row.label}</text>
            </g>
          ))}
        </g>
      )}

      {(variant === "amm" || variant === "amm-power") && (
        <g transform="translate(320, 180)" fill="none">
          <circle r="118" stroke="var(--identity-rf)" strokeOpacity="0.85" strokeWidth="1.8" />
          <circle r="92" stroke="var(--identity-rf)" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="3 5" />
          <circle r="54" stroke="var(--organism-accent-strong)" strokeOpacity="0.9" strokeWidth="1.8" />
          <circle r="18" fill="var(--organism-accent-strong)" fillOpacity="0.22" stroke="var(--organism-accent-strong)" strokeWidth="1.6" />
          <circle r="5" fill="var(--organism-accent-strong)" />
          {[-135, -45, 45, 135].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = Math.cos(rad) * 112;
            const y1 = Math.sin(rad) * 112;
            const x2 = Math.cos(rad) * 60;
            const y2 = Math.sin(rad) * 60;
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--identity-rf)"
                strokeWidth="1.6"
                strokeDasharray={variant === "amm-power" ? "none" : "3 4"}
              />
            );
          })}
          <text y="-136" textAnchor="middle" fill="var(--identity-rf)" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            {variant === "amm-power" ? "DEPENDENCE · EXTRACTION · POWER" : "CULTURE · STATUS QUO · CANVAS"}
          </text>
        </g>
      )}
    </svg>
  );
};
