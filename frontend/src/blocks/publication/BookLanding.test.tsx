import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { saveReadingPathProgress } from "../../attention-os/reader/readingPathProgress";
import type { DotBookOneManifest } from "../../content/publications/dotBookOne";
import BookLanding from "./BookLanding";

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
    label: "Digital Edition",
    published_at: "2026-08-12T00:00:00Z",
    updated_at: "2026-08-12T00:00:00Z",
  },
  extent: { chapters: 1, words: 1200, equations: 0, references: 2 },
  reader_contract: {
    finite: true,
    autoplay: false,
    claim_levels: ["Observation", "Model", "Hypothesis", "Speculation"],
  },
  sections: [
    {
      id: "preface",
      order: 0,
      slug: "preface",
      kind: "preface",
      number: null,
      title: "The Observer Belongs in the Inquiry",
      subtitle: "The observer belongs in the inquiry.",
      part: "The Proposed Architecture",
      content_path: "sections/preface.md",
      word_count: 1200,
      reading_time_minutes: 6,
      related_concepts: [],
    },
  ],
};

describe("BookLanding", () => {
  beforeEach(() => window.localStorage.clear());

  it("presents one clear threshold before the finite book index", () => {
    render(
      <MemoryRouter>
        <BookLanding manifest={manifest} />
      </MemoryRouter>,
    );

    // The cover and proposition share one composition; the reader gets one
    // primary way into the complete edition rather than a second CTA section.
    expect(
      screen.getByText(/A construction, not a revelation/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Begin with the Preface/ }))
      .toHaveAttribute("href", "/book/digital-organism-theory/preface");
    expect(screen.getByRole("link", { name: /PDF/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Consciousness, treated as architecture.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("A life is shaped, acts, and is shaped again."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Read the claim at the level it earns.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open the concept map/ })).toHaveAttribute(
      "href",
      "/doctrine",
    );
    expect(screen.getByText("A finite sequence.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Entrances/i })).not.toBeInTheDocument();
  });

  it("continues an existing local reading path", () => {
    saveReadingPathProgress("start-where-you-live", "the-canvas");

    render(
      <MemoryRouter>
        <BookLanding manifest={manifest} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Continue reading/ })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/the-canvas?path=start-where-you-live",
    );
  });
});
