import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Captions,
  Maximize2,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import identity from "../../content/identity.json";
import spokenTrailerCaptions from "../../content/inquiry-trailer-captions.json";
import {
  INQUIRY_VIDEOS,
  TRAILER_VOICE_OFFSET_SECONDS,
  inquiryTypeTicks,
  mountInquiryCanvas,
  type InquiryVideoSpec,
  type TrailerSceneSpec,
} from "../../../scripts/channel-inquiry-video.mjs";
import { TrailerAudioEngine } from "./TrailerAudioEngine";

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

function formatTimecode(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(clamped / 60)).padStart(2, "0");
  const secs = String(clamped % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

/** Index of the last time at or before `seconds`, or -1 when none has passed. */
function lastIndexAtOrBefore(times: readonly number[], seconds: number): number {
  let index = -1;
  while (index + 1 < times.length && times[index + 1] <= seconds) index += 1;
  return index;
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
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(true);
  const [voiceoverUnavailable, setVoiceoverUnavailable] = useState(false);
  const [bufferingVoiceover, setBufferingVoiceover] = useState(false);
  const [showCaptionsBar, setShowCaptionsBar] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 639px)").matches,
  );
  const [currentTime, setCurrentTime] = useState<number>(film.posterSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);

  const playerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<{ seek: (seconds: number) => void } | null>(null);
  const timeRef = useRef<number>(film.posterSeconds);
  const audioEngineRef = useRef<TrailerAudioEngine | null>(null);
  const lastSceneIdRef = useRef<string | null>(null);
  const lastTickIndexRef = useRef<number>(-1);
  const lastCueIndexRef = useRef<number>(-1);

  useEffect(() => {
    setFullscreenAvailable(
      typeof playerRef.current?.requestFullscreen === "function" &&
      document.fullscreenEnabled !== false,
    );
  }, []);

  const videoSpec: InquiryVideoSpec = useMemo(() => {
    return (
      INQUIRY_VIDEOS.find((v) => v.name === film.id) ??
      INQUIRY_VIDEOS.find((v) => v.name === "inquiry-trailer")!
    );
  }, [film.id]);

  const scenes: TrailerSceneSpec[] = useMemo(
    () => videoSpec.scenes ?? [],
    [videoSpec.scenes],
  );
  const narrationOnly = videoSpec.name === "inquiry-trailer";
  const ticks = useMemo(
    () => narrationOnly ? [] : inquiryTypeTicks(videoSpec),
    [narrationOnly, videoSpec],
  );
  // A short film's score marks each beat once, as its text arrives.
  const cues = useMemo(
    () => narrationOnly ? [] : videoSpec.captions.map((caption) => caption.start),
    [narrationOnly, videoSpec],
  );

  const getAudioEngine = useCallback(() => {
    if (!audioEngineRef.current) {
      const engine = new TrailerAudioEngine(setVoiceoverUnavailable, {
        narrationOnly,
        voiceOffsetSeconds: narrationOnly ? TRAILER_VOICE_OFFSET_SECONDS : 0,
      });
      engine.setMuted(muted);
      engine.setVoiceoverEnabled(voiceoverEnabled);
      audioEngineRef.current = engine;
    }
    return audioEngineRef.current;
  }, [muted, voiceoverEnabled, narrationOnly]);

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
    setVoiceoverUnavailable(false);
    timeRef.current = film.posterSeconds;
    setCurrentTime(film.posterSeconds);
    lastTickIndexRef.current = -1;
    lastCueIndexRef.current = -1;
    lastSceneIdRef.current = null;
    audioEngineRef.current?.destroy();
    audioEngineRef.current = null;
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
      diagramOnly: false,
    });
    controllerRef.current = handle;
    handle.seek(timeRef.current);
    if (typeof document !== "undefined" && "fonts" in document) {
      void document.fonts.ready.then(() => {
        controllerRef.current?.seek(timeRef.current);
      });
    }
  }, [videoSpec, edition, sourceMode]);

  // Active scene for the 12-scene trailer (returns null during the 0:00–0:05 DOT Emergence Opening Splash)
  const activeScene: TrailerSceneSpec | null = useMemo(() => {
    if (!scenes.length) return null;
    if (currentTime < scenes[0].start) return null;
    return (
      scenes.find((sc) => currentTime >= sc.start && currentTime < sc.end) ??
      scenes[scenes.length - 1]
    );
  }, [scenes, currentTime]);

  // Keep recorded narration on the film clock; short films get their beat tones instead.
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!playing || sourceMode !== "native") {
      engine?.pause();
      setBufferingVoiceover(false);
      lastSceneIdRef.current = null;
      return;
    }
    const liveEngine = getAudioEngine();
    liveEngine.start();
    // Load the first narration during the opening splash, after the reader starts.
    const scene = activeScene ?? (narrationOnly ? scenes[0] : null);
    if (scene) {
      const sceneIdx = Math.max(0, scene.number - 1);
      liveEngine.updateScene(
        sceneIdx,
        timeRef.current,
        scene.primaryStatement,
        scene.start,
      );
      lastSceneIdRef.current = scene.id;
    } else {
      liveEngine.clearScene();
    }
  }, [playing, sourceMode, activeScene, currentTime, getAudioEngine, narrationOnly, scenes]);

  const playKeystrokeTick = useCallback(
    (index: number, atTime: number) => {
      if (muted || typeof window === "undefined") return;
      // Only trigger typewriter ticks during the first 2.5s of each scene's text reveal
      if (scenes.length > 0) {
        const sc = scenes.find((s) => atTime >= s.start && atTime < s.end);
        if (sc && atTime - sc.start > 2.5) return;
      }
      getAudioEngine().playKeystrokeTick(index);
    },
    [muted, scenes, getAudioEngine],
  );

  const seekTo = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(videoSpec.duration, seconds));
      timeRef.current = clamped;
      audioEngineRef.current?.requestVoiceoverSeek();
      setCurrentTime(clamped);
      controllerRef.current?.seek(clamped);
      lastSceneIdRef.current = null;
      // Seeking never strikes a beat; only playing through one does.
      lastTickIndexRef.current = lastIndexAtOrBefore(ticks, clamped);
      lastCueIndexRef.current = lastIndexAtOrBefore(cues, clamped);
    },
    [ticks, cues, videoSpec.duration],
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
      const dt = Math.max(0, (now - prev) / 1000);
      prev = now;
      const waiting = audioEngineRef.current?.waitingForVoiceover ?? false;
      setBufferingVoiceover(waiting);
      if (waiting) {
        raf = window.requestAnimationFrame(step);
        return;
      }
      const nextTime = timeRef.current + dt;

      for (let i = lastTickIndexRef.current + 1; i < ticks.length; i++) {
        if (ticks[i] <= nextTime) {
          if (ticks[i] >= timeRef.current - 0.05) {
            playKeystrokeTick(i, ticks[i]);
          }
          lastTickIndexRef.current = i;
        } else {
          break;
        }
      }

      for (let i = lastCueIndexRef.current + 1; i < cues.length && cues[i] <= nextTime; i++) {
        if (cues[i] >= timeRef.current - 0.05) audioEngineRef.current?.playCue(i);
        lastCueIndexRef.current = i;
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
  }, [playing, sourceMode, ticks, cues, videoSpec.duration, playKeystrokeTick]);

  // Cleanup AudioEngine on unmount.
  useEffect(() => {
    return () => {
      audioEngineRef.current?.destroy();
      audioEngineRef.current = null;
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

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      audioEngineRef.current?.setMuted(next);
      return next;
    });
  };

  const toggleVoiceover = () => {
    setVoiceoverEnabled((prev) => {
      const next = !prev;
      audioEngineRef.current?.setVoiceoverEnabled(next);
      return next;
    });
  };

  const handleFullscreen = () => {
    const el = playerRef.current;
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

  const activeSpokenCaption = useMemo(
    () => narrationOnly
      ? spokenTrailerCaptions.find((caption) =>
          currentTime >= caption.startSeconds && currentTime < caption.endSeconds,
        )?.text ?? ""
      : "",
    [narrationOnly, currentTime],
  );
  const captionReadout = narrationOnly
    ? activeSpokenCaption
    : activeCaption
      ? `${activeCaption.lines.join(" ")} ${(activeCaption.notes ?? (activeCaption.note ? [activeCaption.note] : [])).join(" ")}`
      : "";
  const captionDisplay = narrationOnly
    ? hasStarted ? activeSpokenCaption : film.title
    : activeCaption?.lines.join(" ") ?? film.title;

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

  const formattedTotalDuration = useMemo(
    () => formatTimecode(videoSpec.duration),
    [videoSpec.duration],
  );

  return (
    <div
      ref={playerRef}
      className={`films-screening-shell ${compact ? "films-screening-shell--compact" : ""}`}
      data-edition={edition}
      data-scene-mode={activeScene?.mode ?? "default"}
    >
      {/* Main 16:9 Stage */}
      <div className="films-stage-viewport">
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

            {!playing && !hasStarted && (
              <button
                type="button"
                className="films-play-hero-btn"
                onClick={togglePlay}
                aria-label={`Play ${film.title} (${film.duration})`}
              >
                <span className="films-play-hero-icon" aria-hidden="true">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <span className="films-play-hero-label">
                  Play · {film.duration}
                </span>
              </button>
            )}

            {bufferingVoiceover && (
              <p className="films-buffering-status" role="status">
                Loading narration…
              </p>
            )}

            {/* Short-film text retains its live readout. The spoken trailer’s
                accessible transcript avoids competing speech over its narration. */}
            {!narrationOnly && hasStarted && captionReadout && (
              <div className="sr-only" aria-live="polite">
                {captionReadout}
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
            {captionDisplay}
          </p>
        </div>
      )}

      {sourceMode === "native" && voiceoverEnabled && voiceoverUnavailable && (
        <div className="films-live-caption-bar" role="status">
          <p className="films-live-caption-lines">
            This scene’s narration could not play. You can still read the film transcript.
          </p>
        </div>
      )}

      {/* Transport Scrubber Bar & Scene Markers (Native Mode) */}
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
              {formatTimecode(currentTime)} <span aria-hidden="true">/</span>{" "}
              {formattedTotalDuration}
            </span>

            <div className="films-scrubber-wrap">
              <div
                className="films-scrubber-progress"
                style={{ width: `${progressPercent}%` }}
                aria-hidden="true"
              />
              {scenes.length > 0
                ? scenes.map((sc) => {
                    const isCurrentScene = activeScene?.id === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        className="films-scrubber-scene-marker"
                        data-active={isCurrentScene ? "true" : "false"}
                        data-mode={sc.mode}
                        style={{
                          left: `${(sc.start / Math.max(1, videoSpec.duration)) * 100}%`,
                        }}
                        title={`Scene ${sc.number}: ${sc.actHeader} (${sc.timecode})`}
                        aria-label={`Jump to Scene ${sc.number}: ${sc.actHeader}`}
                        onClick={() => {
                          setHasStarted(true);
                          seekTo(sc.start + 0.05);
                        }}
                      />
                    );
                  })
                : film.acts.map((act) => (
                    <span
                      key={act.id}
                      className="films-scrubber-notch"
                      style={{
                        left: `${(act.seconds / Math.max(1, videoSpec.duration)) * 100}%`,
                      }}
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
                aria-valuetext={`${formatTimecode(currentTime)} of ${formattedTotalDuration}`}
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
                aria-label={
                  showCaptionsBar
                    ? "Hide synchronized caption bar"
                    : "Show synchronized caption bar"
                }
                title={showCaptionsBar ? "Hide caption bar" : "Show caption bar"}
              >
                <Captions className="h-4 w-4" aria-hidden="true" />
              </button>
            )}

            {scenes.length > 0 && (
              <button
                type="button"
                className="films-transport-btn"
                aria-pressed={voiceoverEnabled}
                onClick={toggleVoiceover}
                aria-label={
                  voiceoverEnabled
                    ? "Disable synchronized voiceover"
                    : "Enable synchronized voiceover"
                }
                title={voiceoverEnabled ? "Voiceover On" : "Voiceover Off"}
              >
                {voiceoverEnabled ? (
                  <Mic className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <MicOff className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}

            <button
              type="button"
              className="films-transport-btn"
              onClick={toggleMute}
              aria-label={
                muted
                  ? "Unmute film audio"
                  : "Mute film audio"
              }
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

            {fullscreenAvailable && (
              <button
                type="button"
                className="films-transport-btn"
                onClick={handleFullscreen}
                aria-label="Toggle fullscreen"
                title="Toggle fullscreen"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {scenes.length > 0 && (
            <label className="films-scene-jump">
              <span>Jump to scene</span>
              <select
                aria-label="Jump to trailer scene"
                value={activeScene?.id ?? "opening"}
                onChange={(event) => {
                  const scene = scenes.find((item) => item.id === event.target.value);
                  setHasStarted(true);
                  seekTo(scene ? scene.start + 0.05 : 0);
                }}
              >
                <option value="opening">Opening · 00:00</option>
                {scenes.map((scene) => (
                  <option key={scene.id} value={scene.id}>
                    {scene.number}. {scene.actHeader.replace(/^\d+\s*\/\/\s*/, "")} · {formatTimecode(scene.start)}
                  </option>
                ))}
              </select>
            </label>
          )}

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
