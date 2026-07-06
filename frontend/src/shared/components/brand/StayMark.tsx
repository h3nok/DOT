import type { CSSProperties } from "react";

// Stay logo system — duotone, single signal accent.
//
// The mark is a held dot inside a stabilized ring: a Self that keeps its form.
// Everything is monoline and currentColor-driven except the held center dot,
// which carries the signal accent. Scales cleanly from favicon to billboard.

interface StayMarkProps {
  size?: number;
  accent?: string;
  /** Color of the ring / structure. Defaults to currentColor. */
  ink?: string;
  className?: string;
  title?: string;
}

export const StayMark = ({
  size = 48,
  accent = "#00a896",
  ink = "currentColor",
  className,
  title = "Stay",
}: StayMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    role="img"
    aria-label={title}
    className={className}
  >
    {/* Stabilized field — the substrate that holds */}
    <circle
      cx="24"
      cy="24"
      r="20"
      stroke={ink}
      strokeOpacity="0.9"
      strokeWidth="1.6"
    />
    {/* Inner discipline ring */}
    <circle
      cx="24"
      cy="24"
      r="13"
      stroke={ink}
      strokeOpacity="0.35"
      strokeWidth="1.2"
      strokeDasharray="1.2 3.2"
    />
    {/* The held dot — a Self that stays */}
    <circle cx="24" cy="24" r="5.2" fill={accent} />
    <circle
      cx="24"
      cy="24"
      r="5.2"
      stroke={accent}
      strokeOpacity="0.35"
      strokeWidth="3"
    />
  </svg>
);

interface StayLockupProps {
  size?: number;
  accent?: string;
  ink?: string;
  tagline?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const StayLockup = ({
  size = 40,
  accent = "#00a896",
  ink = "currentColor",
  tagline = false,
  className,
  style,
}: StayLockupProps) => (
  <span
    className={`inline-flex items-center gap-3 ${className ?? ""}`}
    style={style}
  >
    <StayMark size={size} accent={accent} ink={ink} />
    <span className="flex flex-col leading-none">
      <span
        className="font-serif font-black tracking-tight"
        style={{ fontSize: size * 0.62, color: ink }}
      >
        Stay
      </span>
      {tagline ? (
        <span
          className="mt-1 font-mono uppercase tracking-[0.24em]"
          style={{ fontSize: size * 0.17, color: ink, opacity: 0.55 }}
        >
          Hold your form
        </span>
      ) : null}
    </span>
  </span>
);

export default StayMark;
