import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import MODEL from "./amm-model.json";
import { AMM_DOT_CONCEPTS, AMM_TERMS, OPENING, ammParts, cite, type ModelQuote } from "./ammModel";
import { getDoctrineNode } from "./doctrine/doctrineData";
import { headingSlug } from "../attention-os/reader/headingSlug";

/**
 * The model is written once and must stay the author's published text. Every
 * sentence is checked against the section of the chapter it claims to come from,
 * and every level of claim against Book One's preface.
 */
const ROOT = process.cwd();
const plain = (text: string) => text
  .replace(/\[\^[^\]]+\]/g, "")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/[*_`]/g, "")
  .replace(/\\\$/g, "$")
  .replace(/\s+/g, " ")
  .trim();

function sections(path: string): Map<string, string> {
  const out = new Map<string, string>();
  let current = "(opening)";
  for (const line of readFileSync(join(ROOT, path), "utf8").split("\n")) {
    const heading = /^#{2,3} (.+)/.exec(line);
    if (heading) current = heading[1].trim();
    // A figure's published caption (its Markdown title) is part of its section, as the model build reads it.
    else out.set(current, `${out.get(current) ?? ""} ${plain(line)} ${/^\s*!\[[^\]]*\]\([^)\s]+ "([^"]+)"\)/.exec(line)?.[1] ?? ""}`);
  }
  return out;
}

const CHAPTERS = new Map(MODEL.chapters.map((item) => [item.n, sections(`src/content/essays/${item.slug}.md`)]));
const DOT_SECTION = (file: string) => sections(`public/publications/henok/digital-organism-theory/v5/sections/${file}.md`);
const SOURCES = MODEL.sources as Record<string, { label: string; route: string; path?: string }>;
/** The file a sentence claims to come from: a chapter, a Book One section, or another published work. */
const fileOf = (quote: ModelQuote) => quote.doc === "dot" ? `public/publications/henok/digital-organism-theory/v5/sections/${quote.file}.md` : quote.doc ? SOURCES[quote.doc].path! : `src/content/essays/${MODEL.chapters.find((c) => c.n === quote.chapter)!.slug}.md`;
const passage = (quote: ModelQuote) => (quote.doc === "dot" ? DOT_SECTION(quote.file!) : quote.doc ? sections(fileOf(quote)) : CHAPTERS.get(quote.chapter!))?.get(quote.section) ?? "";

function quotes(value: unknown, out: ModelQuote[] = []): ModelQuote[] {
  if (Array.isArray(value)) value.forEach((item) => quotes(item, out));
  else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.text === "string" && (typeof record.chapter === "number" || typeof record.doc === "string") && typeof record.section === "string") out.push(record as unknown as ModelQuote);
    else Object.values(record).forEach((item) => quotes(item, out));
  }
  return out;
}

describe("the AMM model", () => {
  const all = quotes(MODEL);

  it("quotes only published text (the chapters, Book One, the earlier Chapter Two, the letter), each sentence in the section it names", () => {
    expect(all.length).toBeGreaterThan(60);
    const drift = all.filter((quote) => !passage(quote).includes(quote.text))
      .map((quote) => `${quote.doc ?? `Chapter ${quote.chapter}`} · ${quote.section}: ${quote.text.slice(0, 80)}`);
    expect(drift).toEqual([]);
    expect(all.filter((quote) => quote.doc === "dot").length).toBeGreaterThanOrEqual(5);
  });

  it("links each sentence to the heading the reader will land on", () => {
    const quote = MODEL.scenes.model.heading;
    expect(cite(quote).source).toEqual({ label: "Chapter Three · The Inversion in Practice", href: "/essays/amm-book-chapter-three-the-host-and-the-infection#3-the-inversion-in-practice" });
    for (const item of all) {
      // Text before a work's first heading links to the work itself.
      if (item.section === OPENING) {
        expect(cite(item).source.href).not.toContain("#");
        continue;
      }
      const essay = readFileSync(join(ROOT, fileOf(item)), "utf8");
      const headings = [...essay.matchAll(/^#{2,3} (.+)$/gm)].map((match) => headingSlug(match[1]));
      expect(headings).toContain(cite(item).source.href.split("#")[1]);
    }
  });

  it("marks only a sentence's own words, and never every sentence", () => {
    const marked = all.filter((quote) => quote.mark);
    for (const quote of marked) expect(quote.text, quote.mark).toContain(quote.mark);
    expect(marked.length).toBeLessThan(all.length / 2);
  });

  it("cites Book One by section address", () => {
    expect(cite(MODEL.power.enters.heading).source).toEqual({ label: "Book One · The Culture Inside You", href: "/book/digital-organism-theory/the-painting#the-culture-inside-you" });
  });

  it("draws Organized Power's figures from the chapter's own sentences", () => {
    const { income, housing } = MODEL.power;
    const list = (words: readonly string[]) => `${words.slice(0, -1).join(", ")}, and ${words.at(-1)}`;
    expect(`${income.upWords.line} ${list(income.upWords.words)}.`).toBe(income.up.text);
    expect(`${income.downWords.line} ${list(income.downWords.words)}.`).toBe(income.down.text);
    for (const metro of housing.metros) expect(housing.gao.text).toMatch(new RegExp(`${metro.value} percent (of single-family rentals )?in ${metro.label}`));
    expect(housing.ftc.text).toContain("446,000");
  });

  it("marks a sentence that begins mid-sentence as a fragment", () => {
    expect(cite(MODEL.scenes.division.lines[0]).text.startsWith("…our harm")).toBe(true);
  });

  it("takes the four levels of claim from Book One's preface", () => {
    const preface = plain(readFileSync(join(ROOT, "public/publications/henok/digital-organism-theory/v5/sections/preface.md"), "utf8"));
    expect(MODEL.levels.items.map((level) => level.label)).toEqual(["Observation", "External model", "DOT derivation", "Speculative extension"]);
    for (const level of MODEL.levels.items) expect(preface).toContain(level.definition);
  });

  it("defines every working term from Chapter Four and links only to concepts DOT has released", () => {
    expect(AMM_TERMS.map((term) => term.term)).toContain("Moral erosion");
    for (const id of MODEL.terms.flatMap((term) => term.applies)) expect(getDoctrineNode(id), id).toBeDefined();
    expect(AMM_DOT_CONCEPTS.length).toBeGreaterThan(5);
  });

  it("places every part of the model and gives each a screen on the home", () => {
    const parts = ammParts("/amm");
    expect(parts.map((part) => part.place)).toEqual(["above", "line", "on", "below", "outside"]);
    for (const part of parts) expect(part.href).toMatch(/^\/amm#amm-/);
  });

  it("keeps each record's address as the chapter cites it", () => {
    for (const record of MODEL.records) {
      const essay = readFileSync(join(ROOT, `src/content/essays/${MODEL.chapters.find((c) => c.n === record.chapter)!.slug}.md`), "utf8");
      expect(essay, record.id).toContain(record.href);
      if (record.use) expect(plain(essay), record.id).toContain(record.use);
    }
  });
});
