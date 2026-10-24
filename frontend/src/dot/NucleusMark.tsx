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
  /** Diameter in px or a CSS length, such as 100% of a square cover frame. */
  size?: number | string;
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
        shapeRendering="geometricPrecision"
        aria-hidden="true"
      >
        <circle
          className="nucleus-mark-field"
          cx={50}
          cy={50}
          r={43.5}
          stroke="var(--organism-accent-soft, color-mix(in oklch, var(--organism-accent) 42%, transparent))"
          strokeWidth={1.15}
          strokeDasharray="3 5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="nucleus-mark-ring"
          cx={50}
          cy={50}
          r={33.64}
          stroke="var(--organism-accent)"
          strokeWidth={1.5}
          opacity={0.78}
          vectorEffect="non-scaling-stroke"
        />
        <g
          className="nucleus-mark-nodes"
          fill="var(--organism-accent-strong)"
          opacity={0.86}
        >
          <circle cx={50} cy={16.36} r={2} />
          <circle cx={83.64} cy={50} r={2} />
          <circle cx={50} cy={83.64} r={2} />
          <circle cx={16.36} cy={50} r={2} />
        </g>
        <g className="nucleus-mark-arcs">
          <path
            d="M 50 22 C 65.5 22 78 34.5 78 50 C 78 65.5 65.5 78 50 78"
            stroke="var(--organism-accent-strong)"
            strokeWidth={2.15}
            strokeLinecap="round"
            opacity={0.92}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M 50 78 C 34.5 78 22 65.5 22 50 C 22 34.5 34.5 22 50 22"
            stroke="var(--organism-accent)"
            strokeWidth={1.75}
            strokeLinecap="round"
            opacity={0.68}
            vectorEffect="non-scaling-stroke"
          />
        </g>
        <circle
          className="nucleus-mark-inner"
          cx={50}
          cy={50}
          r={16.5}
          stroke="var(--organism-accent-strong)"
          strokeWidth={1.35}
          opacity={0.54}
          vectorEffect="non-scaling-stroke"
        />
        <circle
          className="nucleus-mark-core"
          cx={50}
          cy={50}
          r={8.6}
          fill="var(--organism-accent-strong)"
        />
        <circle
          className="nucleus-mark-pin"
          cx={50}
          cy={50}
          r={3.4}
          fill="var(--background, white)"
          opacity={0.92}
        />
      </svg>
    </span>
  );
};

export default NucleusMark;
