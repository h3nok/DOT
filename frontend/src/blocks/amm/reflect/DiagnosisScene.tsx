import { useEffect, useRef, useState, type ReactNode } from "react";
import { Artwork, type ExplainerImage } from "../../../attention-os/explainer";
import MEDIA from "../../../content/amm-media.json";

type Variant = Pick<ExplainerImage, "fallback" | "full" | "sources">;
/** Each illustration has a light-page version and, where the scene needs one, a dark-page version. */
export type DiagnosisPainting = ExplainerImage & { night?: Variant };
export const PAINTINGS = MEDIA.reflect as Record<string, DiagnosisPainting>;

/** Shows the version made for the reader's theme; the other stays unloaded (lazy and not displayed). */
export function FloatingArt({ painting, priority = false }: { painting: DiagnosisPainting; priority?: boolean }) {
  if (!painting.night) return <div className="amm-art"><Artwork image={painting} priority={priority} /></div>;
  return <>
    <div className="amm-art amm-art--light"><Artwork image={painting} priority={priority} /></div>
    <div className="amm-art amm-art--dark"><Artwork image={{ ...painting, ...painting.night }} /></div>
  </>;
}

/**
 * One concept on one screen: a painting and the words it carries. Scenes alternate
 * sides on wide screens; on phones the painting comes first. "night" scenes are the
 * room where the culture is practiced, set on a deeper band of the reader's own theme;
 * "paper" scenes hold what we claim and the turn.
 */
export interface Callout { id: string; label: string; x: number; y: number; side: string }

/**
 * Names pinned to the painting itself: a dot on the thing, its name beside it.
 * On narrow screens the dots carry numbers and the names sit in a key below.
 */
export function Callouts({ items, label }: { items: ReadonlyArray<Callout>; label: string }) {
  return <>
    <ol className="amm-callouts" aria-label={label}>
      {items.map((item, index) => <li key={item.id} className={`amm-callout amm-callout--${item.side === "left" ? "left" : "right"}`}
        style={{ left: `${item.x * 100}%`, top: `${item.y * 100}%` }}>
        <span className="amm-callout-dot" aria-hidden="true">{index + 1}</span>
        <span className="amm-callout-label">{item.label}</span>
      </li>)}
    </ol>
    <ol className="amm-callout-key" aria-hidden="true">
      {items.map((item, index) => <li key={item.id}><span>{index + 1}</span>{item.label}</li>)}
    </ol>
  </>;
}

export function DiagnosisScene({ id, image, painting: given, tone = "night", reverse = false, label, disclosure, priority = false, callouts, calloutsLabel = "", children }: {
  id: string;
  /** A painting from outside the diagnosis set, used when `image` does not name one. */
  painting?: DiagnosisPainting;
  /** Names pinned to parts of the painting, positioned as fractions of its width and height. */
  callouts?: ReadonlyArray<Callout>;
  calloutsLabel?: string;
  image?: string;
  tone?: "night" | "paper";
  reverse?: boolean;
  label: string;
  disclosure: string;
  priority?: boolean;
  children: ReactNode;
}) {
  const painting = given ?? (image ? PAINTINGS[image] : undefined);
  return <section id={id} className={`amm-diagnosis-scene amm-diagnosis-scene--${tone}${painting ? "" : " amm-diagnosis-scene--words"}${reverse ? " amm-diagnosis-scene--reverse" : ""}`} aria-label={label}>
    <div className="amm-diagnosis-frame">
      {painting && <div className="amm-diagnosis-art" data-reveal>
        {callouts?.length
          ? <div className="amm-annotated"><FloatingArt painting={painting} priority={priority} /><Callouts items={callouts} label={calloutsLabel} /></div>
          : <FloatingArt painting={painting} priority={priority} />}
        <p className="amm-diagnosis-disclosure">{disclosure}</p>
      </div>}
      <div className="amm-diagnosis-words">{children}</div>
    </div>
  </section>;
}

/** Time to read the word once before it turns. */
const READ_ONCE_MS = 1800;

/**
 * A title whose last word turns upside down after the reader has read it once:
 * it loosens, swings past, and settles inverted. It plays once, when the word is
 * on screen, and never repeats (L1). Readers who prefer stillness see it already
 * inverted; without JavaScript it stays upright. Assistive technology reads it as written.
 */
export function InvertedTitle({ text }: { text: string }) {
  const word = useRef<HTMLSpanElement>(null);
  const [turned, setTurned] = useState(false);
  useEffect(() => {
    const node = word.current;
    if (!node) return;
    const still = (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches)
      || document.documentElement.dataset.motion === "still";
    if (still || typeof IntersectionObserver !== "function") { setTurned(true); return; }
    let timer = 0;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      timer = window.setTimeout(() => setTurned(true), READ_ONCE_MS);
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => { observer.disconnect(); window.clearTimeout(timer); };
  }, []);
  const at = text.lastIndexOf(" ");
  return <>{at > 0 ? `${text.slice(0, at)} ` : ""}<span ref={word} className="amm-inverted" data-turned={turned ? "true" : undefined}>{text.slice(at + 1)}</span></>;
}

/** Sentences in reading order, each settling in after the one before. */
export function Lines({ items, className = "amm-diagnosis-line", from = 1 }: { items: ReadonlyArray<{ text: string }>; className?: string; from?: number }) {
  return <>{items.map((item, index) => <p key={item.text} className={className} data-reveal={String(Math.min(6, from + index))}>{item.text}</p>)}</>;
}

export interface ThoughtItem {
  term: string;
  text: string;
}

/**
 * The citizen's head: the Carrier thoughts (compliance) beside the Enforcer thoughts
 * (policing others), each with its keyword.
 */
export function ThoughtField({ carrier, enforcer, carrierLabel, enforcerLabel }: {
  carrier: ReadonlyArray<ThoughtItem>;
  enforcer: ReadonlyArray<ThoughtItem>;
  carrierLabel: string;
  enforcerLabel: string;
}) {
  const renderList = (kind: "carrier" | "enforcer", label: string, items: ReadonlyArray<ThoughtItem>) => (
    <div className={`amm-thought-column amm-thought-column--${kind}`}>
      <h3 className={`amm-thought-column-title amm-thought-column-title--${kind}`}>{label}</h3>
      <ul role="list" aria-label={label} className="amm-thought-list">
        {items.map(item => <li key={item.text} className={`amm-thought-card amm-thought-card--${kind}`}>
          <span className="amm-thought-term">{item.term}</span>
          <span className={`amm-thought amm-thought--${kind}`}>{`“${item.text}”`}</span>
        </li>)}
      </ul>
    </div>
  );

  return (
    <div className="amm-thought-columns" data-reveal="2">
      {renderList("carrier", carrierLabel, carrier)}
      {renderList("enforcer", enforcerLabel, enforcer)}
    </div>
  );
}
