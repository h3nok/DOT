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

/**
 * Where the reader is when they ask.
 *
 * A question asked from inside a chapter — "what is this guy talking about?" —
 * has an obvious referent on the reader's screen and none at all in the
 * sentence. Carrying the open section makes those questions answerable instead
 * of refused.
 */
export interface ReadingPosition {
  section: string;
  title?: string | null;
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
  /**
   * False only when the companion found nothing and says so. The type used to
   * pin this to `true`, which left no way to express an honest empty hand —
   * so the alternative was returning two weakly-related passages as if they
   * were an answer.
   */
  grounded: boolean;
  refusal_code: string | null;
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
    // Reference markers survive link-stripping as bare superscripts and read as
    // corruption mid-sentence ("...established fear.¹⁷¹⁸"). The citation still
    // reaches the reader through the passage's own source chip.
    .replace(/[²³¹⁰⁴-₟]+/g, "")
    .replace(/\s+([.,;:!?])/g, "$1")
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
  return manifest.sections
    // The bibliography is where claims are *checked*, not where they are made.
    // Left in the corpus it surfaces as an answer — a probe of the entry's own
    // questions returned a placebo-neuroscience citation as half the reply to
    // "Is this science, philosophy, or faith?". Citations still reach the reader
    // through the passages that cite them.
    .filter((section) => section.kind !== "references")
    .flatMap((section) => parseSection(section, markdownBySlug[section.slug] ?? ""));
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

/**
 * Questions a person actually arrives with, routed to the passages that answer
 * them.
 *
 * Bare term-frequency ranking fails badly on natural phrasing: a probe of the
 * entry's own questions matched "difficult questions" in a practice prompt to a
 * passage about Big C's developmental history, and answered "what does DOT
 * claim?" with the theory's most speculative hypothesis — the exact
 * misrepresentation the preface works to prevent.
 *
 * Each intent therefore names the headings that genuinely answer it. A heading
 * hit outranks any amount of incidental word overlap, so the reply no longer
 * depends on the visitor happening to use the book's vocabulary.
 */
interface Intent {
  id: string;
  match: RegExp;
  /** Headings that answer this directly, matched case-insensitively. */
  headings: string[];
  terms: string[];
}

const INTENTS: readonly Intent[] = [
  {
    id: "what-is-claimed",
    match:
      /what (?:does|do).{0,20}(?:dot|theory|this|it).{0,20}(?:claim|say|argue|propose)|what is (?:dot|this)\b|summar|overview|in a nutshell/i,
    headings: [
      "What Chapter 1 Has—and Has Not—Established",
      "The Subjective Data Principle",
      "Why Call It Digital?",
    ],
    terms: ["observation", "model", "hypothesis", "speculation", "architecture"],
  },
  {
    id: "repeating-patterns",
    match:
      /repeat|same pattern|keep doing|stuck|habit|why do i|can'?t stop|over and over|conditioning/i,
    headings: [
      "Repainting the Canvas",
      "The Painting Protects Itself",
      "Coupling: When Information Becomes Identity",
      "Forming Character",
    ],
    terms: ["painting", "canvas", "character", "inherited", "expectation", "pattern"],
  },
  {
    id: "weakest",
    match: /weak|strongest objection|falsif|debt|wrong|criticis|criticiz|flaw|hole/i,
    headings: [
      "What Chapter 1 Has—and Has Not—Established",
      "The Limit of Knowledge",
      "What the Timing Puzzle Establishes",
    ],
    terms: ["alternative", "speculative", "debt", "distinguish", "unpaid", "limit"],
  },
  {
    id: "epistemic-status",
    match: /science|philosophy|faith|religion|spiritual|pseudo|believe|proof|prove/i,
    headings: [
      "An Invitation, Not a Demand",
      "The Subjective Data Principle",
      "Love as an Epistemic Condition",
    ],
    terms: ["interpretation", "speculation", "metaphysics", "evidence", "rigor"],
  },
  {
    id: "practice-pause",
    match: /paus|before (?:i )?(?:answer|respond|react)|interval|slow down|take a breath/i,
    headings: ["Where Freedom Lives", "Repainting the Canvas"],
    terms: ["pause", "notice", "authorship", "possibility", "attention", "revision"],
  },
  {
    id: "practice-urge",
    match: /urge|impulse|pull|craving|phone|scroll|without acting|resist/i,
    headings: ["Where Freedom Lives", "Fear and the Narrowing of Decision-Space"],
    terms: ["notice", "policy", "attention", "action", "visible", "revised"],
  },
  {
    id: "practice-repaint",
    match: /repaint|inherited (?:reaction|pattern)|test (?:a|the|one) (?:prediction|pattern)|change (?:a|my) pattern|work on myself/i,
    headings: ["Repainting the Canvas", "From Painting to Painter"],
    terms: ["notice", "predict", "test", "consequence", "update", "visible"],
  },
  {
    id: "fear",
    match: /fear|afraid|anxiet|scared|panic/i,
    headings: [
      "Fear and the Narrowing of Decision-Space",
      "The Fear-Gating Principle",
    ],
    terms: ["fear", "narrow", "decision", "contraction", "gate"],
  },
  {
    id: "love",
    match: /\blove\b|compassion|kindness/i,
    headings: ["Love as an Epistemic Condition", "Repainting the Canvas"],
    terms: ["love", "fear", "govern", "condition", "inquiry"],
  },
] as const;

export function intentFor(question: string): Intent | null {
  return INTENTS.find((intent) => intent.match.test(question)) ?? null;
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
  const intent = intentFor(question);
  if (intent) add(...intent.terms);

  if (/where.*(?:begin|start)|reading order|first read/i.test(question)) {
    add("observer", "inquiry", "subjective", "preface");
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
  reading?: ReadingPosition | null,
): BookPassage[] {
  const priorQuestion = [...history]
    .reverse()
    .find((turn) => turn.role === "member")?.content;
  const priorAnswer = [...history]
    .reverse()
    .find((turn) => turn.role === "twin")?.content;
  // Same order the orchestrator searches in: where the reader is, what was just
  // said, then what they actually asked.
  const query = [
    reading?.title ?? reading?.section?.replaceAll("-", " ") ?? "",
    priorAnswer?.slice(0, 240) ?? "",
    priorQuestion ?? "",
    question,
  ]
    .join(" ")
    .trim();
  const terms = termsFor(query, lens);
  const intent = intentFor(query);
  const intentHeadings = new Set(
    (intent?.headings ?? []).map((heading) => heading.toLowerCase()),
  );

  // What the visitor actually typed, minus the terms this module added. A
  // passage has to meet *their* words, not the expansion's, before it counts as
  // relevant — otherwise a boost term makes every off-topic question look
  // answerable.
  const askedTerms = new Set(
    (query.toLowerCase().match(/[a-z0-9']{3,}/g) ?? []).filter(
      (word) => !STOPWORDS.has(word),
    ),
  );

  const ranked = corpus
    .map((passage) => {
      const heading = `${passage.sectionTitle} ${passage.headingTitle}`.toLowerCase();
      const body = passage.text.toLowerCase();
      let score = 0;
      // A heading the intent names outranks any amount of incidental overlap,
      // so a plainly-worded question cannot be beaten by a passage that merely
      // repeats one of its words.
      const headingHit = intentHeadings.has(passage.headingTitle.trim().toLowerCase());
      if (headingHit) score += 60;
      for (const term of terms) {
        score += occurrences(heading, term) * 5;
        score += Math.min(occurrences(body, term), 4);
      }
      // A single-sentence passage rarely stands alone as an answer. Prefer
      // something the reader can actually grasp without opening the chapter.
      if (passage.text.length < 140) score -= 3;

      let matchedAsked = 0;
      for (const term of askedTerms) {
        if (heading.includes(term) || body.includes(term)) matchedAsked += 1;
      }
      // The relevance floor. Without it, one incidental word ("best") is enough
      // to answer "what is the best pizza in Chicago?" with a confident passage
      // about inherited conditioning.
      const relevant = headingHit || matchedAsked >= 2 || askedTerms.size <= 1;
      if (!relevant) score = 0;
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
  reading?: ReadingPosition | null,
): GroundedBookAnswer | null {
  const selected = rankPassages(corpus, question, lens, history, reading);

  // An honest empty hand. Two loosely-related fragments presented as an answer
  // is a small dishonesty; saying so and offering a real next step is not.
  if (selected.length === 0) {
    return {
      answer: [
        "I could not find a passage in Book One that answers this directly, and I would rather say so than hand you something close-but-unrelated.",
        "Two things usually help: ask it in the book's own terms — Canvas, Painting, Character, Fear, Intent, Reality Frame — or open the concept map and start from whichever idea is nearest.",
      ].join("\n\n"),
      citations: [],
      grounded: false,
      refusal_code: "no_grounded_passage",
    };
  }

  const lead =
    lens === "test"
      ? "Book One bounds this question here."
      : lens === "ground"
        ? "Here is what the book itself says."
        : "Here is where this lives in the book.";

  // Emitted as blockquotes so the reading surface can set them as real pull
  // quotes with their attribution attached. Run as plain paragraphs, two
  // passages read as one continuous answer in Minty's own voice, which
  // misrepresents quoted text as synthesis.
  const body = selected
    .map(
      (passage) =>
        `> ${excerpt(passage.text)}\n>\n> — ${passage.headingTitle}`,
    )
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
  reading?: ReadingPosition | null,
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
  return answerFromCorpus(await corpusPromise, question, lens, history, reading);
}
