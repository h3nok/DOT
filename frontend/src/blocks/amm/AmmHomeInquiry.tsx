import { Artwork } from "../../attention-os/explainer/Artwork";
import type { ExplainerImage } from "../../attention-os/explainer/Artwork";
import { PullQuote } from "../../attention-os/explainer/PullQuote";
import { ScrollStory } from "../../attention-os/explainer/ScrollStory";
import { useAmmContent } from "../../content/editable/useAmmContent";
import MEDIA from "../../content/amm-media.json";
import { AmmMark } from "./AmmMark";
import "./amm-home.css";

const sequence: Record<string, string> = MEDIA.homeScenes.concepts;

function sceneArt(home: { sceneAlt: string }, id: string): ExplainerImage {
  const scenes: Record<string, ExplainerImage> = { everyday: { ...MEDIA.everyday, alt: home.sceneAlt }, anatomy: MEDIA.anatomy, erosion: MEDIA.erosion };
  return scenes[sequence[id]] ?? scenes.everyday;
}

/**
 * One concept per screen. Each scene leads with a line the reader has heard all their life,
 * says what it does to them, and closes on AMM's own argument, quoted from the chapter it comes from.
 * The picture holds for the scenes it belongs to.
 */
export function AmmHomeOverview() {
  const { home } = useAmmContent();
  return <section id="amm-overview" tabIndex={-1} className="reading-scene amm-home-overview" aria-labelledby="amm-overview-title">
    <header className="amm-overview-heading">
      <h2 id="amm-overview-title" data-reveal>{home.overviewTitle}</h2>
      <div className="amm-overview-argument">
        <p className="amm-overview-claim" data-reveal="1">{home.overviewClaim}</p>
        <p className="amm-overview-intro" data-reveal="2">{home.overviewIntro}</p>
        <div data-reveal="3"><PullQuote source={home.overviewSource}>{home.overviewArgument}</PullQuote></div>
      </div>
    </header>
    <ScrollStory counted={false} label={home.conceptsLabel} marker={<AmmMark className="amm-story-flame" />}
      steps={home.concepts.map(concept => ({ id: concept.id, kicker: concept.label, title: `“${concept.script}”`, text: concept.text, quote: concept.argument, source: concept.source, context: home.scriptLabel }))}
      figure={step => <div key={sequence[step.id]} className="amm-everyday-art"><Artwork image={sceneArt(home, step.id)} /></div>} />
  </section>;
}
