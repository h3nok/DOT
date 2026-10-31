import { DoWordmark } from "../../shared/DoWordmark";
import { useReducedMotion } from "../../organism/signals/useReducedMotion";
import filmsData from "../../content/films.json";
import { ConceptTourFrame } from "./ConceptTourPlayer";
import { DarkFilmTrailer } from "./DarkFilmTrailer";
import { DrawnFilmPlayer } from "./DrawnFilmPlayer";
import { FilmProgress } from "./FilmProgress";
import {
  DARK_FILM_KEYSTROKES,
  DARK_FILM_SECONDS,
  DARK_FILM_SECTIONS,
  DARK_FILM_STARTS,
  DARK_OPENING_SECONDS,
  describeDarkFilmTime,
  originalDarkFilmTime,
} from "./darkFilmRevision";
import { formatDuration } from "./filmTime";
import "./films.css";
import "./dark-film.css";

const TOUR = filmsData.conceptTour;

/** The frame shown before Play: the figure drawn, its first line typed. */
export const DARK_FILM_POSTER_SECONDS = 7.5;

/**
 * One frame of the film: the opening trailer, then the seventeen concepts. `burnIn` draws the
 * film's progress line into the picture, for exported video only; players have their own.
 */
export function DarkFilmFrame({ seconds, still, burnIn = false }: { seconds: number; still: boolean; burnIn?: boolean }) {
  const trailer = seconds < DARK_OPENING_SECONDS;
  return (
    <div className={`dark-film-frame${trailer ? " dark-film-frame--trailer" : ""}`} data-dark-film-render>
      <div className="dark-film-signature" aria-hidden="true">
        <DoWordmark compact />
        <span>Digital Organism Theory</span>
      </div>
      {trailer ? (
        <DarkFilmTrailer seconds={seconds} still={still} />
      ) : (
        <div className="dark-film-lesson concept-tour">
          <ConceptTourFrame frame={originalDarkFilmTime(seconds)} still={still} />
        </div>
      )}
      <div className="dark-film-colophon" aria-hidden="true">
        <span>dotheory.org</span>
      </div>
      {burnIn && (
        <FilmProgress
          className="dark-film-progress"
          seconds={seconds}
          duration={DARK_FILM_SECONDS}
          sections={DARK_FILM_SECTIONS}
          warmUntil={DARK_OPENING_SECONDS}
          label={describeDarkFilmTime(seconds).replace(": ", " · ")}
        />
      )}
    </div>
  );
}

/**
 * The public film: the opening trailer, then every concept in the Concept Map. It is drawn in
 * its own dark palette in either site theme. Nothing plays or sounds until the reader presses
 * Play; it stops at its end and never moves on by itself (L3). Reduced motion shows each part
 * finished, without sound.
 */
export function DarkFilmPlayer() {
  const still = useReducedMotion();
  return (
    <div className="dark-film-scope">
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

