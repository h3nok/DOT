import "./explainer.css";

/**
 * A share of a whole as a hundred squares, so a percentage is seen as a
 * quantity. A fractional value fills the last square in part; nothing is
 * rounded up. The caption carries the fact; the squares only picture it.
 */
export function ShareGrid({ value, label, tone = "accent", fill, ink }: {
  value: number;
  label: string;
  tone?: "accent" | "ink";
  /** A colour of the space's own (e.g. a role), for the squares; `ink` for the figure, if it differs. */
  fill?: string;
  ink?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const whole = Math.floor(clamped), part = Math.round((clamped - whole) * 100);
  return (
    <figure className={`explainer-share explainer-share--${tone}`} style={fill ? { ["--ex-fill" as string]: fill, ["--ex-fill-ink" as string]: ink ?? fill } : undefined}>
      <div className="explainer-share-grid" aria-hidden="true">
        {Array.from({ length: 100 }, (_, index) => (
          <span key={index} className={index < whole ? "is-full" : undefined} data-part={index === whole && part > 0 ? "" : undefined}
            style={index === whole && part > 0 ? { ["--explainer-part" as string]: `${part}%`, ["--ex-order" as string]: index } : index < whole ? { ["--ex-order" as string]: index } : undefined} />
        ))}
      </div>
      <figcaption><strong>{clamped}%</strong> <span>{label}</span></figcaption>
    </figure>
  );
}
