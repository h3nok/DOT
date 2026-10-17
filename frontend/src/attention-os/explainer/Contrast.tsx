import { ArrowDown, ArrowUp } from "lucide-react";
import "./explainer.css";

export interface ContrastSide {
  direction: "up" | "down";
  /** The sentence the words complete. */
  line: string;
  words: readonly string[];
}

/** Two movements set against each other, word by word. */
export function Contrast({ sides }: { sides: readonly [ContrastSide, ContrastSide] }) {
  return (
    <div className="explainer-contrast">
      {sides.map(side => (
        <div key={side.line} className={`explainer-contrast-side explainer-contrast-side--${side.direction}`}>
          {side.direction === "up" ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
          <p>{side.line}</p>
          <ul>{side.words.map(word => <li key={word}>{word}</li>)}</ul>
        </div>
      ))}
    </div>
  );
}
