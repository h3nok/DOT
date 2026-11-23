import { useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmShell } from "./AmmIdentity";
import { AmmButton } from "./AmmControls";
import MEDIA from "../../content/amm-media.json";
import { AmmFeature } from "./AmmFeature";
import { AmmHomeScreens } from "./AmmHomeScreens";
import { AmmMarked } from "./AmmScreens";
import { useReveal } from "../../attention-os/motion";
import "../../attention-os/explainer/reading-scene.css";
import "./amm-home.css";

/**
 * The AMM home (the author, 2026-11-19): the opening shows the country lived in against
 * the country described, the Inversion, carried by the painting, and gives the citizen the
 * author's message. Its words are editable in Studio. Beneath it: what a stable society
 * requires, the model (the Inversion, the Host, the Leech, its body today, how it feeds),
 * and the book.
 *
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
          <h1 id="amm-title" className="amm-hero-title" data-reveal>{AMM.model.heroTitle}</h1>
          {AMM.model.heroLine && <p className="amm-home-premise" data-reveal="1"><AmmMarked text={AMM.model.heroLine} /></p>}        </div>
        <div className="amm-hero-visual" data-reveal="2">
          <AmmFeature />
          <p className="amm-hero-key">{AMM.model.mirrorKey}</p>
          <p className="amm-art-disclosure">{AMM.reflect.disclosure}</p>
        </div>
        <div className="amm-hero-actions" data-reveal="2">
          <AmmButton variant="primary" to={AMM.introduction.route} label={AMM.heroAction} endIcon={<ArrowRight />} />
        </div>
      </div>
    </section>
    <AmmHomeScreens />
  </div></AmmShell>;
}
