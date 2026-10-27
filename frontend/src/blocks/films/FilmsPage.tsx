import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
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
import { ConceptFilmPlayer } from "./ConceptFilmPlayer";
import { CONCEPT_FILMS, findConceptFilm } from "./conceptFilms";
import { FilmEpisodeArtwork } from "./FilmEpisodeArtwork";
import "./films.css";

const prefersStillness = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function FilmsPage() {
  // `?concept=` opens a particular film, so a concept's film can be linked directly.
  const [activeConceptId, setActiveConceptId] = useState<string>(() => {
    const requested = typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("concept");
    return findConceptFilm(requested)?.id ?? CONCEPT_FILMS[0].id;
  });
  const screeningSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    document.title = `${filmsData.eyebrow} — ${author.name}`;
  }, []);

  const activeIndex = Math.max(0, CONCEPT_FILMS.findIndex((film) => film.id === activeConceptId));
  const activeFilm = CONCEPT_FILMS[activeIndex];
  const previousFilm = CONCEPT_FILMS[activeIndex - 1];
  const nextFilm = CONCEPT_FILMS[activeIndex + 1];

  const selectFilm = (id: string, bringIntoView = false) => {
    setActiveConceptId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("concept", id);
    window.history.replaceState(window.history.state, "", url);
    if (bringIntoView) {
      screeningSectionRef.current?.scrollIntoView?.({
        behavior: prefersStillness() ? "auto" : "smooth",
        block: "start",
      });
    }
  };

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
          <p className="dot-label">
            <Link to="/academy" className="films-inline-link">Academy</Link>
            <span aria-hidden="true"> / </span>
            {filmsData.eyebrow}
          </p>
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
                <span>Watch the concept films</span>
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

      {/* Screening room: one concept's film, then every concept to choose from */}
      <section
        id="screening-room"
        ref={screeningSectionRef}
        aria-labelledby="screening-room-heading"
        className="films-section"
      >
        <div className="films-section-head films-section-head--split">
          <div>
            <p className="dot-label">Screening room</p>
            <h2 id="screening-room-heading" className="films-section-title">
              A short film for each concept
            </h2>
          </div>
          <div className="films-section-aside">
            <p>{filmsData.conceptFilmsNote}</p>
          </div>
        </div>

        <ConceptFilmPlayer film={activeFilm} />

        <div className="concept-film-detail">
          <div className="concept-film-links">
            <Link to={activeFilm.node.source.href} className="films-text-link films-text-link--accent">
              <span>Read the passage · {activeFilm.node.source.sectionTitle}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link to={`/doctrine/${activeFilm.id}`} className="films-text-link">
              <span>Open in the concept map</span>
            </Link>
          </div>
          <div className="concept-film-steps">
            <button
              type="button"
              className="concept-film-step-btn"
              disabled={!previousFilm}
              onClick={() => previousFilm && selectFilm(previousFilm.id)}
              aria-label={previousFilm ? `Previous film: ${previousFilm.node.title}` : "No previous film"}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <span className="concept-film-position">
              {activeFilm.number} of {CONCEPT_FILMS.length}
            </span>
            <button
              type="button"
              className="concept-film-step-btn"
              disabled={!nextFilm}
              onClick={() => nextFilm && selectFilm(nextFilm.id)}
              aria-label={nextFilm ? `Next film: ${nextFilm.node.title}` : "No next film"}
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav className="concept-film-index" aria-label="Concept films">
          <ol>
            {CONCEPT_FILMS.map((film) => (
              <li key={film.id}>
                <button
                  type="button"
                  aria-current={film.id === activeFilm.id ? "true" : undefined}
                  onClick={() => selectFilm(film.id, true)}
                >
                  <span className="concept-film-index-number">{film.number}</span>
                  <span className="concept-film-index-name">{film.node.title}</span>
                  <span className="concept-film-index-level">{film.node.source.claimLevel}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
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
                {stream.episodes.map((episode) => {
                  const conceptFilm = findConceptFilm(episode.conceptFilmId);
                  return (
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
                          {conceptFilm && (
                            <button
                              type="button"
                              className="films-text-link"
                              onClick={() => selectFilm(conceptFilm.id, true)}
                            >
                              <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                              <span>Watch the film: {conceptFilm.node.title}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
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
