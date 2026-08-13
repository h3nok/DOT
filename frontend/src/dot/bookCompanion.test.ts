import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { DotBookOneManifest } from "../content/publications/dotBookOne";
import { answerFromCorpus, buildBookCorpus } from "./bookCompanion";

const releaseRoot = join(
  process.cwd(),
  "public/publications/henok/digital-organism-theory/v2",
);
const manifest = JSON.parse(
  readFileSync(join(releaseRoot, "manifest.json"), "utf8"),
) as DotBookOneManifest;
const markdownBySlug = Object.fromEntries(
  manifest.sections.map((section) => [
    section.slug,
    readFileSync(join(releaseRoot, section.content_path), "utf8"),
  ]),
);
const corpus = buildBookCorpus(manifest, markdownBySlug);

describe("Minty's Book One fallback", () => {
  it("answers a definition from the released passage and links to it", () => {
    const result = answerFromCorpus(
      corpus,
      "How does Book One define a Digital Organism?",
      "ground",
    );

    expect(result?.grounded).toBe(true);
    expect(result?.citations[0].locator.href).toContain(
      "/book/digital-organism-theory/the-digital-organism#why-call-it-digital",
    );
    expect(result?.answer).toContain("carries state");
  });

  it("uses prior visitor context to ground a follow-up", () => {
    const result = answerFromCorpus(
      corpus,
      "What is the strongest alternative?",
      "test",
      [{ role: "member", content: "What does DOT claim about Little c?" }],
    );

    expect(result?.grounded).toBe(true);
    expect(result?.citations.length).toBeGreaterThan(0);
    expect(result?.citations.every((citation) => citation.kind === "book")).toBe(
      true,
    );
  });
});

/**
 * The entry page sends visitors here with four sample questions and three
 * practice prompts. A probe of those seven found the fallback answering
 * "what does DOT claim?" with the theory's most speculative hypothesis, sending
 * a practice prompt to a passage about Big C's developmental history (a keyword
 * collision on "difficult questions"), and returning a bibliography entry as an
 * answer. These pin the repairs.
 */
describe("Minty's answers to the entry's own questions", () => {
  const headingsFor = (question: string, lens: "ground" | "test" = "ground") =>
    answerFromCorpus(corpus, question, lens)?.citations.map(
      (citation) => citation.locator.heading_title,
    ) ?? [];

  it("does not answer 'what does DOT claim' with its most speculative hypothesis", () => {
    const headings = headingsFor("What does DOT actually claim?");

    expect(headings).toContain("What Chapter 1 Has—and Has Not—Established");
    expect(headings).not.toContain("The Big C Hypothesis");
  });

  it("sends a personal question about repetition to the repainting passage", () => {
    expect(headingsFor("Why do I keep repeating the same patterns?")).toContain(
      "Repainting the Canvas",
    );
  });

  it("grounds the practice prompts in the passages that describe them", () => {
    expect(
      headingsFor(
        "I want to practise pausing before I answer difficult questions. Walk me through what DOT says is happening in that interval, and how to try it today.",
      ),
    ).toContain("Where Freedom Lives");

    expect(
      headingsFor(
        "I want to examine one inherited pattern using DOT's repainting loop: notice, predict, test, receive, update. Help me pick something small enough to test safely.",
      ),
    ).toContain("Repainting the Canvas");
  });

  it("places the epistemic-status question in the invitation, not the bibliography", () => {
    const headings = headingsFor("Is this science, philosophy, or faith?");

    expect(headings).toContain("An Invitation, Not a Demand");
    expect(headings.some((heading) => /^Reference \d+$/.test(heading))).toBe(false);
  });

  it("keeps the bibliography out of the answerable corpus entirely", () => {
    expect(corpus.some((passage) => passage.sectionSlug === "references")).toBe(false);
  });

  it("says it has nothing rather than answering an unrelated question", () => {
    const result = answerFromCorpus(corpus, "What is the best pizza in Chicago?", "ground");

    expect(result?.grounded).toBe(false);
    expect(result?.refusal_code).toBe("no_grounded_passage");
    expect(result?.citations).toHaveLength(0);
  });

  it("strips reference superscripts out of quoted prose", () => {
    const answer = answerFromCorpus(
      corpus,
      "Why do I keep repeating the same patterns?",
      "ground",
    )?.answer;

    // "...established fear.¹⁷¹⁸" reads as corruption mid-sentence.
    expect(answer).not.toMatch(/[¹²³⁴-⁹]/);
  });
});
