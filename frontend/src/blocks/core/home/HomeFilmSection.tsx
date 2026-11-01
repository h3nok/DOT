import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import filmsData from "../../../content/films.json";
import { DarkFilmPlayer } from "../../films/DarkFilmPlayer";
import { DARK_FILM_SECONDS } from "../../films/darkFilmRevision";
import { formatDuration } from "../../films/filmTime";
import "../../films/films.css";

// The revised opening leads into every concept; playback begins only on request.
const TOUR = filmsData.conceptTour;

const INNER_LOOP_CARDS = [
  {
    step: "01",
    title: "The body responds",
    status: "An ordinary moment",
    tone: "local",
    body: "Someone replies ‘Okay.’ Your chest tightens; you feel dismissed. Someone else might read the same words as a busy day. The feeling is real. What the other person meant still needs to be understood.",
    linkLabel: "Chapter 5 · The Canvas",
    linkTo: "/book/digital-organism-theory/the-canvas",
  },
  {
    step: "02",
    title: "A history meets the present",
    status: "What experience leaves behind",
    tone: "rf",
    body: "If short replies have preceded rejection, the next one may already feel threatening. You answer defensively; the exchange becomes tense. What follows can reinforce that expectation or give you reason to revise it.",
    linkLabel: "Chapter 6 · The Painting",
    linkTo: "/book/digital-organism-theory/the-painting",
  },
  {
    step: "03",
    title: "A question worth talking through",
    status: "Choice & conversation",
    tone: "big-c",
    body: "‘When you said Okay, what did you mean?’ A reply may confirm your first reading or change it. There may be room for curiosity, a boundary, or a more honest response. DOT asks what you carry forward from that encounter.",
    linkLabel: "Bring a question to Henok",
    linkTo: "/contact?purpose=writing",
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
            <p className="dot-label">{TOUR.label} · {formatDuration(DARK_FILM_SECONDS)}</p>
            <h2 id="visual-inquiry-title">{TOUR.title}</h2>
          </div>
          <Link to="/academy/films">Films in the Academy <ArrowRight aria-hidden="true" /></Link>
        </header>
        <div className="home-film-stage">
          <DarkFilmPlayer />
        </div>

        {/* Inner Loop & Canvas Entropy bridge */}
        <div
          className="home-film-inner-loop"
          aria-label="An ordinary conversation through the lens of DOT"
        >
          <div className="home-film-inner-loop__intro">
            <span className="home-film-inner-loop__kicker">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>An idea to talk through</span>
            </span>
            <p className="home-film-inner-loop__summary">
              The film offers a model. A conversation can begin with one
              ordinary moment: what happened, what you felt, how you
              understood it, and what followed. You can discuss that moment
              while keeping the wider explanation open to question.
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
