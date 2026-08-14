import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type {
  BookReleaseSection,
  DotBookOneManifest,
} from "../../content/publications/dotBookOne";
import BookCitation from "./BookCitation";

const section: BookReleaseSection = {
  id: "the-canvas",
  order: 5,
  slug: "the-canvas",
  kind: "chapter",
  number: 5,
  title: "The Canvas",
  subtitle: null,
  part: "The Proposed Architecture",
  content_path: "sections/the-canvas.md",
  word_count: 3200,
  reading_time_minutes: 14,
  related_concepts: ["canvas"],
};

const manifest: DotBookOneManifest = {
  schema_version: "publication.release.v2",
  generated_at: "2026-08-12T00:00:00Z",
  source: { format: "docx", sha256: "test" },
  project: {
    id: "dot-book-one",
    owner_id: "henok",
    type: "book",
    series_title: "Digital Organism Theory",
    title: "Consciousness: A Digital Organism",
    subtitle: "Book One",
    author: "Henok Ghebrechristos",
    slug: "digital-organism-theory",
    visibility: "public",
  },
  release: {
    id: "v2",
    version: 2,
    status: "published",
    label: "Digital edition",
    published_at: "2026-08-12",
    updated_at: "2026-08-12",
  },
  extent: { chapters: 6, words: 22719, equations: 14, references: 25 },
  reader_contract: {
    finite: true,
    autoplay: false,
    claim_levels: ["Observation", "Model", "Hypothesis", "Speculation"],
  },
  sections: [section],
};

describe("BookCitation", () => {
  it("names the chapter, the version it was read in, and its URL", () => {
    render(<BookCitation manifest={manifest} section={section} />);

    const citation = screen.getAllByText(/Ghebrechristos, H\. \(2026\)/)[0];
    expect(citation.textContent).toContain("The Canvas");
    expect(citation.textContent).toContain("version 2");
    expect(citation.textContent).toContain(
      "https://dotheory.org/book/digital-organism-theory/the-canvas",
    );
  });

  it("offers BibTeX for the same chapter", () => {
    render(<BookCitation manifest={manifest} section={section} />);

    fireEvent.click(screen.getByRole("button", { name: "BibTeX" }));

    expect(screen.getByText(/@inbook\{ghebrechristos2026thecanvas/)).toBeInTheDocument();
  });

  it("copies the citation a reader asked for", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<BookCitation manifest={manifest} section={null} />);

    fireEvent.click(screen.getByRole("button", { name: /Copy reference/ }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("Consciousness: A Digital Organism (Digital edition, version 2)"),
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
