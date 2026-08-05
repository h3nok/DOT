import { useMemo } from "react";
import { motion } from "framer-motion";
/**
 * SynapticEdge — a living, curved connection from the nucleus to a node.
 *
 * Replaces a plain dashed `<line>` with a quadratic Bézier arc that bows
 * gently away from the straight path. Two–three luminous particles flow along
 * the curve on the organism heartbeat, and the whole edge brightens when its
 * target node is hovered or selected.
 *
 * Everything reads from the organism CSS variables so the edge colour, glow,
 * and cadence match the rest of the living skin. Under reduced motion the
 * particles become static accent dots and no animation runs.
 */

interface SynapticEdgeProps {
  /** Centre of the nucleus. */
  cx: number;
  cy: number;
  /** Position of the target node. */
  px: number;
  py: number;
  /** Unique key for CSS id scoping. */
  id: string;
  /** Index for staggered timing. */
  index: number;
  /** Whether this edge's node is hovered. */
  hovered?: boolean;
  /** Whether this edge's node is selected. */
  active?: boolean;
  reducedMotion?: boolean;
}

/**
 * Perpendicular offset for the Bézier control point.
 * A positive offset bows the curve clockwise (looking from start → end).
 */
const CURVE_OFFSET = 0.12;
/** Edges leave the nucleus at the avatar's rim and stop at the node's halo. */
const TRIM_START = 68;
const TRIM_END = 20;
export const SynapticEdge: React.FC<SynapticEdgeProps> = ({
  cx,
  cy,
  px,
  py,
  index,
  hovered = false,
  active = false,
  reducedMotion = false,
}) => {
  // Trim the straight span at both ends, then bow the remaining arc with a
  // quadratic Bézier control point offset perpendicular to the line.
  const geometry = useMemo(() => {
    const dx = px - cx;
    const dy = py - cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const trimStart = Math.min(TRIM_START, len * 0.4);
    const trimEnd = Math.min(TRIM_END, len * 0.15);
    const sx = cx + ux * trimStart;
    const sy = cy + uy * trimStart;
    const ex = px - ux * trimEnd;
    const ey = py - uy * trimEnd;

    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const span = Math.hypot(ex - sx, ey - sy) || 1;
    // Perpendicular unit vector, alternating direction.
    const sign = index % 2 === 0 ? 1 : -1;
    const perpX = (-uy) * sign;
    const perpY = ux * sign;
    const offset = span * CURVE_OFFSET;
    const ctrlX = mx + perpX * offset;
    const ctrlY = my + perpY * offset;

    return {
      d: `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${ex} ${ey}`,
      sx,
      sy,
      ex,
      ey,
    };
  }, [cx, cy, px, py, index]);

  const lit = hovered || active;
  const strokeWidth = lit ? 1.6 : 1;

  return (
    <g>
      {/* The arc: one line, one relation. Drawing in is the `connect`
          gesture; brightening is the whole hover treatment. */}
      <motion.path
        d={geometry.d}
        fill="none"
        stroke="var(--attention-line, var(--organism-accent))"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={!reducedMotion ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: lit ? 0.9 : 0.45 }}
        transition={{ duration: 0.8, delay: 0.4 + index * 0.05, ease: "easeOut" }}
        style={{
          transition: "stroke-width 300ms ease",
        }}
      />

      {/* Accent dots at the trimmed endpoints — the synapse terminals. */}
      <circle
        cx={geometry.sx}
        cy={geometry.sy}
        r={1.8}
        fill="var(--primary)"
        opacity={lit ? 0.8 : 0.35}
        style={{ transition: "opacity 300ms ease" }}
      />
      <circle
        cx={geometry.ex}
        cy={geometry.ey}
        r={2}
        fill="var(--organism-accent-strong)"
        opacity={lit ? 0.7 : 0.3}
        style={{ transition: "opacity 300ms ease" }}
      />
    </g>
  );
};

export default SynapticEdge;
