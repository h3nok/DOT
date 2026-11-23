import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { ErosionSpiral, InterruptedThread, Note, PartMark, SplitSentences } from "../../attention-os/explainer";
import { useReveal } from "../../attention-os/motion";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AMM_MODEL as M, cite } from "../../content/ammModel";
import MEDIA from "../../content/amm-media.json";
import { AmmButton } from "./AmmControls";
import { AmmShell } from "./AmmIdentity";
import { ModelStep, Screen, ScreenFoot } from "./AmmScreens";
import { DiagnosisScene, InvertedTitle, Lines } from "./reflect/DiagnosisScene";
import { InfectionScene } from "./reflect/InfectionScene";
import "../../attention-os/explainer/reading-scene.css";
import "./amm-reflect.css";

const HOME = M.home;

/**
 * Dedicated page for The Host & Its Infection (/amm/reflect), simplified so each
 * screen holds one clear focus:
 * 1. Opening (#inversion): Mirror vs. Room
 * 2. Root Cause (#civilization, #origin): what a civilization is, and the dishonest tiering
 * 3. Two Countries (#claimed beside #practiced): proclaimed ideals vs. lived symptoms, in one stage
 * 4. The Infection's Damage to the Host:
 *    - #amm-attention: Cognitive health (attention broken into fragments)
 *    - #amm-mind: Mental health (intimate suffering, institutional revenue)
 *    - #crushing: Moral health (renaming harm, hollowed character & reflexes)
 * 5. Peer Enforcement (#thoughts / #human-nature): Carrier → Enforcer → "That's just human nature."
 * 6. Separation (#not-your-nature, #begin): character vs. infection, leading into Chapter Three & Four
 *
 * The page asks nothing of the reader and records nothing (L9).
 */
export default function AmmReflectPage() {
  const AMM = useAmmContent();
  const R = AMM.reflect;
  const L = AMM.model;
  const page = useRef<HTMLDivElement>(null);
  useReveal(page);
  const cover = (MEDIA.reflect as Record<string, { full: string; alt: string }>)[R.image];
  const pairs = R.practiced.pairs;
  const civ = M.reflect.civilization;
  const research = { href: L.researchHref, label: L.researchSource };
  const warning = (current: number) => <PartMark label={L.warningLabel} current={current} parts={[
    { label: L.warningCognitive, href: "#amm-attention" },
    { label: L.warningMental, href: "#amm-mind" },
    { label: L.warningMoral, href: "#crushing" },
  ]} />;

  return <AmmShell><div ref={page} className="amm-diagnosis amm-home-screens">
    <Helmet>
      <title>{`${R.title} — ${AMM.title}`}</title>
      <meta name="description" content={R.description} />
      <meta property="og:title" content={R.title} />
      <meta property="og:description" content={R.description} />
      {cover && <meta property="og:image" content={`https://dotheory.org${cover.full}`} />}
      {cover && <meta property="og:image:alt" content={cover.alt} />}
    </Helmet>

    <DiagnosisScene id="inversion" image={R.image} tone="night" label={R.title} disclosure={R.disclosure} priority>
      <p className="amm-diagnosis-eyebrow" data-reveal>{R.eyebrow}</p>
      <h1 className="amm-diagnosis-title" data-reveal="1"><InvertedTitle text={R.title} /></h1>
      <Lines items={R.lead} className="amm-diagnosis-lead" from={2} />
      <nav className="amm-diagnosis-index" aria-label="Diagnosis path" data-reveal="4">
        <a href="#civilization" className="amm-diagnosis-pill"><span>01</span> {R.origin.eyebrow}</a>
        <a href="#claimed" className="amm-diagnosis-pill"><span>02</span> {R.practiced.eyebrow}</a>
        <a href="#amm-attention" className="amm-diagnosis-pill"><span>03</span> {R.crushing.title}</a>
      </nav>
      <div className="amm-model-actions" data-reveal="5">
        <AmmButton variant="quiet" to={AMM.power.route} label={R.fromPower} endIcon={<ArrowRight />} />
      </div>
    </DiagnosisScene>

    <DiagnosisScene id="civilization" tone="paper" label={R.civilization.title} disclosure={R.disclosure}>
      <p className="amm-diagnosis-eyebrow" data-reveal>{R.origin.eyebrow}</p>
      <h2 className="amm-diagnosis-heading" data-reveal="1">{R.civilization.title}</h2>
      <blockquote className="amm-diagnosis-definition" data-reveal="2">
        <p>{civ.definition}</p>
        <footer>{R.civilization.definitionSource} <a href={civ.href} rel="noopener">{civ.publisher}</a>, “{civ.title}”</footer>
      </blockquote>
      <figure className="amm-diagnosis-marks" data-reveal="3">
        <figcaption>{civ.marksLead}</figcaption>
        <ul>{civ.marks.map((mark, index) => <li key={mark} data-emphasis={index === civ.marks.length - 1 ? "" : undefined}>{mark}</li>)}</ul>
      </figure>
    </DiagnosisScene>

    <DiagnosisScene id="origin" image={R.origin.image} tone="paper" reverse label={R.origin.eyebrow} disclosure={R.disclosure}>
      <p className="amm-diagnosis-eyebrow" data-reveal>{R.origin.eyebrow} <span>· {R.origin.lineage}</span></p>
      <h2 className="amm-diagnosis-heading" data-reveal="1">{R.origin.title}</h2>
      <Lines items={R.origin.lines} from={2} />
      <blockquote className="amm-diagnosis-record" data-reveal="4">
        <p>{R.origin.quote.text}</p>
        <footer>{R.origin.quote.source}</footer>
      </blockquote>
      <p className="amm-diagnosis-turn" data-reveal="5">{R.origin.close}</p>
    </DiagnosisScene>

    <div className="amm-contradiction-stage">
      <div className="amm-contradiction-columns">
        <DiagnosisScene id="claimed" tone="paper" label={R.claimed.title} disclosure={R.disclosure}>
          <header className="amm-comparison-header">
            <h2 className="amm-comparison-title" data-reveal>{R.claimed.title}</h2>
            <p className="amm-comparison-subtitle amm-claimed-eyebrow" data-reveal="1">{R.claimed.eyebrow}</p>
          </header>
          <ul className="amm-claims" aria-label={R.claimed.eyebrow}>
            {R.claimed.items.map((item, index) => <li
              key={item.text}
              className="amm-claim-card"
              data-reveal={String(Math.min(6, index + 2))}
            >
              <span className="amm-claim-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <div className="amm-claim-body">
                <q>{item.text}</q>
                <span className="amm-claim-source">{item.source}</span>
              </div>
            </li>)}
          </ul>
        </DiagnosisScene>

        <DiagnosisScene id="practiced" tone="night" label={R.practiced.eyebrow} disclosure={R.disclosure}>
          <header className="amm-comparison-header">
            <h2 className="amm-comparison-title" data-reveal>{R.practiced.title}</h2>
            <p className="amm-comparison-subtitle" data-reveal="1">
              <span>{R.practiced.eyebrow}</span>
              <span className="amm-comparison-sep" aria-hidden="true">·</span>
              <span>{R.practiced.lead}</span>
            </p>
          </header>
          <ol className="amm-symptom-list" aria-label={R.practiced.eyebrow} data-reveal="2">
            {pairs.map((pair, index) => <li key={pair.id} id={`practice-${pair.id}`} className="amm-symptom-row">
              <div className="amm-symptom-item">
                <span className="amm-symptom-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="amm-symptom-copy">
                  <strong className="amm-symptom-term">{pair.practice}</strong>
                  <span className="amm-symptom-claim">{pair.claim} · {pair.enforce}</span>
                </span>
              </div>
            </li>)}
          </ol>
        </DiagnosisScene>
      </div>
      <p className="amm-contradiction-verdict" data-reveal="4">{R.claimed.note}</p>
    </div>

    <Screen id="amm-attention" eyebrow={warning(0)} heading={HOME.attention.heading} lines={HOME.attention.lines} tone="night" reverse media={
      <InterruptedThread whole={HOME.attention.thread.whole} broken={HOME.attention.thread.broken} interruptions={HOME.attention.thread.interruptions} label={cite(HOME.attention.jammed).text} />}>
      <Note kind="source" link={research}>{L.researchAttention}</Note>
      <ScreenFoot id="amm-attention" quotes={[HOME.attention.jammed, HOME.attention.heading, ...HOME.attention.lines]} />
    </Screen>

    <Screen id="amm-mind" eyebrow={warning(1)} heading={HOME.mind.heading} lines={HOME.mind.lines} media={
      <SplitSentences heads={[cite(HOME.mind.suffering).text, cite(HOME.mind.revenue).text]} rows={HOME.mind.rows} label={L.splitLabel} />}>
      <Note kind="source" link={research}>{L.researchMind}</Note>
      <ScreenFoot id="amm-mind" quotes={[HOME.mind.heading, ...HOME.mind.lines, HOME.mind.suffering, ...HOME.mind.still]} />
    </Screen>

    <InfectionScene eyebrow={warning(2)} content={R.crushing} disclosure={R.disclosure} />

    <Screen id="thoughts" eyebrow={<ModelStep step={L.stepSpiral} hint={L.stepSpiralHint} />} title={R.enforce.title} lines={HOME.spiral.lines} media={
      <div id="human-nature">
        <ErosionSpiral who={L.spiralYou} label={L.spiralLabel} phases={[
          { label: L.spiralCarrier, kind: "carry", voices: HOME.spiral.carrier.map((line) => cite(line).text) },
          { label: L.spiralEnforcer, kind: "enforce", voices: HOME.spiral.enforcer.map((line) => cite(line).text) },
          { label: L.spiralInversion, kind: "end", voices: [cite(HOME.spiral.inversion).text] },
        ]} />
      </div>}>
      <p className="amm-plain-note">{R.alibi.line}</p>
      <ScreenFoot id="thoughts" quotes={[...HOME.spiral.lines, ...HOME.spiral.carrier, ...HOME.spiral.enforcer, HOME.spiral.inversion]} />
    </Screen>

    <DiagnosisScene id="not-your-nature" image={R.separate.image} tone="night" reverse label={R.separate.eyebrow} disclosure={R.disclosure}>
      <p className="amm-diagnosis-eyebrow" data-reveal>{R.separate.eyebrow}</p>
      <h2 className="amm-diagnosis-heading" data-reveal="1">{R.separate.title}</h2>
      <Lines items={R.separate.lines} from={2} />
    </DiagnosisScene>

    <DiagnosisScene id="begin" tone="paper" label={R.end.line} disclosure={R.disclosure}>
      <p className="amm-diagnosis-statement" data-reveal>{R.end.line}</p>
      <nav aria-label={R.eyebrow} className="amm-model-actions amm-reflect-end-actions" data-reveal="2">
        <AmmButton variant="primary" to={R.end.chapterRoute} label={R.end.chapterAction} endIcon={<ArrowRight />} />
        <AmmButton variant="secondary" to={R.end.nextRoute} label={R.end.nextAction} endIcon={<ArrowRight />} />
        <AmmButton variant="quiet" to={R.end.homeRoute} label={R.end.homeAction} />
      </nav>
    </DiagnosisScene>
  </div></AmmShell>;
}
