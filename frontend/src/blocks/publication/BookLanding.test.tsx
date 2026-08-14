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

  it("states the proposal before offering finite ways into the book", () => {
    render(
      <MemoryRouter>
        <BookLanding manifest={manifest} />
      </MemoryRouter>,
    );

    // The Codex: automaton is central, title overlaid, thesis stated.
    expect(screen.getByText(/What you do meets consequence/)).toBeInTheDocument();
    expect(
      screen.getByText(/A construction, not a revelation/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Begin reading/ }))
      .toHaveAttribute("href", "/book/digital-organism-theory/preface");
    expect(
      screen.getByRole("link", { name: /Entrances/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /PDF/ })).toBeInTheDocument();
    expect(screen.getByText("A life is shaped, acts, and is shaped again.")).toBeInTheDocument();
    expect(screen.getByText("Not every claim carries the same weight.")).toBeInTheDocument();
    expect(
      screen.getByText("Read the argument or explore its structure."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read Book One/ })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface",
    );
    expect(screen.getByRole("link", { name: /Concept Map/ })).toHaveAttribute(
      "href",
      "/doctrine",
    );
    expect(screen.getByText("Contents")).toBeInTheDocument();
    expect(screen.queryByText("A reader's method")).not.toBeInTheDocument();
    expect(screen.queryByText("An atlas of the argument")).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a chapter to see the concepts/)).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /Continue Book One/ })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/the-canvas?path=start-where-you-live",
    );
    expect(
      screen.getByText(
        "Begin with lived experience, section 2 of 8: The Canvas.",
      ),
    ).toBeInTheDocument();
  });
});
