import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";

import { formatDuration, formatTimecode } from "./filmTime";
import "./concept-films.css";

interface SilentFilmPlayerProps {
  duration: number;
  /** The frame shown before the reader presses Play. */
  posterTime: number;
  /** Accessible name of the poster's Play button. */
  playLabel: string;
  /** Restarts the film from its poster when this changes. */
  resetKey: string;
  className?: string;
  /** Film seconds marked on the timeline, such as where each part begins. */
  notches?: readonly number[];
  /** Spoken position for the timeline, e.g. the part playing at that second. */
  describeTime?: (seconds: number) => string;
  dataAttributes?: Record<`data-${string}`, string>;
  /** Draws the stage at a film second. */
  children: (frame: number) => ReactNode;
}

/**
 * A silent film drawn from code. Nothing plays until the reader asks; before that
 * the stage holds the poster frame. The film stops at its end and never moves on
 * by itself (L3).
 */
export function SilentFilmPlayer({
  duration,
  posterTime,
  playLabel,
  resetKey,
  className = "",
  notches = [],
  describeTime,
  dataAttributes,
  children,
}: SilentFilmPlayerProps) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const timeRef = useRef(0);
  const playerRef = useRef<HTMLDivElement | null>(null);

  const frame = hasStarted ? time : posterTime;
  const durationLabel = formatDuration(duration);

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
  }, [resetKey]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      // A hidden tab pauses frames; resume where the film was rather than jumping ahead.
      const dt = Math.min(0.25, Math.max(0, (now - prev) / 1000));
      prev = now;
      const next = Math.min(duration, timeRef.current + dt);
      timeRef.current = next;
      setTime(next);
      if (next >= duration) {
        setPlaying(false);
        return;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, duration]);

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    timeRef.current = clamped;
    setTime(clamped);
  };

  const togglePlay = () => {
    if (!hasStarted || timeRef.current >= duration - 0.05) {
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

  const progressPercent = Math.min(100, (time / duration) * 100);
  const spokenTime = `${formatTimecode(time)} of ${formatTimecode(duration)}`;

  return (
    <div
      ref={playerRef}
      className={`films-screening-shell concept-film ${className}`.trim()}
      {...dataAttributes}
    >
      <div className="concept-film-stage" onClick={togglePlay}>
        {children(frame)}

        {!hasStarted && (
          <button
            type="button"
            className="films-play-hero-btn"
            onClick={(event) => {
              event.stopPropagation();
              togglePlay();
            }}
            aria-label={playLabel}
          >
            <span className="films-play-hero-icon" aria-hidden="true">
              <Play className="h-4 w-4 fill-current" />
            </span>
            <span className="films-play-hero-label">Play · {durationLabel}</span>
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
            {formatTimecode(time)} <span aria-hidden="true">/</span> {formatTimecode(duration)}
          </span>

          <div className="films-scrubber-wrap">
            <div className="films-scrubber-progress" style={{ width: `${progressPercent}%` }} aria-hidden="true" />
            {notches.map((seconds) => (
              <span
                key={seconds}
                className="films-scrubber-notch"
                style={{ left: `${(seconds / duration) * 100}%` }}
                aria-hidden="true"
              />
            ))}
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={time}
              aria-label="Seek timeline in seconds"
              aria-valuetext={describeTime ? `${spokenTime} · ${describeTime(time)}` : spokenTime}
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
