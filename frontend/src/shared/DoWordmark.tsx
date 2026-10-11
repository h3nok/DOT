import { NucleusMark } from "../dot/NucleusMark";
import "./do-wordmark.css";

interface DoWordmarkProps {
  /** One brief emergence, followed by stillness. Never starts a breathing loop. */
  emerge?: boolean;
}

/** The home signature: the shared nucleus supplies the O and its central dot. */
export function DoWordmark({ emerge = false }: DoWordmarkProps) {
  return (
    <span
      className="do-wordmark"
      role="img"
      aria-label="DO"
      data-emergence={emerge ? "play" : "still"}
    >
      <span className="do-wordmark__d" aria-hidden="true">
        D
      </span>
      <span className="do-wordmark__o" aria-hidden="true">
        <NucleusMark size="100%" reducedMotion />
      </span>
    </span>
  );
}
