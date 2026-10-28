import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { author } from "../../content/author";
import filmsData from "../../content/films.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { ConceptTourPlayer } from "./ConceptTourPlayer";
import { CONCEPT_TOUR_SECONDS } from "./conceptTour";
import { formatDuration } from "./filmTime";
import "./films.css";

const TOUR = filmsData.conceptTour;

/**
 * The homepage film at an address of its own, so it can be shared: the film is the page.
 * It plays only when the reader presses Play and stops at its end (L3).
 */
export default function FilmPage() {
  return (
    <PageShell wide className="film-page" header={<PageHeader />} footer={<SiteColophon variant="personal" />}>
      <Helmet>
        <title>{`${TOUR.title} — ${author.name}`}</title>
        <meta name="description" content={TOUR.description} />
      </Helmet>

      <header className="film-page-heading">
        <p className="dot-label">
          {TOUR.label} · {formatDuration(CONCEPT_TOUR_SECONDS)} · By{" "}
          <Link to="/about" className="films-inline-link">{author.name}</Link>
        </p>
        <h1 className="dot-page-heading">{TOUR.title}</h1>
      </header>

      <div className="film-page-stage">
        <ConceptTourPlayer />
      </div>

      <nav aria-label="After the film" className="film-page-next">
        {TOUR.closing.links.map((link) => (
          <Link key={link.to} to={link.to} className="films-inline-link">{link.label}</Link>
        ))}
        <Link to="/academy/films" className="films-inline-link">Films in the Academy</Link>
      </nav>
    </PageShell>
  );
}
