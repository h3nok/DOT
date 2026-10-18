import { useId, useRef, useState } from "react";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import "./explainer.css";
import "./artwork.css";

export interface ExplainerImage {
  sources?: readonly { type: string; srcset: string }[];
  fallback: string;
  /** Full-resolution image, loaded only when the reader opens the viewer. */
  full?: string;
  title: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  caption?: string;
}

/** Frameless artwork with a reader-controlled, keyboard-accessible detail view. */
export function Artwork({ image, priority = false }: { image: ExplainerImage; priority?: boolean }) {
  const title = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const open = () => {
    setLoading(true);
    setFailed(false);
    setOpened(true);
    dialog.current?.showModal();
  };
  return <figure className="explainer-artwork">
    <button type="button" className="explainer-artwork-open" onClick={open} aria-label={`Inspect ${image.title}`} aria-haspopup="dialog">
      <picture>
        {image.sources?.map(source => <source key={source.type} type={source.type} srcSet={source.srcset} sizes={image.sizes ?? "100vw"} />)}
        <img src={image.fallback} alt={image.alt} width={image.width} height={image.height} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
      </picture>
      <span className="explainer-artwork-hint"><Maximize2 aria-hidden="true" /> Inspect illustration</span>
    </button>
    {image.caption && <figcaption>{image.caption}</figcaption>}
    <dialog ref={dialog} className="explainer-art-dialog" aria-labelledby={title} onClose={() => { setOpened(false); setExpanded(false); }}>
      <div className="explainer-art-toolbar">
        <h2 id={title}>{image.title}</h2>
        <button type="button" aria-pressed={expanded} onClick={() => { setExpanded(value => !value); viewport.current?.scrollTo(0, 0); }}>
          {expanded ? <ZoomOut aria-hidden="true" /> : <ZoomIn aria-hidden="true" />} {expanded ? "Fit image" : "Zoom in"}
        </button>
        <button type="button" onClick={() => dialog.current?.close()} aria-label="Close illustration"><X aria-hidden="true" /></button>
      </div>
      <div ref={viewport} className="explainer-art-viewport" data-expanded={expanded || undefined} tabIndex={0} aria-label="Illustration. When zoomed, scroll to inspect details.">
        {opened && <>
          {loading && <p className="explainer-art-status" role="status">Loading illustration…</p>}
          {failed ? <p className="explainer-art-status" role="status">The full-size image could not load. <a href={image.fallback} target="_blank" rel="noreferrer">Open the smaller image</a></p> :
            <img src={image.full ?? image.fallback} alt={image.alt} width={image.width} height={image.height} decoding="async" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />}
        </>}
      </div>
      <p className="explainer-art-caption">{image.caption ?? image.alt}</p>
    </dialog>
  </figure>;
}
