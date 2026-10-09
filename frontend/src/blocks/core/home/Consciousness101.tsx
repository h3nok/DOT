import { ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import HOME from "../../../content/home.json";

export function Consciousness101() {
  return (
    <section
      id="consciousness-101"
      className="home-environment home-theory-layer-environment"
      data-layer="little-c"
      aria-labelledby="consciousness-101-title"
    >
      <div className="dot-page-container dot-page-wide">
        <article className="home-theory-layer-card home-consciousness-101">
          <div className="home-theory-layer-copy">
            <span className="home-theory-layer-status">Love and relationships</span>
            <h2 id="consciousness-101-title" className="dot-page-heading">Consciousness 101</h2>
            <p className="home-theory-layer-lede">
              In DOT, the purpose of Little c is to develop toward Love.
              Relationships are where that development becomes lived experience.
            </p>
            <blockquote className="home-love-statement">
              <p>{HOME.loveDefinition}</p>
            </blockquote>
            <p className="home-theory-layer-human-stakes">
              It is practiced in how you listen, tell the truth, respect another
              person’s agency, and take responsibility for what follows.
            </p>
            <p className="home-theory-layer-human-stakes">
              A relationship need not mean agreement or self-abandonment.
              Care can include boundaries, accountability, and repair.
              The work is not to become perfect in isolation, but to learn
              how to relate without letting Fear govern the encounter.
            </p>
            <p className="home-consciousness-101-source">
              <Link to="/book/digital-organism-theory/the-painting#love-must-become-operational">
                Book One · Love Must Become Operational
              </Link>
            </p>
            <a href="#choose-path" className="home-theory-layer-next">
              <span>
                <small>From purpose to inquiry</small>
                <span className="home-theory-layer-next-title">Read and inquire</span>
              </span>
              <ArrowDown aria-hidden="true" />
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
