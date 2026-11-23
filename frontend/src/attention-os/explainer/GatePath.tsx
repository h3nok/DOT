import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import "./explainer.css";

export interface GateStep {
  id: string;
  /** The whole sentence, read by assistive technology in place of the drawing. */
  sentence: string;
  /** What the person needs, and who or what stands in front of it. */
  need: string;
  gate: string;
  needIcon?: ReactNode;
  gateIcon?: ReactNode;
}

/**
 * A person, the gate that stands in front of a need, and the need itself, drawn
 * as one path per need. The drawing is a picture of the sentence; the sentence
 * itself is what a screen reader hears, so no meaning lives only in the layout.
 */
export function GatePath({ steps, you, label }: { steps: readonly GateStep[]; you: string; label: string }) {
  return (
    <figure className="explainer-gates" aria-label={label}>
      <span className="explainer-gates-you" aria-hidden="true">{you}</span>
      <ul>
        {steps.map((step, index) => (
          <li key={step.id} style={{ ["--ex-order" as string]: index }}>
            <span className="explainer-visually-hidden">{step.sentence}</span>
            <span className="explainer-gates-row" aria-hidden="true">
              <span className="explainer-gates-line" />
              <span className="explainer-gates-gate">{step.gateIcon}{step.gate}</span>
              <span className="explainer-gates-line"><ArrowRight /></span>
              <span className="explainer-gates-need">{step.needIcon}{step.need}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
