import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAmmContent } from "../../content/editable/useAmmContent";
import MEDIA from "../../content/amm-media.json";
import { AmmReadingLink } from "./AmmControls";
import { AMM_PARTS } from "./ammReading";
import "./amm-reading.css";

/**
 * The manuscript in the author's order. Each part is its own section: the
 * author's artwork beside the part's title and one line on what it covers.
 * The page ends after the last part; nothing loads more (L2, L3).
 */
export function AmmReadingPath({ id }: { id: string }) {
  const AMM = useAmmContent();
  return <section className="amm-path-section" id={id} aria-labelledby={`${id}-title`}>
    <header className="amm-section-heading"><h2 id={`${id}-title`}>{AMM.chapterSection.title}</h2></header>
    <ol className="amm-path" aria-label="The manifesto, in reading order">
      {AMM_PARTS.map(part => {
        const summary = AMM.money.companions.find(note => note.id === part.slug)?.summary;
        const art = MEDIA.parts[part.slug as keyof typeof MEDIA.parts];
        return <li key={part.slug} className="amm-part">
          {art && <Link to={part.route} className="amm-part-art" tabIndex={-1} aria-hidden="true">
            <span className="amm-reading-art amm-path-art" style={{ "--amm-art": `url(${art.src})` } as CSSProperties}><img src={art.src} srcSet={art.srcset} sizes={MEDIA.partSizes} alt="" width={art.width} height={art.height} loading="lazy" decoding="async" /></span>
          </Link>}
          <div className="amm-part-text">
            <h3 className="amm-part-title"><AmmReadingLink to={part.route} label={part.title} className="amm-part-primary"><span className="amm-reading-title"><span>{part.title}</span><ArrowRight className="amm-reading-arrow" aria-hidden="true" /></span></AmmReadingLink></h3>
            {summary && <p className="amm-part-summary">{summary}</p>}
          </div>
        </li>;
      })}
    </ol>
    {/* The artwork is AI-generated; the page says so once. */}
    <p className="amm-path-credit">{AMM.artwork.caption}</p>
  </section>;
}
