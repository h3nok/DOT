import { ARCHITECTURE_PARTS, type ArchitecturePartId } from "./architectureModel";

interface Props {
  selected: ArchitecturePartId | null;
  onSelect: (part: ArchitecturePartId | null) => void;
}

/** Name a part to see what it is, what governs it, and how firmly DOT holds it. */
export function HeroArchitectureExplorer({ selected, onSelect }: Props) {
  const part = ARCHITECTURE_PARTS.find((candidate) => candidate.id === selected);

  return (
    <div
      className="home-architecture-explorer"
      onKeyDown={(event) => {
        if (event.key === "Escape" && selected) onSelect(null);
      }}
    >
      <div role="group" aria-label="Explore the architecture" className="home-architecture-explorer__parts">
        {ARCHITECTURE_PARTS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={selected === id}
            onClick={() => onSelect(selected === id ? null : id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="home-architecture-explorer__detail" aria-live="polite">
        {part ? (
          <>
            <p className="home-architecture-explorer__status">{part.label} · {part.status}</p>
            {part.rules && <p><strong>Rules:</strong> {part.rules}</p>}
            <p>{part.summary}</p>
            <a href={part.href}>{part.more}</a>
          </>
        ) : (
          <p className="home-architecture-explorer__hint">
            Select a ring, a frame, or a name above to see what it is and how firmly DOT holds it.
          </p>
        )}
      </div>
    </div>
  );
}
