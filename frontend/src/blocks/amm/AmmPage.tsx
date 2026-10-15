import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import AMM from "../../content/amm.json";
import { ReaderListForm } from "../../dot/ReaderListForm";
import { AmmMark, AmmShell } from "./AmmIdentity";
import { AmmAnalysis } from "./AmmAnalysis";
import { AmmEditions } from "./AmmEditions";
import { AmmField } from "./AmmField";
import { AmmChapters, AmmMovement } from "./AmmChapters";



export default function AmmPage() {
  return <AmmShell>
    <Helmet><title>{AMM.title}</title><meta name="description" content={AMM.description} /><meta property="og:title" content={AMM.title} /><meta property="og:description" content={AMM.description} /><meta property="og:image" content="https://dotheory.org/og/amm.png" /><meta property="og:image:alt" content="The American Millennial Manifesto — A country is more than a market." /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="https://dotheory.org/og/amm.png" /><link rel="alternate" type="application/rss+xml" title={AMM.title} href={AMM.feed} /></Helmet>
    <section className="amm-hero" aria-labelledby="amm-title">
      <div className="amm-edition-rule"><p>Power. Culture. Public life.</p><span>An independent publication</span></div>
      <div className="amm-hero-grid">
        <div className="amm-hero-copy">
          <p className="amm-eyebrow">The American Millennial Manifesto</p>
          <h1 id="amm-title">{AMM.headline[0]} <em>{AMM.headline[1]}</em></h1>
          <p className="amm-deck">{AMM.deck}</p>
          <Link className="amm-primary" to={AMM.introduction.route}>{AMM.introduction.label} <ArrowRight aria-hidden="true" /></Link>
          <p className="amm-byline">By <Link to="/about">Henok Ghebrechristos</Link></p>
        </div>
        <div className="amm-hero-visual">
          <figure className="amm-feature"><div className="amm-plate-label"><span>AMM / Visual essay</span><span>Public life, under pressure</span></div><img src={AMM.artwork.src} alt={AMM.artwork.alt} width={1536} height={1024} decoding="async" fetchPriority="high" /><figcaption><span>{AMM.artwork.title}</span><a href={AMM.artwork.src} target="_blank" rel="noreferrer" aria-label="Open full-size illustration">Full-size <ArrowUpRight aria-hidden="true" /></a></figcaption></figure>
          <details className="amm-illustration-description"><summary>Read the illustration</summary><p>{AMM.artwork.description}</p><a href={AMM.artwork.movementUrl} className="amm-text-link" rel="noreferrer">4Us · Economy for Us <ArrowUpRight aria-hidden="true" /></a></details>
        </div>
      </div>
    </section>
    <AmmChapters />
    <AmmField />
    <AmmAnalysis />
    <figure className="amm-principle"><span aria-hidden="true">“</span><blockquote>{AMM.principle.quote}</blockquote><figcaption>{AMM.principle.attribution}</figcaption></figure>
    <AmmEditions />
    <AmmMovement />
    <section id="amm-subscribe" className="amm-subscribe" aria-label="Subscribe to AMM"><div className="amm-subscribe-note"><AmmMark /><p className="amm-eyebrow">The AMM letter</p><p>A letter to read.<br /><em>Room to think.</em></p><span>New editions, sent when they are ready.</span></div><div><ReaderListForm source="amm" publication="amm" fallback={<p>AMM email signup is not open yet. <a href={AMM.feed}>Read with RSS</a> in the meantime.</p>} unavailableFallback={<p role="alert">Email signup could not be reached. Please try again later. <a href={AMM.feed}>AMM RSS remains available.</a></p>} loadingFallback={<p role="status">Opening signup…</p>} /><p className="amm-signup-foot">Free to read. No tracking pixels. Leave in one click. <Link to="/privacy">Privacy</Link></p></div></section>
  </AmmShell>;
}
