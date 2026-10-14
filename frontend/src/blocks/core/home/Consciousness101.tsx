import { ArrowDown } from "lucide-react";
import HOME from "../../../content/home.json";
import { TextLink } from "../../../shared/design-system/Editorial";

export function Consciousness101() {
  return (
    <section
      id="consciousness-101"
      className="home-environment home-practice-environment"
      aria-labelledby="consciousness-101-title"
    >
      <div className="dot-page-container dot-page-wide">
        <div className="home-practice-layout">
          <div className="home-practice-reflection">
            <p className="dot-label">{HOME.practice.eyebrow}</p>
            <h2 id="consciousness-101-title" className="dot-section-heading">{HOME.practice.title}</h2>
            <p className="home-practice-situation">{HOME.practice.situation}</p>
            <ol className="home-practice-questions" aria-label="Questions for reflection">
              {HOME.practice.questions.map(item => (
                <li key={item.label}><span>{item.label}</span><p>{item.question}</p></li>
              ))}
            </ol>
            <p className="home-practice-invitation">{HOME.practice.invitation}</p>
          </div>
          <div className="home-practice-love">
            <p className="dot-label">Love and relationships</p>
            <p className="home-practice-intro">{HOME.practice.loveIntro}</p>
            <blockquote className="home-love-statement">
              <p>{HOME.loveDefinition}</p>
            </blockquote>
            <p className="home-practice-body">{HOME.practice.relationships}</p>
            <p className="home-practice-body">{HOME.practice.boundaries}</p>
            <TextLink className="home-practice-source" to={HOME.practice.sourcePath}>{HOME.practice.sourceLabel}</TextLink>
          </div>
          <TextLink href="#possibility-field" className="home-practice-next" icon={<ArrowDown />}>Explore the proposed architecture</TextLink>
        </div>
      </div>
    </section>
  );
}
