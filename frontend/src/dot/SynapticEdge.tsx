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
  // Compute the quadratic Bézier control point by offsetting the midpoint
  // perpendicular to the line. Alternate the direction by index so edges
  // don't all bow the same way.
  const d = useMemo(() => {
    const mx = (cx + px) / 2;
    const my = (cy + py) / 2;
    const dx = px - cx;
    const dy = py - cy;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular unit vector, alternating direction.
    const sign = index % 2 === 0 ? 1 : -1;
    const perpX = (-dy / len) * sign;
    const perpY = (dx / len) * sign;
    const offset = len * CURVE_OFFSET;
    const ctrlX = mx + perpX * offset;
    const ctrlY = my + perpY * offset;

    return `M ${cx} ${cy} Q ${ctrlX} ${ctrlY} ${px} ${py}`;
  }, [cx, cy, px, py, index]);

  const lit = hovered || active;
  const strokeWidth = lit ? 1.6 : 1;

  return (
    <g>
      {/* The arc: one line, one relation. Drawing in is the `connect`
          gesture; brightening is the whole hover treatment. */}
      <motion.path
        d={d}
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

      {/* Static accent dots at connection points */}
      <circle
        cx={cx}
        cy={cy}
        r={2.5}
        fill="var(--primary)"
        opacity={lit ? 0.9 : 0.5}
        style={{ transition: "opacity 300ms ease" }}
      />
      <circle
        cx={px}
        cy={py}
        r={2}
        fill="var(--organism-accent-strong)"
        opacity={lit ? 0.7 : 0.3}
        style={{ transition: "opacity 300ms ease" }}
      />
    </g>
  );
};

export default SynapticEdge;
