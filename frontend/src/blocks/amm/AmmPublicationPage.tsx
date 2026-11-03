import { Helmet } from "react-helmet-async";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmShell } from "./AmmIdentity";
import { AmmEditions } from "./AmmEditions";
import { AmmParticipation } from "./AmmParticipation";

/** The archive, in reading order, and the opt-in email list have their own destination. */
export default function AmmPublicationPage() {
  const AMM = useAmmContent();
  return <AmmShell>
    <Helmet><title>{AMM.archiveTitle} — {AMM.title}</title><meta name="description" content={AMM.description} /><link rel="alternate" type="application/rss+xml" title={AMM.title} href={AMM.feed} /></Helmet>
    <AmmEditions />
    <AmmParticipation />
  </AmmShell>;
}
