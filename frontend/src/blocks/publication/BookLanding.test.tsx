import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

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
  it("states the proposal before offering finite ways into the book", () => {
    render(
      <MemoryRouter>
        <BookLanding manifest={manifest} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/DOT models consciousness as a living process/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read the preface/ })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface",
    );
    expect(screen.getByText("Four levels of certainty. Kept separate.")).toBeInTheDocument();
    expect(screen.getByText("Start with your life, or start with the architecture.")).toBeInTheDocument();
    expect(screen.getByText("Contents")).toBeInTheDocument();
    expect(screen.queryByText("A reader's method")).not.toBeInTheDocument();
    expect(screen.queryByText("An atlas of the argument")).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a chapter to see the concepts/)).not.toBeInTheDocument();
  });
});
