import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { doctrineNodes } from "./doctrine/doctrineData";
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
  it("keeps delivery, canon ingestion, and the API image on edition v4", () => {
    for (const input of [
      "src/content/publications/dotBookOne.ts",
      "../backend/orchestrator/scripts/ingest_canon.py",
      "../backend/orchestrator/Dockerfile",
      "scripts/materialize-public-routes.mjs",
    ]) {
      const source = readFileSync(input, "utf8");
      // Literal paths, template literals (`${slug}/v4`), and path segments ("v4").
      expect(source, input).toMatch(/digital-organism-theory\/v4|\/v4`|"v4"/);
      expect(source, input).not.toMatch(/digital-organism-theory\/v[123]\b|\/v[123]`|"v[123]"/);
    }
  });

  it("keeps first-party theory descriptions subordinate to Book One", () => {
    const dotProject = siteConfig.projects.find((project) => project.slug === "dot");
    expect(dotProject?.description).toContain("Book One");

    const publicTheoryCopy = JSON.stringify({
      site: siteConfig,
      concepts: doctrineNodes,
      pageMetadata: readFileSync("index.html", "utf8"),
    }).toLowerCase();

    for (const claim of earlierDraftClaims) {
      expect(publicTheoryCopy).not.toContain(claim);
    }
  });
});
