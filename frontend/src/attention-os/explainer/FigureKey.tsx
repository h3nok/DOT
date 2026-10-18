import "./explainer.css";

export interface FigureKeyItem { label: string; meaning: string; href?: string }

/** A short, readable key for a visual metaphor. Links take readers to its explanation. */
export function FigureKey({ items, label }: { items: readonly FigureKeyItem[]; label: string }) {
  return <dl className="explainer-key" aria-label={label}>
    {items.map(item => <div key={item.label}>
      <dt>{item.href ? <a href={item.href}>{item.label}<span aria-hidden="true"> ↗</span></a> : item.label}</dt>
      <dd>{item.meaning}</dd>
    </div>)}
  </dl>;
}
