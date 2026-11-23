import { ArrowRight } from "lucide-react";
import { useAmmContent } from "../../../content/editable/useAmmContent";
import { FloatingArt, InvertedTitle, PAINTINGS } from "./DiagnosisScene";
import { AmmButton } from "../AmmControls";
import "../amm-reflect.css";

/** One screen on the AMM home that leads readers to the diagnosis. */
export function AmmReflectInvite() {
  const R = useAmmContent().reflect;
  const painting = PAINTINGS[R.inviteImage];
  return <section id="amm-reflect-invite" className="reading-scene amm-reflect-invite" aria-labelledby="amm-reflect-invite-title">
    <div className="amm-diagnosis-frame">
      <div className="amm-diagnosis-art">
        {painting && <FloatingArt painting={painting} />}
        <p className="amm-diagnosis-disclosure">{R.disclosure}</p>
      </div>
      <div className="amm-diagnosis-words">
        <p className="amm-diagnosis-eyebrow">{R.eyebrow}</p>
        <h2 id="amm-reflect-invite-title" className="amm-diagnosis-heading"><InvertedTitle text={R.title} /></h2>
        {R.lead.map(line => <p key={line.text} className="amm-diagnosis-lead">{line.text}</p>)}
        <div><AmmButton variant="primary" to={R.route} label={R.inviteAction} endIcon={<ArrowRight />} /></div>
      </div>
    </div>
  </section>;
}
