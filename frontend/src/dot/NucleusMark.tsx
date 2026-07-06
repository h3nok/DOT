/**
 * NucleusMark — the fingerprint at the heart of the graph.
 *
 * The centre of every DOT surface is an identity: a Self, a Dot. This mark
 * renders that identity as a living fingerprint — concentric ridges that whorl
 * around a breathing core. It is monoline and reads entirely from the organism
 * accent variables, so it is alive (breathing, glowing) without any per-frame
 * work of its own, and it stays crisp at any size via non-scaling strokes.
 *
 * The fingerprint says: this place is held by someone. One Self, distinct,
 * keeping its form.
 */

interface NucleusMarkProps {
  /** Diameter in px. The mark scales crisply to any size. */
  size?: number;
  reducedMotion?: boolean;
  className?: string;
}

export const NucleusMark: React.FC<NucleusMarkProps> = ({
  size = 120,
  reducedMotion = false,
  className,
}) => {
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        animation: reducedMotion
          ? undefined
          : "nucleusBreathe var(--organism-breath, 8s) ease-in-out infinite",
      }}
      aria-hidden="true"
    >
      {/* Monoline concentric ridges — quiet, crisp, no gloss. */}
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        aria-hidden="true"
      >
        {[46, 38, 30, 22].map((r, i) => (
          <circle
            key={r}
            cx={50}
            cy={50}
            r={r}
            stroke="var(--organism-accent)"
            strokeWidth={1}
            opacity={0.2 + i * 0.1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <circle cx={50} cy={50} r={6} fill="var(--organism-accent-strong)" />
      </svg>
      <style>{`
        @keyframes nucleusBreathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.88; }
        }
        @keyframes orbSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
};

export default NucleusMark;
