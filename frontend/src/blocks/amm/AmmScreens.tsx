import type { ReactNode } from "react";
import { Marked, Scene, ShareLink } from "../../attention-os/inquiry";
import { chapterSources, cite, splitTerm, type ModelQuote } from "../../content/ammModel";
import { useAmmContent } from "../../content/editable/useAmmContent";
import MEDIA from "../../content/amm-media.json";
import { FloatingArt, PAINTINGS, type DiagnosisPainting } from "./reflect/DiagnosisScene";
import "./amm-reflect.css";
import "./amm-model.css";

/** A painting by name: the diagnosis set first, then the AMM's other illustrations. */
const painting = (key: string): DiagnosisPainting | undefined =>
  PAINTINGS[key] ?? (MEDIA as unknown as Record<string, DiagnosisPainting | undefined>)[key];

const INVERSION = /(\b[Tt]he Inversion\b)/;

/**
 * In a heading or label, the word "Inversion" turns over as its screen arrives and stays inverted
 * (the author, 2026-11-22: "Invert 'Inversion'… animated"). Only the look turns; the words read
 * the same aloud. Running text is never inverted.
 */
export function Inverted({ text }: { text: string }) {
  return <>{text.split(/(Inversion)/).map((part, index) => index % 2
    ? <span key={index} className="amm-invert">{part}</span>
    : part)}</>;
}

/**
 * A sentence with its key phrase marked, and the Inversion always marked too (the author,
 * 2026-11-19: "Always highlight the Inversion"). A key phrase that already holds the
 * Inversion is marked whole. In a heading or label, `invert` also turns the word over.
 */
export function AmmMarked({ text, mark, invert }: { text: string; mark?: string; invert?: boolean }) {
  if (mark?.includes("Inversion") && text.includes(mark)) return <Marked text={text} mark={mark} />;
  return <>{text.split(INVERSION).map((part, index) => index % 2
    ? <mark key={index} className="inq-mark">{invert ? <Inverted text={part} /> : part}</mark>
    : <Marked key={index} text={part} mark={mark} />)}</>;
}

/** A painting, floating, with its disclosure. Each appears once on a page. */
export function Art({ name }: { name: string }) {
  const { reflect } = useAmmContent();
  const art = painting(name);
  if (!art) return null;
  return <div className="amm-diagnosis-art"><FloatingArt painting={art} /><p className="amm-diagnosis-disclosure">{reflect.disclosure}</p></div>;
}

/** Which part of the cultural arrangement this screen shows, paired with a plain-English cue. */
export function ModelStep({ step, hint }: { step: string; hint?: string }) {
  return (
    <p className="amm-model-step">
      <span className="amm-model-step-name">{step}</span>
      {hint && <><span className="amm-model-step-sep" aria-hidden="true">·</span><span className="amm-model-step-hint">{hint}</span></>}
    </p>
  );
}

/** One quiet line under a screen: the works it quotes, cleanly separated from the share control. */
export function ScreenFoot({ id, quotes }: { id?: string; quotes: ReadonlyArray<ModelQuote> }) {
  const { model: L } = useAmmContent();
  return (
    <p className="amm-screen-foot">
      {quotes.length > 0 && <span className="amm-screen-source">{L.sourceLabel}{" "}{chapterSources(quotes).map((source, index) => <span key={source.href}>{index ? " · " : ""}<a href={source.href}>{source.label}</a></span>)}</span>}
      {quotes.length > 0 && id && <span className="amm-screen-sep" aria-hidden="true"> · </span>}
      {quotes.length > 0 && id && " "}
      {id && <ShareLink target={id} labels={{ action: L.shareAction, done: L.shareDone, unavailable: L.shareUnavailable }} />}
    </p>
  );
}

/**
 * Heading, then anything shown with it, then the lines, then the source and next step.
 * The heading is a published sentence (`heading`) or a plain label (`title`); beside
 * the words sits a painting (`art`) or a figure (`media`), never both. A heading set as a
 * term (`asTerm`, the model's parts) shows the term in the flame and what it means beneath it;
 * read aloud, it is the same sentence.
 */
export function Screen({ id, heading, title, eyebrow, lines = [], art, media, reverse, wide, body, children, tone, asTerm }: {
  id: string;
  asTerm?: boolean;
  /** Where the screen sits, shown above its heading (e.g. a CycleMark). */
  eyebrow?: ReactNode;
  heading?: ModelQuote;
  title?: string;
  lines?: ReadonlyArray<ModelQuote>;
  art?: string;
  media?: ReactNode;
  reverse?: boolean;
  wide?: boolean;
  tone?: "paper" | "night";
  body?: ReactNode;
  children?: ReactNode;
}) {
  const text = title ?? (heading ? cite(heading).text : "");
  const { term, cue } = splitTerm(text);
  return (
    <Scene id={id} labelledBy={`${id}-title`} media={art ? <Art name={art} /> : media} reverse={reverse} wide={wide} tone={tone} reveal>
      {eyebrow}
      {asTerm
        ? <h2 id={`${id}-title`} className="amm-screen-heading amm-term-heading">
            <span className="amm-term"><Inverted text={term} /></span>
            {cue && <><span className="amm-term-sep">: </span><span className="amm-term-cue"><AmmMarked text={cue} /></span></>}
          </h2>
        : <h2 id={`${id}-title`} className={`amm-screen-heading${text.length > 60 ? " amm-screen-heading--long" : ""}`}><AmmMarked text={text} /></h2>}
      {body}
      {lines.map((line) => <p key={line.text} className="amm-screen-line"><AmmMarked text={cite(line).text} mark={line.mark} /></p>)}
      {children}
    </Scene>
  );
}
