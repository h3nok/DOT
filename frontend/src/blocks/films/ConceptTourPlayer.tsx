import { useMemo, type ReactNode } from "react";
import { Play, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";

import filmsData from "../../content/films.json";
import { useReducedMotion } from "../../organism/signals/useReducedMotion";
import { ArchitectureGlyph, ArchitectureMap, HumanCharacter, TourOpening, type ArchitectureLayer } from "./ConceptFilmMotifs";
import { CONCEPT_FILMS, CONCEPT_FILM_SECONDS, conceptTyping } from "./conceptFilms";
import { ConceptFrame, TypedText } from "./ConceptFrame";
import {
  CLOSING_TYPING,
  CONCEPT_TOUR,
  CONCEPT_TOUR_KEYSTROKES,
  CONCEPT_TOUR_NOTCHES,
  CONCEPT_TOUR_SECONDS,
  CONCEPT_TOUR_STARTS,
  TOUR_ARCHITECTURE,
  TOUR_CONCEPT_BEATS,
  TOUR_MAP_SECONDS,
  TOUR_MOTIF_SPEED,
  TOUR_POSTER_SECONDS,
  describeTourTime,
  openingDrawingTime,
  sceneTyping,
  tourPartAt,
  tourPartDrift,
  tourPartOpacity,
  tourPictureOpacity,
  tourPlace,
} from "./conceptTour";
import { HeroArchitecture } from "../core/home/HeroArchitecture";
// The closing draws the homepage's own architecture, so its styles come with it on /film too.
import "../core/home/home.css";
import { DrawnFilmPlayer } from "./DrawnFilmPlayer";
import { formatDuration, reveal, type TypedLine } from "./filmTime";

const TOUR = filmsData.conceptTour;

interface TitleFrameProps {
  t: number;
  /** The picture: the opening's continuous drawing, an interlude's, or the closing architecture. */
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
  /** Sets a long, sentence-length title a size smaller, so the film keeps its height. */
  sentence?: boolean;
  /** Where the part sits in the architecture, lit on the locator beside its eyebrow. */
  layer?: ArchitectureLayer;
  /** Opens on the architecture, at this layer, before crossfading into the scene's picture. */
  lead?: { layer: ArchitectureLayer; seconds: number };
  /** A picture drawn as HTML rather than inside the frame's own SVG, such as the homepage's diagram. */
  figure?: ReactNode;
}

function TitleFrame({ t, picture, pictureOpacity, opacity, drift, eyebrow, title, note, source, sourceAt, links, description, sentence = false, layer, lead, figure }: TitleFrameProps) {
  const style = { opacity, transform: drift ? `translateY(${drift.toFixed(1)}px)` : undefined };
  return (
    <>
      {figure ? (
        <div className="concept-film-motif concept-film-figure" role="img" aria-label={description} style={{ opacity: pictureOpacity }}>
          {figure}
        </div>
      ) : (
      <svg className="concept-film-motif" viewBox="0 0 600 600" role="img" aria-label={description} style={{ opacity: pictureOpacity }}>
        {lead && t < lead.seconds ? (
          <g opacity={1 - reveal(t, lead.seconds - 0.5, 0.5)}>
            <ArchitectureMap t={t} layer={lead.layer} />
          </g>
        ) : null}
        <g opacity={lead ? reveal(t, lead.seconds - 0.5, 0.5) : 1}>
          {picture}
        </g>
      </svg>
      )}
      <div className="concept-film-copy" style={style}>
        <p className="concept-film-eyebrow">
          {layer && <ArchitectureGlyph layer={layer} />}
          <span><TypedText line={eyebrow} time={t} caret={false} /></span>
        </p>
        <h3 className={sentence ? "concept-film-name concept-film-name--sentence" : "concept-film-name"}><TypedText line={title} time={t} /></h3>
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
        if (part.kind === "scene" || part.kind === "interlude") {
          const words = part.kind === "scene" ? part.scene : part.interlude;
          lines = [words.eyebrow, words.title, words.note, null, words.source || null];
        } else if (part.kind === "closing") {
          lines = [TOUR.closing.eyebrow, TOUR.closing.title, null, null, TOUR.closing.source || null];
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
            <p className={part.kind === "interlude" ? "concept-film-name concept-film-name--sentence" : "concept-film-name"}>{lines[1]}</p>
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

const COVER_DESCRIPTION =
  "The architecture of Digital Organism Theory: T × E outside, Big C within it, RF₀ inside Big C, and Little c within RF₀.";

/** What the film passes through, in order, for the cover. */
const COVER_PATH = [TOUR.scenes[0].name, TOUR.scenes[1].name, `${CONCEPT_FILMS.length} concepts`, "The architecture"];

/**
 * The film's cover, shown until the reader first plays or seeks: the book's title over its
 * architecture, what the film passes through, one way to start it, and what it will sound like.
 */
function TourCover({ playLabel, onPlay, still }: { playLabel: string; onPlay: () => void; still: boolean }) {
  return (
    <>
      <svg className="concept-film-motif" viewBox="0 0 600 600" role="img" aria-label={COVER_DESCRIPTION}>
        <ArchitectureMap t={4} layer="all" />
      </svg>
      <div className="concept-film-copy concept-film-cover">
        <p className="concept-film-eyebrow">
          <span>{TOUR.label} · {formatDuration(CONCEPT_TOUR_SECONDS)}</span>
        </p>
        <h3 className="concept-film-name">{TOUR.closing.title}</h3>
        <p className="concept-film-cover-line">{TOUR.description}</p>
        <ol className="concept-film-cover-path" aria-label="The film passes through">
          {COVER_PATH.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <button
          type="button"
          className="concept-film-cover-play"
          aria-label={playLabel}
          onClick={(event) => {
            event.stopPropagation();
            onPlay();
          }}
        >
          <span className="concept-film-cover-play-icon" aria-hidden="true"><Play /></span>
          <span>Play the film</span>
          <span className="concept-film-cover-length" aria-hidden="true">{formatDuration(CONCEPT_TOUR_SECONDS)}</span>
        </button>
        <p className="concept-film-cover-note">
          {still ? (
            "Reduced motion is on, so each part is shown finished, without sound."
          ) : (
            <>
              <Volume2 aria-hidden="true" /> Soft typewriter sound while it types. One click turns it off.
            </>
          )}
        </p>
      </div>
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
    const pictureTime = openingDrawingTime(still ? part.end - 0.6 : frame);
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
        lead={!still && part.index === 0 ? { layer: "little-c", seconds: 2.6 } : undefined}
      />
    );
  }
  if (part.kind === "interlude") {
    const typing = sceneTyping(part.interlude);
    return (
      <TitleFrame
        t={local}
        picture={<HumanCharacter t={still ? CONCEPT_FILM_SECONDS : Math.min(CONCEPT_FILM_SECONDS, local * TOUR_MOTIF_SPEED)} />}
        pictureOpacity={opacity}
        opacity={opacity}
        drift={drift}
        eyebrow={typing.eyebrow}
        title={typing.title}
        note={typing.note}
        source={part.interlude.source}
        sourceAt={typing.source}
        description={part.interlude.description}
        sentence
        layer="little-c"
      />
    );
  }
  if (part.kind === "closing") {
    return (
      <TitleFrame
        t={local}
        picture={null}
        figure={
          // The homepage's own architecture, emerging as it does there; the film's words carry
          // its meaning for screen readers, so the drawing itself is inert.
          <div className="home-hero-environment concept-film-architecture" data-hero-motion={still ? "still" : "full"} inert>
            <HeroArchitecture embedded />
          </div>
        }
        pictureOpacity={opacity}
        opacity={opacity}
        drift={drift}
        eyebrow={CLOSING_TYPING.eyebrow}
        title={CLOSING_TYPING.title}
        source={TOUR.closing.source}
        sourceAt={CLOSING_TYPING.source}
        links={{ at: CLOSING_TYPING.links, items: TOUR.closing.links }}
        description="The architecture of Digital Organism Theory: T × E outside; Big C within it, its outer process circling; RF₀ inside Big C; and Little c within RF₀, with its own inner process."
      />
    );
  }
  // Some concepts first show where they sit in the architecture; their picture follows.
  const layer = still ? undefined : TOUR_ARCHITECTURE[part.film.id];
  const pictureClock = layer ? Math.max(0, local - TOUR_MAP_SECONDS) : local;
  return (
    <ConceptFrame
      film={part.film}
      lead={layer ? { layer, seconds: TOUR_MAP_SECONDS } : undefined}
      motifTime={still ? CONCEPT_FILM_SECONDS : Math.min(CONCEPT_FILM_SECONDS, pictureClock * TOUR_MOTIF_SPEED)}
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
 * Frame that hold it, then types each concept's picture, definition, and analogy. Big C,
 * Little c, the Reality Frame, and the Reality Stream first show where they sit in the
 * architecture; the human character follows the Fear-Gating Principle; and the film ends on the whole
 * architecture and the book's title. It plays only when asked and stops at its end (L3); its
 * typewriter sound starts with Play and can be turned off.
 */
export function ConceptTourPlayer() {
  const still = useReducedMotion();
  const sizers = useMemo(() => <TourSizers />, []);
  const playLabel = `Play ${TOUR.title} (${formatDuration(CONCEPT_TOUR_SECONDS)})`;

  return (
    <DrawnFilmPlayer
      duration={CONCEPT_TOUR_SECONDS}
      posterTime={TOUR_POSTER_SECONDS}
      playLabel={playLabel}
      resetKey="concept-tour"
      className="concept-tour"
      notches={CONCEPT_TOUR_NOTCHES}
      chapters={{ starts: CONCEPT_TOUR_STARTS, noun: "concept" }}
      describeTime={describeTourTime}
      keystrokes={still ? undefined : CONCEPT_TOUR_KEYSTROKES}
      cover={(play) => <TourCover playLabel={playLabel} onPlay={play} still={still} />}
    >
      {(frame, started) => (
        <>
          {sizers}
          {started && <TourFrame frame={frame} still={still} />}
        </>
      )}
    </DrawnFilmPlayer>
  );
}

