import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import { fetchEssayIndex } from "../../content/essays/essays";
import MEDIA from "../../content/amm-media.json";
import { AmmButton } from "./AmmControls";
import { AMM_PARTS } from "./ammReading";
import "./amm-reading.css";

/** Reading time for each chapter, so a reader knows what they are starting. Absent until the index loads. */
function useChapterMinutes() {
  const [minutes, setMinutes] = useState<Record<string, number>>({});
  useEffect(() => {
    const abort = new AbortController();
    fetchEssayIndex(abort.signal)
      .then(essays => setMinutes(Object.fromEntries(essays.map(essay => [essay.slug, essay.readingMinutes]))))
      .catch(() => undefined);
    return () => abort.abort();
  }, []);
  return minutes;
}

/**
 * The manifesto as a book: its chapters in the author's order, each with its
 * artwork, its full title, one line from the chapter itself, how long it takes,
 * and one way in. The first chapter is the start. Nothing loads more (L2, L3).
 */
export function AmmReadingPath({ id }: { id: string }) {
  const AMM = useAmmContent();
  const minutes = useChapterMinutes();
  return <section className="amm-path-section amm-book" id={id} tabIndex={-1} aria-labelledby={`${id}-title`}>
    <header className="amm-book-heading"><h2 id={`${id}-title`} data-reveal>{AMM.chapterSection.title}</h2><p data-reveal="1">{AMM.chapterSection.description}</p></header>
    <ol className="amm-path" aria-label="The manifesto, in reading order">
      {AMM_PARTS.map((part, index) => {
        const line = AMM.chapterSection.chapters.find(chapter => chapter.id === part.slug)?.line;
        const art = MEDIA.parts[part.slug as keyof typeof MEDIA.parts];
        const time = minutes[part.slug];
        return <li key={part.slug} className="amm-part" aria-labelledby={`${id}-${part.slug}`}>
          {art && <Link to={part.route} className="amm-part-art" tabIndex={-1} aria-hidden="true" data-reveal>
            <span className="amm-reading-art amm-path-art" style={{ "--amm-art": `url(${art.src})` } as CSSProperties}><img src={art.src} srcSet={art.srcset} sizes={MEDIA.partSizes} alt="" width={art.width} height={art.height} loading="lazy" decoding="async" /></span>
          </Link>}
          <div className="amm-part-text">
            <h3 id={`${id}-${part.slug}`} className="amm-part-title" data-reveal="1"><span className="amm-part-number">{part.label}</span> <span className="amm-part-name">{part.title}</span></h3>
            {line && <p className="amm-part-line" data-reveal="2">{line}</p>}
            <div className="amm-part-actions" data-reveal="3">
              <AmmButton variant={index === 0 ? "primary" : "secondary"} to={part.route} label={index === 0 ? AMM.introduction.label : part.action} endIcon={<ArrowRight />} />
              {time ? <p className="amm-part-time">{time} min read</p> : null}
            </div>
          </div>
        </li>;
      })}
    </ol>
    {/* The artwork is AI-generated; the page says so once. */}
    <p className="amm-path-credit">{AMM.artwork.caption}</p>
  </section>;
}
