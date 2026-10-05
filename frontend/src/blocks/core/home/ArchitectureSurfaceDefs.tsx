export function ArchitectureSurfaceDefs({ idPrefix }: { idPrefix: string }) {
  return (
    <>
      {/* Living surfaces only: RF₀ is structure, not a conscious organism. */}
      {["big-c", "local"].map((material) => (
        <radialGradient
          key={material}
          id={`${idPrefix}-${material}`}
          className="home-architecture-surface-gradient"
          data-material={material}
          cx="32%"
          cy="26%"
          r="85%"
        >
          <stop className="home-architecture-surface-light" offset="0%" />
          <stop className="home-architecture-surface-body" offset="38%" />
          <stop className="home-architecture-surface-turn" offset="76%" />
          <stop className="home-architecture-surface-shade" offset="100%" />
        </radialGradient>
      ))}
      <linearGradient id={`${idPrefix}-rim`} x1="0%" y1="0%" x2="75%" y2="100%">
        <stop className="home-architecture-rim-light" offset="0%" />
        <stop className="home-architecture-rim-mid" offset="46%" />
        <stop className="home-architecture-rim-shade" offset="78%" />
        <stop className="home-architecture-rim-light" offset="100%" stopOpacity="0.45" />
      </linearGradient>
      <filter
        id={`${idPrefix}-shadow`}
        x="-12%"
        y="-12%"
        width="124%"
        height="128%"
        colorInterpolationFilters="sRGB"
      >
        <feDropShadow dx="0" dy="3" stdDeviation="1.5" floodColor="var(--foreground)" floodOpacity="0.1" />
      </filter>
    </>
  );
}
