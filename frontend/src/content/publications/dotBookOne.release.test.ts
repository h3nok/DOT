import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const releaseRoot = join(
  process.cwd(),
  "public/publications/henok/digital-organism-theory/v2",
);
const manuscriptPath = join(
  process.cwd(),
  "../docs/blueprint/DOT-Book-One-Digital-Edition-v2.docx",
);
const downloadsRoot = join(process.cwd(), "public/books");
const protectedBooksRoot = join(process.cwd(), "../backend/orchestrator/private/books");
const retiredPublicWordPath = join(
  downloadsRoot,
  "consciousness-a-digital-organism-book-one-v2.docx",
);
const retiredPublicPdfPath = join(
  downloadsRoot,
  "consciousness-a-digital-organism-book-one-v2.pdf",
);
const protectedPdfPath = join(protectedBooksRoot, "digital-organism-theory-book-one.pdf");
const manifest = JSON.parse(
  readFileSync(join(releaseRoot, "manifest.json"), "utf8"),
) as {
  source: { name: string; sha256: string };
  project: { subtitle: string };
  release: { version: number; label: string };
  extent: { equations: number; references: number };
  sections: Array<{ content_path: string }>;
};

describe("Book One edition v2", () => {
  it("is generated from the canonical digital-edition manuscript", () => {
    const digest = createHash("sha256")
      .update(readFileSync(manuscriptPath))
      .digest("hex");

    expect(manifest.source.sha256).toBe(digest);
    expect(manifest.source.name).toBe(
      "DOT-Book-One-Digital-Edition-v2.docx",
    );
    expect(manifest.release.version).toBe(2);
    expect(manifest.release.label).toBe("Digital edition");
  });

  it("carries the current title language and complete apparatus", () => {
    expect(manifest.project.subtitle).toBe(
      "A Framework for Consciousness, Conditioning, and Conscious Authorship",
    );
    expect(manifest.extent.equations).toBe(14);
    expect(manifest.extent.references).toBe(25);
    expect(
      manifest.sections.every((section) =>
        existsSync(join(releaseRoot, section.content_path)),
      ),
    ).toBe(true);
  });

  it("publishes one protected PDF while keeping public downloads and DOCX private", () => {
    const sourceDigest = createHash("sha256")
      .update(readFileSync(manuscriptPath))
      .digest("hex");
    const pdf = readFileSync(protectedPdfPath);

    expect(existsSync(retiredPublicWordPath)).toBe(false);
    expect(existsSync(retiredPublicPdfPath)).toBe(false);
    expect(readdirSync(downloadsRoot)).toEqual([]);
    expect(sourceDigest).toBe(manifest.source.sha256);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(100_000);
  });
});
