import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { ReaderListForm } from "../../dot/ReaderListForm";
import { AmmMark, AmmShell } from "./AmmIdentity";
import { AmmEditions } from "./AmmEditions";

/** The archive, in reading order, and the opt-in email list have their own destination. */
export default function AmmPublicationPage() {
  const AMM = useAmmContent();
  return <AmmShell>
    <Helmet><title>{AMM.archiveTitle} — {AMM.title}</title><meta name="description" content={AMM.description} /><link rel="alternate" type="application/rss+xml" title={AMM.title} href={AMM.feed} /></Helmet>
    <AmmEditions />
    <section id="amm-subscribe" className="amm-subscribe" aria-label="Subscribe to AMM">
      <div className="amm-subscribe-note"><AmmMark /><p className="amm-eyebrow">The AMM letter</p><p>A letter to read.<br /><em>Room to think.</em></p><span>New editions, sent when they are ready.</span></div>
      <div>
        <ReaderListForm source="amm" publication="amm"
          fallback={<p>AMM email signup is not open yet. <a href={AMM.feed}>Read with RSS</a> in the meantime.</p>}
          unavailableFallback={<p role="alert">Email signup could not be reached. Please try again later. <a href={AMM.feed}>AMM RSS remains available.</a></p>}
          loadingFallback={<p role="status">Opening signup…</p>} />
        <p className="amm-signup-foot">Free to read. No tracking pixels. Leave in one click. <Link to="/privacy">Privacy</Link></p>
      </div>
    </section>
  </AmmShell>;
}
