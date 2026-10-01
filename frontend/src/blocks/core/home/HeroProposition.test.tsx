import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HeroProposition } from "./HeroProposition";

describe("HeroProposition", () => {
  const renderProposition = () =>
    render(
      <MemoryRouter>
        <HeroProposition />
      </MemoryRouter>,
    );

  it("offers a human question without self-advancing copy", () => {
    renderProposition();

    expect(
      screen.getByRole("heading", {
        name: "What shapes the life you live?",
      }),
    ).toBeVisible();
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
    expect(document.querySelector(".home-hero-statement")).toBeNull();
  });

  it("introduces the idea before asking readers to learn the model's terms", () => {
    renderProposition();

    const heading = screen.getByRole("heading", {
      name: "What shapes the life you live?",
    });
    expect(heading.querySelector("em")).toBeNull();
    expect(screen.getByText("Digital Organism Theory")).toBeVisible();
    expect(screen.getByText(/Consciousness is the experience of being you/)).toBeVisible();
    expect(document.querySelector(".home-hero-dossier")).toBeNull();
  });

  it("explains the paradigm without claiming purpose is already understood", () => {
    renderProposition();

    expect(screen.getByText(/DOT proposes that it precedes the physical universe we inhabit/)).toBeVisible();
    expect(screen.getByText(/environment for conscious learning and development/)).toBeVisible();
    expect(screen.getByText("Held as hypothesis · Open to challenge")).toBeVisible();
  });

  it("offers one primary reading action and a quiet path to the explanation", () => {
    renderProposition();

    expect(screen.getByRole("link", { name: /read book one/i })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface",
    );
    expect(screen.getByRole("link", { name: /explore the model/i })).toHaveAttribute(
      "href",
      "#possibility-field",
    );
    expect(within(screen.getByRole("navigation", { name: "Begin exploring DOT" })).getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Read Book One" }))
      .toHaveAccessibleDescription("Begin with the preface · Free to read");
  });

  it("puts the question and reading invitation before the diagram", () => {
    render(
      <MemoryRouter>
        <HeroProposition stage={<figure aria-label="Proposed architecture" />} />
      </MemoryRouter>,
    );

    const diagram = screen.getByRole("figure", { name: "Proposed architecture" });
    const heading = screen.getByRole("heading", { name: "What shapes the life you live?" });
    const reading = screen.getByRole("navigation", { name: "Begin exploring DOT" });
    const explanation = screen.getByText(/DOT proposes that it/i);
    expect(heading.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(heading.compareDocumentPosition(reading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(reading.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the question tools behind a reader-controlled disclosure", () => {
    render(
      <MemoryRouter>
        <HeroProposition inquiry={<input aria-label="Question about Book One" />} />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText("Question about Book One");
    const disclosure = input.closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByText("Have a question about Book One?")).toBeVisible();
  });
});
