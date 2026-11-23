import type { ReactNode } from "react";
import { Renaming } from "../../../attention-os/explainer";
import { AMM_MODEL as M } from "../../../content/ammModel";
import { ScreenFoot } from "../AmmScreens";
import { Callouts, FloatingArt, PAINTINGS, type Callout } from "./DiagnosisScene";
import "./amm-infection.css";

interface Hollowed { id: string; word: string; effect: string }

/**
 * Moral health & Your Infection (#crushing): the third movement of the Host's
 * infection (after cognitive and mental health), simplified into one cohesive
 * two-part section on the night band:
 *  I.  The annotated Host painting beside the character turn, the cultural
 *      renaming of harm (exhaustion → adulthood, anxiety → responsibility…),
 *      and its chapter source.
 *  II. A calm ledger of the five hollowed faculties and the closing verdict.
 */
export function InfectionScene({ eyebrow, content, disclosure }: {
  eyebrow?: ReactNode;
  content: {
    eyebrow: string; title: string; image: string;
    callouts: ReadonlyArray<Callout>; calloutsLabel: string;
    hollowLabel: string;
    lines: ReadonlyArray<{ text: string }>;
    hollowed: ReadonlyArray<Hollowed>;
  };
  disclosure: string;
}) {
  const c = content;
  const painting = PAINTINGS[c.image];
  const [surface, quotation, , , verdict] = c.lines;
  const us = M.home.us;
  const titleAt = c.title.lastIndexOf(" ");

  return <section id="crushing" className="amm-infection" aria-label={c.eyebrow}>
    <div className="amm-infection-surface">
      {painting && <div className="amm-diagnosis-art amm-infection-art" data-reveal>
        <div className="amm-annotated"><FloatingArt painting={painting} /><Callouts items={c.callouts} label={c.calloutsLabel} /></div>
        <p className="amm-diagnosis-disclosure">{disclosure}</p>
      </div>}
      <div className="amm-infection-intro">
        {eyebrow ?? <p className="amm-diagnosis-eyebrow" data-reveal>{c.eyebrow}</p>}
        <h2 className="amm-infection-title" data-reveal="1">
          {titleAt > 0 ? <>{c.title.slice(0, titleAt)} <span>{c.title.slice(titleAt + 1)}</span></> : c.title}
        </h2>
        {surface && <p className="amm-infection-surface-line" data-reveal="1">{surface.text}</p>}
        {quotation && <p className="amm-screen-line" data-reveal="2">{quotation.text}</p>}
        <div data-reveal="2"><Renaming lead={us.renames.lead} pairs={us.renames.pairs} /></div>
        <ScreenFoot id="crushing" quotes={[us.heading, us.renamed, ...us.lines]} />
      </div>
    </div>

    <div className="amm-infection-hollow">
      <h3 className="amm-infection-label">{c.hollowLabel}</h3>
      <ol className="amm-hollow-list">
        {c.hollowed.map(item => <li key={item.id} className="amm-hollow">
          <span className="amm-hollow-word">
            <span className="amm-hollow-outline">{item.word}</span>
            <span className="amm-hollow-fill" aria-hidden="true">{item.word}</span>
          </span>
          <span className="amm-hollow-effect">{item.effect}</span>
        </li>)}
      </ol>
      {verdict && <p className="amm-infection-verdict" data-reveal>{verdict.text}</p>}
    </div>
  </section>;
}
