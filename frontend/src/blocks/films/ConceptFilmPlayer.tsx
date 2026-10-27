import { Fragment, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";

import {
  CONCEPT_FILM_BEATS,
  CONCEPT_FILM_SECONDS,
  CONCEPT_MOTIFS,
  type ConceptFilm,
} from "./conceptFilms";
import "./concept-films.css";

const DURATION_LABEL = `0:${String(CONCEPT_FILM_SECONDS).padStart(2, "0")}`;

function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

const reveal = (t: number, at: number, length = 0.8) => {
  const u = Math.min(1, Math.max(0, (t - at) / length));
  return u * u * (3 - 2 * u);
};

/**
 * A silent film for one concept. Nothing plays until the reader asks; before that
 * the stage holds the film's finished frame, so the concept can be read without
 * watching. The film ends on that same frame and never moves on by itself (L3).
 */
export function ConceptFilmPlayer({ film }: { film: ConceptFilm }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const timeRef = useRef(0);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const { Motif, description } = CONCEPT_MOTIFS[film.id];
  const frame = hasStarted ? time : CONCEPT_FILM_SECONDS;
  const words = film.node.oneLine.split(" ");

  useEffect(() => {
    setFullscreenAvailable(
      typeof playerRef.current?.requestFullscreen === "function" &&
      document.fullscreenEnabled !== false,
    );
  }, []);

  useEffect(() => {
    setPlaying(false);
    setHasStarted(false);
    timeRef.current = 0;
    setTime(0);
  }, [film.id]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      // A hidden tab pauses frames; resume where the film was rather than jumping ahead.
      const dt = Math.min(0.25, Math.max(0, (now - prev) / 1000));
      prev = now;
      const next = Math.min(CONCEPT_FILM_SECONDS, timeRef.current + dt);
      timeRef.current = next;
      setTime(next);
      if (next >= CONCEPT_FILM_SECONDS) {
        setPlaying(false);
        return;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [playing]);

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(CONCEPT_FILM_SECONDS, seconds));
    timeRef.current = clamped;
    setTime(clamped);
  };

  const togglePlay = () => {
    if (!hasStarted || timeRef.current >= CONCEPT_FILM_SECONDS - 0.05) {
      setHasStarted(true);
      seekTo(0);
      setPlaying(true);
      return;
    }
    setPlaying((prev) => !prev);
  };

  const restart = () => {
    setHasStarted(true);
    seekTo(0);
    setPlaying(true);
  };

  const toggleFullscreen = () => {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void el.requestFullscreen?.();
    }
  };

  const progressPercent = Math.min(100, (time / CONCEPT_FILM_SECONDS) * 100);

  return (
    <div
      ref={playerRef}
      className="films-screening-shell concept-film"
      data-concept={film.id}
    >
      <div className="concept-film-stage" onClick={togglePlay}>
        <svg
          className="concept-film-motif"
          viewBox="0 0 600 600"
          role="img"
          aria-label={description}
        >
          <Motif t={frame} />
        </svg>

        <div className="concept-film-copy">
          <p className="concept-film-eyebrow" style={{ opacity: reveal(frame, CONCEPT_FILM_BEATS.name) }}>
            Concept {film.number} · {film.node.source.claimLevel}
          </p>
          <h3 className="concept-film-name" style={{ opacity: reveal(frame, CONCEPT_FILM_BEATS.name, 1) }}>
            {film.node.title}
          </h3>
          <p className="concept-film-definition">
            {words.map((word, index) => {
              const shown = reveal(frame, CONCEPT_FILM_BEATS.definition + index * CONCEPT_FILM_BEATS.wordStep, 0.5);
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
          <p className="concept-film-source" style={{ opacity: reveal(frame, CONCEPT_FILM_BEATS.source) }}>
            Book One · {film.node.source.sectionTitle}
          </p>
        </div>

        {!hasStarted && (
          <button
            type="button"
            className="films-play-hero-btn"
            onClick={(event) => {
              event.stopPropagation();
              togglePlay();
            }}
            aria-label={`Play the ${film.node.title} film (${DURATION_LABEL}, silent)`}
          >
            <span className="films-play-hero-icon" aria-hidden="true">
              <Play className="h-4 w-4 fill-current" />
            </span>
            <span className="films-play-hero-label">Play · {DURATION_LABEL}</span>
          </button>
        )}
      </div>

      <div className="films-transport-shell">
        <div className="films-transport-bar">
          <button
            type="button"
            className="films-transport-btn films-transport-btn--primary"
            onClick={togglePlay}
            aria-label={playing ? "Pause film" : "Play film"}
          >
            {playing ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className="films-transport-btn"
            onClick={restart}
            aria-label="Restart film from 0:00"
            title="Restart from 0:00"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <span className="films-transport-time" aria-live="off">
            {formatTimecode(time)} <span aria-hidden="true">/</span> {formatTimecode(CONCEPT_FILM_SECONDS)}
          </span>

          <div className="films-scrubber-wrap">
            <div className="films-scrubber-progress" style={{ width: `${progressPercent}%` }} aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={CONCEPT_FILM_SECONDS}
              step={0.1}
              value={time}
              aria-label="Seek timeline in seconds"
              aria-valuetext={`${formatTimecode(time)} of ${formatTimecode(CONCEPT_FILM_SECONDS)}`}
              className="films-transport-slider"
              onChange={(event) => {
                setHasStarted(true);
                seekTo(Number(event.target.value));
              }}
            />
          </div>

          <span className="concept-film-silent">Silent</span>

          {fullscreenAvailable && (
            <button
              type="button"
              className="films-transport-btn"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
