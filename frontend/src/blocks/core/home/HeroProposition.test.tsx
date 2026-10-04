import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HeroProposition } from "./HeroProposition";

describe("HeroProposition", () => {
  const renderProposition = () =>
    render(
      <MemoryRouter>
        <HeroProposition reducedMotion />
      </MemoryRouter>,
    );

  it("keeps the human question still while concepts have their own controls", () => {
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
    expect(screen.getByText(/You inherit ways of seeing before you learn to examine them/)).toBeVisible();
    expect(document.querySelector(".home-hero-dossier")).toBeNull();
  });

  it("introduces practical inquiry without presenting the architecture as established", () => {
    renderProposition();

    expect(screen.getByText(/offers a practical framework for exploring/)).toBeVisible();
    expect(screen.getByText(/conditioning, choice, and consequence shape your life\./)).toBeVisible();
    expect(screen.queryByText(/greater awareness can support/)).not.toBeInTheDocument();
    const concepts = screen.getByRole("region", { name: "Key concepts from Book One" });
    expect(within(concepts).getByRole("heading", { name: "The Digital Organism" })).toBeVisible();
    expect(within(concepts).getByRole("group", { name: "1 of 10" }))
      .toHaveAttribute("data-epistemic-status", "model");
    expect(screen.queryByText("Held as hypothesis · Open to challenge")).not.toBeInTheDocument();
  });

  it("offers one primary reading action and a quiet path to the explanation", () => {
    renderProposition();

    expect(screen.getByRole("link", { name: "Begin with lived experience" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface?path=start-where-you-live",
    );
    expect(screen.getByRole("link", { name: /explore the model/i })).toHaveAttribute(
      "href",
      "#possibility-field",
    );
    expect(within(screen.getByRole("navigation", { name: "Begin exploring DOT" })).getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Begin with lived experience" }))
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
    const explanation = screen.getByText(/offers a practical framework/i);
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
