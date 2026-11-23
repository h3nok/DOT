import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Scene } from "../../attention-os/inquiry";
import { AMM_MODEL as M, cite, splitTerm, type ModelQuote } from "../../content/ammModel";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmButton } from "./AmmControls";
import { AMM_PARTS } from "./ammReading";
import { DIAGNOSIS_ADDRESS } from "./ammPowerMoves";
import { AmmMarked, Screen, ScreenFoot } from "./AmmScreens";

export const HOME = M.home;
export { ScreenFoot };

/** The paintings of the model's screens, each shown once on the home. */
const HOME_ART = {
  inversion: "inversion-empty-frame",
  host: "anatomy",
  leech: "the-leech-portrait",
  anatomy: "leechAnatomy",
  feeding: "belief-4-the-feeding",
} as const;

/**
 * The model's parts in order, with the one on this screen marked, so a reader always sees
 * where they are in the whole (the author, 2026-11-19: "Clarify the model to a common person").
 */
function ModelPath({ terms, current, label }: { terms: ReadonlyArray<string>; current: number; label: string }) {
  return (
    <ol className="amm-model-path" aria-label={label}>
      {terms.map((term, index) => {
        const name = term.replace(/^The /, "");
        return <li key={term} aria-current={index === current ? "step" : undefined}>{name.charAt(0).toUpperCase() + name.slice(1)}</li>;
      })}
    </ol>
  );
}

/**
 * One part of the model on one screen: its term as the heading, what it means beneath it,
 * the book's sentences that define it, and the painting that carries it. The source line
 * names the works quoted.
 */
function ModelScreen({ id, title, heading, lines, note, art, tone, reverse, path, children }: {
  id: string;
  path: React.ReactNode;
  title?: string;
  heading?: ModelQuote;
  lines: ReadonlyArray<ModelQuote>;
  note?: ModelQuote;
  art: string;
  tone: "paper" | "night";
  reverse?: boolean;
  children?: React.ReactNode;
}) {
  const quotes = [...(heading ? [heading] : []), ...lines, ...(note ? [note] : [])];
  return (
    <Screen id={id} title={title} heading={heading} lines={lines} art={art} tone={tone} reverse={reverse} eyebrow={path} asTerm>
      {note && <p className="amm-screen-note"><AmmMarked text={cite(note).text} /></p>}
      {children}
      <ScreenFoot quotes={quotes} />
    </Screen>
  );
}

/** One numbered article of the thesis; the book's hinge is set apart and keeps its source. */
function Article({ n, text, mark, hinge }: { n: number; text: string; mark?: string; hinge?: boolean }) {
  return (
    <li className={`amm-article${hinge ? " amm-article--hinge" : ""}`}>
      <span className="amm-article-number" aria-hidden="true">{String(n).padStart(2, "0")}</span>
      <p className="amm-article-text"><AmmMarked text={text} mark={mark} /></p>
    </li>
  );
}

/**
 * The AMM thesis, set as a manifesto (the author, 2026-11-20; "Manifesto style", 2026-11-22): AMM's
 * conviction in the book's words, then numbered articles in two columns. The purpose, closed by
 * the book's hinge (a society is judged by whether it preserves that order or reverses it), faces
 * the Inversion: what American culture does instead, and the character it leaves behind.
 */
function ThesisScreen() {
  const { model: L } = useAmmContent();
  const { worth, judged } = HOME.thesis;
  return (
    <Scene id="amm-thesis" labelledBy="amm-thesis-title" tone="night" wide reveal>
      <h2 id="amm-thesis-title" className="amm-thesis-title">{L.thesisTitle}</h2>
      <p className="amm-thesis-conviction">{cite(worth).text}</p>
      <div className="amm-thesis-columns">
        <div className="amm-thesis-column">
          <h3 className="amm-thesis-column-label">{L.thesisPurposeLabel}</h3>
          <ol className="amm-articles">
            <Article n={1} text={L.thesisSociety} />
            <Article n={2} text={L.thesisHonor} />
            <Article n={3} text={cite(judged).text} mark="preserve that order or reverse it" hinge />
          </ol>
        </div>
        <div className="amm-thesis-column amm-thesis-column--inverted">
          <h3 className="amm-thesis-column-label"><AmmMarked text={L.thesisInversionLabel} /></h3>
          <ol className="amm-articles" start={4}>
            <Article n={4} text={L.thesisInverts} mark="inverts this purpose" />
            <Article n={5} text={L.thesisMyth} />
            <Article n={6} text={L.thesisBelief} />
            <Article n={7} text={L.thesisCharacter} mark="a conditioned character" />
          </ol>
        </div>
      </div>
      <ScreenFoot quotes={[worth, judged]} />
    </Scene>
  );
}

/**
 * The way out (the author, 2026-11-19): only a cultural revolution, in his
 * words, then the book's account of what it must change, and the chapter that takes it up.
 */
function WayOutScreen() {
  const { model: L } = useAmmContent();
  const { lines } = HOME.revolution;
  return (
    <Scene id="amm-way-out" labelledBy="amm-way-out-title" tone="night" align="center" wide reveal>
      <p className="amm-way-out-eyebrow">{L.revolutionEyebrow}</p>
      <h2 id="amm-way-out-title" className="amm-way-out-title">{L.revolutionLine}</h2>
      {lines.map((line) => <p key={line.text} className="amm-way-out-line"><AmmMarked text={cite(line).text} mark={line.mark} /></p>)}
      <ScreenFoot quotes={lines} />
      <div className="amm-screen-action"><AmmButton variant="primary" to={AMM_PARTS[AMM_PARTS.length - 1].route} label={L.revolutionAction} endIcon={<ArrowRight />} /></div>
    </Scene>
  );
}

/** The book: the four chapters, in order, each opening its chapter. */
function BookScreen() {
  const AMM = useAmmContent();
  const L = AMM.model;
  return (
    <Scene id="amm-book" labelledBy="amm-book-title" tone="paper" wide reveal>
      <header className="amm-book-header">
        <h2 id="amm-book-title" className="amm-screen-heading">{L.bookTitle}</h2>
        <p className="amm-book-status">{AMM.manuscript.status}</p>
      </header>
      <ol className="amm-book-chapters" aria-labelledby="amm-book-title">
        {AMM_PARTS.map((part) => (
          <li key={part.slug} id={`amm-chapter-${part.part}`} className="amm-chapter">
            <Link to={part.route} className="amm-chapter-link" aria-label={`${part.label}: ${part.title}`}>
              <span className="amm-chapter-number">{part.label}</span>
              <span className="amm-chapter-title">{part.title}</span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="amm-book-foot">
        <AmmButton variant="secondary" to="/amm/editions" label={L.closingBook} endIcon={<ArrowRight />} />
      </div>
    </Scene>
  );
}

/**
 * Beneath the opening, as the author set it on 2026-11-19: the AMM thesis,
 * then the model: the Inversion (the primary diagnosis), the Host ("us, the
 * public"), the Leech (a dominance ideology), its body today (the oligarchy, and what it
 * attaches to), and how it feeds. Then the way out: a cultural revolution, and the book chapters.
 * Each painting appears once.
 */
export function AmmHomeScreens() {
  const AMM = useAmmContent();
  const L = AMM.model;
  const terms = [cite(HOME.inversion.heading).text, L.hostTitle, L.leechTitle, L.anatomyTitle, L.feedingTitle].map((title) => splitTerm(title).term);
  const path = (current: number) => <ModelPath terms={terms} current={current} label={L.mapLabel} />;
  return <div className="amm-home-screens">
    <ThesisScreen />
    <ModelScreen id="amm-inversion" heading={HOME.inversion.heading} lines={HOME.inversion.lines} art={HOME_ART.inversion} tone="paper" path={path(0)}>
      <div className="amm-screen-action"><AmmButton variant="primary" to={DIAGNOSIS_ADDRESS} label={L.readDiagnosis} endIcon={<ArrowRight />} /></div>
    </ModelScreen>
    <ModelScreen id="amm-host" title={L.hostTitle} lines={HOME.host.lines} art={HOME_ART.host} tone="night" reverse path={path(1)} />
    <ModelScreen id="amm-leech" title={L.leechTitle} lines={HOME.leech.lines} art={HOME_ART.leech} tone="paper" path={path(2)} />
    <ModelScreen id="amm-anatomy" title={L.anatomyTitle} lines={HOME.anatomy.lines} note={HOME.anatomy.note} art={HOME_ART.anatomy} tone="night" reverse path={path(3)}>
      <p className="amm-screen-more"><Link to={AMM.power.figuresRoute}>{L.figuresLink}</Link></p>
    </ModelScreen>
    <ModelScreen id="amm-feeding" title={L.feedingTitle} lines={HOME.feeding.lines} art={HOME_ART.feeding} tone="paper" path={path(4)} />
    <WayOutScreen />
    <BookScreen />
  </div>;
}
