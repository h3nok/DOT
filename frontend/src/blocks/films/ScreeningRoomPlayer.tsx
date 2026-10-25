import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Captions,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import identity from "../../content/identity.json";
import {
  INQUIRY_VIDEOS,
  inquiryTypeTicks,
  mountInquiryCanvas,
  type InquiryVideoSpec,
} from "../../../scripts/channel-inquiry-video.mjs";

export interface ScreeningAct {
  id: string;
  code: string;
  title: string;
  timestamp: string;
  seconds: number;
  summary: string;
  readingLabel: string;
  readingTo: string;
}

export interface ScreeningFilmMeta {
  id: string;
  number: string;
  badge: string;
  title: string;
  duration: string;
  durationSeconds: number;
  posterSeconds: number;
  resolution: string;
  summary: string;
  claimLevels: string[];
  youtubeId?: string;
  youtubeUrl: string;
  companion: {
    label: string;
    to: string;
  };
  acts: ScreeningAct[];
}

function formatTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = String(clamped % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function detectSiteTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("light") || root.getAttribute("data-theme") === "light") {
    return "light";
  }
  if (root.classList.contains("dark") || root.getAttribute("data-theme") === "dark") {
    return "dark";
  }
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

interface ScreeningRoomPlayerProps {
  film: ScreeningFilmMeta;
  seekRequest?: { seconds: number; autoplay: boolean; seq: number } | null;
  compact?: boolean;
  /** The act buttons under the scrubber; off where the page lists the acts itself. */
  showActs?: boolean;
}

export const ScreeningRoomPlayer: React.FC<ScreeningRoomPlayerProps> = ({
  film,
  seekRequest = null,
  compact = false,
  showActs = false,
}) => {
  // The film's edition is the site's theme: the Appearance control is the one switch.
  const [edition, setEdition] = useState<"dark" | "light">(detectSiteTheme);

  const [sourceMode, setSourceMode] = useState<"native" | "youtube">("native");
  const [youtubeConsented, setYoutubeConsented] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showCaptionsBar, setShowCaptionsBar] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(film.posterSeconds);
  const [hasStarted, setHasStarted] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<{ seek: (seconds: number) => void } | null>(null);
  const timeRef = useRef<number>(film.posterSeconds);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickIndexRef = useRef<number>(-1);

  const videoSpec: InquiryVideoSpec = useMemo(() => {
    return (
      INQUIRY_VIDEOS.find((v) => v.name === film.id) ??
      INQUIRY_VIDEOS.find((v) => v.name === "inquiry-trailer")!
    );
  }, [film.id]);

  const ticks = useMemo(() => inquiryTypeTicks(videoSpec), [videoSpec]);

  // Observe site theme changes (DOT Daylight / DOT Night) so the player stays in lockstep
  // with AppearanceControl.
  useEffect(() => {
    if (typeof MutationObserver === "undefined") return;
    const sync = () => {
      const next = detectSiteTheme();
      setEdition((prev) => (prev === next ? prev : next));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Reset player state when switching films.
  useEffect(() => {
    setPlaying(false);
    setHasStarted(false);
    setSourceMode("native");
    timeRef.current = film.posterSeconds;
    setCurrentTime(film.posterSeconds);
    lastTickIndexRef.current = -1;
  }, [film.id, film.posterSeconds]);

  // Mount or re-mount the deterministic 4K canvas renderer when film or edition changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sourceMode !== "native") return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx || typeof ctx.save !== "function") return;
    const handle = mountInquiryCanvas(canvas, {
      video: videoSpec,
      identity: identity as unknown as Record<string, unknown>,
      theme: edition,
    });
    controllerRef.current = handle;
    handle.seek(timeRef.current);
    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(() => {
        controllerRef.current?.seek(timeRef.current);
      });
    }
  }, [videoSpec, edition, sourceMode]);

  const playKeystrokeTick = useCallback(
    (index: number) => {
      if (muted || typeof window === "undefined") return;
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1750 + ((index * 7) % 5) * 120, now);
      gain.gain.setValueAtTime(0.014, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.015);
    },
    [muted],
  );

  const seekTo = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(videoSpec.duration, seconds));
      timeRef.current = clamped;
      setCurrentTime(clamped);
      controllerRef.current?.seek(clamped);
      let nextIdx = -1;
      for (let i = 0; i < ticks.length; i++) {
        if (ticks[i] <= clamped) nextIdx = i;
        else break;
      }
      lastTickIndexRef.current = nextIdx;
    },
    [ticks, videoSpec.duration],
  );

  // Handle external seek requests (e.g. clicking an Act card or Transcript beat).
  useEffect(() => {
    if (!seekRequest) return;
    setSourceMode("native");
    setHasStarted(true);
    seekTo(seekRequest.seconds);
    if (seekRequest.autoplay) {
      setPlaying(true);
    }
  }, [seekRequest, seekTo]);

  // Animation loop when playing.
  useEffect(() => {
    if (!playing || sourceMode !== "native") return;
    let raf = 0;
    let prev = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const nextTime = timeRef.current + dt;

      for (let i = lastTickIndexRef.current + 1; i < ticks.length; i++) {
        if (ticks[i] <= nextTime) {
          if (ticks[i] >= timeRef.current - 0.05) {
            playKeystrokeTick(i);
          }
          lastTickIndexRef.current = i;
        } else {
          break;
        }
      }

      if (nextTime >= videoSpec.duration) {
        timeRef.current = videoSpec.duration;
        setCurrentTime(videoSpec.duration);
        controllerRef.current?.seek(videoSpec.duration);
        setPlaying(false);
        return;
      }

      timeRef.current = nextTime;
      setCurrentTime(nextTime);
      controllerRef.current?.seek(nextTime);
      raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [playing, sourceMode, ticks, videoSpec.duration, playKeystrokeTick]);

  // Cleanup AudioContext on unmount.
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const togglePlay = () => {
    if (!hasStarted || timeRef.current >= videoSpec.duration - 0.05) {
      setHasStarted(true);
      seekTo(0);
      setPlaying(true);
      return;
    }
    setPlaying((prev) => !prev);
  };

  const handleRestart = () => {
    setHasStarted(true);
    seekTo(0);
    setPlaying(true);
  };

  const handleFullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void el.requestFullscreen?.();
    }
  };

  // Active caption for screen-reader & optional live caption bar
  const activeCaption = useMemo(() => {
    return (
      videoSpec.captions.find(
        (cap) => currentTime >= cap.start && currentTime <= cap.end,
      ) ?? null
    );
  }, [videoSpec.captions, currentTime]);

  // Active act based on currentTime
  const activeActId = useMemo(() => {
    if (!film.acts.length) return null;
    let current = film.acts[0].id;
    for (const act of film.acts) {
      if (currentTime >= act.seconds - 0.2) {
        current = act.id;
      }
    }
    return current;
  }, [film.acts, currentTime]);

  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / Math.max(1, videoSpec.duration)) * 100),
  );

  return (
    <div
      className={`films-screening-shell ${compact ? "films-screening-shell--compact" : ""}`}
      data-edition={edition}
    >
      {/* Main 16:9 Stage */}
      <div ref={stageRef} className="films-stage-viewport">
        {sourceMode === "native" ? (
          <>
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="films-stage-canvas"
              aria-label={`${film.title} (${edition === "light" ? "Daylight" : "Night"} edition)`}
              onClick={togglePlay}
            />

            {!playing && (
              <button
                type="button"
                className="films-play-hero-btn"
                onClick={togglePlay}
                aria-label={
                  !hasStarted
                    ? `Play ${film.title} (${film.duration})`
                    : `Resume ${film.title}`
                }
              >
                <span className="films-play-hero-icon" aria-hidden="true">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <span className="films-play-hero-label">
                  {!hasStarted
                    ? `Play · ${film.duration}`
                    : timeRef.current >= videoSpec.duration - 0.05
                      ? "Replay"
                      : "Resume"}
                </span>
              </button>
            )}

            {/* Live SR-accessible caption readout only after playback starts */}
            {hasStarted && activeCaption && (
              <div className="sr-only" aria-live="polite">
                {`${activeCaption.lines.join(" ")} ${(activeCaption.notes ?? (activeCaption.note ? [activeCaption.note] : [])).join(" ")}`}
              </div>
            )}
          </>
        ) : (
          <div className="films-youtube-privacy-stage">
            {film.youtubeId && youtubeConsented ? (
              <iframe
                className="films-youtube-iframe"
                src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?rel=0`}
                title={`${film.title} — YouTube (Privacy-Enhanced Mode)`}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="films-privacy-gate">
                <div className="films-privacy-badge">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Law 9 · Zero Third-Party Tracking on Load</span>
                </div>
                <h3 className="films-privacy-title">{film.title}</h3>
                <p className="films-privacy-copy">
                  To protect your attention and privacy, <code>dotheory.org</code> never loads
                  third-party embeds or cookies automatically. You can watch this film right here
                  in the native 4K Screening Player, or open the official{" "}
                  <strong>@dotheory</strong> channel on YouTube.
                </p>
                <div className="films-privacy-actions">
                  <button
                    type="button"
                    className="films-btn-primary"
                    onClick={() => {
                      setSourceMode("native");
                      setHasStarted(true);
                      seekTo(0);
                      setPlaying(true);
                    }}
                  >
                    <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Play in Native Screening Room</span>
                  </button>
                  {film.youtubeId && (
                    <button
                      type="button"
                      className="films-btn-secondary"
                      onClick={() => setYoutubeConsented(true)}
                    >
                      <span>Load YouTube Player (youtube-nocookie.com)</span>
                    </button>
                  )}
                  <a
                    href={film.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="films-btn-secondary"
                  >
                    <span>Open @dotheory on YouTube</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Caption bar: the current line, only when explicitly toggled on */}
      {sourceMode === "native" && showCaptionsBar && videoSpec.captions.length > 0 && (
        <div className="films-live-caption-bar" aria-hidden="true">
          <p className="films-live-caption-lines">
            {activeCaption ? activeCaption.lines.join(" ") : film.title}
          </p>
        </div>
      )}

      {/* Transport Scrubber Bar & Optional Act Markers (Native Mode) */}
      {sourceMode === "native" && (
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
              onClick={handleRestart}
              aria-label="Restart film from 0:00"
              title="Restart from 0:00"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <span className="films-transport-time" aria-live="off">
              {formatTime(currentTime)} <span aria-hidden="true">/</span> {film.duration}
            </span>

            <div className="films-scrubber-wrap">
              <div
                className="films-scrubber-progress"
                style={{ width: `${progressPercent}%` }}
                aria-hidden="true"
              />
              {film.acts.map((act) => (
                <span
                  key={act.id}
                  className="films-scrubber-notch"
                  style={{ left: `${(act.seconds / Math.max(1, videoSpec.duration)) * 100}%` }}
                  aria-hidden="true"
                />
              ))}
              <input
                type="range"
                min={0}
                max={videoSpec.duration}
                step={0.1}
                value={currentTime}
                aria-label="Seek timeline in seconds"
                className="films-transport-slider"
                onChange={(e) => {
                  setHasStarted(true);
                  seekTo(Number(e.target.value));
                }}
              />
            </div>

            {videoSpec.captions.length > 0 && (
              <button
                type="button"
                className="films-transport-btn"
                aria-pressed={showCaptionsBar}
                onClick={() => setShowCaptionsBar((v) => !v)}
                aria-label={showCaptionsBar ? "Hide synchronized caption bar" : "Show synchronized caption bar"}
                title={showCaptionsBar ? "Hide caption bar" : "Show caption bar"}
              >
                <Captions className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              className="films-transport-btn"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute digital keystroke audio" : "Mute digital keystroke audio"}
              title={muted ? "Unmute audio" : "Mute audio"}
            >
              {muted ? (
                <VolumeX className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {film.youtubeId && (
              <button
                type="button"
                className="films-transport-btn films-transport-btn--text"
                onClick={() => {
                  setPlaying(false);
                  setSourceMode("youtube");
                }}
              >
                YouTube
              </button>
            )}

            <button
              type="button"
              className="films-transport-btn"
              onClick={handleFullscreen}
              aria-label="Toggle fullscreen"
              title="Toggle fullscreen"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Inline Act Quick-Jump Bar inside Player Chrome (only when explicitly requested) */}
          {showActs && film.acts.length > 0 && (
            <div className="films-transport-acts" role="group" aria-label="Jump to film act">
              {film.acts.map((act) => {
                const isCurrentAct = act.id === activeActId && hasStarted;
                return (
                  <button
                    key={act.id}
                    type="button"
                    className="films-transport-act-pill"
                    data-active={isCurrentAct ? "true" : "false"}
                    onClick={() => {
                      setHasStarted(true);
                      seekTo(act.seconds);
                      setPlaying(true);
                    }}
                  >
                    <span className="films-transport-act-code">{act.code}</span>
                    <span className="films-transport-act-title">{act.title}</span>
                    <span className="films-transport-act-time">{act.timestamp}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
