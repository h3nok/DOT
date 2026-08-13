import { NucleusMark } from "../dot";

/**
 * The brand lockup: the mark, then the name.
 *
 * This replaces an earlier acronym that drew a filled dot inside the letter O.
 * That version had to redraw the identity in CSS every time it appeared, so the
 * "dot" in DOT was a different shape from the dot the whole site is built
 * around — and on surfaces that already showed a separate dot beside the word,
 * it read as two marks competing. NucleusMark is the identity; the word is just
 * the word.
 *
 * Still by default. The mark breathes at hero size where it is the subject, but
 * a pulsing 16px logo in fixed chrome is movement with nothing to say.
 */
interface DotWordmarkProps {
  /** Mark diameter in px. The wordmark sits beside it at the caller's type size. */
  size?: number;
  /** Let the mark breathe. Off in chrome, on where the mark is the subject. */
  alive?: boolean;
  /** Applied to the word, so callers keep control of its type treatment. */
  className?: string;
}

export function DotWordmark({
  size = 16,
  alive = false,
  className = "",
}: DotWordmarkProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <NucleusMark size={size} reducedMotion={!alive} className="shrink-0" />
      <span className={className}>DOT</span>
    </span>
  );
}

export default DotWordmark;
