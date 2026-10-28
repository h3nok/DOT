import { ArchitectureMap, type ArchitectureLayer } from "./ConceptFilmMotifs";
import { CONCEPT_MOTIFS, conceptTyping, type ConceptFilm, type ConceptTextBeats } from "./conceptFilms";
import { reveal, type TypedLine } from "./filmTime";

/**
 * Words typed onto a frame: what has been typed, a caret while typing, and the rest held
 * unseen so the lines never reflow. Screen readers receive the whole line at once.
 */
export function TypedText({ line, time, caret = true }: { line: TypedLine; time: number; caret?: boolean }) {
  const typed = (time - line.start) * line.charsPerSecond;
  const whole = Math.max(0, Math.min(line.text.length, Math.floor(typed)));
  const typing = typed > 0 && typed < line.text.length;
  return (
    <>
      <span className="sr-only">{line.text}</span>
      <span aria-hidden="true">
        {line.text.slice(0, whole)}
        {typing && <span style={{ opacity: typed - whole }}>{line.text[whole]}</span>}
        {caret && typing && <span className="concept-film-caret" />}
        <span className="concept-film-untyped">{line.text.slice(typing ? whole + 1 : whole)}</span>
      </span>
    </>
  );
}

interface ConceptFrameProps {
  film: ConceptFilm;
  /** The motif's own clock, 0–16 seconds. */
  motifTime: number;
  /** The clock the words are typed against. */
  copyTime: number;
  beats: ConceptTextBeats;
  /** Fades the whole frame, for passing between concepts. */
  opacity?: number;
  /** Lifts the frame by this many pixels as it arrives and leaves. */
  drift?: number;
  /** The concept's place, such as "Concept 7 of 17"; the claim level follows it. */
  place?: string;
  /** Opens on the architecture, at this layer, for this many seconds before the concept's picture. */
  lead?: { layer: ArchitectureLayer; seconds: number };
}

/** One concept as a film frame: its picture beside the Concept Map's own words and an analogy. */
export function ConceptFrame({ film, motifTime, copyTime, beats, opacity = 1, drift = 0, place, lead }: ConceptFrameProps) {
  const { Motif, description } = CONCEPT_MOTIFS[film.id];
  const typing = conceptTyping(film, beats, place ?? `Concept ${film.number}`);
  const frameStyle =
    opacity < 1 || drift !== 0 ? { opacity, transform: drift ? `translateY(${drift.toFixed(1)}px)` : undefined } : undefined;

  return (
    <>
      <svg
        className="concept-film-motif"
        viewBox="0 0 600 600"
        role="img"
        aria-label={lead ? `Where ${film.node.title} sits in the architecture, then: ${description}` : description}
        style={frameStyle}
      >
        {lead && copyTime < lead.seconds ? (
          <g opacity={1 - reveal(copyTime, lead.seconds - 0.5, 0.5)}>
            <ArchitectureMap t={copyTime} layer={lead.layer} />
          </g>
        ) : null}
        <g opacity={lead ? reveal(copyTime, lead.seconds - 0.5, 0.5) : 1}>
          <Motif t={motifTime} />
        </g>
      </svg>

      <div className="concept-film-copy" style={frameStyle}>
        <p className="concept-film-eyebrow">
          <TypedText line={typing.eyebrow} time={copyTime} caret={false} />
        </p>
        <h3 className="concept-film-name">
          <TypedText line={typing.name} time={copyTime} />
        </h3>
        <p className="concept-film-definition">
          <TypedText line={typing.definition} time={copyTime} />
        </p>
        <p
          className="concept-film-analogy"
          style={{
            borderLeftColor: `color-mix(in oklab, var(--cf-big-c) ${Math.round(reveal(copyTime, typing.analogy.start - 0.3, 0.3) * 100)}%, transparent)`,
          }}
        >
          <TypedText line={typing.analogy} time={copyTime} />
        </p>
        <p className="concept-film-source" style={{ opacity: reveal(copyTime, typing.source) }}>
          Book One · {film.node.source.sectionTitle}
        </p>
      </div>
    </>
  );
}
