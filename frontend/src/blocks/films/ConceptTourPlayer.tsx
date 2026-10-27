import { useMemo } from "react";

import filmsData from "../../content/films.json";
import { CONCEPT_FILMS } from "./conceptFilms";
import { ConceptFrame } from "./ConceptFrame";
import {
  CONCEPT_TOUR,
  CONCEPT_TOUR_NOTCHES,
  CONCEPT_TOUR_SECONDS,
  TOUR_CONCEPT_BEATS,
  TOUR_MOTIF_SPEED,
  TOUR_OPENING_SECONDS,
  TOUR_CROSSFADE_SECONDS,
  describeTourTime,
  tourPartAt,
  tourPartOpacity,
} from "./conceptTour";
import { formatDuration, reveal } from "./filmTime";
import { SilentFilmPlayer } from "./SilentFilmPlayer";

const TOUR = filmsData.conceptTour;

/** Quiet rings around a point: the observer the film begins and ends with. */
function ObserverMark({ t }: { t: number }) {
  return (
    <g>
      {[64, 128, 192, 256].map((radius, index) => (
        <circle
          key={radius}
          className="cm-s cm-line"
          cx={300}
          cy={300}
          r={radius}
          opacity={reveal(t, 0.4 + index * 0.45, 1.2)}
        />
      ))}
      <circle className="cm-f cm-origin" cx={300} cy={300} r={9} opacity={reveal(t, 0.1, 0.8)} />
    </g>
  );
}

interface TitleFrameProps {
  t: number;
  opacity: number;
  eyebrow: string;
  title: string;
  note?: string;
  source: string;
  description: string;
}

function TitleFrame({ t, opacity, eyebrow, title, note, source, description }: TitleFrameProps) {
  return (
    <>
      <svg className="concept-film-motif" viewBox="0 0 600 600" role="img" aria-label={description} style={{ opacity }}>
        <ObserverMark t={t} />
      </svg>
      <div className="concept-film-copy" style={{ opacity }}>
        <p className="concept-film-eyebrow" style={{ opacity: reveal(t, 0.2) }}>{eyebrow}</p>
        <h3 className="concept-film-name" style={{ opacity: reveal(t, 0.4, 1) }}>{title}</h3>
        {note && (
          <p className="concept-film-definition" style={{ opacity: reveal(t, 1.8, 1) }}>{note}</p>
        )}
        <p className="concept-film-source" style={{ opacity: reveal(t, 2.6) }}>{source}</p>
      </div>
    </>
  );
}

/**
 * Every part's words, unseen, in the same cell as the part on screen, so the film keeps
 * the height of its longest part and the page never jumps while it plays.
 */
function TourSizers() {
  return (
    <>
      {CONCEPT_TOUR.map((part) => {
        const text =
          part.kind === "opening"
            ? [TOUR.opening.eyebrow, TOUR.opening.line, TOUR.opening.note, TOUR.opening.source]
            : part.kind === "closing"
              ? [TOUR.closing.eyebrow, TOUR.closing.title, "", TOUR.closing.source]
              : [
                  `Concept ${part.position} of ${CONCEPT_FILMS.length} · ${part.film.node.source.claimLevel}`,
                  part.film.node.title,
                  part.film.node.oneLine,
                  `Book One · ${part.film.node.source.sectionTitle}`,
                ];
        return (
          <div key={part.start} className="concept-film-copy concept-tour-sizer" aria-hidden="true">
            <p className="concept-film-eyebrow">{text[0]}</p>
            <p className="concept-film-name">{text[1]}</p>
            {text[2] && <p className="concept-film-definition">{text[2]}</p>}
            <p className="concept-film-source">{text[3]}</p>
          </div>
        );
      })}
    </>
  );
}

/**
 * One silent film through every concept in the Concept Map, in the map's order: the
 * preface's opening line, ten seconds per concept, and the book's title. It plays only
 * when asked and stops at its end (L3).
 */
export function ConceptTourPlayer() {
  const sizers = useMemo(() => <TourSizers />, []);

  return (
    <SilentFilmPlayer
      duration={CONCEPT_TOUR_SECONDS}
      posterTime={TOUR_OPENING_SECONDS - TOUR_CROSSFADE_SECONDS - 0.1}
      playLabel={`Play ${TOUR.title} (${formatDuration(CONCEPT_TOUR_SECONDS)}, silent)`}
      resetKey="concept-tour"
      className="concept-tour"
      notches={CONCEPT_TOUR_NOTCHES}
      describeTime={describeTourTime}
    >
      {(frame) => (
        <>
          {sizers}
          <TourFrame frame={frame} />
        </>
      )}
    </SilentFilmPlayer>
  );
}

function TourFrame({ frame }: { frame: number }) {
  const part = tourPartAt(frame);
  const opacity = tourPartOpacity(part, frame);
  const local = frame - part.start;
  if (part.kind === "opening") {
    return (
      <TitleFrame
        t={local}
        opacity={opacity}
        eyebrow={TOUR.opening.eyebrow}
        title={TOUR.opening.line}
        note={TOUR.opening.note}
        source={TOUR.opening.source}
        description="Rings open around a single point: the observer."
      />
    );
  }
  if (part.kind === "closing") {
    return (
      <TitleFrame
        t={local}
        opacity={opacity}
        eyebrow={TOUR.closing.eyebrow}
        title={TOUR.closing.title}
        source={TOUR.closing.source}
        description="Rings settle around a single point."
      />
    );
  }
  return (
    <ConceptFrame
      film={part.film}
      motifTime={Math.min(16, local * TOUR_MOTIF_SPEED)}
      copyTime={local}
      beats={TOUR_CONCEPT_BEATS}
      opacity={opacity}
      eyebrow={`Concept ${part.position} of ${CONCEPT_FILMS.length}`}
    />
  );
}
