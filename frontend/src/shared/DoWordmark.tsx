import { NucleusMark } from "../dot/NucleusMark";
import "./do-wordmark.css";

interface DoWordmarkProps {
  /** One brief emergence, followed by stillness. Never starts a breathing loop. */
  emerge?: boolean;
  /** Smaller signature for footers and compact reading controls. */
  compact?: boolean;
}

/** DOT's site signature: the shared nucleus supplies the O and its central dot. */
export function DoWordmark({ emerge = false, compact = false }: DoWordmarkProps) {
  return (
    <span
      className={`do-wordmark${compact ? " do-wordmark--compact" : ""}`}
      role="img"
      aria-label="DOT"
      data-emergence={emerge ? "play" : "still"}
    >
      <span className="do-wordmark__d" aria-hidden="true">
        D
      </span>
      <span className="do-wordmark__o" aria-hidden="true">
        <NucleusMark size="100%" reducedMotion />
      </span>
      <span className="do-wordmark__t" aria-hidden="true">
        T
      </span>
    </span>
  );
}
