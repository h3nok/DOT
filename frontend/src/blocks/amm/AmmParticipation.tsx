import { Link } from "react-router-dom";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { ReaderListForm } from "../../dot/ReaderListForm";
import { AmmMark } from "./AmmMark";

/** Verified email consent stays separate from free membership. */
export function AmmReaderSignup() {
  const AMM = useAmmContent();
  return <ReaderListForm source="amm" publication="amm"
    fallback={<p>AMM email signup is not open yet. <a href={AMM.feed}>Read with RSS</a> in the meantime.</p>}
    unavailableFallback={<p role="alert">Email signup could not be reached. Please try again later. <a href={AMM.feed}>AMM RSS remains available.</a></p>}
    loadingFallback={<p role="status">Opening signup…</p>} />;
}

export function AmmMembershipLink() {
  const { participation } = useAmmContent();
  return <details className="amm-membership">
    <summary>{participation.membershipTitle}</summary>
    <p>{participation.membershipDescription}</p>
    <Link className="amm-text-link" to="/amm/membership">{participation.membershipAction}</Link>
  </details>;
}

export function AmmParticipation({ id = "amm-subscribe" }: { id?: string }) {
  const { participation, feed } = useAmmContent();
  return <section id={id} className="amm-subscribe" aria-label="Subscribe to AMM">
    <div className="amm-subscribe-note"><AmmMark /><p className="amm-eyebrow">{participation.eyebrow}</p><h2>{participation.title}</h2><p className="amm-participation-description">{participation.description}</p></div>
    <div>
      <AmmReaderSignup />
      <p className="amm-signup-foot">Confirm your address. No tracking pixels. Leave in one click. <Link to="/privacy">Privacy</Link> · <a href={feed}>Follow with RSS</a></p>
      <AmmMembershipLink />
    </div>
  </section>;
}
