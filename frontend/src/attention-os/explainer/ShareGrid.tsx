import "./explainer.css";

/**
 * A share of a whole as a hundred squares, so a percentage is seen as a
 * quantity. A fractional value fills the last square in part; nothing is
 * rounded up. The caption carries the fact; the squares only picture it.
 */
export function ShareGrid({ value, label, tone = "accent" }: { value: number; label: string; tone?: "accent" | "ink" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const whole = Math.floor(clamped), part = Math.round((clamped - whole) * 100);
  return (
    <figure className={`explainer-share explainer-share--${tone}`}>
      <div className="explainer-share-grid" aria-hidden="true">
        {Array.from({ length: 100 }, (_, index) => (
          <span key={index} className={index < whole ? "is-full" : undefined} data-part={index === whole && part > 0 ? "" : undefined} style={index === whole && part > 0 ? { ["--explainer-part" as string]: `${part}%` } : undefined} />
        ))}
      </div>
      <figcaption><strong>{clamped}%</strong> <span>{label}</span></figcaption>
    </figure>
  );
}
