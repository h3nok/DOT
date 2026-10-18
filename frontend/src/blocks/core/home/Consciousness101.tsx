import { ArrowDown } from "lucide-react";
import HOME from "../../../content/home.json";
import { TextLink } from "../../../shared/design-system/Editorial";

export function Consciousness101() {
  return (
    <section
      id="consciousness-101"
      className="home-environment home-culture-environment"
      aria-labelledby="consciousness-101-title"
    >
      <div className="dot-page-container dot-page-wide">
        <div className="home-culture-layout">
          <div className="home-culture-critique">
            <p className="dot-label">{HOME.culture.eyebrow}</p>
            <h2 id="consciousness-101-title" className="dot-section-heading">{HOME.culture.title}</h2>
            <p className="home-culture-body">{HOME.culture.critique}</p>
            <p className="home-culture-body">{HOME.culture.questions}</p>
            <p className="home-culture-challenge"><strong>{HOME.culture.challenge}</strong></p>
          </div>
          <div className="home-culture-love">
            <p className="dot-label">{HOME.culture.loveLabel}</p>
            <p className="home-culture-body">{HOME.culture.loveIntro}</p>
            <blockquote className="home-love-statement">
              <p>{HOME.loveDefinition}</p>
            </blockquote>
            <p className="home-culture-body">{HOME.culture.reflection}</p>
            <TextLink className="home-culture-source" to={HOME.culture.sourcePath}>{HOME.culture.sourceLabel}</TextLink>
          </div>
          <TextLink href="#possibility-field" className="home-culture-next" icon={<ArrowDown />}>Explore the proposed architecture</TextLink>
        </div>
      </div>
    </section>
  );
}
