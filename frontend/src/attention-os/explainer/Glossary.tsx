import "./explainer.css";

export interface GlossaryTerm {
  id: string;
  term: string;
  text: string;
}

/** Terms defined in plain language, side by side. */
export function Glossary({ terms }: { terms: readonly GlossaryTerm[] }) {
  return (
    <dl className="explainer-glossary">
      {terms.map(item => <div key={item.id}><dt>{item.term}</dt><dd>{item.text}</dd></div>)}
    </dl>
  );
}
