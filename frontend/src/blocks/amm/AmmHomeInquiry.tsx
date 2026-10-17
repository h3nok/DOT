import { Repeat2, Shield, ShieldAlert, Scale, RefreshCcw, BadgeDollarSign, EyeOff } from "lucide-react";
import { ConceptExplorer } from "../../attention-os/explainer/ConceptExplorer";
import { Questions } from "../../attention-os/explainer/Questions";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { TextLink } from "../../shared/design-system/Editorial";
import "./amm-home.css";

const conceptIcons = {
  conditioning: Repeat2,
  fear: ShieldAlert,
  protection: Shield,
  erosion: Scale,
  accountability: RefreshCcw,
};
const reasonIcons = { worth: BadgeDollarSign, harm: EyeOff, power: Scale };

/** The pre-read gives the inquiry a named beginning and a deliberate exit into the manuscript. */
export function AmmHomeOverview() {
  const { home } = useAmmContent();
  return <section id="amm-overview" className="amm-home-overview" aria-labelledby="amm-overview-title">
    <header className="amm-overview-heading">
      <div><p className="amm-eyebrow">{home.overviewEyebrow}</p><h2 id="amm-overview-title">{home.overviewTitle}</h2></div>
      <div><p className="amm-overview-intro">{home.overviewIntro}</p><TextLink href="#amm-start">{home.overviewAction}</TextLink></div>
    </header>
    <AmmHomeConcepts />
  </section>;
}

export function AmmHomeConcepts() {
  const { home } = useAmmContent();
  return <section className="amm-home-concepts" aria-label={home.conceptsLabel}>
    <ConceptExplorer label={home.conceptsLabel} questionLabel={home.questionLabel} items={home.concepts.map(item => {
      const Icon = conceptIcons[item.id as keyof typeof conceptIcons];
      return { ...item, icon: Icon ? <Icon /> : undefined };
    })} />
  </section>;
}

export function AmmHomeReflection() {
  const { home } = useAmmContent();
  return <section className="amm-home-reflection" aria-labelledby="amm-reflection-title">
    <header className="amm-section-heading">
      <div><p className="amm-eyebrow">{home.reflectionEyebrow}</p><h2 id="amm-reflection-title">{home.reflectionTitle}</h2></div>
      <p>{home.reflectionIntro}</p>
    </header>
    <div className="amm-home-concerns">
      {home.reasons.map(reason => {
        const Icon = reasonIcons[reason.id as keyof typeof reasonIcons];
        const questions = reason.reflections.flatMap(id => home.reflections.filter(item => item.id === id));
        return <section className="amm-home-concern" key={reason.id} aria-labelledby={`amm-concern-${reason.id}`}>
          <Icon className="amm-concern-icon" aria-hidden="true" />
          <h3 id={`amm-concern-${reason.id}`}>{reason.title}</h3>
          <p className="amm-concern-intro">{reason.text}</p>
          <Questions label={`${home.reflectionLabel}: ${reason.title}`} items={questions} headingLevel={4} />
        </section>;
      })}
    </div>
    <details className="amm-home-method">
      <summary>{home.limitsTitle}</summary>
      <p>{home.limits}</p><p>{home.method}</p>
    </details>
  </section>;
}
