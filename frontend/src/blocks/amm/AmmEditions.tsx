import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Rss } from "lucide-react";
import AMM from "../../content/amm.json";
import { essayRoute, fetchEssayIndex, formatEssayDate } from "../../content/essays/essays";
import { fetchReleasedWriting } from "../../services/OrchestratorWritingService";
import { publicationRoute, replacesEssay } from "../publication/writing/publicationBridge";
import { AmmMark } from "./AmmIdentity";

type Edition = { id: string; title: string; summary: string; date: string; href: string; cover?: string };
const SIZE = 6;

export function AmmEditions() {
  const [editions, setEditions] = useState<Edition[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [params] = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  const pageParam = params.get("page");
  const previousPage = useRef(pageParam);
  useEffect(() => {
    if (previousPage.current !== pageParam) { heading.current?.focus(); previousPage.current = pageParam; }
  }, [pageParam]);
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false);
    void Promise.allSettled([fetchEssayIndex(abort.signal), fetchReleasedWriting(abort.signal, true)]).then(([essays, writing]) => {
      if (abort.signal.aborted) return;
      const posts: Edition[] = [];
      const native = writing.status === "fulfilled" ? writing.value : [];
      if (essays.status === "fulfilled") posts.push(...essays.value.filter(item => item.series === AMM.series && !native.some(entry => replacesEssay(entry, item.slug))).map(item => ({ id: `essay:${item.slug}`, title: item.title, summary: item.summary, date: item.published, href: essayRoute(item.slug), cover: item.cover?.src })));
      posts.push(...native.filter(item => !item.withdrawn_at && item.presentation?.series === AMM.series).map(item => ({ id: `writing:${item.work_id}`, title: item.title, summary: item.summary ?? "", date: item.released_at.slice(0, 10), href: publicationRoute(item), cover: item.cover?.src })));
      setEditions(posts.sort((a, b) => b.date.localeCompare(a.date)));
      setFailed(essays.status === "rejected" || writing.status === "rejected");
    });
    return () => abort.abort();
  }, [attempt]);
  const pages = Math.max(1, Math.ceil((editions?.length ?? 0) / SIZE));
  const requested = Number(pageParam ?? 1);
  const page = Number.isInteger(requested) && requested > 0 && requested <= pages ? requested : 1;
  return (
    <section id="amm-editions" className="amm-editions" aria-labelledby="amm-editions-title">
      <header className="amm-section-heading"><div><p className="amm-eyebrow">03 / The publication</p><h2 id="amm-editions-title" tabIndex={-1} ref={heading}>Letters from the present.</h2></div><a className="amm-text-link" href={AMM.feed}><Rss aria-hidden="true" />AMM RSS</a></header>
      {failed && <p role="alert" className="amm-notice">Some editions could not be loaded. <button onClick={() => setAttempt(value => value + 1)}>Try again</button></p>}
      {editions === null ? <p role="status">Opening the archive…</p> : editions.length > 0 ? <>
        <ol className="amm-edition-grid" aria-label="AMM editions, newest first">{editions.slice((page - 1) * SIZE, page * SIZE).map(edition => <li key={edition.id}><article><Link to={edition.href} className="amm-edition-art" tabIndex={-1} aria-hidden="true">{edition.cover ? <img src={edition.cover} alt="" loading="lazy" /> : <AmmMark />}</Link><div className="amm-edition-copy"><p className="amm-eyebrow"><time dateTime={edition.date}>{formatEssayDate(edition.date)}</time></p><h3><Link to={edition.href}>{edition.title}<ArrowRight aria-hidden="true" /></Link></h3><p>{edition.summary}</p><span className="amm-edition-label">AMM · Read the edition</span></div></article></li>)}</ol>
        {pages > 1 && <nav className="amm-pagination" aria-label="AMM archive pages">{page > 1 ? <Link to={`/amm?page=${page - 1}#amm-editions`}>Newer editions</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link to={`/amm?page=${page + 1}#amm-editions`}>Older editions</Link> : <span />}</nav>}
        {page === pages && !failed && <p className="amm-end">You’ve reached the end of the archive.</p>}
      </> : !failed && <div className="amm-empty"><AmmMark /><div><h3>{AMM.emptyTitle}</h3><p>{AMM.emptyDescription}</p><a className="amm-text-link" href="#amm-subscribe">Receive the next edition <ArrowRight aria-hidden="true" /></a></div></div>}
    </section>
  );
}
