import type { Transition, Variants } from "framer-motion";

/**
 * Organismic motion — the shared animation vocabulary for DOT.
 *
 * Every surface in DOT moves like living tissue, not like UI. Rather than each
 * component hand-rolling springs and easings, they all draw from this one
 * grammar so the whole system breathes with a single character:
 *
 *  - **bloom** — content grows out of the nucleus and settles, like a cell
 *    swelling into form. Used by every focused surface.
 *  - **stagger** — a list reveals one item after another, like cells dividing
 *    in sequence rather than appearing all at once.
 *  - **emerge** — a single element rises softly into place.
 *
 * The easings are deliberately asymmetric (quick to arrive, slow to settle) so
 * motion feels alive and exhaled rather than mechanical. All of it collapses to
 * a plain fade when the viewer asks for reduced motion.
 */

/** Asymmetric ease: arrives with intent, settles like a held breath. */
export const EASE_SETTLE: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Soft organic ease for ambient drift and ring expansion. */
export const EASE_BREATHE: [number, number, number, number] = [
  0.37, 0, 0.63, 1,
];

/** The spring a surface card grows on — supple, lightly damped, never bouncy. */
export const ORGANIC_SPRING: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 26,
};

/** A quicker spring for small interactive elements (dots, chips, buttons). */
export const ORGANIC_SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 22,
};

/**
 * Bloom transform for a card growing from a screen-space origin (the nucleus)
 * to the centre. Returns framer-motion props; falls back to a plain fade under
 * reduced motion.
 */
export function bloomFromOrigin(
  origin: { x: number; y: number } | undefined,
  reducedMotion: boolean,
) {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0 },
    };
  }
  if (!origin) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    };
  }
  const cx = typeof window !== "undefined" ? window.innerWidth / 2 : origin.x;
  const cy = typeof window !== "undefined" ? window.innerHeight / 2 : origin.y;
  const dx = origin.x - cx;
  const dy = origin.y - cy;
  return {
    initial: { opacity: 0, scale: 0.18, x: dx, y: dy, filter: "blur(6px)" },
    animate: { opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.2, x: dx, y: dy, filter: "blur(8px)" },
    transition: ORGANIC_SPRING,
  };
}

/**
 * Stagger container — orchestrates children revealing in sequence. Pair with
 * {@link staggerChild} on each item. Use `custom={reducedMotion}` to silence.
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: (reducedMotion: boolean = false) => ({
    transition: reducedMotion
      ? {}
      : { staggerChildren: 0.055, delayChildren: 0.04 },
  }),
};

/** A single staggered item — swells into place like a dividing cell. */
export const staggerChild: Variants = {
  hidden: (reducedMotion: boolean = false) =>
    reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 8, scale: 0.97, filter: "blur(2px)" },
  visible: (reducedMotion: boolean = false) =>
    reducedMotion
      ? { opacity: 1, transition: { duration: 0.2 } }
      : {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 0.5, ease: EASE_SETTLE },
        },
};

/** A single element rising softly into place. */
export const emerge: Variants = {
  hidden: (reducedMotion: boolean = false) =>
    reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
  visible: (reducedMotion: boolean = false) =>
    reducedMotion
      ? { opacity: 1, transition: { duration: 0.2 } }
      : { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_SETTLE } },
};
