import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { useReducedMotion } from "../../organism/signals/useReducedMotion";
import { DoWordmark } from "../../shared/DoWordmark";
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
  DARK_TRAILER_HEARTBEATS,
  DARK_TRAILER_SHOTS,
  describeDarkFilmTime,
  originalDarkFilmTime,
} from "./darkFilmRevision";
import { formatDuration } from "./filmTime";
import "./films.css";
import "./dark-film-preview.css";

declare global {
  interface Window {
    __DOT_DARK_FILM_PREVIEW__?: {
      renderAt: (seconds: number) => Promise<void>;
      duration: number;
      openingSeconds: number;
      keystrokes: typeof DARK_FILM_KEYSTROKES;
      /** The trailer's shots and heartbeats, so the exported score follows the picture. */
      trailer: { shots: { kind: string; start: number; end: number }[]; heartbeats: readonly number[] };
    };
  }
}

function DarkFilmFrame({ seconds, still, burnIn = false }: { seconds: number; still: boolean; burnIn?: boolean }) {
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
      {/* The film's structure, drawn into exported video only; the player has its own line. */}
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

/** Development-only review room. It reuses the released concepts without publishing a revision. */
export default function DarkFilmPreview() {
  const renderMode = new URLSearchParams(window.location.search).get("render") === "1";
  const [renderTime, setRenderTime] = useState(1.2);
  const still = useReducedMotion();

  useEffect(() => {
    if (!renderMode) return;
    const renderer = {
      duration: DARK_FILM_SECONDS,
      openingSeconds: DARK_OPENING_SECONDS,
      keystrokes: DARK_FILM_KEYSTROKES,
      trailer: {
        shots: DARK_TRAILER_SHOTS.map(({ kind, start, end }) => ({ kind, start, end })),
        heartbeats: DARK_TRAILER_HEARTBEATS,
      },
      renderAt: async (seconds: number) => {
        if (!Number.isFinite(seconds)) throw new Error("Film time must be finite.");
        flushSync(() => setRenderTime(Math.max(0, Math.min(DARK_FILM_SECONDS, seconds))));
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      },
    };
    window.__DOT_DARK_FILM_PREVIEW__ = renderer;
    return () => { delete window.__DOT_DARK_FILM_PREVIEW__; };
  }, [renderMode]);

  return (
    <main className={`dark-film-preview${renderMode ? " dark-film-preview--render" : ""}`}>
      <Helmet>
        <title>Dark film revision — DOT preview</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {!renderMode && (
        <header className="dark-film-preview-heading">
          <div>
            <p>Dark edition · Editorial draft</p>
            <h1>An opening trailer, then the seventeen concepts.</h1>
            <p>A one-minute trailer introduces DOT, followed by the complete Book One concept film. {formatDuration(DARK_FILM_SECONDS)}.</p>
          </div>
          <Link to="/film">Original film</Link>
        </header>
      )}
      {renderMode ? (
        <div className="films-screening-shell concept-film dark-film-render-shell">
          <DarkFilmFrame seconds={renderTime} still={false} burnIn />
        </div>
      ) : (
        <DrawnFilmPlayer
          duration={DARK_FILM_SECONDS}
          posterTime={1.2}
          playLabel="Play the revised dark film"
          resetKey="dark-film-revision"
          className="dark-film-player"
          notches={DARK_FILM_STARTS.slice(1)}
          sections={DARK_FILM_SECTIONS}
          warmUntil={DARK_OPENING_SECONDS}
          chapters={{ starts: DARK_FILM_STARTS, noun: "concept" }}
          describeTime={describeDarkFilmTime}
          keystrokes={still ? undefined : DARK_FILM_KEYSTROKES}
        >
          {(frame) => <DarkFilmFrame seconds={frame} still={still} />}
        </DrawnFilmPlayer>
      )}
    </main>
  );
}
