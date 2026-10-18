import { useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmShell } from "./AmmIdentity";
import { AmmButton } from "./AmmControls";
import MEDIA from "../../content/amm-media.json";
import { AmmFeature } from "./AmmFeature";
import { AmmHomeOverview } from "./AmmHomeInquiry";
import { AmmReadingPath } from "./AmmReadingPath";
import { AmmDotLineage, AmmSponsor } from "./AmmLineage";
import { useReveal } from "../../attention-os/motion";
import "../../attention-os/explainer/reading-scene.css";

/**
 * A finite front page read in one continuous scroll, one concept per screen: the claim,
 * what it does to the reader, the lines they were sold, the theory AMM applies (DOT),
 * the manifesto itself, then the movement it sponsors (4Us).
 * Each screen's content settles in once as the reader reaches it (Attention OS Reveal).
 * Reading never advances or loads more by itself (L1, L2, L3).
 * The public hero has one silent, pausable loop (ADR-0052).
 */
export default function AmmPage() {
  const AMM = useAmmContent();
  const { hash, search } = useLocation();
  const page = useRef<HTMLDivElement>(null);
  useReveal(page);
  // Preserve existing archive and subscription bookmarks after shortening the landing.
  if (["#amm-chapters", "#amm-editions", "#amm-subscribe"].includes(hash) || new URLSearchParams(search).has("page")) {
    return <Navigate to={`/amm/editions${search}${hash}`} replace />;
  }
  return <AmmShell><div ref={page}>
    <Helmet><title>{AMM.title}</title><meta name="description" content={AMM.description} /><meta property="og:title" content={AMM.title} /><meta property="og:description" content={AMM.description} /><meta property="og:image" content={`https://dotheory.org${MEDIA.illustration.fallback}`} /><meta property="og:image:alt" content={AMM.artwork.alt} /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content={`https://dotheory.org${MEDIA.illustration.fallback}`} /><link rel="alternate" type="application/rss+xml" title={AMM.title} href={AMM.feed} /></Helmet>
    <section className="reading-scene amm-hero amm-hero--inquiry" aria-labelledby="amm-title">
      <div className="amm-hero-grid">
        <div className="amm-hero-copy">
          <h1 id="amm-title" data-reveal>{AMM.headline[0]} <em>{AMM.headline[1]}</em></h1>
          <p className="amm-home-premise" data-reveal="1">{AMM.home.premise}</p>
        </div>
        <div className="amm-hero-visual" data-reveal="2">
          <AmmFeature />
        </div>
        <div className="amm-hero-actions">
          <AmmButton variant="primary" href="#amm-overview" label={AMM.heroAction} endIcon={<ArrowRight />} />
        </div>
      </div>
    </section>
    <div className="amm-home-sections">
      <AmmHomeOverview />
    </div>
    <AmmDotLineage />
    <AmmReadingPath id="amm-start" />
    <AmmSponsor />
  </div></AmmShell>;
}
