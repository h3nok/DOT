import { Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmShell } from "./AmmIdentity";
import { AmmButton } from "./AmmControls";
import MEDIA from "../../content/amm-media.json";
import { AmmFeature } from "./AmmFeature";
import { AmmReadingPath } from "./AmmReadingPath";
import { AmmEditionCard } from "./AmmEditions";
import { ammPart } from "./ammReading";
import { useAmmEditions } from "./useAmmEditions";
import { AmmHomeOverview, AmmHomeReflection } from "./AmmHomeInquiry";

/**
 * A finite front page: the argument, reader-controlled concepts, reflection,
 * then the manuscript. Nothing advances or loads more by itself (L1, L2, L3).
 */
export default function AmmPage() {
  const AMM = useAmmContent();
  const { hash, search } = useLocation();
  const { editions } = useAmmEditions();
  // Preserve existing archive and subscription bookmarks after shortening the landing.
  if (["#amm-chapters", "#amm-editions", "#amm-subscribe"].includes(hash) || new URLSearchParams(search).has("page")) {
    return <Navigate to={`/amm/editions${search}${hash}`} replace />;
  }
  const latestLetter = editions?.find(edition => !ammPart(edition.slug));
  return <AmmShell>
    <Helmet><title>{AMM.title}</title><meta name="description" content={AMM.description} /><meta property="og:title" content={AMM.title} /><meta property="og:description" content={AMM.description} /><meta property="og:image" content={`https://dotheory.org${MEDIA.illustration.fallback}`} /><meta property="og:image:alt" content={AMM.artwork.alt} /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content={`https://dotheory.org${MEDIA.illustration.fallback}`} /><link rel="alternate" type="application/rss+xml" title={AMM.title} href={AMM.feed} /></Helmet>
    <section className="amm-hero amm-hero--inquiry" aria-labelledby="amm-title">
      <div className="amm-hero-grid">
        <div className="amm-hero-copy">
          <p className="amm-eyebrow">{AMM.home.eyebrow}</p>
          <h1 id="amm-title">{AMM.headline[0]} <em>{AMM.headline[1]}</em></h1>
          <p className="amm-home-premise">{AMM.home.premise}</p>
        </div>
        <div className="amm-hero-visual">
          <AmmFeature />
        </div>
        <div className="amm-hero-actions">
          <AmmButton variant="primary" to={AMM.introduction.route} label={AMM.heroAction} endIcon={<ArrowRight />} />
        </div>
      </div>
    </section>
    <AmmHomeOverview />
    <AmmHomeReflection />
    <AmmReadingPath id="amm-start" />
    {latestLetter && <section className="amm-latest" aria-labelledby="amm-latest-title">
      <header className="amm-section-heading"><h2 id="amm-latest-title">The latest letter</h2></header>
      <ol className="amm-edition-grid" aria-label="The latest AMM letter"><li><AmmEditionCard edition={latestLetter} dated={false} /></li></ol>
    </section>}
  </AmmShell>;
}
