import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HeroArchitecture } from "./HeroArchitecture";
import { HeroProposition } from "./HeroProposition";

describe("the concept slideshow and the architecture stay one explanation", () => {
  const renderLinked = () => render(
    <MemoryRouter>
      <HeroProposition reducedMotion stage={<HeroArchitecture />} />
    </MemoryRouter>,
  );
  const concepts = () => screen.getByRole("region", { name: "Key concepts from Book One" });
  const focus = () => document.querySelector(".home-hero-architecture__svg")?.getAttribute("data-focus");

  it("brings forward the part each architecture concept explains, and only then", () => {
    renderLinked();
    expect(focus()).toBeNull();
    const next = within(concepts()).getByRole("button", { name: "Next concept" });
    while (!within(concepts()).queryByRole("heading", { name: "T × E: The Source" })) fireEvent.click(next);
    expect(focus()).toBe("te");
    fireEvent.click(next);
    expect(focus()).toBe("awareness");
    fireEvent.click(next);
    expect(within(concepts()).getByRole("heading", { name: "Big C: Primordial Consciousness" })).toBeVisible();
    expect(focus()).toBe("big-c");
  });

  it("turns to a part's concept when it is chosen in the diagram", () => {
    renderLinked();
    fireEvent.click(document.querySelector('[data-part="rfn"] .home-architecture-other-frame-zone')!);
    expect(within(concepts()).getByRole("heading", { name: "RFₙ: Every Reality Frame" })).toBeVisible();
    expect(focus()).toBe("rfn");
    fireEvent.click(document.querySelector('[data-part="rf0"] .home-architecture-frame-zone')!);
    expect(within(concepts()).getByRole("heading", { name: "RF₀: Where Physics Governs" })).toBeVisible();
    expect(focus()).toBe("rf0");
  });

  it("shows Big C's outer loop and c₁'s inner loop only with Process Rules", () => {
    renderLinked();
    const loops = document.querySelector(".home-architecture-process-loops")!;
    expect(loops.querySelectorAll("path[marker-end]")).toHaveLength(2);
    const next = within(concepts()).getByRole("button", { name: "Next concept" });
    while (!within(concepts()).queryByRole("heading", { name: "Awareness: The Undifferentiated Process" })) fireEvent.click(next);
    expect(focus()).toBe("awareness");
    while (!within(concepts()).queryByRole("heading", { name: "Process Rules" })) fireEvent.click(next);
    expect(focus()).toBe("process");
    expect(within(concepts()).getByRole("group", { name: /of \d+$/ }))
      .toHaveTextContent(/work maintains you, effort develops you, rest lets the loop consolidate/);
  });
});

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
    expect(document.querySelector(".home-hero-lede")).toBeNull();
    expect(document.querySelector(".home-hero-dossier")).toBeNull();
  });

  it("lets the first concept carry DOT's proposal at its honest claim level", () => {
    renderProposition();

    expect(screen.queryByText(/greater awareness can support/)).not.toBeInTheDocument();
    const concepts = screen.getByRole("region", { name: "Key concepts from Book One" });
    expect(within(concepts).getByRole("heading", { name: "The Digital Organism" })).toBeVisible();
    const first = within(concepts).getByRole("group", { name: /^1 of \d+$/ });
    expect(first).toHaveTextContent(/you are not physical/);
    expect(first).toHaveAttribute("data-epistemic-status", "hypothesis");
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
      .toHaveAccessibleDescription("The preface · Free to read");
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
    const explanation = screen.getByRole("region", { name: "Key concepts from Book One" });
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
