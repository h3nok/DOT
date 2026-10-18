import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { ReaderListForm } from "../../dot/ReaderListForm";
import { AmmButton, AmmReadingLink } from "./AmmControls";
import { AMM_PARTS, ammPart, nextAmmPart, previousAmmPart } from "./ammReading";
import "./amm-reading.css";

/** Where this edition sits: its part in the manifesto, and the contents a reader can open. */
export function AmmReadingBar({ slug }: { slug?: string }) {
  const { reading } = useAmmContent();
  const part = ammPart(slug);
  return <nav className="amm-reading-bar" aria-label="Reading order">
    <p><span className="amm-eyebrow">{part ? reading.orderLabel : reading.letterLabel}</span>{part && <span className="amm-reading-bar-position">Part {part.part} of {AMM_PARTS.length} published</span>}</p>
    <details className="amm-contents">
      <summary>{reading.contentsLabel}</summary>
      <ol>{AMM_PARTS.map(item => <li key={item.slug}><Link to={item.route} aria-current={item.slug === slug ? "page" : undefined}><span aria-hidden="true">0{item.part}</span><span>{item.label} · {item.title}</span></Link></li>)}</ol>
    </details>
  </nav>;
}

/**
 * What follows the last paragraph. The next part follows the author's fixed
 * order, never a ranking (L2, L3). The two asks live only here, after the
 * reader has finished, and neither changes what they can read (L6, L7).
 */
export function AmmEditionEnd({ slug }: { slug?: string }) {
  const AMM = useAmmContent();
  const { reading } = AMM;
  const part = ammPart(slug);
  const next = nextAmmPart(slug);
  const previous = previousAmmPart(slug);
  return <div className="amm-edition-end">
    <nav className="amm-continue" aria-label="Continue reading">
      {next
        ? <AmmReadingLink to={next.route} label={`${part ? reading.nextLabel : reading.beginLabel}: ${next.title}`} className="amm-continue-next">
            <span className="amm-eyebrow">{part ? reading.nextLabel : reading.beginLabel}</span>
            <span className="amm-reading-title"><span>{next.label} · {next.title}</span><ArrowRight className="amm-reading-arrow" aria-hidden="true" /></span>
          </AmmReadingLink>
        : <p className="amm-continue-latest">{reading.latestNote}</p>}
      {previous && <Link className="amm-text-link" to={previous.route}><ArrowLeft aria-hidden="true" />{previous.label} · {previous.title}</Link>}
    </nav>
    <section className="amm-end-signup" aria-label="Subscribe to AMM by email">
      <ReaderListForm source="amm" publication="amm"
        fallback={<p>AMM email signup is not open yet. <a href={AMM.feed}>Read with RSS</a> in the meantime.</p>}
        unavailableFallback={<p role="alert">Email signup could not be reached. Please try again later. <a href={AMM.feed}>AMM RSS remains available.</a></p>}
        loadingFallback={<p role="status">Opening signup…</p>} />
    </section>
    <section className="amm-end-support" aria-labelledby={`amm-support-${slug ?? "edition"}`}>
      <h2 id={`amm-support-${slug ?? "edition"}`}>{reading.supportTitle}</h2>
      <p>{reading.supportDescription}</p>
      <AmmButton to="/support?purpose=author&from=amm" label={reading.supportAction} endIcon={<ArrowUpRight />} />
      <p className="amm-signup-foot">{reading.supportNote} <Link to="/terms">Terms and refunds</Link></p>
    </section>
  </div>;
}
