import { useId } from "react";
import "./explainer.css";

export interface CycleStep {
  id: string;
  /** One or two words, drawn on the ring. */
  label: string;
  title: string;
  text: string;
}

const SIZE = 420, CENTER = SIZE / 2, RADIUS = 150, NODE = 54;

/**
 * A loop: each step leads to the next and the last returns to the first. The
 * ring shows the shape; the list beside it carries every word, so the diagram
 * is never the only place the content lives.
 */
export function CycleDiagram({ steps, centre, label, returnNote }: {
  steps: readonly CycleStep[];
  centre: string;
  label: string;
  returnNote?: string;
}) {
  const marker = `explainer-cycle-arrow-${useId().replace(/:/g, "")}`;
  const angle = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / steps.length;
  const point = (index: number, radius = RADIUS) => ({ x: CENTER + radius * Math.cos(angle(index)), y: CENTER + radius * Math.sin(angle(index)) });
  // Arcs run along the ring from one node's edge to the next node's edge.
  const gap = Math.asin(NODE / RADIUS) + 0.08;
  const arc = (index: number) => {
    const from = angle(index) + gap, to = angle(index + 1) - gap;
    const a = { x: CENTER + RADIUS * Math.cos(from), y: CENTER + RADIUS * Math.sin(from) };
    const b = { x: CENTER + RADIUS * Math.cos(to), y: CENTER + RADIUS * Math.sin(to) };
    return `M${a.x.toFixed(1)} ${a.y.toFixed(1)}A${RADIUS} ${RADIUS} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  };
  return (
    <div className="explainer-cycle">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`${label}: ${steps.map(step => step.label).join(", then ")}, and back to ${steps[0]?.label}.`}>
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="explainer-cycle-arrowhead" /></marker>
        </defs>
        {steps.map((step, index) => <path key={`arc-${step.id}`} d={arc(index)} className={`explainer-cycle-arc${index === steps.length - 1 ? " explainer-cycle-arc--return" : ""}`} markerEnd={`url(#${marker})`} />)}
        {steps.map((step, index) => {
          const { x, y } = point(index);
          return (
            <g key={step.id} className="explainer-cycle-node">
              <circle cx={x} cy={y} r={NODE} />
              <text x={x} y={y - 6} textAnchor="middle" className="explainer-cycle-number">{String(index + 1).padStart(2, "0")}</text>
              <text x={x} y={y + 14} textAnchor="middle" className="explainer-cycle-label">{step.label}</text>
            </g>
          );
        })}
        <text x={CENTER} y={CENTER + 6} textAnchor="middle" className="explainer-cycle-centre">{centre}</text>
      </svg>
      <ol className="explainer-cycle-list">
        {steps.map((step, index) => (
          <li key={step.id}>
            <p className="explainer-cycle-step"><span>{String(index + 1).padStart(2, "0")}</span>{step.label}</p>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      {returnNote && <p className="explainer-cycle-return">{returnNote}</p>}
    </div>
  );
}
