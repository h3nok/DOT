import "./explainer.css";

export interface ExplainerQuestion {
  id: string;
  title: string;
  text: string;
}

/** Questions a reader can carry into the text, numbered and answerable. */
export function Questions({ items, label, headingLevel = 3 }: { items: readonly ExplainerQuestion[]; label: string; headingLevel?: 3 | 4 }) {
  const Heading = headingLevel === 4 ? "h4" : "h3";
  return (
    <ol className="explainer-questions" aria-label={label}>
      {items.map((item, index) => (
        <li key={item.id}>
          <span className="explainer-questions-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <Heading>{item.title}</Heading>
          <p>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
