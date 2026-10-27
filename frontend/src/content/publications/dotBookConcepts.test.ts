import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { doctrineNodes } from "../doctrine/doctrineData";
import { conceptMapHref } from "./dotBookConcepts";

const manifest = JSON.parse(
  readFileSync(
    join(process.cwd(), "public/publications/henok/digital-organism-theory/v4/manifest.json"),
    "utf8",
  ),
) as { sections: { slug: string; related_concepts: string[] }[] };

describe("conceptMapHref", () => {
  it("links concepts the Concept Map has, including Fear under its map name", () => {
    expect(conceptMapHref("subjective-data")).toBe("/doctrine/subjective-data");
    expect(conceptMapHref("fear")).toBe("/doctrine/fear-gating");
    expect(conceptMapHref("rendering-latency")).toBe("/doctrine/decoupling-principle");
  });

  it("does not link concepts the map has no page for", () => {
    for (const concept of ["culture", "continuity", "agency", "body-interface", "terms", "sources"]) {
      expect(conceptMapHref(concept)).toBeNull();
    }
  });

  it("sends every related concept in the released book to an existing map page", () => {
    const pages = new Set(doctrineNodes.map((node) => `/doctrine/${node.id}`));
    const hrefs = manifest.sections.flatMap((section) =>
      section.related_concepts.map(conceptMapHref).filter((href): href is string => href !== null),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) expect(pages).toContain(href);
  });
});
