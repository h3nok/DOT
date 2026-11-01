import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { useReducedMotion } from "../../organism/signals/useReducedMotion";
import { DarkFilmFrame } from "./DarkFilmPlayer";
import type { FilmTone } from "./DarkFilmTrailer";
import { DrawnFilmPlayer } from "./DrawnFilmPlayer";
import {
  DARK_FILM_BODY_END,
  DARK_FILM_KEYSTROKES,
  DARK_FILM_SECONDS,
  DARK_FILM_SECTIONS,
  DARK_FILM_STARTS,
  DARK_OPENING_SECONDS,
  DARK_TRAILER_HEARTBEATS,
  DARK_TRAILER_SHOTS,
  describeDarkFilmTime,
} from "./darkFilmRevision";
import { formatDuration } from "./filmTime";
import "./films.css";
import "./dark-film.css";

declare global {
  interface Window {
    __DOT_DARK_FILM_PREVIEW__?: {
      renderAt: (seconds: number) => Promise<void>;
      duration: number;
      openingSeconds: number;
      keystrokes: typeof DARK_FILM_KEYSTROKES;
      /** The trailer's shots and heartbeats, so the exported score follows the picture. */
      trailer: { shots: { kind: string; start: number; end: number }[]; heartbeats: readonly number[]; closingMark: number };
    };
  }
}

/**
 * Development-only review room. It reuses the released concepts without publishing a revision.
 * `?tone=light` shows the light version; export it with the page in its light theme.
 */
export default function DarkFilmPreview() {
  const params = new URLSearchParams(window.location.search);
  const renderMode = params.get("render") === "1";
  const tone: FilmTone = params.get("tone") === "light" ? "light" : "dark";
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
        closingMark: DARK_FILM_BODY_END,
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

  // The dark tone sets the page's dark tokens itself; the light tone uses the page's light theme.
  return (
    <main
      className={`${tone === "dark" ? "dark dark-film-scope " : ""}dark-film-preview${renderMode ? " dark-film-preview--render" : ""}`}
      data-film-tone={tone}
    >
      <Helmet>
        <title>Dark film revision — DOT preview</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      {!renderMode && (
        <header className="dark-film-preview-heading">
          <div>
            <p>{tone === "light" ? "Light" : "Dark"} edition · Editorial draft</p>
            <h1>An opening trailer, then the seventeen concepts.</h1>
            <p>A one-minute trailer introduces DOT, followed by the complete Book One concept film. {formatDuration(DARK_FILM_SECONDS)}.</p>
          </div>
          <Link to="/film">Original film</Link>
        </header>
      )}
      {renderMode ? (
        <div className="films-screening-shell concept-film dark-film-render-shell">
          <DarkFilmFrame seconds={renderTime} still={false} burnIn tone={tone} />
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
          {(frame) => <DarkFilmFrame seconds={frame} still={still} tone={tone} />}
        </DrawnFilmPlayer>
      )}
    </main>
  );
}
