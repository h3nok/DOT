import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import filmsData from "../../../content/films.json";
import { ConceptTourPlayer } from "../../films/ConceptTourPlayer";
import { CONCEPT_TOUR_SECONDS } from "../../films/conceptTour";
import { formatDuration } from "../../films/filmTime";
import "../../films/films.css";

// The homepage plays one silent film through every concept in the Concept Map.
const TOUR = filmsData.conceptTour;

const INNER_LOOP_CARDS = [
  {
    step: "01",
    title: "What a short reply can stir up",
    status: "Experience & interpretation",
    tone: "local",
    body: "Someone replies ‘Okay.’ One person hears irritation; another hears a busy day. The message is shared. The interpretation carries a history.",
    linkLabel: "Chapter 5 · The Canvas",
    linkTo: "/book/digital-organism-theory/the-canvas",
  },
  {
    step: "02",
    title: "When protection becomes a pattern",
    status: "Fear & choice",
    tone: "rf",
    body: "An old argument can make a new question sound like an attack. Noticing that familiar reaction gives you a place to pause and ask what is happening now.",
    linkLabel: "Chapter 6 · The Painting",
    linkTo: "/book/digital-organism-theory/the-painting",
  },
  {
    step: "03",
    title: "Room for a different response",
    status: "Love & development",
    tone: "big-c",
    body: "A pause can make room for curiosity, a boundary, or a more honest reply. In DOT, Love names the condition in which Fear no longer governs those choices.",
    linkLabel: "Full Screening Room & Series",
    linkTo: "/academy/films",
  },
] as const;

export function HomeFilmSection() {
  return (
    <section
      id="visual-inquiry"
      aria-labelledby="visual-inquiry-title"
      className="home-environment home-film-environment"
    >
      <div className="dot-page-container dot-page-wide home-film-layout">
        <header className="home-film-heading">
          <div>
            <p className="dot-label">{TOUR.label} · {formatDuration(CONCEPT_TOUR_SECONDS)}</p>
            <h2 id="visual-inquiry-title">{TOUR.title}</h2>
          </div>
          <Link to="/academy/films">Films in the Academy <ArrowRight aria-hidden="true" /></Link>
        </header>
        <div className="home-film-stage">
          <ConceptTourPlayer />
        </div>

        {/* Inner Loop & Canvas Entropy bridge */}
        <div
          className="home-film-inner-loop"
          aria-label="The inner loop of Little c: Canvas, Fear, and Love"
        >
          <div className="home-film-inner-loop__intro">
            <span className="home-film-inner-loop__kicker">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>An invitation to personal exploration</span>
            </span>
            <p className="home-film-inner-loop__summary">
              Begin with an ordinary moment. Notice what happened, what it
              meant to you, and what you chose next. Explore the concepts
              through your own experience.
            </p>
          </div>

          <div className="home-film-inner-loop__grid">
            {INNER_LOOP_CARDS.map((card) => (
              <article
                key={card.step}
                className="home-film-loop-card"
                data-tone={card.tone}
              >
                <div className="home-film-loop-card__top">
                  <span className="home-film-loop-card__step">
                    {card.step} · {card.status}
                  </span>
                </div>
                <h3 className="home-film-loop-card__title">{card.title}</h3>
                <p className="home-film-loop-card__body">{card.body}</p>
                <Link to={card.linkTo} className="home-film-loop-card__link">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{card.linkLabel}</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeFilmSection;
