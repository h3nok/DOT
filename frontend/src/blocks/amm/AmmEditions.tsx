import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Rss } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { formatEssayDate } from "../../content/essays/essays";
import { AmmMark } from "./AmmIdentity";
import { AmmReadingLink } from "./AmmControls";
import { AmmReadingPath } from "./AmmReadingPath";
import { ammPart } from "./ammReading";
import { useAmmEditions, type AmmEdition } from "./useAmmEditions";

const SIZE = 6;

export function AmmEditionCard({ edition, headingLevel = 3, dated = true }: { edition: AmmEdition; headingLevel?: 2 | 3; dated?: boolean }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <article><AmmReadingLink to={edition.href} label={edition.title}>
    <span className="amm-reading-art amm-edition-art">{edition.cover ? <img src={edition.cover} alt="" loading="lazy" /> : <AmmMark />}</span>
    <div className="amm-edition-copy">{dated && <p className="amm-eyebrow"><time dateTime={edition.date}>{formatEssayDate(edition.date)}</time></p>}<Heading className="amm-reading-title"><span>{edition.title}</span><ArrowRight className="amm-reading-arrow" aria-hidden="true" /></Heading><p>{edition.summary}</p></div>
  </AmmReadingLink></article>;
}

/** The archive: the manifesto in reading order, then every other edition newest first. */
export function AmmEditions() {
  const AMM = useAmmContent();
  const { editions, failed, retry } = useAmmEditions();
  const [params] = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const pageParam = params.get("page");
  const previousPage = useRef(pageParam);
  useEffect(() => {
    if (previousPage.current !== pageParam) { heading.current?.focus(); previousPage.current = pageParam; }
  }, [pageParam]);
  const letters = editions?.filter(edition => !ammPart(edition.slug)) ?? null;
  const pages = Math.max(1, Math.ceil((letters?.length ?? 0) / SIZE));
  const requested = Number(pageParam ?? 1);
  const page = Number.isInteger(requested) && requested > 0 && requested <= pages ? requested : 1;
  return <>
    <section id="amm-editions" className="amm-editions" aria-labelledby="amm-editions-title">
      <header className="amm-section-heading"><div><p className="amm-eyebrow">The publication</p><h1 id="amm-editions-title" tabIndex={-1}>{AMM.archiveTitle}</h1></div><a className="amm-text-link" href={AMM.feed}><Rss aria-hidden="true" />AMM RSS</a></header>
      <div className="amm-archive-intro"><p>{AMM.archiveDescription}</p></div>
      {failed && <p role="alert" className="amm-notice">Some editions could not be loaded. <button onClick={retry}>Try again</button></p>}
    </section>
    <AmmReadingPath id="amm-chapters" />
    <section id="amm-letters" className="amm-letters" aria-labelledby="amm-letters-title">
      <header className="amm-section-heading"><div><p className="amm-eyebrow">{AMM.reading.lettersEyebrow}</p><h2 id="amm-letters-title" tabIndex={-1} ref={heading}>{AMM.reading.lettersTitle}</h2></div><p>{AMM.reading.lettersDescription}</p></header>
      {letters === null ? <p role="status">Opening the archive…</p> : letters.length > 0 ? <>
        <ol className="amm-edition-grid" aria-label="AMM letters, newest first">{letters.slice((page - 1) * SIZE, page * SIZE).map(edition => <li key={edition.id}><AmmEditionCard edition={edition} /></li>)}</ol>
        {pages > 1 && <nav className="amm-pagination" aria-label="AMM archive pages">{page > 1 ? <Link to={`/amm/editions?page=${page - 1}#amm-letters`}>Newer letters</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link to={`/amm/editions?page=${page + 1}#amm-letters`}>Older letters</Link> : <span />}</nav>}
        {page === pages && !failed && <p className="amm-end">You’ve reached the end of the archive.</p>}
      </> : !failed && <div className="amm-empty"><AmmMark /><div><h3>{AMM.emptyTitle}</h3><p>{AMM.emptyDescription}</p><a className="amm-text-link" href="#amm-subscribe">Receive the next edition <ArrowRight aria-hidden="true" /></a></div></div>}
    </section>
  </>;
}
