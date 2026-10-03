import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const releaseRoot = join(
  process.cwd(),
  "public/publications/henok/digital-organism-theory/v4",
);
const manuscriptPath = join(
  process.cwd(),
  "../docs/blueprint/book-one-complete/release-v4/DOT-Book-One-Complete-Edition-v4.docx",
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
const publicPdfPath = join(releaseRoot, "digital-organism-theory-book-one.pdf");
const manifest = JSON.parse(
  readFileSync(join(releaseRoot, "manifest.json"), "utf8"),
) as {
  source: { name: string; sha256: string };
  project: { subtitle: string };
  release: { version: number; label: string };
  extent: { equations: number; references: number; core_words: number; words: number; depth_passages: number };
  reader_contract: { depth?: string };
  sections: Array<{ content_path: string }>;
};

describe("Book One edition v4", () => {
  it("is generated from the canonical digital-edition manuscript", () => {
    const digest = createHash("sha256")
      .update(readFileSync(manuscriptPath))
      .digest("hex");

    expect(manifest.source.sha256).toBe(digest);
    expect(manifest.source.name).toBe("DOT-Book-One-Complete-Edition-v4.docx");
    expect(manifest.release.version).toBe(4);
    expect(manifest.release.label).toBe("Digital edition");
  });

  it("carries the current title language and complete apparatus", () => {
    expect(manifest.project.subtitle).toBe("Foundations, Agency, and Research");
    expect(manifest.extent.equations).toBe(24);
    expect(manifest.extent.references).toBe(51);
    expect(
      manifest.sections.every((section) =>
        existsSync(join(releaseRoot, section.content_path)),
      ),
    ).toBe(true);
  });

  it("folds depth passages in the digital reader without dropping their text (ADR-0036)", () => {
    expect(manifest.reader_contract.depth).toBe("folded-on-request");
    expect(manifest.extent.depth_passages).toBe(26);
    expect(manifest.extent.core_words).toBeLessThan(manifest.extent.words);
    const markdown = manifest.sections
      .map((section) => readFileSync(join(releaseRoot, section.content_path), "utf8"))
      .join("\n");
    expect(markdown.match(/^::: depth .+$/gm)).toHaveLength(26);
    expect(markdown.match(/^:::$/gm)).toHaveLength(26);
  });

  it("publishes identical free and backend PDFs while keeping the DOCX private", () => {
    const sourceDigest = createHash("sha256")
      .update(readFileSync(manuscriptPath))
      .digest("hex");
    const pdf = readFileSync(protectedPdfPath);

    expect(existsSync(retiredPublicWordPath)).toBe(false);
    expect(existsSync(retiredPublicPdfPath)).toBe(false);
    const publicFiles = existsSync(downloadsRoot)
      ? readdirSync(downloadsRoot).filter((f) => !f.startsWith("."))
      : [];
    expect(publicFiles).toEqual([]);
    expect(sourceDigest).toBe(manifest.source.sha256);
    expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdf.byteLength).toBeGreaterThan(100_000);
    // Digest comparison: a deep-equal over a 1.6 MB Buffer takes seconds.
    const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
    expect(digest(readFileSync(publicPdfPath))).toBe(digest(pdf));
    expect(readdirSync(releaseRoot).some((file) => file.endsWith(".docx"))).toBe(false);
  });
});
