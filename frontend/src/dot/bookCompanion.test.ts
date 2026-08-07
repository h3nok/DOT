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

describe("Lumen's Book One fallback", () => {
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
