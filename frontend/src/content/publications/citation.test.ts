import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { citationUrl, formatBibTeX, formatReference } from "./citation";
import type { DotBookOneManifest } from "./dotBookOne";

const manifest = JSON.parse(
  readFileSync(
    join(
      process.cwd(),
      "public/publications/henok/digital-organism-theory/v2/manifest.json",
    ),
    "utf8",
  ),
) as DotBookOneManifest;

const canvas = manifest.sections.find((section) => section.slug === "the-canvas")!;
const accessed = new Date("2026-08-13T00:00:00Z");

describe("citing Book One", () => {
  it("cites the whole edition by author, year, edition, and URL", () => {
    expect(formatReference(manifest, null)).toBe(
      "Ghebrechristos, H. (2026). Consciousness: A Digital Organism (Digital edition, version 2). Digital Organism Theory. https://dotheory.org/book/digital-organism-theory",
    );
  });

  it("cites a chapter inside the edition it was read in", () => {
    expect(formatReference(manifest, canvas)).toBe(
      `Ghebrechristos, H. (2026). ${canvas.title}. In Consciousness: A Digital Organism (Digital edition, version 2). Digital Organism Theory. https://dotheory.org/book/digital-organism-theory/the-canvas`,
    );
  });

  it("pins the version, so a later release cannot silently replace what was quoted", () => {
    const reference = formatReference(manifest, canvas);
    expect(reference).toContain(`version ${manifest.release.version}`);
    expect(citationUrl(canvas)).toContain(canvas.slug);
  });

  it("offers BibTeX for the chapter with a stable key and retrieval date", () => {
    const bibtex = formatBibTeX(manifest, canvas, accessed);
    expect(bibtex.startsWith("@inbook{ghebrechristos2026thecanvas,")).toBe(true);
    expect(bibtex).toContain("author    = {Ghebrechristos, Henok},");
    expect(bibtex).toContain("booktitle = {Consciousness: A Digital Organism},");
    expect(bibtex).toContain("edition   = {Digital edition, version 2},");
    expect(bibtex).toContain("urldate   = {2026-08-13},");
  });

  it("uses a book entry when no chapter is being cited", () => {
    const bibtex = formatBibTeX(manifest, null, accessed);
    expect(bibtex.startsWith("@book{ghebrechristos2026dot,")).toBe(true);
    expect(bibtex).not.toContain("booktitle");
  });

  it("handles an author with a single name", () => {
    const mononym = {
      ...manifest,
      project: { ...manifest.project, author: "Henok" },
    };
    expect(formatReference(mononym, null)).toContain("Henok (2026).");
    expect(formatBibTeX(mononym, null, accessed)).toContain("author  = {Henok},");
  });
});
