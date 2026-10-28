import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { HeroArchitecture } from "./HeroArchitecture";
import { HeroProposition } from "./HeroProposition";

describe("the hero architecture opens the section that explains each part", () => {
  const renderLinked = () => render(
    <MemoryRouter>
      <HeroProposition stage={<HeroArchitecture />} />
    </MemoryRouter>,
  );

  it("scrolls to the matching homepage section when a part is chosen", () => {
    renderLinked();
    const sections = ["possibility-field", "big-c", "reality-frame", "little-c"].map((id) => {
      const section = document.createElement("section");
      section.id = id;
      section.scrollIntoView = vi.fn();
      document.body.append(section);
      return section;
    });
    const [origin, bigC, frame, little] = sections;
    fireEvent.click(document.querySelector('[data-part="te"] .home-architecture-origin-boundary')!);
    expect(origin.scrollIntoView).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('[data-part="rfn"] .home-architecture-other-frame-zone')!);
    fireEvent.click(document.querySelector('[data-part="rf0"] .home-architecture-frame-zone')!);
    expect(frame.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(bigC.scrollIntoView).not.toHaveBeenCalled();
    expect(little.scrollIntoView).not.toHaveBeenCalled();
    sections.forEach((section) => section.remove());
  });

  it("keeps the explanation of the concepts out of the hero", () => {
    renderLinked();
    expect(screen.queryByRole("region", { name: "Key concepts and questions" })).not.toBeInTheDocument();
    expect(screen.queryByText(/In DOT, you are the conscious process/)).not.toBeInTheDocument();
    const more = screen.getByRole("navigation", { name: "More ways to explore" });
    expect(within(more).getByRole("link", { name: "Explore the architecture" }))
      .toHaveAttribute("href", "#possibility-field");
    expect(within(more).getByRole("link", { name: "Watch the concepts" }))
      .toHaveAttribute("href", "#visual-inquiry");
  });
});

describe("HeroProposition", () => {
  const renderProposition = () =>
    render(
      <MemoryRouter>
        <HeroProposition />
      </MemoryRouter>,
    );

  it("keeps the opening question still", () => {
    renderProposition();

    expect(
      screen.getByRole("heading", {
        name: "Trust your experience.",
      }),
    ).toBeVisible();
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
    expect(document.querySelector(".home-hero-statement")).toBeNull();
  });

  it("keeps the opening concise with one reading path into the book", () => {
    renderProposition();

    const heading = screen.getByRole("heading", {
      name: "Trust your experience.",
    });
    expect(heading.querySelector("em")).toBeNull();
    expect(screen.getByText("Digital Organism Theory")).toBeVisible();
    expect(document.querySelector(".home-hero-opening-copy")).toBeNull();
    expect(document.querySelector(".home-hero-subtitle")).toHaveTextContent(
      "Understand what shapes you. Transcend your culture.",
    );
    expect(document.querySelector(".home-author-line")).toBeNull();
    // The opening is an invitation to examine beliefs, not an attributed quotation.
    expect(screen.queryByRole("link", { name: /preface/i })).not.toBeInTheDocument();
    expect(document.querySelector(".home-hero-masthead blockquote")).toBeNull();
    expect(document.querySelector(".home-hero-lede")).toBeNull();
    expect(document.querySelector(".home-hero-dossier")).toBeNull();
  });

  it("offers one reading action and nothing beside it", () => {
    renderProposition();

    expect(screen.getByRole("link", { name: "Read Book One" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface?path=start-where-you-live",
    );
    expect(within(screen.getByRole("navigation", { name: "Begin exploring DOT" })).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Read Book One" }))
      .not.toHaveAccessibleDescription();
    expect(screen.queryByText("Book One’s preface · Free to read")).not.toBeInTheDocument();
  });

  it("keeps reading immediate, then presents the architecture", () => {
    render(
      <MemoryRouter>
        <HeroProposition stage={<figure aria-label="Proposed architecture" />} />
      </MemoryRouter>,
    );

    const diagram = screen.getByRole("figure", { name: "Proposed architecture" });
    const heading = screen.getByRole("heading", { name: "Trust your experience." });
    const reading = screen.getByRole("navigation", { name: "Begin exploring DOT" });
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
