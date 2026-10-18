import { Artwork, type ExplainerImage } from "./Artwork";
import { FigureKey, type FigureKeyItem } from "./FigureKey";
import "./explainer.css";
export interface ContentsItem {
  href: string;
  label: string;
}

/**
 * The opening of an explainer: what it argues in one sentence, the picture it
 * stands behind, and the scenes ahead, numbered, so a reader sees the whole
 * length before starting.
 */
export function ExplainerHero({ eyebrow, title, intro, image, figureKey, figureKeyLabel, contents, contentsLabel }: {
  eyebrow?: string;
  title: string;
  intro: string;
  image?: ExplainerImage;
  figureKey?: readonly FigureKeyItem[];
  figureKeyLabel?: string;
  contents?: readonly ContentsItem[];
  contentsLabel?: string;
}) {
  return (
    <header className={`explainer-hero${image ? " explainer-hero--art" : ""}`}>
      <div className="explainer-hero-copy">
        {eyebrow && <p className="explainer-eyebrow explainer-hero-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="explainer-standfirst">{intro}</p>
      </div>
      {image && (
        <div className="explainer-hero-art">
          <Artwork image={image} priority />
          {figureKey && <FigureKey items={figureKey} label={figureKeyLabel ?? "Reading the image"} />}
        </div>
      )}
      {contents && contents.length > 0 && (
        <nav className="explainer-contents" aria-label={contentsLabel ?? "Contents"}>
          <ol>{contents.map((item, index) => <li key={item.href}><a href={item.href}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{item.label}</a></li>)}</ol>
        </nav>
      )}
    </header>
  );
}
