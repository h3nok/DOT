import {
  bookSectionRoute,
  fetchDotBookOneManifest,
  fetchDotBookOneSection,
  type BookReleaseSection,
  type DotBookOneManifest,
} from "../content/publications/dotBookOne";
import { doctrineNodes } from "../content/doctrine/doctrineData";
import { headingSlug as headingId } from "../attention-os/reader/headingSlug";
import type { AgentLens } from "./agent";

export interface CompanionHistoryTurn {
  role: "member" | "twin";
  content: string;
}

export interface BookCitation {
  node_id: string;
  kind: "book";
  label: string;
  locator: {
    edition: string;
    section: string;
    title: string;
    heading: string;
    heading_title: string;
    href: string;
    claim_level?: string;
  };
}

export interface GroundedBookAnswer {
  answer: string;
  citations: BookCitation[];
  grounded: true;
  refusal_code: null;
}

export interface BookPassage {
  id: string;
  sectionSlug: string;
  sectionTitle: string;
  heading: string;
  headingTitle: string;
  href: string;
  claimLevel?: string;
  text: string;
}

const STOPWORDS = new Set([
  "about",
  "actually",
  "after",
  "again",
  "also",
  "and",
  "are",
  "book",
  "can",
  "could",
  "does",
  "dot",
  "for",
  "from",
  "have",
  "into",
  "its",
  "one",
  "that",
  "the",
  "their",
  "this",
  "through",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "you",
]);

const SOCIAL_GREETING =
  /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening)|howdy)[\s!,.?]*$/i;
const SOCIAL_THANKS =
  /^(?:thanks|thank\s+you|thank\s+you\s+very\s+much)[\s!,.?]*$/i;

let corpusPromise: Promise<BookPassage[]> | null = null;

function cleanMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_`>#]/g, "")
    .replace(/\$+/g, "")
    .replace(/\\(?:begin|end)\{[^}]+\}/g, "")
    .replace(/\\[A-Za-z]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitLongParagraph(text: string, maximum = 900): string[] {
  if (text.length <= maximum) return [text];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > maximum) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function claimLevelFor(sectionSlug: string, heading: string): string | undefined {
  return doctrineNodes.find(
    (node) =>
      node.source.sectionSlug === sectionSlug && node.source.heading === heading,
  )?.source.claimLevel;
}

function passageFrom(
  section: BookReleaseSection,
  headingTitle: string,
  paragraph: string,
  index: number,
): BookPassage[] {
  const heading = headingId(headingTitle);
  const href = `${bookSectionRoute(section)}${heading ? `#${heading}` : ""}`;
  return splitLongParagraph(cleanMarkdown(paragraph))
    .filter((text) => text.length >= 40)
    .map((text, chunkIndex) => ({
      id: `book:${section.slug}:${heading || "opening"}:${index}:${chunkIndex}`,
      sectionSlug: section.slug,
      sectionTitle: section.title,
      heading,
      headingTitle: headingTitle || section.title,
      href,
      claimLevel: claimLevelFor(section.slug, heading),
      text,
    }));
}

function parseSection(
  section: BookReleaseSection,
  markdown: string,
): BookPassage[] {
  const passages: BookPassage[] = [];
  const paragraph: string[] = [];
  let currentHeading = section.title;
  let index = 0;
  let inCodeFence = false;

  const flush = () => {
    const text = paragraph.join(" ").trim();
    paragraph.length = 0;
    if (!text) return;
    passages.push(...passageFrom(section, currentHeading, text, index));
    index += 1;
  };

  for (const line of markdown.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) {
      flush();
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flush();
      currentHeading = cleanMarkdown(heading[1]);
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return passages;
}

export function buildBookCorpus(
  manifest: DotBookOneManifest,
  markdownBySlug: Readonly<Record<string, string>>,
): BookPassage[] {
  return manifest.sections.flatMap((section) =>
    parseSection(section, markdownBySlug[section.slug] ?? ""),
  );
}

function conceptFallbackCorpus(): BookPassage[] {
  return doctrineNodes.flatMap((node, nodeIndex) =>
    node.body.split(/\n{2,}/).map((text, paragraphIndex) => ({
      id: `book:concept:${node.id}:${paragraphIndex}`,
      sectionSlug: node.source.sectionSlug,
      sectionTitle: node.source.sectionTitle,
      heading: node.source.heading,
      headingTitle: node.title,
      href: node.source.href,
      claimLevel: node.source.claimLevel,
      text: cleanMarkdown(text),
      order: nodeIndex,
    })),
  );
}

async function loadCorpus(): Promise<BookPassage[]> {
  try {
    const manifest = await fetchDotBookOneManifest();
    const bodies = await Promise.all(
      manifest.sections.map(async (section) => [
        section.slug,
        await fetchDotBookOneSection(section),
      ] as const),
    );
    const corpus = buildBookCorpus(manifest, Object.fromEntries(bodies));
    return corpus.length > 0 ? corpus : conceptFallbackCorpus();
  } catch {
    return conceptFallbackCorpus();
  }
}

function termsFor(question: string, lens: AgentLens): string[] {
  const terms = Array.from(
    new Set(
      (question.toLowerCase().match(/[a-z0-9']{3,}/g) ?? []).filter(
        (word) => !STOPWORDS.has(word),
      ),
    ),
  );

  const add = (...values: string[]) => values.forEach((value) => terms.push(value));
  if (/where.*(?:begin|start)|reading order|first read/i.test(question)) {
    add("observer", "inquiry", "subjective", "preface");
  }
  if (/claim|overview|framework|theory/i.test(question)) {
    add("observation", "model", "hypothesis", "speculation");
  }
  if (/evidence|weak|falsif|test|support|limit|debt/i.test(question) || lens === "test") {
    add("evidence", "hypothesis", "alternative", "distinguish", "debt", "limit");
  }
  if (/consciousness/i.test(question)) add("awareness", "big", "little");
  if (/body|brain|neural/i.test(question)) add("interface", "decoupling", "neural");
  if (/conditioning|habit|identity/i.test(question)) add("canvas", "painting", "character");
  if (/choice|agency|decision/i.test(question)) add("intent", "authorship", "possibility");
  return Array.from(new Set(terms));
}

function occurrences(text: string, term: string): number {
  let count = 0;
  let position = text.indexOf(term);
  while (position !== -1) {
    count += 1;
    position = text.indexOf(term, position + term.length);
  }
  return count;
}

function rankPassages(
  corpus: BookPassage[],
  question: string,
  lens: AgentLens,
  history: readonly CompanionHistoryTurn[],
): BookPassage[] {
  const priorQuestion = [...history]
    .reverse()
    .find((turn) => turn.role === "member")?.content;
  const query = `${priorQuestion ?? ""} ${question}`.trim();
  const terms = termsFor(query, lens);

  const ranked = corpus
    .map((passage) => {
      const heading = `${passage.sectionTitle} ${passage.headingTitle}`.toLowerCase();
      const body = passage.text.toLowerCase();
      let score = 0;
      for (const term of terms) {
        score += occurrences(heading, term) * 5;
        score += Math.min(occurrences(body, term), 4);
      }
      if (lens === "test" && /not prove|hypothesis|speculat|alternative|debt|limit/i.test(body)) {
        score += 4;
      }
      if (/where.*(?:begin|start)/i.test(question) && passage.sectionSlug === "preface") {
        score += 8;
      }
      return { passage, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  const selected: BookPassage[] = [];
  const seenHeadings = new Set<string>();
  const limit = /\b(?:define|definition|what is|what does .+ mean)\b/i.test(
    question,
  )
    ? 1
    : 2;
  for (const candidate of ranked) {
    const headingKey = `${candidate.passage.sectionSlug}:${candidate.passage.heading}`;
    if (seenHeadings.has(headingKey)) continue;
    selected.push(candidate.passage);
    seenHeadings.add(headingKey);
    if (selected.length === limit) break;
  }
  return selected;
}

function excerpt(text: string, maximum = 520): string {
  if (text.length <= maximum) return text;
  const shortened = text.slice(0, maximum);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf(". "),
    shortened.lastIndexOf("? "),
    shortened.lastIndexOf("! "),
  );
  return `${shortened.slice(0, sentenceEnd > 220 ? sentenceEnd + 1 : maximum).trim()}…`;
}

function citationFor(passage: BookPassage): BookCitation {
  return {
    node_id: passage.id,
    kind: "book",
    label: `${passage.sectionTitle} · ${passage.headingTitle}`,
    locator: {
      edition: "digital-organism-theory-v2",
      section: passage.sectionSlug,
      title: passage.sectionTitle,
      heading: passage.heading,
      heading_title: passage.headingTitle,
      href: passage.href,
      ...(passage.claimLevel ? { claim_level: passage.claimLevel } : {}),
    },
  };
}

export function answerFromCorpus(
  corpus: BookPassage[],
  question: string,
  lens: AgentLens,
  history: readonly CompanionHistoryTurn[] = [],
): GroundedBookAnswer | null {
  const selected = rankPassages(corpus, question, lens, history);
  if (selected.length === 0) return null;

  const lead =
    lens === "test"
      ? "Book One keeps this question bounded by these passages:"
      : lens === "ground"
        ? "The closest Book One passages say:"
        : "A useful place in Book One is:"
  const body = selected
    .map((passage) => {
      const boundary = passage.claimLevel ? ` [${passage.claimLevel}]` : "";
      return `${passage.sectionTitle} · ${passage.headingTitle}${boundary}\n${excerpt(passage.text)}`;
    })
    .join("\n\n");

  return {
    answer: `${lead}\n\n${body}`,
    citations: selected.map(citationFor),
    grounded: true,
    refusal_code: null,
  };
}

export async function answerFromBook(
  question: string,
  lens: AgentLens = "ground",
  history: readonly CompanionHistoryTurn[] = [],
): Promise<GroundedBookAnswer | null> {
  if (SOCIAL_GREETING.test(question.trim())) {
    return {
      answer:
        "Hello. I am Minty, the DOT Companion. We can locate an idea, ground a question in Book One, or test where the argument is weakest.",
      citations: [],
      grounded: true,
      refusal_code: null,
    };
  }
  if (SOCIAL_THANKS.test(question.trim())) {
    return {
      answer: "You are welcome. I will keep the next answer tied to Book One.",
      citations: [],
      grounded: true,
      refusal_code: null,
    };
  }

  corpusPromise ??= loadCorpus();
  return answerFromCorpus(await corpusPromise, question, lens, history);
}
