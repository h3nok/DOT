import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import filmsData from "../../../content/films.json";
import {
  ScreeningRoomPlayer,
  type ScreeningFilmMeta,
} from "../../films/ScreeningRoomPlayer";
import "../../films/films.css";

const TRAILER = (filmsData.screeningFilms as ScreeningFilmMeta[])[0];

const INNER_LOOP_CARDS = [
  {
    step: "01",
    formula: "Experience → Canvas → Painting",
    title: "The Inner Loop of Little c",
    status: "Model · Ch. 5–6",
    tone: "local",
    body: "Every consequential action in RF₀ returns feedback to Little c. That feedback etches the Canvas; what accumulates there becomes the Painting — the interpretive lens that colours the next moment before deliberate thought begins.",
    linkLabel: "Chapter 5 · The Canvas",
    linkTo: "/book/digital-organism-theory/the-canvas",
  },
  {
    step: "02",
    formula: "E_C ↑ → Fragmented Intent",
    title: "Fear: High Canvas Entropy",
    status: "Model · Defensive State",
    tone: "rf",
    body: "When the Canvas is turbulent and unexamined, high entropy governs. Perception narrows around defence, urgency, and control, and Little c mistakes its inherited Painting for the whole of reality.",
    linkLabel: "Chapter 6 · The Painting",
    linkTo: "/book/digital-organism-theory/the-painting",
  },
  {
    step: "03",
    formula: "E_C ↓ → Coherent Intent",
    title: "Love: Low Canvas Entropy",
    status: "Model · Stabilized State",
    tone: "big-c",
    body: "Because Little c is an undifferentiated local process of awareness, being Love means Canvas entropy is low. Distortion settles, agency widens, and Intent aligns with truth and care rather than defence.",
    linkLabel: "Full Screening Room & Series",
    linkTo: "/films",
  },
] as const;

export function HomeFilmSection() {
  if (!TRAILER) return null;

  return (
    <section
      id="visual-inquiry"
      aria-labelledby="visual-inquiry-title"
      className="home-environment home-film-environment"
    >
      <div className="dot-page-container dot-page-wide home-film-layout">
        {/* The film alone: no header, no tabs, just the trailer */}
        <h2 id="visual-inquiry-title" className="sr-only">
          Visual inquiry
        </h2>
        <div className="home-film-stage">
          <ScreeningRoomPlayer film={TRAILER} compact />
        </div>

        {/* Inner Loop & Canvas Entropy bridge */}
        <div
          className="home-film-inner-loop"
          aria-label="The inner loop of Little c: Canvas, Fear, and Love"
        >
          <div className="home-film-inner-loop__intro">
            <span className="home-film-inner-loop__kicker">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Inside Little c · The Experience Loop</span>
            </span>
            <p className="home-film-inner-loop__summary">
              Why does the architecture matter for how you live? Because{" "}
              <strong>Little c</strong> is an undifferentiated conscious process
              whose state is governed by the entropy of its{" "}
              <strong>Canvas</strong>.
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
                  <code className="home-film-loop-card__formula">
                    {card.formula}
                  </code>
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