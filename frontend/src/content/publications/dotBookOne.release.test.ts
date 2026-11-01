import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DOT_BOOK_ONE_PDF_URL, type DotBookOneManifest } from "./dotBookOne";

const repository = join(process.cwd(), "..");
const publicBase = "publications/henok/digital-organism-theory/v5";
const releaseRoot = join(process.cwd(), "public", publicBase);
const archive = join(repository, "docs/blueprint/book-one-complete/release-v5");
const manuscriptName = "DOT-Book-One-Complete-Edition-v5";
const manuscriptPath = join(archive, manuscriptName + ".docx");
const protectedPdfPath = join(repository, "backend/orchestrator/private/books/digital-organism-theory-book-one.pdf");
const publicPdfPath = join(releaseRoot, "digital-organism-theory-book-one.pdf");
const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const hash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");
const manifest = readJson(join(releaseRoot, "manifest.json")) as DotBookOneManifest & {
  source: { edit_manifest_sha256: string };
  extent: { figures: number };
  artifacts: { pdf: string; pdf_sha256: string };
  integrity: { files: Record<string, string> };
};
const validation = readJson(join(archive, manuscriptName + "-Validation.json"));
const seal = readJson(join(archive, "Seal.json")) as { files: Record<string, string> };
const markdown = manifest.sections.map(section => readFileSync(join(releaseRoot, section.content_path), "utf8")).join("\n");
const figureIds = ["avatar-canvas", "experience-loop", "architecture", "reality-stream", "little-c-scope", "canvas-painting-character", "connection-and-identification", "fear-and-choice"];

function filesBelow(directory: string, prefix = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relative = prefix + entry.name;
    return entry.isDirectory() ? filesBelow(join(directory, entry.name), relative + "/") : [relative];
  }).sort();
}

function verifyFiles(root: string, files: Record<string, string>) {
  for (const [name, digest] of Object.entries(files)) {
    expect(name.startsWith("/") || name.split("/").includes("..") || name.includes("\\"), name).toBe(false);
    expect(hash(join(root, name)), name).toBe(digest);
  }
}

describe("Book One edition v5", () => {
  it("comes from the exact final-labelled manuscript and frozen editorial review", () => {
    expect(manifest.source.name).toBe(manuscriptName + ".docx");
    expect(manifest.source.sha256).toBe(hash(manuscriptPath));
    expect(validation.docx_sha256).toBe(manifest.source.sha256);
    expect(validation.status).toBe("release-candidate");
    expect(validation.edition).toBe(5);
    expect(validation.edit_manifest_sha256).toBe(hash(join(archive, "editing/v5-edits.json")));
    expect(manifest.source.edit_manifest_sha256).toBe(validation.edit_manifest_sha256);
    expect(validation.redline_sha256).toBe(hash(join(archive, manuscriptName + "-Redline.html")));
    expect(readJson(join(archive, "editing/v5-precision-review.json")).paragraphs_reviewed).toBe(2055);
    expect(manifest.release).toMatchObject({ version: 5, status: "published", id: "dot-book-one-v5", label: "Digital edition" });
    expect(manifest.release.published_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(manifest.project.visibility).toBe("public");
  });

  it("freezes every public file and every archived source/artwork file", () => {
    expect(filesBelow(releaseRoot).filter(name => name !== "manifest.json"))
      .toEqual(Object.keys(manifest.integrity.files).sort());
    verifyFiles(releaseRoot, manifest.integrity.files);
    expect(filesBelow(archive).filter(name => name !== "Seal.json")).toEqual(Object.keys(seal.files).sort());
    verifyFiles(archive, seal.files);
    verifyFiles(join(archive, "assets"), validation.assets_sha256);
    expect(readJson(join(archive, "Web-Manifest.json"))).toEqual(manifest);
  });

  it("preserves the complete apparatus and uses the book's own claim levels", () => {
    expect(manifest.project.subtitle).toBe("Foundations, Agency, and Research");
    expect(manifest.extent).toMatchObject({ equations: 24, references: 51, depth_passages: 26, figures: 8 });
    expect(validation.native_equations).toBe(101);
    expect(validation.references_preserved).toBe(51);
    expect(manifest.reader_contract.claim_levels).toEqual(["Observation", "External Model", "DOT Derivation", "Speculative Extension"]);
    expect(manifest.reader_contract.depth).toBe("folded-on-request");
    expect(manifest.extent.core_words).toBeLessThan(manifest.extent.words);
    expect(markdown.match(/^::: depth .+$/gm)).toHaveLength(26);
    expect(markdown.match(/^:::$/gm)).toHaveLength(26);
  });

  it("keeps every numbered illustration, phone composition, caption, and cover", () => {
    expect(manifest.figures?.map(figure => figure.id)).toEqual(figureIds);
    expect(manifest.figures?.map(figure => figure.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(markdown.match(/^!\[/gm)).toHaveLength(8);
    for (const figure of manifest.figures ?? []) {
      expect(markdown.split(`](/${publicBase}/${figure.src})`)).toHaveLength(2);
      expect(figure.caption.length).toBeGreaterThan(30);
      expect(figure.alt.length).toBeGreaterThan(30);
      expect(figure.width).toBeGreaterThan(0);
      expect(figure.height).toBeGreaterThan(0);
      expect(figure.mobileSrc).toBeTruthy();
      expect(existsSync(join(releaseRoot, figure.mobileSrc!))).toBe(true);
      expect(figure.mobileWidth).toBeGreaterThan(0);
      expect(figure.mobileHeight).toBeGreaterThan(0);
    }
    expect(manifest.cover?.src).toContain("release");
    expect(manifest.cover?.alt).not.toMatch(/author review/i);
    expect(existsSync(join(releaseRoot, manifest.cover!.src))).toBe(true);
    expect(validation.tagged_figures).toBe(9);
  });

  it("publishes one matching PDF and keeps Word and review material private", () => {
    expect(manifest.artifacts.pdf).toBe("digital-organism-theory-book-one.pdf");
    expect(hash(publicPdfPath)).toBe(validation.pdf_sha256);
    expect(hash(protectedPdfPath)).toBe(validation.pdf_sha256);
    expect(hash(join(archive, manuscriptName + ".pdf"))).toBe(validation.pdf_sha256);
    expect(manifest.artifacts.pdf_sha256).toBe(validation.pdf_sha256);
    expect(DOT_BOOK_ONE_PDF_URL).toBe(`/${publicBase}/${manifest.artifacts.pdf}`);
    expect(filesBelow(releaseRoot).some(name => /\.docx$|redline|validation|^\./i.test(name))).toBe(false);
    const downloads = join(process.cwd(), "public/books");
    expect(existsSync(downloads) ? readdirSync(downloads).filter(name => !name.startsWith(".")) : []).toEqual([]);
    expect(markdown + JSON.stringify(manifest)).not.toMatch(/\/_preview\/book-v5|\/_book-v5|author review|unpublished edition/i);
  });

  it("aligns the active reader, static pages and deployed canon on v5", () => {
    expect(readFileSync(join(repository, "backend/orchestrator/Dockerfile"), "utf8"))
      .toContain("ORCHESTRATOR_CANON_ROOT=/canon/digital-organism-theory/v5");
    const ingest = readFileSync(join(repository, "backend/orchestrator/scripts/ingest_canon.py"), "utf8");
    expect(ingest).toContain("frontend/public/publications/henok/digital-organism-theory/v5");
    const materializer = readFileSync(join(process.cwd(), "scripts/materialize-public-routes.mjs"), "utf8");
    expect(materializer).toMatch(/"v5",\s*"manifest.json"/);
    expect(materializer).not.toMatch(/"v4",\s*"manifest.json"/);
  });
});
