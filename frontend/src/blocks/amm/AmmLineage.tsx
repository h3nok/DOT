import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { AmmButton } from "./AmmControls";
import "./amm-lineage.css";

/**
 * One screen that shows where AMM comes from and where it leads: three ideas in
 * Digital Organism Theory's own words, each beside the place it shows up in AMM
 * or 4Us, and a way back to DOT.
 */
export function AmmDotLineage() {
  const { dot } = useAmmContent();
  return <section id="amm-dot" tabIndex={-1} className="amm-lineage" aria-labelledby="amm-dot-title">
    <div className="amm-lineage-claim">
      <h2 id="amm-dot-title" data-reveal>{dot.title}</h2>
      <p data-reveal="1">{dot.intro}</p>
      <div className="amm-lineage-action" data-reveal="2"><AmmButton variant="primary" to={dot.route} label={dot.action} endIcon={<ArrowRight />} /></div>
    </div>
    <ol className="amm-lineage-chain" aria-label="From Digital Organism Theory to AMM and 4Us">
      {dot.links.map((item, index) => <li key={item.id} data-reveal={String(index + 1)}>
        <h3><Link to={`/doctrine/${item.id}`}>{item.title}<ArrowRight aria-hidden="true" /></Link></h3>
        <blockquote><p>{item.quote}</p></blockquote>
        <p className="amm-lineage-applies">{item.applies}</p>
      </li>)}
    </ol>
  </section>;
}

/** The movement AMM sponsors, said plainly, with one way to it. */
export function AmmSponsor() {
  const { movement } = useAmmContent();
  return <section id="amm-sponsor" tabIndex={-1} className="amm-sponsor" aria-labelledby="amm-sponsor-title">
    <img className="amm-sponsor-art" data-reveal src={movement.artwork} alt={movement.artworkAlt} width={1024} height={1536} loading="lazy" decoding="async" />
    <div className="amm-sponsor-text">
      <p className="amm-sponsor-line" data-reveal="1">{movement.sponsor}</p>
      <p className="amm-sponsor-name" data-reveal="1">{movement.name}</p>
      <h2 id="amm-sponsor-title" data-reveal="2">{movement.title}</h2>
      <p data-reveal="3">{movement.description}</p>
      <p className="amm-sponsor-stage" data-reveal="4">{movement.stage}</p>
      <div className="amm-sponsor-action" data-reveal="4"><AmmButton variant="primary" href={movement.href} rel="noopener" label={movement.action} endIcon={<ArrowUpRight />} /></div>
    </div>
  </section>;
}
