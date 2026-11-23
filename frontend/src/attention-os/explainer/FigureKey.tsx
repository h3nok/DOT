import "./explainer.css";

export interface FigureKeyItem { label: string; meaning?: string; href?: string; /** A colour the key explains; drawn as a swatch beside the label. */ swatch?: string }

function Term({ item }: { item: FigureKeyItem }) {
  return <>{item.swatch && <span className="explainer-key-swatch" aria-hidden="true" style={{ background: item.swatch }} />}{item.href ? <a href={item.href}>{item.label}<span aria-hidden="true"> ↗</span></a> : item.label}</>;
}

/**
 * A short, readable key for a visual metaphor. Links take readers to its explanation.
 * When no item needs a meaning, the key is a single line of names.
 */
export function FigureKey({ items, label }: { items: readonly FigureKeyItem[]; label: string }) {
  if (items.every(item => !item.meaning)) {
    return <ul className="explainer-key explainer-key--inline" aria-label={label}>
      {items.map(item => <li key={item.label}><Term item={item} /></li>)}
    </ul>;
  }
  return <dl className="explainer-key" aria-label={label}>
    {items.map(item => <div key={item.label}>
      <dt><Term item={item} /></dt>
      {item.meaning && <dd>{item.meaning}</dd>}
    </div>)}
  </dl>;
}
