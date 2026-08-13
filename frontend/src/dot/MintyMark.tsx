import { motion } from "framer-motion";

interface MintyMarkProps {
  size?: number;
  thinking?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

const signals = [
  { x: 50, y: 7, cx: [50, 50, 50], cy: [7, 25, 50], delay: 0 },
  { x: 93, y: 50, cx: [93, 75, 50], cy: [50, 50, 50], delay: 0.55 },
  { x: 50, y: 93, cx: [50, 50, 50], cy: [93, 75, 50], delay: 1.1 },
  { x: 7, y: 50, cx: [7, 25, 50], cy: [50, 50, 50], delay: 1.65 },
];

/** DOT's settled mark, with source signals converging while Minty is thinking. */
export function MintyMark({
  size = 30,
  thinking = false,
  reducedMotion = false,
  className = "",
}: MintyMarkProps) {
  const active = thinking && !reducedMotion;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none">
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          stroke="var(--organism-accent-soft)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          animate={active ? { opacity: [0.35, 0.9, 0.35] } : { opacity: 0.72 }}
          transition={active ? { duration: 2.8, repeat: Infinity, ease: "easeInOut" } : {}}
        />
        <motion.g
          style={{ transformOrigin: "50px 50px" }}
          animate={active ? { rotate: 360 } : { rotate: 0 }}
          transition={active ? { duration: 9, repeat: Infinity, ease: "linear" } : {}}
        >
          <path
            d="M50 16C68 16 84 31 84 50C84 69 68 84 50 84"
            stroke="var(--organism-accent-strong)"
            strokeWidth="2.3"
            strokeLinecap="round"
            opacity="0.92"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M50 84C32 84 16 69 16 50C16 31 32 16 50 16"
            stroke="var(--organism-accent)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.58"
            vectorEffect="non-scaling-stroke"
          />
        </motion.g>
        <circle
          cx="50"
          cy="50"
          r="30"
          stroke="var(--organism-accent)"
          strokeWidth="1.5"
          opacity="0.56"
          vectorEffect="non-scaling-stroke"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="15"
          stroke="var(--organism-accent-strong)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          animate={active ? { r: [13, 17, 13], opacity: [0.28, 0.62, 0.28] } : { opacity: 0.36 }}
          transition={active ? { duration: 2.1, repeat: Infinity, ease: "easeInOut" } : {}}
        />

        {signals.map((signal) => (
          <motion.circle
            key={`${signal.x}-${signal.y}`}
            cx={signal.x}
            cy={signal.y}
            r="2.7"
            fill="var(--organism-accent-strong)"
            animate={
              active
                ? { cx: signal.cx, cy: signal.cy, opacity: [0, 0.9, 0], scale: [0.7, 1, 0.45] }
                : { opacity: 0 }
            }
            transition={
              active
                ? {
                    duration: 2.4,
                    delay: signal.delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : {}
            }
          />
        ))}

        <motion.circle
          cx="50"
          cy="50"
          r="7.5"
          fill="var(--organism-accent-strong)"
          animate={active ? { scale: [0.92, 1.12, 0.92] } : { scale: 1 }}
          style={{ transformOrigin: "50px 50px" }}
          transition={active ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
        />
        <circle cx="50" cy="50" r="3.2" fill="var(--background)" opacity="0.76" />
      </svg>
    </span>
  );
}

export default MintyMark;
