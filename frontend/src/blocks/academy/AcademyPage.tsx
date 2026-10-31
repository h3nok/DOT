import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import landing from "../../content/academy/landing.json";
import { OPEN_SEAMS_EDITION, openSeams } from "../../content/applied/openSeams";
import filmsData from "../../content/films.json";
import { PageHeader, PageShell } from "../../shared/PageShell";
import { SiteColophon } from "../../shared/SiteColophon";
import { ArchitectureMap, TourOpening } from "../films/ConceptFilmMotifs";
import { CONCEPT_FILM_SECONDS, CONCEPT_FILMS, CONCEPT_MOTIFS } from "../films/conceptFilms";
import "../films/films.css";
import "../films/concept-films.css";
import "./academy-hub.css";

const BOOK = "/book/digital-organism-theory";
const number = (index: number) => String(index + 1).padStart(2, "0");

/** What the Academy holds, in the order a reader meets it. Each part owns a screen. */
const CONTENTS = [
  { id: "academy-read", label: "Read" },
  { id: "academy-concepts", label: "Concepts" },
  { id: "academy-films", label: "Films" },
  { id: "academy-questions", label: "Open questions" },
] as const;

/** The film's own drawing on its 600 × 600 stage, held at a finished frame. Nothing moves. */
function Still({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <svg
      className="concept-film-motif academy-hub-still"
      viewBox="0 0 600 600"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {children}
    </svg>
  );
}

/** The screening room shown by its first four films, held on their last frames. */
const SCREENING_PREVIEW = CONCEPT_FILMS.slice(0, 4);

const FILMS = [
  {
    to: "/film",
    kind: "Introduction",
    title: filmsData.conceptTour.title,
    description: "An introduction to every concept in Book One, with on-screen text. Sound is optional.",
    // The film's opening at its fullest: the struggle, inside the cultural trap, inside the Frame.
    art: <Still><TourOpening t={34} /></Still>,
  },
  {
    to: "/academy/films",
    kind: "Screening room",
    title: "Concept films",
    description: "A 16-second silent film for each concept, in concept map order.",
    art: (
      <span className="academy-hub-mosaic">
        {SCREENING_PREVIEW.map(({ id }) => {
          const { Motif } = CONCEPT_MOTIFS[id];
          return <Still key={id}><Motif t={CONCEPT_FILM_SECONDS} /></Still>;
        })}
      </span>
    ),
  },
];

/**
 * The Academy's front page: what it holds, shown rather than described.
 *
 * ADR-0030: it opens with reading, presents only materials that exist, plays no
 * film itself, and claims no course, assessment, or enrolment. The drawings are
 * the films' own, held still.
 */
export default function AcademyPage() {
  return (
    <PageShell wide className="academy-hub films-palette concept-film" header={<PageHeader />} footer={<SiteColophon />}>
      <Helmet>
        <title>{landing.title}</title>
        <meta name="description" content={landing.description} />
      </Helmet>

      <section id="academy-read" className="academy-hub-screen" aria-labelledby="academy-title">
        <div className="academy-hub-opening">
          <header className="academy-hub-heading academy-hub-masthead">
            <p className="dot-label">Digital Organism Theory</p>
            <h1 id="academy-title">{landing.heading}</h1>
            <p>{landing.introduction}</p>
            <nav className="academy-hub-contents" aria-label="In the Academy">
              {CONTENTS.map(({ id, label }, index) => (
                <a key={id} href={`#${id}`}><span aria-hidden="true">{number(index)}</span>{label}</a>
              ))}
            </nav>
          </header>
          <figure className="academy-hub-figure">
            <Still label="The architecture of Digital Organism Theory: T × E outside, Big C within it, RF₀ inside Big C, and Little c within RF₀.">
              <ArchitectureMap t={CONCEPT_FILM_SECONDS} layer="all" />
            </Still>
            <figcaption>The architecture of Digital Organism Theory: T × E outside, Big C within it, RF₀ inside Big C, and Little c within RF₀.</figcaption>
          </figure>
        </div>
        <ol className="academy-hub-grid academy-hub-grid--two" aria-label="Reading paths">
          {READING_PATHS.map((path, index) => (
            <li key={path.id}>
              <Link to={`${BOOK}/${path.steps[0].slug}?path=${path.id}`} className="academy-hub-card">
                <span className="academy-hub-meta" aria-hidden="true">Path {number(index)}</span>
                <h2>{path.label}</h2>
                <p>{path.purpose}</p>
                <ArrowRight className="academy-hub-arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <p className="academy-hub-note">
          Both paths use the same fixed, citable edition.{" "}
          <Link className="academy-hub-link" to={BOOK}>View Book One and its contents <ArrowRight aria-hidden="true" /></Link>
        </p>
      </section>

      <section id="academy-concepts" className="academy-hub-screen" aria-labelledby="academy-concepts-title">
        <header className="academy-hub-heading">
          <p className="dot-label">Concept map · Edition {CONCEPT_FILMS[0].node.version}</p>
          <h2 id="academy-concepts-title">Concepts</h2>
          <p>The {CONCEPT_FILMS.length} concepts of Book One in concept map order, with claim level, definition, and analogy.</p>
        </header>
        <ol className="academy-hub-grid academy-hub-grid--concepts" aria-label="Concepts">
          {CONCEPT_FILMS.map(({ id, number: position, node }) => {
            const { Motif, analogy } = CONCEPT_MOTIFS[id];
            return (
              <li key={id}>
                <Link to={`/doctrine/${id}`} className="academy-hub-concept">
                  <span className="academy-hub-concept-art"><Still><Motif t={CONCEPT_FILM_SECONDS} /></Still></span>
                  <span className="academy-hub-concept-copy">
                    <span className="academy-hub-meta"><span aria-hidden="true">{position}</span> {node.source.claimLevel}</span>
                    <h3>{node.title}</h3>
                    <span className="academy-hub-definition">{node.oneLine}</span>
                    <span className="academy-hub-analogy">{analogy}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <Link className="academy-hub-link" to="/doctrine">Open the concept map <ArrowRight aria-hidden="true" /></Link>
      </section>

      <section id="academy-films" className="academy-hub-screen" aria-labelledby="academy-films-title">
        <header className="academy-hub-heading">
          <p className="dot-label">Introduction and concept films</p>
          <h2 id="academy-films-title">Films</h2>
          <p>Films play only when started and stop at the end.</p>
        </header>
        <ul className="academy-hub-grid academy-hub-grid--two" aria-label="Films">
          {FILMS.map((film) => (
            <li key={film.to}>
              <Link to={film.to} className="academy-hub-card academy-hub-card--film">
                <span className="academy-hub-film-art">{film.art}</span>
                <span className="academy-hub-meta">{film.kind}</span>
                <h3>{film.title}</h3>
                <p>{film.description}</p>
                <ArrowRight className="academy-hub-arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="academy-questions" className="academy-hub-screen" aria-labelledby="academy-questions-title">
        <header className="academy-hub-heading">
          <p className="dot-label">Open seams · Edition {OPEN_SEAMS_EDITION}</p>
          <h2 id="academy-questions-title">Open questions</h2>
          <p>Questions Book One identifies as unresolved, each with what would settle it.</p>
        </header>
        <ol className="academy-hub-seams" aria-label="Open questions">
          {openSeams.map((seam, index) => (
            <li key={seam.id}>
              <Link to={`/applied#${seam.id}`}>
                <span className="academy-hub-meta" aria-hidden="true">{number(index)}</span>
                <span>{seam.title}</span>
                <ArrowRight className="academy-hub-arrow" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <nav className="academy-hub-next" aria-label="Continue the inquiry">
          <Link className="academy-hub-link" to="/applied">View all open questions <ArrowRight aria-hidden="true" /></Link>
          <Link className="academy-hub-link" to="/contact?purpose=writing">Ask a question <ArrowRight aria-hidden="true" /></Link>
        </nav>
      </section>
    </PageShell>
  );
}
