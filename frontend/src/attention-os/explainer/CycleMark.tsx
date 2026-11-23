import "./explainer.css";

/**
 * Where this screen sits in a loop drawn earlier on the page: a small ring of
 * steps with the current one filled, then its number and name. It orients; it
 * never counts progress or asks the reader to finish anything (Manifesto L6).
 */
export function CycleMark({ count, current, label, href }: { count: number; current: number; label: string; href?: string }) {
  const size = 28, centre = size / 2, radius = 10;
  const dots = Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return { x: centre + radius * Math.cos(angle), y: centre + radius * Math.sin(angle), on: index === current };
  });
  const text = <><span className="explainer-cyclemark-number">{String(current + 1).padStart(2, "0")}</span>{label}</>;
  return (
    <p className="explainer-cyclemark">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" focusable="false">
        <circle cx={centre} cy={centre} r={radius} className="explainer-cyclemark-ring" />
        {dots.map((dot, index) => <circle key={index} cx={dot.x} cy={dot.y} r={dot.on ? 4 : 2.25} className={dot.on ? "is-on" : undefined} />)}
      </svg>
      {href ? <a href={href}>{text}</a> : <span>{text}</span>}
    </p>
  );
}
