import { useId } from "react";
import "./explainer.css";

export interface CycleStep {
  id: string;
  /** One or two words, drawn on the ring. */
  label: string;
  title: string;
  /** Optional: a step can stand on its title alone. */
  text?: string;
  /** Optional: where the step is explained, so the list doubles as contents. */
  href?: string;
}

const SIZE = 420, CENTER = SIZE / 2, RADIUS = 150, NODE = 54;

/**
 * A loop: each step leads to the next and the last returns to the first. The
 * ring shows the shape; the list beside it carries every word, so the diagram
 * is never the only place the content lives.
 *
 * `list={false}` draws the ring alone, for an opening screen where each step is
 * explained further down: the nodes become the links, named by their titles.
 */
export function CycleDiagram({ steps, centre, label, returnNote, list = true }: {
  steps: readonly CycleStep[];
  centre: string;
  label: string;
  returnNote?: string;
  list?: boolean;
}) {
  const marker = `explainer-cycle-arrow-${useId().replace(/:/g, "")}`;
  // A longer centre phrase breaks into two balanced lines so it never reaches the ring.
  const words = centre.split(" ");
  const half = Math.ceil(words.length / 2);
  const centreLines = centre.length > 16 && words.length > 1 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [centre];
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
  const order = `${label}: ${steps.map(step => step.label).join(", then ")}, and back to ${steps[0]?.label}.`;
  return (
    <div className={`explainer-cycle${list ? "" : " explainer-cycle--ring"}`}>
      {/* With its list, the ring is a picture of it; alone, it is the group of links. */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role={list ? "img" : "group"} aria-label={order}>
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" className="explainer-cycle-arrowhead" /></marker>
        </defs>
        {/* A drawn arc measures itself as 1, so it can be drawn in; the dashed return keeps its own dashes. */}
        {steps.map((step, index) => {
          const back = index === steps.length - 1;
          return <path key={`arc-${step.id}`} d={arc(index)} pathLength={back ? undefined : 1} className={`explainer-cycle-arc${back ? " explainer-cycle-arc--return" : ""}`} markerEnd={`url(#${marker})`} aria-hidden="true" style={{ ["--ex-order" as string]: index }} />;
        })}
        {steps.map((step, index) => {
          const { x, y } = point(index);
          const node = (
            <g className="explainer-cycle-node" style={{ ["--ex-order" as string]: index }}>
              <circle cx={x} cy={y} r={NODE} />
              <text x={x} y={y - 6} textAnchor="middle" className="explainer-cycle-number">{String(index + 1).padStart(2, "0")}</text>
              <text x={x} y={y + 14} textAnchor="middle" className="explainer-cycle-label">{step.label}</text>
            </g>
          );
          if (list) return <g key={step.id}>{node}</g>;
          return step.href
            ? <a key={step.id} href={step.href} aria-label={step.title}>{node}</a>
            : <g key={step.id} role="img" aria-label={step.title}>{node}</g>;
        })}
        <text x={CENTER} y={CENTER + 6 - (centreLines.length - 1) * 12} textAnchor="middle" className="explainer-cycle-centre">
          {centreLines.map((line, index) => <tspan key={line} x={CENTER} dy={index ? 24 : 0}>{line}</tspan>)}
        </text>
      </svg>
      {list && <ol className="explainer-cycle-list">
        {steps.map((step, index) => (
          <li key={step.id}>
            <p className="explainer-cycle-step"><span>{String(index + 1).padStart(2, "0")}</span>{step.label}</p>
            <h3>{step.href ? <a href={step.href}>{step.title}</a> : step.title}</h3>
            {step.text && <p>{step.text}</p>}
          </li>
        ))}
      </ol>}
      {returnNote && <p className="explainer-cycle-return">{returnNote}</p>}
    </div>
  );
}
