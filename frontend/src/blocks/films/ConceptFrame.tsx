import { Fragment } from "react";

import { CONCEPT_MOTIFS, type ConceptFilm } from "./conceptFilms";
import { reveal } from "./filmTime";

/** When each part of a concept's text arrives, in seconds of copy time. */
export interface ConceptTextBeats {
  name: number;
  definition: number;
  /** Delay between successive words of the definition. */
  wordStep: number;
  source: number;
}

interface ConceptFrameProps {
  film: ConceptFilm;
  /** The motif's own clock, 0–16 seconds. */
  motifTime: number;
  /** The clock the text beats are measured against. */
  copyTime: number;
  beats: ConceptTextBeats;
  /** Fades the whole frame, for passing between concepts. */
  opacity?: number;
  /** Extra line above the name, such as the concept's place in a longer film. */
  eyebrow?: string;
}

/** One concept as a film frame: its motion study beside the Concept Map's own words. */
export function ConceptFrame({ film, motifTime, copyTime, beats, opacity = 1, eyebrow }: ConceptFrameProps) {
  const { Motif, description } = CONCEPT_MOTIFS[film.id];
  const words = film.node.oneLine.split(" ");

  return (
    <>
      <svg
        className="concept-film-motif"
        viewBox="0 0 600 600"
        role="img"
        aria-label={description}
        style={opacity < 1 ? { opacity } : undefined}
      >
        <Motif t={motifTime} />
      </svg>

      <div className="concept-film-copy" style={opacity < 1 ? { opacity } : undefined}>
        <p className="concept-film-eyebrow" style={{ opacity: reveal(copyTime, beats.name) }}>
          {eyebrow ?? `Concept ${film.number}`} · {film.node.source.claimLevel}
        </p>
        <h3 className="concept-film-name" style={{ opacity: reveal(copyTime, beats.name, 1) }}>
          {film.node.title}
        </h3>
        <p className="concept-film-definition">
          {words.map((word, index) => {
            const shown = reveal(copyTime, beats.definition + index * beats.wordStep, 0.5);
            return (
              <Fragment key={index}>
                <span style={{ opacity: shown, transform: `translateY(${((1 - shown) * 0.3).toFixed(3)}em)` }}>
                  {word}
                </span>
                {index < words.length - 1 ? " " : null}
              </Fragment>
            );
          })}
        </p>
        <p className="concept-film-source" style={{ opacity: reveal(copyTime, beats.source) }}>
          Book One · {film.node.source.sectionTitle}
        </p>
      </div>
    </>
  );
}
