/**
 * NucleusMark — the fingerprint at the heart of the graph.
 *
 * The centre of every DOT surface is an identity: a Self, a Dot. This mark
 * renders that identity as a clear central dot held inside a stable field. It
 * reads entirely from the organism accent variables, so the mark follows the
 * selected theme and stays crisp at any size via non-scaling strokes.
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
  const classes = ["nucleus-mark", className].filter(Boolean).join(" ");

  return (
    <span
      className={classes}
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
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx={50}
          cy={50}
          r={44}
          stroke="var(--organism-accent-soft, color-mix(in oklch, var(--organism-accent) 32%, transparent))"
          strokeWidth={1.35}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={50}
          cy={50}
          r={30}
          stroke="var(--organism-accent)"
          strokeWidth={1.55}
          opacity={0.62}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 50 16 C 68 16 84 31 84 50 C 84 69 68 84 50 84"
          stroke="var(--organism-accent-strong)"
          strokeWidth={2.25}
          strokeLinecap="round"
          opacity={0.9}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 50 84 C 32 84 16 69 16 50 C 16 31 32 16 50 16"
          stroke="var(--organism-accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.56}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={50}
          cy={50}
          r={15}
          stroke="var(--organism-accent-strong)"
          strokeWidth={1.4}
          opacity={0.36}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={50} cy={50} r={7.5} fill="var(--organism-accent-strong)" />
        <circle cx={50} cy={50} r={3.25} fill="var(--background, white)" opacity={0.72} />
      </svg>
    </span>
  );
};

export default NucleusMark;
