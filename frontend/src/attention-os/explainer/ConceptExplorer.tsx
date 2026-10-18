import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import "./concept-explorer.css";

export interface ExplainerConcept {
  id: string;
  label: string;
  hint: string;
  title: string;
  text: string;
  question: string;
  icon?: ReactNode;
  visual?: ReactNode;
}

/** A finite set of concepts. Selection is explicit; focus never leaves the reader. */
export function ConceptExplorer({ label, questionLabel, items }: {
  label: string;
  questionLabel: string;
  items: readonly ExplainerConcept[];
}) {
  const id = useId();
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    setSelected(next);
    buttons.current[next]?.focus();
  }
  return <div className="concept-explorer">
    <div className="concept-explorer-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => <button type="button" role="tab" key={item.id}
        id={`${id}-tab-${item.id}`} aria-controls={`${id}-panel-${item.id}`}
        aria-selected={selected === index} aria-label={item.label} tabIndex={selected === index ? 0 : -1}
        ref={node => { buttons.current[index] = node; }}
        onClick={() => setSelected(index)} onKeyDown={event => navigate(event, index)}>
        <span className="concept-explorer-icon" aria-hidden="true">{item.icon}</span>
        <strong>{item.label}</strong><span className="concept-explorer-hint">{item.hint}</span>
      </button>)}
    </div>
    <div className="concept-explorer-panels">
      {items.map((item, index) => <div role="tabpanel" key={item.id}
        id={`${id}-panel-${item.id}`} aria-labelledby={`${id}-tab-${item.id}`}
        aria-hidden={selected !== index} inert={selected !== index}
        tabIndex={selected === index ? 0 : -1} className="concept-explorer-panel" data-illustrated={Boolean(item.visual)}>
        {item.visual && <div className="concept-explorer-visual">{item.visual}</div>}
        <div className="concept-explorer-explanation"><h3>{item.title}</h3><p>{item.text}</p></div>
        <div className="concept-explorer-question"><span>{questionLabel}</span><p>{item.question}</p></div>
      </div>)}
    </div>
  </div>;
}
