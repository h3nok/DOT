import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { stayBrand } from "./brand/stay";
import { doctrineNodes } from "./doctrine/doctrineData";
import { caseStudiesData } from "./projects/caseStudiesData";
import { siteConfig } from "./site.config";

const earlierDraftClaims = [
  "digital organisms theory",
  "primordial, incomprehensible substrate",
  "emergent self-aware entities",
  "continuous-space biological engine",
  "greater c",
  "collective consciousness",
  "substrate of pure possibility",
  "first pattern that stabilized itself",
  "love is maximal coherence",
];

describe("Book One authority", () => {
  it("keeps both delivery and canon ingestion on edition v2", () => {
    const liveReleaseInputs = [
      readFileSync("src/content/publications/dotBookOne.ts", "utf8"),
      readFileSync("../backend/orchestrator/scripts/ingest_canon.py", "utf8"),
    ].join("\n");

    expect(liveReleaseInputs).toContain("digital-organism-theory/v2");
    expect(liveReleaseInputs).not.toContain("digital-organism-theory/v1");
  });

  it("keeps first-party theory descriptions subordinate to Book One", () => {
    const dotProject = siteConfig.projects.find((project) => project.slug === "dot");
    expect(dotProject?.description).toContain("Book One");
    expect(stayBrand.firstUseCase).toContain("Book One reader");
    expect(caseStudiesData.dot.fullContent).toContain(
      "Observation, Model, Hypothesis, and Speculation",
    );

    const publicTheoryCopy = JSON.stringify({
      site: siteConfig,
      brand: stayBrand,
      project: caseStudiesData.dot,
      concepts: doctrineNodes,
      pageMetadata: readFileSync("index.html", "utf8"),
    }).toLowerCase();

    for (const claim of earlierDraftClaims) {
      expect(publicTheoryCopy).not.toContain(claim);
    }
  });
});
