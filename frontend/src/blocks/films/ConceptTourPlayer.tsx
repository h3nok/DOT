import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";

import filmsData from "../../content/films.json";
import { useReducedMotion } from "../../organism/signals/useReducedMotion";
import { TourOpening } from "./ConceptFilmMotifs";
import { CONCEPT_FILM_SECONDS, conceptTyping } from "./conceptFilms";
import { ConceptFrame, TypedText } from "./ConceptFrame";
import {
  CLOSING_TYPING,
  CONCEPT_TOUR,
  CONCEPT_TOUR_KEYSTROKES,
  CONCEPT_TOUR_NOTCHES,
  CONCEPT_TOUR_SECONDS,
  CONCEPT_TOUR_STARTS,
  TOUR_CONCEPT_BEATS,
  TOUR_MOTIF_SPEED,
  TOUR_OPENING_SECONDS,
  TOUR_POSTER_SECONDS,
  describeTourTime,
  sceneTyping,
  tourPartAt,
  tourPartDrift,
  tourPartOpacity,
  tourPictureOpacity,
  tourPlace,
} from "./conceptTour";
import { DrawnFilmPlayer } from "./DrawnFilmPlayer";
import { formatDuration, reveal, type TypedLine } from "./filmTime";

const TOUR = filmsData.conceptTour;

/** Quiet rings opening around a point: the observer the film ends with. */
function ObserverMark({ t }: { t: number }) {
  return (
    <g>
      {[64, 128, 192, 256].map((radius, index) => {
        const open = reveal(t, 0.4 + index * 0.45, 1.2);
        return (
          <circle
            key={radius}
            className="cm-s cm-line"
            cx={300}
            cy={300}
            r={radius * (0.7 + 0.3 * open)}
            strokeWidth={2}
            opacity={open}
          />
        );
      })}
      <circle className="cm-f cm-origin" cx={300} cy={300} r={10} opacity={reveal(t, 0.1, 0.8)} />
    </g>
  );
}

interface TitleFrameProps {
  t: number;
  /** The picture: the opening's continuous drawing, or the closing rings. */
  picture: ReactNode;
  pictureOpacity: number;
  opacity: number;
  drift: number;
  eyebrow: TypedLine;
  title: TypedLine;
  note?: TypedLine;
  source: string;
  sourceAt: number;
  links?: { at: number; items: readonly { label: string; to: string }[] };
  description: string;
}

function TitleFrame({ t, picture, pictureOpacity, opacity, drift, eyebrow, title, note, source, sourceAt, links, description }: TitleFrameProps) {
  const style = { opacity, transform: drift ? `translateY(${drift.toFixed(1)}px)` : undefined };
  return (
    <>
      <svg className="concept-film-motif" viewBox="0 0 600 600" role="img" aria-label={description} style={{ opacity: pictureOpacity }}>
        {picture}
      </svg>
      <div className="concept-film-copy" style={style}>
        <p className="concept-film-eyebrow"><TypedText line={eyebrow} time={t} caret={false} /></p>
        <h3 className="concept-film-name"><TypedText line={title} time={t} /></h3>
        {note && (
          <p className="concept-film-definition"><TypedText line={note} time={t} /></p>
        )}
        {source && <p className="concept-film-source" style={{ opacity: reveal(t, sourceAt) }}>{source}</p>}
        {links && t >= links.at && (
          <p className="concept-film-links" style={{ opacity: reveal(t, links.at) }}>
            {links.items.map((link) => (
              <Link key={link.to} to={link.to} onClick={(event) => event.stopPropagation()}>
                {link.label}
              </Link>
            ))}
          </p>
        )}
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
        let lines: (string | null)[];
        if (part.kind === "scene") {
          lines = [part.scene.eyebrow, part.scene.title, part.scene.note, null, part.scene.source || null];
        } else if (part.kind === "closing") {
          lines = [TOUR.closing.eyebrow, TOUR.closing.title, null, null, TOUR.closing.source];
        } else {
          const typing = conceptTyping(part.film, TOUR_CONCEPT_BEATS, tourPlace(part.position));
          lines = [
            typing.eyebrow.text,
            typing.name.text,
            typing.definition.text,
            typing.analogy.text,
            `Book One · ${part.film.node.source.sectionTitle}`,
          ];
        }
        return (
          <div key={part.start} className="concept-film-copy concept-tour-sizer" aria-hidden="true">
            <p className="concept-film-eyebrow">{lines[0]}</p>
            <p className="concept-film-name">{lines[1]}</p>
            {lines[2] && <p className="concept-film-definition">{lines[2]}</p>}
            {lines[3] && <p className="concept-film-analogy">{lines[3]}</p>}
            {lines[4] && <p className="concept-film-source">{lines[4]}</p>}
            {part.kind === "closing" && (
              <p className="concept-film-links">
                {TOUR.closing.links.map((link) => <span key={link.to}>{link.label}</span>)}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

function TourFrame({ frame, still }: { frame: number; still: boolean }) {
  const part = tourPartAt(frame);
  const opacity = tourPartOpacity(part, frame);
  const drift = still ? 0 : tourPartDrift(part, frame);
  // With reduced motion, each part is shown finished: its picture settled, its words whole.
  const local = still ? Infinity : frame - part.start;
  if (part.kind === "scene") {
    const typing = sceneTyping(part.scene);
    // Still frames show each scene's drawing as it stands at the scene's end.
    const pictureTime = still ? Math.min(part.end, TOUR_OPENING_SECONDS) - 0.6 : frame;
    return (
      <TitleFrame
        t={local}
        picture={<TourOpening t={pictureTime} />}
        pictureOpacity={tourPictureOpacity(part, frame)}
        opacity={opacity}
        drift={drift}
        eyebrow={typing.eyebrow}
        title={typing.title}
        note={typing.note}
        source={part.scene.source}
        sourceAt={typing.source}
        description={part.scene.description}
      />
    );
  }
  if (part.kind === "closing") {
    return (
      <TitleFrame
        t={local}
        picture={<ObserverMark t={local} />}
        pictureOpacity={opacity}
        opacity={opacity}
        drift={drift}
        eyebrow={CLOSING_TYPING.eyebrow}
        title={CLOSING_TYPING.title}
        source={TOUR.closing.source}
        sourceAt={CLOSING_TYPING.source}
        links={{ at: CLOSING_TYPING.links, items: TOUR.closing.links }}
        description="Rings settle around a single point."
      />
    );
  }
  return (
    <ConceptFrame
      film={part.film}
      motifTime={still ? CONCEPT_FILM_SECONDS : Math.min(CONCEPT_FILM_SECONDS, local * TOUR_MOTIF_SPEED)}
      copyTime={local}
      beats={TOUR_CONCEPT_BEATS}
      opacity={opacity}
      drift={drift}
      place={tourPlace(part.position)}
    />
  );
}

/**
 * One film through every concept in the Concept Map, in the map's order. It opens on the
 * struggle the American Millennial Manifesto describes, pulls back to the cultural trap and the
 * Frame that hold it, then types each concept's picture, definition, and analogy, and ends
 * on the book's title. It plays only when asked and stops at its end (L3); its typewriter
 * sound starts with Play and can be turned off.
 */
export function ConceptTourPlayer() {
  const still = useReducedMotion();
  const sizers = useMemo(() => <TourSizers />, []);

  return (
    <DrawnFilmPlayer
      duration={CONCEPT_TOUR_SECONDS}
      posterTime={TOUR_POSTER_SECONDS}
      playLabel={`Play ${TOUR.title} (${formatDuration(CONCEPT_TOUR_SECONDS)})`}
      resetKey="concept-tour"
      className="concept-tour"
      notches={CONCEPT_TOUR_NOTCHES}
      chapters={{ starts: CONCEPT_TOUR_STARTS, noun: "concept" }}
      describeTime={describeTourTime}
      keystrokes={still ? undefined : CONCEPT_TOUR_KEYSTROKES}
    >
      {(frame) => (
        <>
          {sizers}
          <TourFrame frame={frame} still={still} />
        </>
      )}
    </DrawnFilmPlayer>
  );
}

