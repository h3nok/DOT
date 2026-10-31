import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

import { formatDuration, formatTimecode } from "./filmTime";
import { FilmProgress } from "./FilmProgress";
import { TypewriterSound, keystrokesBetween, type Keystroke } from "./TypewriterSound";
import "./concept-films.css";

interface DrawnFilmPlayerProps {
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
  /** Where each segment of the progress line begins; defaults to the chapters or notches. */
  sections?: readonly number[];
  /** Segments that begin before this second are drawn warm, such as an opening. */
  warmUntil?: number;
  /** Where each part begins, for stepping between parts, and what a part is called. */
  chapters?: { starts: readonly number[]; noun: string };
  /** Spoken position for the timeline, e.g. the part playing at that second. */
  describeTime?: (seconds: number) => string;
  /** Typewriter keys to sound as the film plays. Without them the film is silent. */
  keystrokes?: readonly Keystroke[];
  dataAttributes?: Record<`data-${string}`, string>;
  /**
   * A designed cover, shown until the reader first plays or seeks, in place of the poster
   * frame and its Play button. It receives the function that starts the film.
   */
  cover?: (play: () => void) => ReactNode;
  /** Draws the stage at a film second; `started` is false while a cover is showing. */
  children: (frame: number, started: boolean) => ReactNode;
}

/**
 * A film drawn from code. Nothing plays, and nothing sounds, until the reader asks; before
 * that the stage holds the poster frame. The film stops at its end and never moves on by
 * itself, and it pauses when the reader scrolls it out of view (L3).
 */
export function DrawnFilmPlayer({
  duration,
  posterTime,
  playLabel,
  resetKey,
  className = "",
  notches = [],
  sections,
  warmUntil,
  chapters,
  describeTime,
  keystrokes,
  dataAttributes,
  cover,
  children,
}: DrawnFilmPlayerProps) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const timeRef = useRef(0);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const soundRef = useRef<TypewriterSound | null>(null);
  const soundOnRef = useRef(true);
  const keystrokesRef = useRef(keystrokes);

  const hasSound = Boolean(keystrokes?.length);
  const frame = hasStarted ? time : posterTime;
  const durationLabel = formatDuration(duration);

  useEffect(() => {
    setFullscreenAvailable(
      typeof playerRef.current?.requestFullscreen === "function" &&
      document.fullscreenEnabled !== false,
    );
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    keystrokesRef.current = keystrokes;
  }, [keystrokes]);

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
      const from = timeRef.current;
      const next = Math.min(duration, from + dt);
      timeRef.current = next;
      setTime(next);
      if (soundOnRef.current && keystrokesRef.current) {
        for (const key of keystrokesBetween(keystrokesRef.current, from, next)) soundRef.current?.strike(key.kind);
      }
      if (next >= duration) {
        setPlaying(false);
        return;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, duration]);

  // A film nobody can see is not being watched: pause it when it leaves the screen.
  useEffect(() => {
    const el = playerRef.current;
    if (!playing || !el || typeof IntersectionObserver === "undefined") return;
    // A page still settling can shift the film for a moment; pause only once it has stayed out of sight.
    let away = 0;
    const observer = new IntersectionObserver(([entry]) => {
      window.clearTimeout(away);
      if (entry && !entry.isIntersecting && !document.fullscreenElement) {
        away = window.setTimeout(() => setPlaying(false), 600);
      }
    });
    observer.observe(el);
    return () => {
      window.clearTimeout(away);
      observer.disconnect();
    };
  }, [playing]);

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration, seconds));
    timeRef.current = clamped;
    setTime(clamped);
  };

  /** Plays from where the film is, opening the sound inside the reader's click. */
  const play = () => {
    if (hasSound && soundOnRef.current) {
      soundRef.current ??= new TypewriterSound();
      soundRef.current.start();
    }
    setHasStarted(true);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (!hasStarted || timeRef.current >= duration - 0.05) {
      seekTo(0);
      play();
      return;
    }
    if (playing) setPlaying(false);
    else play();
  };

  const restart = () => {
    seekTo(0);
    play();
  };

  let chapterIndex = -1;
  chapters?.starts.forEach((start, index) => {
    if (start <= time + 0.01) chapterIndex = index;
  });
  const previousChapter = () => {
    if (!chapters) return;
    const current = chapters.starts[chapterIndex] ?? 0;
    const target = time - current > 1.5 ? current : (chapters.starts[chapterIndex - 1] ?? 0);
    seekTo(target);
    play();
  };
  const nextChapter = () => {
    const target = chapters?.starts[chapterIndex + 1];
    if (target === undefined) return;
    seekTo(target);
    play();
  };

  const toggleSound = () => {
    const on = !soundOnRef.current;
    soundOnRef.current = on;
    setSoundOn(on);
    if (on && playing) {
      soundRef.current ??= new TypewriterSound();
      soundRef.current.start();
    }
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

  const spokenTime = `${formatTimecode(time)} of ${formatTimecode(duration)}`;

  return (
    <div
      ref={playerRef}
      className={`films-screening-shell concept-film ${className}`.trim()}
      {...dataAttributes}
    >
      <div className="concept-film-stage" onClick={togglePlay}>
        {children(frame, hasStarted)}

        {!hasStarted && cover?.(togglePlay)}

        {!hasStarted && !cover && (
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

          {chapters && (
            <>
              <button
                type="button"
                className="films-transport-btn films-transport-btn--previous"
                onClick={previousChapter}
                aria-label={`Previous ${chapters.noun}`}
                title={`Previous ${chapters.noun}`}
              >
                <SkipBack className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="films-transport-btn films-transport-btn--next"
                onClick={nextChapter}
                disabled={chapterIndex >= chapters.starts.length - 1}
                aria-label={`Next ${chapters.noun}`}
                title={`Next ${chapters.noun}`}
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}

          <button
            type="button"
            className="films-transport-btn films-transport-btn--restart"
            onClick={restart}
            aria-label="Restart film from 0:00"
            title="Restart from 0:00"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <span className="films-transport-time" aria-live="off">
            {formatTimecode(time)} <span aria-hidden="true">/</span> {formatTimecode(duration)}
          </span>

          <div className="films-scrubber-wrap films-scrubber-wrap--structured">
            <FilmProgress
              seconds={time}
              duration={duration}
              sections={sections ?? chapters?.starts ?? [0, ...notches]}
              warmUntil={warmUntil}
            />
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

          {hasSound ? (
            <button
              type="button"
              className="films-transport-btn films-transport-btn--sound"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label="Typewriter sound"
              title={soundOn ? "Typewriter sound on" : "Typewriter sound off"}
            >
              {soundOn ? <Volume2 className="h-4 w-4" aria-hidden="true" /> : <VolumeX className="h-4 w-4" aria-hidden="true" />}
            </button>
          ) : (
            <span className="concept-film-silent">Silent</span>
          )}

          {fullscreenAvailable && (
            <button
              type="button"
              className="films-transport-btn films-transport-btn--fullscreen"
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
