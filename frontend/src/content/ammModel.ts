/**
 * The American Millennial Manifesto's model, read from amm-model.json (generated
 * from the published chapters by scripts/build-amm-model.py) and resolved into the
 * shapes the inquiry primitives draw. Pages never restate these sentences; they
 * render them from here, each with the exact passage it came from.
 */
import MODEL from "./amm-model.json";
import { headingSlug } from "../attention-os/reader/headingSlug";
import type { ClaimLevel, InquiryQuote, InquiryRecord, InquiryTerm, ModelPart, ModelPlace } from "../attention-os/inquiry";
import { getDoctrineNode } from "./doctrine/doctrineData";

export interface ModelQuote {
  text: string;
  /** A chapter of the working book, or… */
  chapter?: number;
  /** …another published source: "dot" (Book One), "amm-2-earlier" (the earlier Chapter Two) or "letter". */
  doc?: string;
  /** Book One's section file, for "dot" quotes. */
  file?: string;
  section: string;
  fragment?: string;
  /** The key phrase to mark, always the sentence's own words. */
  mark?: string;
}

const OTHER = MODEL.sources as Record<string, { label: string; route: string }>;

export const AMM_MODEL = MODEL;
export const ESSAY_ROUTE = "/essays";

const chapter = (n: number) => {
  const found = MODEL.chapters.find((item) => item.n === n);
  if (!found) throw new Error(`AMM chapter ${n} is not in the model`);
  return found;
};

export const chapterRoute = (n: number) => `${ESSAY_ROUTE}/${chapter(n).slug}`;
export const chapterLabel = (n: number) => chapter(n).label;

/** "3. The Inversion in Practice" → "The Inversion in Practice". */
const sectionName = (section: string) => section.replace(/^\d+\.\s*/, "");

/** The work a sentence comes from: its label ("Chapter Three", "Book One") and address. */
function work(quote: ModelQuote): { label: string; route: string } {
  if (quote.doc) {
    const source = OTHER[quote.doc];
    if (!source) throw new Error(`Unknown source ${quote.doc}`);
    return { label: source.label, route: quote.file ? `${source.route}/${quote.file}` : source.route };
  }
  return { label: chapterLabel(quote.chapter!), route: chapterRoute(quote.chapter!) };
}

/** Text before a work's first heading: cited as the work itself. */
export const OPENING = "(opening)";

/** A model sentence with its passage: "Chapter Three · The Inversion in Practice". */
export function cite(quote: ModelQuote): InquiryQuote {
  const { label, route } = work(quote);
  const opening = quote.section === OPENING;
  return {
    text: quote.fragment === "start" ? `…${quote.text}` : quote.text,
    source: opening ? { label, href: route } : { label: `${label} · ${sectionName(quote.section)}`, href: `${route}#${headingSlug(quote.section)}` },
  };
}

/** "The Host: us, the public" → the term ("The Host") and what it means ("us, the public"). */
export function splitTerm(text: string) {
  const at = text.indexOf(": ");
  return at < 0 ? { term: text, cue: "" } : { term: text.slice(0, at), cue: text.slice(at + 2) };
}

/** Book One's four levels of claim, the reader contract AMM inherits from DOT. */
export const AMM_LEVELS: ClaimLevel[] = MODEL.levels.items.map((level) => ({
  id: level.id,
  label: level.label,
  rank: level.rank as ClaimLevel["rank"],
  definition: level.definition,
  source: MODEL.levels.source,
}));

/** Where each part of the model is met on the AMM home: its own screen, or the chapter that develops it. */
export const HOME_ANCHORS: Record<string, string> = {
  described: "amm-inversion",
  inversion: "amm-inversion",
  citizen: "amm-host",
  leech: "amm-leech",
  authorship: "amm-chapter-4",
};

/**
 * The chapters a screen quotes, once each, in order: "Chapter Three" linking to the
 * first section quoted from it. One quiet source line per screen, never one per sentence.
 */
export function chapterSources(quotes: ReadonlyArray<ModelQuote>): InquiryQuote["source"][] {
  const seen = new Map<string, InquiryQuote["source"]>();
  for (const quote of quotes) {
    const { label } = work(quote);
    if (!seen.has(label)) seen.set(label, { label, href: cite(quote).source.href });
  }
  return [...seen.values()];
}

export function ammParts(base = ""): ModelPart[] {
  return MODEL.parts.map((part) => ({
    id: part.id,
    name: part.name,
    place: part.place as ModelPlace,
    summary: cite(part.summary).text,
    members: part.members,
    href: `${base}#${HOME_ANCHORS[part.id]}`,
  }));
}

const doctrine = (id: string) => ({ label: getDoctrineNode(id)?.title ?? id, href: `/doctrine/${id}` });

export const AMM_TERMS: InquiryTerm[] = MODEL.terms.map((item) => ({
  id: item.id,
  term: item.term,
  definition: item.definition.text,
  source: cite(item.definition).source,
  applies: item.applies.map(doctrine),
}));

export const AMM_RECORDS: InquiryRecord[] = MODEL.records.map((record) => ({
  id: record.id,
  date: record.date,
  title: record.title,
  issuer: record.issuer,
  href: record.href,
  use: record.use,
}));

/** The foundational concepts the working definitions apply, in reading order, without repeats. */
export const AMM_DOT_CONCEPTS = [...new Set(MODEL.terms.flatMap((item) => item.applies))].map(doctrine);
