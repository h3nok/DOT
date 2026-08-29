import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  doctrineNodes,
  type DoctrineNode,
} from "./doctrineData";

const releaseRoot = join(
  process.cwd(),
  "public/publications/henok/digital-organism-theory/v3",
);

const manifest = JSON.parse(
  readFileSync(join(releaseRoot, "manifest.json"), "utf8"),
) as {
  release: { version: number };
  sections: Array<{ slug: string; content_path: string }>;
};

function headingId(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function headingsFor(node: DoctrineNode): string[] {
  const section = manifest.sections.find(
    (candidate) => candidate.slug === node.source.sectionSlug,
  );
  expect(section, node.id + " must name a released section").toBeDefined();
  const markdown = readFileSync(
    join(releaseRoot, section?.content_path ?? ""),
    "utf8",
  );
  return Array.from(markdown.matchAll(/^#{1,6}\s+(.+)$/gm), (match) =>
    headingId(match[1]),
  );
}

describe("Book One concept map", () => {
  it("derives every node from a resolvable passage in edition v3", () => {
    expect(manifest.release.version).toBe(3);

    for (const node of doctrineNodes) {
      expect(node.version).toBe(3);
      expect(node.status).toBe("released");
      expect(headingsFor(node)).toContain(node.source.heading);
      expect(node.source.href).toBe(
        "/book/digital-organism-theory/" +
          node.source.sectionSlug +
          "#" +
          node.source.heading,
      );
    }
  });

  it("contains no dangling concept relations", () => {
    const ids = new Set(doctrineNodes.map((node) => node.id));
    for (const node of doctrineNodes) {
      for (const relation of node.related) {
        expect(ids.has(relation.to), node.id + " -> " + relation.to).toBe(true);
      }
    }
  });

  it("does not retain the independent Big Theory draft foundations", () => {
    const ids = new Set(doctrineNodes.map((node) => node.id));
    const earlierDraftIds = [
      "substrate",
      "stabilization",
      "self",
      "coherence",
      "fragmentation",
      "stance",
      "love-as-coherence",
      "emergence-assumed",
      "what-we-do-not-claim",
    ];
    for (const id of earlierDraftIds) expect(ids.has(id)).toBe(false);

    const releasedCopy = doctrineNodes
      .flatMap((node) => [node.title, node.oneLine, node.body])
      .join("\n")
      .toLowerCase();
    for (const claim of [
      "substrate of pure possibility",
      "first pattern that stabilized itself",
      "love is maximal coherence",
      "field of restless possibility",
    ]) {
      expect(releasedCopy).not.toContain(claim);
    }
  });
});
