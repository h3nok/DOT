import { DoWordmark } from "../../shared/DoWordmark";
import { useReducedMotion } from "../../organism/signals/useReducedMotion";
import filmsData from "../../content/films.json";
import { ConceptTourFrame } from "./ConceptTourPlayer";
import { DarkFilmTrailer, FilmClosingMark, type FilmCaptions, type FilmTone } from "./DarkFilmTrailer";
import { DrawnFilmPlayer } from "./DrawnFilmPlayer";
import { FilmProgress } from "./FilmProgress";
import {
  DARK_FILM_BODY_END,
  DARK_FILM_KEYSTROKES,
  DARK_FILM_SECONDS,
  DARK_FILM_SECTIONS,
  DARK_FILM_STARTS,
  DARK_OPENING_SECONDS,
  darkTrailerShot,
  describeDarkFilmTime,
  originalDarkFilmTime,
} from "./darkFilmRevision";
import { formatDuration } from "./filmTime";
import "./films.css";
import "./dark-film.css";

const TOUR = filmsData.conceptTour;

/** The frame shown before Play: the figure drawn, its first line typed. */
export const DARK_FILM_POSTER_SECONDS = 10.2;

/**
 * One frame of the film: the opening trailer, then the seventeen concepts. `burnIn` draws the
 * film's progress line into the picture, for exported video only; players have their own.
 * `tone` sets the trailer's palette and the stage; the concepts follow the page's own theme,
 * so a light export is rendered with the page in its light theme.
 */
export function DarkFilmFrame({ seconds, still, burnIn = false, tone = "dark", captions = "typed" }: {
  seconds: number; still: boolean; burnIn?: boolean; tone?: FilmTone; captions?: FilmCaptions;
}) {
  const opening = seconds < DARK_OPENING_SECONDS;
  const closing = seconds >= DARK_FILM_BODY_END;
  return (
    <div className={`dark-film-frame${opening || closing ? " dark-film-frame--trailer" : ""}`} data-film-tone={tone} data-dark-film-render>
      <div className="dark-film-signature" aria-hidden="true">
        <DoWordmark compact />
        <span>Digital Organism Theory</span>
      </div>
      {opening && <DarkFilmTrailer seconds={seconds} still={still} tone={tone} captions={captions} />}
      {closing && <FilmClosingMark seconds={seconds - DARK_FILM_BODY_END} still={still} tone={tone} links={!burnIn} />}
      {!opening && !closing && (
        <div className="dark-film-lesson concept-tour">
          <ConceptTourFrame frame={originalDarkFilmTime(seconds)} still={still} />
        </div>
      )}
      <div className="dark-film-colophon" aria-hidden="true">
        <span>dotheory.org</span>
      </div>
      {burnIn && !closing && darkTrailerShot(seconds).kind !== "mark" && (
        <FilmProgress
          className="dark-film-progress"
          seconds={seconds}
          duration={DARK_FILM_SECONDS}
          sections={DARK_FILM_SECTIONS}
          warmUntil={DARK_OPENING_SECONDS}
        />
      )}
    </div>
  );
}

/**
 * The public film: the opening trailer, then every concept in the Concept Map. It is drawn in
 * the site's light or dark palette. Nothing plays or sounds until the reader presses
 * Play; it stops at its end and never moves on by itself (L3). Reduced motion shows each part
 * finished, without sound.
 */
export function DarkFilmPlayer() {
  const still = useReducedMotion();
  return (
    <div className="dark-film-scope dark-film-public">
      <DrawnFilmPlayer
        duration={DARK_FILM_SECONDS}
        posterTime={DARK_FILM_POSTER_SECONDS}
        playLabel={`Play ${TOUR.title} (${formatDuration(DARK_FILM_SECONDS)})`}
        resetKey="dark-film"
        className="dark-film-player"
        notches={DARK_FILM_STARTS.slice(1)}
        sections={DARK_FILM_SECTIONS}
        warmUntil={DARK_OPENING_SECONDS}
        chapters={{ starts: DARK_FILM_STARTS, noun: "part" }}
        describeTime={describeDarkFilmTime}
        keystrokes={still ? undefined : DARK_FILM_KEYSTROKES}
      >
        {(frame) => <DarkFilmFrame seconds={frame} still={still} />}
      </DrawnFilmPlayer>
    </div>
  );
}

