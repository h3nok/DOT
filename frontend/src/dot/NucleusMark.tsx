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
 *
 * `thinking` is the same mark working, not a second mark: the arcs sweep, the
 * field and inner ring breathe, the core pulses. Every radius, stroke, and
 * colour is the settled logo's, and nothing is added while it runs — Minty's
 * working state has to *be* DOT's identity rather than resemble it. The motion
 * lives in `index.css` so the mark stays a drawing.
 */

interface NucleusMarkProps {
  /** Diameter in px. The mark scales crisply to any size. */
  size?: number;
  /** The mark at work: its own parts in motion while an answer is forming. */
  thinking?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

export const NucleusMark: React.FC<NucleusMarkProps> = ({
  size = 120,
  thinking = false,
  reducedMotion = false,
  className,
}) => {
  const classes = ["nucleus-mark", className].filter(Boolean).join(" ");
  const working = thinking && !reducedMotion;

  return (
    <span
      className={classes}
      data-thinking={working ? "true" : undefined}
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
          className="nucleus-mark-field"
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
        <g className="nucleus-mark-arcs">
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
        </g>
        <circle
          className="nucleus-mark-inner"
          cx={50}
          cy={50}
          r={15}
          stroke="var(--organism-accent-strong)"
          strokeWidth={1.4}
          opacity={0.36}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="nucleus-mark-core"
          cx={50}
          cy={50}
          r={7.5}
          fill="var(--organism-accent-strong)"
        />
        <circle cx={50} cy={50} r={3.25} fill="var(--background, white)" opacity={0.72} />
      </svg>
    </span>
  );
};

export default NucleusMark;
