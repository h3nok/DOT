import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import HOME from "../../../content/home.json";
import { TextLink } from "../../../shared/design-system/Editorial";

const CULTURE = HOME.culture;

/**
 * The problem and DOT's answer, side by side: the culture we inherit, which the American
 * Millennial Manifesto examines, and the direction Book One proposes. Each ends in its own
 * way in.
 */
export function Consciousness101() {
  return (
    <section
      id="consciousness-101"
      className="home-environment home-culture-environment"
      aria-labelledby="consciousness-101-title"
    >
      <div className="dot-page-container dot-page-wide">
        <div className="home-culture-layout">
          <div className="home-culture-card home-culture-card--critique">
            <p className="dot-label">{CULTURE.eyebrow}</p>
            <h2 id="consciousness-101-title" className="dot-section-heading">{CULTURE.title}</h2>
            <p className="home-culture-body">{CULTURE.critique}</p>
            <p className="home-culture-body">{CULTURE.questions}</p>
            <p className="home-culture-challenge"><strong>{CULTURE.challenge}</strong></p>
            <Link to={CULTURE.ammPath} className="home-culture-door home-culture-door--amm">
              <img className="home-culture-door-mark" src="/amm/mark.svg" alt="" width={36} height={36} />
              <span className="home-culture-door-text">
                <span className="home-culture-door-kicker">{CULTURE.ammKicker}</span>{" "}
                <span className="home-culture-door-title">{CULTURE.ammTitle}</span>
              </span>
              <ArrowRight className="home-culture-door-arrow" aria-hidden="true" />
            </Link>
          </div>

          <div className="home-culture-card home-culture-card--love" role="group" aria-labelledby="home-culture-love-label">
            <p id="home-culture-love-label" className="dot-label">{CULTURE.loveLabel}</p>
            <p className="home-culture-body">{CULTURE.loveIntro}</p>
            <blockquote className="home-love-statement">
              <p>{HOME.loveDefinition}</p>
            </blockquote>
            <p className="home-culture-body">{CULTURE.reflection}</p>
            <Link to={CULTURE.sourcePath} className="home-culture-door home-culture-door--book">
              <span className="home-culture-door-mark" aria-hidden="true"><BookOpen /></span>
              <span className="home-culture-door-text">
                <span className="home-culture-door-kicker">{CULTURE.sourceKicker}</span>{" "}
                <span className="sr-only">·</span>{" "}
                <span className="home-culture-door-title">{CULTURE.sourceTitle}</span>
              </span>
              <ArrowRight className="home-culture-door-arrow" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <TextLink href="#possibility-field" className="home-culture-next" icon={<ArrowDown />}>Explore the proposed architecture</TextLink>
      </div>
    </section>
  );
}
