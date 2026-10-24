import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Play,
  ShieldCheck,
} from "lucide-react";

import { author } from "../../content/author";
import filmsData from "../../content/films.json";
import { AppearanceControl } from "../../organism/AppearanceControl";
import { FocusNav } from "../../attention-os/focus-nav/FocusNav";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { INQUIRY_VIDEOS } from "../../../scripts/channel-inquiry-video.mjs";
import { FilmEpisodeArtwork } from "./FilmEpisodeArtwork";
import {
  ScreeningRoomPlayer,
  type ScreeningFilmMeta,
} from "./ScreeningRoomPlayer";
import "./films.css";

function formatBeatTime(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = String(clamped % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function FilmsPage() {
  const screeningFilms = filmsData.screeningFilms as ScreeningFilmMeta[];
  const [activeFilmId, setActiveFilmId] = useState<string>(
    screeningFilms[0]?.id ?? "inquiry-trailer",
  );
  const [seekRequest, setSeekRequest] = useState<{
    seconds: number;
    autoplay: boolean;
    seq: number;
  } | null>(null);
  const seqRef = useRef(0);
  const screeningSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.title = `${filmsData.eyebrow} — ${author.name}`;
  }, []);

  const activeFilm = useMemo(() => {
    return (
      screeningFilms.find((f) => f.id === activeFilmId) ?? screeningFilms[0]
    );
  }, [screeningFilms, activeFilmId]);

  const activeVideoSpec = useMemo(() => {
    return (
      INQUIRY_VIDEOS.find((v) => v.name === activeFilm.id) ??
      INQUIRY_VIDEOS.find((v) => v.name === "inquiry-trailer")!
    );
  }, [activeFilm.id]);

  const triggerSeek = (
    filmId: string,
    seconds: number,
    autoplay = true,
    scrollToPlayer = false,
  ) => {
    seqRef.current += 1;
    const nextSeq = seqRef.current;
    if (filmId !== activeFilmId) {
      setActiveFilmId(filmId);
    }
    setSeekRequest({ seconds, autoplay, seq: nextSeq });
    if (scrollToPlayer && screeningSectionRef.current) {
      screeningSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const hasActs = activeFilm.acts.length > 0;
  const hasTranscript = activeVideoSpec.captions.length > 0;

  return (
    <PageShell
      wide
      className="films-page"
      header={<PageHeader controls={<AppearanceControl placement="inline" />} />}
      footer={<SiteColophon variant="personal" />}
    >
      <Helmet>
        <title>{`${filmsData.eyebrow} — ${author.name}`}</title>
        <meta name="description" content={filmsData.description} />
      </Helmet>

      {/* Masthead: the title on the left, what to do here on the right */}
      <header className="films-masthead">
        <div className="films-masthead-line">
          <p className="dot-label">{filmsData.eyebrow}</p>
          <p className="films-byline">
            By{" "}
            <Link to="/about" className="films-inline-link">
              {author.name}
            </Link>
          </p>
        </div>

        <div className="films-hero-grid">
          <h1 className="dot-page-heading films-hero-title">
            {filmsData.title}
          </h1>

          <div className="films-hero-aside">
            <p className="films-hero-subtitle">{filmsData.subtitle}</p>
            <div className="films-hero-actions">
              <a href="#screening-room" className="films-btn-primary">
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                <span>Watch the trailer</span>
              </a>
              <a
                href={filmsData.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="films-text-link"
              >
                <span>{filmsData.channelHandle} on YouTube</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <p className="films-privacy-line">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>{filmsData.privacyNote}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Screening room: choose a film, watch it, then follow its acts into the book */}
      <section
        id="screening-room"
        ref={screeningSectionRef}
        aria-labelledby="screening-room-heading"
        className="films-section"
      >
        <div className="films-section-head">
          <p className="dot-label">Screening room</p>
          <h2 id="screening-room-heading" className="films-section-title">
            Featured Films
          </h2>
        </div>

        <div
          className="films-tabs"
          role="tablist"
          aria-label="Select film to screen"
        >
          {screeningFilms.map((film) => {
            const isSelected = film.id === activeFilm.id;
            return (
              <button
                key={film.id}
                type="button"
                role="tab"
                id={`tab-${film.id}`}
                aria-selected={isSelected}
                aria-controls="screening-player-panel"
                className="films-tab"
                onClick={() => {
                  setActiveFilmId(film.id);
                  setSeekRequest(null);
                }}
              >
                <span className="films-tab-meta">
                  {film.number} · {film.duration}
                </span>
                <span className="films-tab-title">{film.title}</span>
              </button>
            );
          })}
        </div>

        <div
          id="screening-player-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeFilm.id}`}
        >
          <ScreeningRoomPlayer
            film={activeFilm}
            seekRequest={seekRequest}
            showActs={false}
          />

          <div
            className="films-detail"
            data-columns={hasActs || hasTranscript ? "2" : "1"}
          >
            <div className="films-detail-copy">
              <p className="dot-label">{activeFilm.badge}</p>
              <h3 className="films-detail-title">{activeFilm.title}</h3>
              <p className="films-detail-summary">{activeFilm.summary}</p>
              <p className="films-claims">
                <span className="films-claims-label">Claims</span>{" "}
                {activeFilm.claimLevels.join(" · ")}
              </p>
              <Link to={activeFilm.companion.to} className="films-text-link films-text-link--accent">
                <span>{activeFilm.companion.label}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            {(hasActs || hasTranscript) && (
              <div className="films-detail-acts">
                {hasActs && (
                  <ol
                    className="films-acts"
                    aria-label="Film acts and chapter timestamps"
                  >
                    {activeFilm.acts.map((act) => (
                      <li key={act.id} className="films-act">
                        <button
                          type="button"
                          className="films-seek-btn"
                          onClick={() =>
                            triggerSeek(activeFilm.id, act.seconds, true, false)
                          }
                          aria-label={`Seek player to ${act.code} (${act.timestamp}): ${act.title}`}
                        >
                          <Play className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                          <span>{act.timestamp}</span>
                        </button>
                        <div className="films-act-body">
                          <p className="films-act-code">{act.code}</p>
                          <h4 className="films-act-title">{act.title}</h4>
                          <Link to={act.readingTo} className="films-act-link">
                            {act.readingLabel}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {hasTranscript && (
                  <details className="films-transcript">
                    <summary className="films-transcript-summary">
                      Read the transcript
                    </summary>
                    <ol className="films-transcript-list">
                      {activeVideoSpec.captions.map((cap, index) => {
                        const stamp = formatBeatTime(cap.start);
                        const notes =
                          cap.notes ?? (cap.note ? [cap.note] : []);
                        return (
                          <li key={`${cap.start}-${index}`} className="films-transcript-item">
                            <button
                              type="button"
                              className="films-seek-btn"
                              onClick={() =>
                                triggerSeek(activeFilm.id, cap.start + 0.1, true, false)
                              }
                              aria-label={`Jump to transcript beat at ${stamp}`}
                            >
                              <span>{stamp}</span>
                            </button>
                            <div>
                              <p className="films-transcript-line">
                                {cap.lines.join(" ")}
                              </p>
                              {notes.map((n, idx) => (
                                <p key={idx} className="films-transcript-note">
                                  {n}
                                </p>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Series: each stream's title and description side by side, then its episodes two across */}
      <section
        id="channel-streams"
        aria-labelledby="channel-streams-heading"
        className="films-section"
      >
        <div className="films-section-head films-section-head--split">
          <div>
            <p className="dot-label">On YouTube</p>
            <h2 id="channel-streams-heading" className="films-section-title">
              Series on {filmsData.channelHandle}
            </h2>
          </div>
          <div className="films-section-aside">
            <p>{filmsData.seriesNote}</p>
            <a
              href={filmsData.channelUrl}
              target="_blank"
              rel="noreferrer"
              className="films-text-link"
            >
              <span>Open the channel</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="films-streams">
          {filmsData.streams.map((stream) => (
            <div key={stream.id} className="films-stream">
              <div className="films-stream-intro">
                <div>
                  <p className="dot-label">{stream.number}</p>
                  <h3 className="films-stream-title">{stream.title}</h3>
                </div>
                <p className="films-stream-description">{stream.description}</p>
              </div>

              <ul
                className="films-episodes"
                data-layout={stream.episodes.length % 2 === 1 ? "lead" : "pairs"}
                aria-label={stream.title}
              >
                {stream.episodes.map((episode) => (
                  <li key={episode.id} className="films-episode">
                    <div className="films-episode-art">
                      <FilmEpisodeArtwork variant={episode.artwork} />
                    </div>

                    <div className="films-episode-body">
                      <p className="films-episode-code">{episode.code}</p>
                      <h4 className="films-episode-title">{episode.title}</h4>
                      <p className="films-episode-subtitle">{episode.subtitle}</p>
                      <div className="films-episode-actions">
                        <Link
                          to={episode.readingTo}
                          className="films-text-link films-text-link--accent"
                        >
                          <span>{episode.readingLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className="films-text-link"
                          onClick={() =>
                            triggerSeek(
                              episode.screeningFilmId,
                              episode.screeningSeconds,
                              true,
                              true,
                            )
                          }
                        >
                          <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                          <span>
                            Preview at {formatBeatTime(episode.screeningSeconds)}
                          </span>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Law 3: Finite completion boundary */}
        <p className="films-completion-note">{filmsData.completionNote}</p>
      </section>

      {/* Single-Focus Navigation (P3) */}
      <div className="films-continue">
        <FocusNav
          label="Continue inquiry"
          primary={{
            label: "Read Book One",
            to: "/book/digital-organism-theory",
          }}
          secondary={[
            { label: "Book One Concept Map", to: "/doctrine" },
            { label: "The American Millennial Manifesto", to: "/amm" },
            { label: "Open Questions", to: "/applied" },
          ]}
        />
      </div>
    </PageShell>
  );
}
