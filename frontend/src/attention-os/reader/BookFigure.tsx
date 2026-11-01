import { useId, type CSSProperties } from "react";
import "./book-figure.css";

export interface BookFigureData {
  id: string;
  number?: number;
  title: string;
  alt: string;
  caption: string;
  claimLevel: string;
  src: string;
  width: number;
  height: number;
  mobileSrc?: string;
  mobileWidth?: number;
  mobileHeight?: number;
}

/** A manuscript illustration stays beside its explanation in every reader size. */
export function BookFigure({ figure }: { figure: BookFigureData }) {
  const captionId = useId();
  const mobileRatio = figure.mobileWidth && figure.mobileHeight
    ? `${figure.mobileWidth} / ${figure.mobileHeight}`
    : `${figure.width} / ${figure.height}`;
  const dimensions = {
    "--book-figure-ratio": `${figure.width} / ${figure.height}`,
    "--book-figure-mobile-ratio": mobileRatio,
  } as CSSProperties;

  return (
    <figure className="book-figure" id={`figure-${figure.id}`} aria-labelledby={captionId}>
      <picture className="book-figure__art" style={dimensions}>
        {figure.mobileSrc && (
          <source
            media="(max-width: 639px)"
            srcSet={figure.mobileSrc}
            width={figure.mobileWidth}
            height={figure.mobileHeight}
          />
        )}
        <img
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          loading="lazy"
          decoding="async"
        />
      </picture>
      <figcaption id={captionId} className="book-figure__caption">
        <span className="book-figure__label">
          {figure.number ? `Figure ${figure.number} · ` : ""}{figure.claimLevel}
        </span>{" "}
        <strong className="book-figure__title">{figure.title}</strong>{" "}
        <span className="book-figure__description">{figure.caption}</span>
      </figcaption>
    </figure>
  );
}
