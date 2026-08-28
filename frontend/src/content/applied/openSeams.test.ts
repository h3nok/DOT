import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { headingSlug } from "../../attention-os/reader/headingSlug";
import type { DotBookOneManifest } from "../publications/dotBookOne";
import {
  openSeams,
  seamWork,
  type AppliedWork,
  type OpenSeam,
} from "./openSeams";

/**
 * ADR-0017 as an executable gate for the applied layer.
 *
 * Two things are binding and neither is checkable by reading prose: every entry
 * declares a claim level drawn from the book's own reader contract, and every
 * entry resolves to a passage that exists in the released text. Both are
 * checked here against the shipped release rather than against a copy of it,
 * so a seam cannot drift from the manuscript without failing the build.
 */

const releaseRoot = join(
  process.cwd(),
  "public/publications/henok/digital-organism-theory/v3",
);
const manifest = JSON.parse(
  readFileSync(join(releaseRoot, "manifest.json"), "utf8"),
) as DotBookOneManifest;

const contractLevels = manifest.reader_contract.claim_levels;

/** Every heading anchor the released text actually renders. */
const anchorsBySection = new Map<string, Set<string>>(
  manifest.sections.map((section) => {
    const markdown = readFileSync(
      join(releaseRoot, section.content_path),
      "utf8",
    );
    const anchors = new Set<string>();
    for (const line of markdown.split(/\r?\n/)) {
      const heading = line.match(/^#{1,6}\s+(.+)$/);
      if (heading) anchors.add(headingSlug(heading[1]));
    }
    return [section.slug, anchors];
  }),
);

const allWork = (): Array<{ seam: OpenSeam; work: AppliedWork }> =>
  openSeams.flatMap((seam) => seam.work.map((work) => ({ seam, work })));

describe("open seams register", () => {
  it("has entries", () => {
    expect(openSeams.length).toBeGreaterThan(0);
  });

  it("declares a claim level the book's reader contract recognises", () => {
    for (const seam of openSeams) {
      expect(contractLevels, seam.id).toContain(seam.claimLevel);
    }
  });

  it("resolves every seam to a section in the released edition", () => {
    const slugs = new Set(manifest.sections.map((section) => section.slug));
    for (const seam of openSeams) {
      expect(slugs, seam.id).toContain(seam.source.sectionSlug);
    }
  });

  it("resolves every seam to a heading the reader actually renders", () => {
    for (const seam of openSeams) {
      const anchors = anchorsBySection.get(seam.source.sectionSlug);
      expect(anchors, seam.id).toBeDefined();
      expect(Array.from(anchors ?? []), seam.id).toContain(seam.source.heading);
    }
  });

  it("builds a href that matches its own section and heading", () => {
    for (const seam of openSeams) {
      expect(seam.source.href, seam.id).toBe(
        `/book/digital-organism-theory/${seam.source.sectionSlug}#${seam.source.heading}`,
      );
    }
  });

  it("says what would settle each seam", () => {
    for (const seam of openSeams) {
      expect(seam.notEstablished.length, seam.id).toBeGreaterThan(40);
      expect(seam.wouldSettleIt.length, seam.id).toBeGreaterThan(40);
    }
  });

  it("uses stable unique ids", () => {
    const ids = openSeams.map((seam) => seam.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("recorded work", () => {
  // Empty today. These run over whatever exists, so the guarantee is already in
  // place for the first real study rather than being written after it lands.
  it("declares a contract claim level and an outcome", () => {
    for (const { seam, work } of allWork()) {
      const where = `${seam.id}/${work.id}`;
      expect(contractLevels, where).toContain(work.claimLevel);
      expect(work.outcome, where).toBeTruthy();
      expect(work.steward.trim(), where).not.toBe("");
    }
  });

  it("uses ids unique within the whole register", () => {
    const ids = allWork().map(({ work }) => work.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("negative results stay first-class", () => {
  const withOutcomes = (outcomes: AppliedWork["outcome"][]): OpenSeam => ({
    ...openSeams[0],
    work: outcomes.map((outcome, index) => ({
      id: `probe-${index}`,
      kind: "study",
      title: `Probe ${index}`,
      claimLevel: "Observation",
      outcome,
      summary: "probe",
      steward: "probe",
      recordedAt: "2026-01-01",
    })),
  });

  it("returns work in the order it was recorded, dropping nothing", () => {
    const seam = withOutcomes([
      "not-supported",
      "supported",
      "inconclusive",
      "mixed",
    ]);
    expect(seamWork(seam).map((work) => work.outcome)).toEqual([
      "not-supported",
      "supported",
      "inconclusive",
      "mixed",
    ]);
  });

  it("does not privilege a supporting result over a refuting one", () => {
    const refuting = withOutcomes(["not-supported"]);
    expect(seamWork(refuting)).toHaveLength(1);
    expect(seamWork(refuting)[0].outcome).toBe("not-supported");
  });
});

describe("no contributor ranking (ADR-0017, extending ADR-0004 L5)", () => {
  it("keeps ranking mechanics out of the register", () => {
    // Comments are stripped first, following the precedent in
    // manifesto-laws.test.ts: the gate matches code, so a comment that names a
    // forbidden mechanism *in order to reject it* is not itself a violation.
    const code = readFileSync("src/content/applied/openSeams.ts", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    for (const banned of [
      /\bleaderboard\b/i,
      /\breputation\b/i,
      /\b(?:contributor|steward)(?:Score|Rank|Rating|Points)\b/i,
      /\btop(?:Contributors|Stewards)\b/i,
      /\bbadges?\b/i,
      /\brank(?:ing)?\s*[:=]/i,
    ]) {
      expect(code, String(banned)).not.toMatch(banned);
    }
  });
});
