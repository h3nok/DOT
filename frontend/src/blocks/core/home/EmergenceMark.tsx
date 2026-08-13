import { motion } from "framer-motion";

/**
 * A point becomes an organism.
 *
 * The geometry and the colours are NucleusMark's exactly, so what settles at the
 * end of the sequence *is* the logo rather than a lookalike that dissolves into
 * it. What this component adds is the order of arrival: the centre first, then
 * structure outward, because that is the direction the book argues development
 * runs. A dot that is only a dot, then a dot that holds a boundary, then a dot
 * with a field around it.
 *
 * Every colour reads from the organism accent variables, which the theme bridge
 * recomputes from the member's tint, the time of day, and the light/dark base.
 * The emergence is therefore the member's own accent arriving, in whichever
 * theme they are in — the Appearance panel governs this surface like every other.
 */

const ACCENT = "var(--organism-accent)";
const ACCENT_STRONG = "var(--organism-accent-strong)";
const ACCENT_SOFT = "var(--organism-accent-soft)";

interface EmergenceMarkProps {
  size?: number;
  /** Skip the sequence and paint the settled mark (reduced motion, repeat visit). */
  settled?: boolean;
}

export function EmergenceMark({ size = 132, settled = false }: EmergenceMarkProps) {
  // With `settled` the whole timeline collapses to zero: same final frame, no motion.
  const t = (delay: number, duration: number) =>
    settled ? { duration: 0, delay: 0 } : { delay, duration, ease: "easeOut" as const };

  return (
    <span style={{ display: "inline-block", width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
        <defs>
          <radialGradient id="emergence-halo">
            <stop offset="0%" stopColor={ACCENT_STRONG} stopOpacity={0.34} />
            <stop offset="55%" stopColor={ACCENT} stopOpacity={0.12} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* The light the dot casts once it exists at all. */}
        <motion.circle
          cx={50}
          cy={50}
          r={46}
          fill="url(#emergence-halo)"
          initial={settled ? false : { opacity: 0, scale: 0.2 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: "50px 50px" }}
          transition={t(0.15, 2.4)}
        />

        {/* 1 — the dot. Nothing else exists yet. */}
        <motion.circle
          cx={50}
          cy={50}
          r={7.5}
          fill={ACCENT_STRONG}
          initial={settled ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ transformOrigin: "50px 50px" }}
          transition={
            settled ? { duration: 0 } : { delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }
          }
        />

        {/* 2 — a boundary: the first thing it holds against change. */}
        <motion.circle
          cx={50}
          cy={50}
          r={15}
          stroke={ACCENT_STRONG}
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
          initial={settled ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.36 }}
          transition={t(0.85, 0.9)}
        />

        {/* 3 — the two arcs: structure that is not yet closed. */}
        <motion.path
          d="M 50 16 C 68 16 84 31 84 50 C 84 69 68 84 50 84"
          stroke={ACCENT_STRONG}
          strokeWidth={2.25}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={settled ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.9 }}
          transition={t(1.15, 1.2)}
        />
        <motion.path
          d="M 50 84 C 32 84 16 69 16 50 C 16 31 32 16 50 16"
          stroke={ACCENT}
          strokeWidth={1.8}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={settled ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.56 }}
          transition={t(1.45, 1.2)}
        />

        {/* 4 — the field it now sits inside. */}
        <motion.circle
          cx={50}
          cy={50}
          r={30}
          stroke={ACCENT}
          strokeWidth={1.55}
          vectorEffect="non-scaling-stroke"
          initial={settled ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.62 }}
          transition={t(1.9, 1)}
        />
        <motion.circle
          cx={50}
          cy={50}
          r={44}
          stroke={ACCENT_SOFT}
          strokeWidth={1.35}
          vectorEffect="non-scaling-stroke"
          initial={settled ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={t(2.15, 1.1)}
        />

        {/* The interior the mark keeps for itself — the page showing through. */}
        <motion.circle
          cx={50}
          cy={50}
          r={3.25}
          fill="var(--background, white)"
          initial={settled ? false : { opacity: 0 }}
          animate={{ opacity: 0.72 }}
          transition={t(0.75, 0.6)}
        />
      </svg>
    </span>
  );
}

export default EmergenceMark;
