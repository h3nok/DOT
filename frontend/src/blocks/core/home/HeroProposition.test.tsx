import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HeroArchitecture } from "./HeroArchitecture";
import { HeroProposition } from "./HeroProposition";

async function openModel() {
  const details = screen.getByText("Explore the model").closest("details")!;
  details.open = true;
  fireEvent(details, new Event("toggle"));
  await screen.findByRole("region", { name: "Key concepts from Book One" });
}

describe("the concept slideshow and the architecture stay one explanation", () => {
  const renderLinked = async () => {
    render(
      <MemoryRouter>
        <HeroProposition reducedMotion stage={<HeroArchitecture />} />
      </MemoryRouter>,
    );
    await openModel();
  };
  const concepts = () => screen.getByRole("region", { name: "Key concepts from Book One" });
  const focus = () => document.querySelector(".home-hero-architecture__svg")?.getAttribute("data-focus");

  it("brings forward the part each architecture concept explains, and only then", async () => {
    await renderLinked();
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

  it("turns to a part's concept when it is chosen in the diagram", async () => {
    await renderLinked();
    fireEvent.click(document.querySelector('[data-part="rfn"] .home-architecture-other-frame-zone')!);
    expect(within(concepts()).getByRole("heading", { name: "RFₙ: Every Reality Frame" })).toBeVisible();
    expect(focus()).toBe("rfn");
    fireEvent.click(document.querySelector('[data-part="rf0"] .home-architecture-frame-zone')!);
    expect(within(concepts()).getByRole("heading", { name: "RF₀: Where Physics Governs" })).toBeVisible();
    expect(focus()).toBe("rf0");
  });

  it("shows Big C's outer loop and c₁'s inner loop only with Process Rules", async () => {
    await renderLinked();
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

  it("keeps the opening question still while concepts have their own controls", () => {
    renderProposition();

    expect(
      screen.getByRole("heading", {
        name: "Progress toward what?",
      }),
    ).toBeVisible();
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
    expect(document.querySelector(".home-hero-statement")).toBeNull();
  });

  it("opens with critical inquiry and keeps one reading path into the book", () => {
    renderProposition();

    const heading = screen.getByRole("heading", {
      name: "Progress toward what?",
    });
    expect(heading.querySelector("em")).toBeNull();
    expect(screen.getByText("Digital Organism Theory")).toBeVisible();
    expect(screen.getByText(/No worldview gets an exemption—including DOT/)).toBeVisible();
    expect(screen.getByRole("link", { name: "The humanist promise" })).toHaveAttribute("href", "https://americanhumanist.org/humanism/humanist-manifesto-iii/");
    expect(screen.getByText(/Secular humanism promises human flourishing/))
      .toBeVisible();
    // The opening is an invitation to examine beliefs, not an attributed quotation.
    expect(screen.queryByRole("link", { name: /preface/i })).not.toBeInTheDocument();
    expect(document.querySelector(".home-hero-masthead blockquote")).toBeNull();
    expect(document.querySelector(".home-hero-lede")).toBeNull();
    expect(document.querySelector(".home-hero-dossier")).toBeNull();
  });

  it("lets the first concept carry DOT's proposal at its honest claim level", async () => {
    renderProposition();

    expect(screen.queryByRole("region", { name: "Key concepts from Book One" })).not.toBeInTheDocument();
    await openModel();
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

    expect(screen.getByRole("link", { name: "Test the worldview" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface?path=start-where-you-live",
    );
    expect(screen.getByText("Explore the model").closest("details")).not.toHaveAttribute("open");
    expect(within(screen.getByRole("navigation", { name: "Begin exploring DOT" })).getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Test the worldview" }))
      .toHaveAccessibleDescription("Book One’s preface · Free to read");
  });

  it("starts the model only when a reader opens it and removes it when closed", async () => {
    render(
      <MemoryRouter>
        <HeroProposition stage={<figure aria-label="Proposed architecture" />} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("figure", { name: "Proposed architecture" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Key concepts from Book One" })).not.toBeInTheDocument();
    await openModel();
    const diagram = screen.getByRole("figure", { name: "Proposed architecture" });
    const heading = screen.getByRole("heading", { name: "Progress toward what?" });
    const reading = screen.getByRole("navigation", { name: "Begin exploring DOT" });
    const explanation = screen.getByRole("region", { name: "Key concepts from Book One" });
    expect(heading.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(heading.compareDocumentPosition(reading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(reading.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(reading.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const details = diagram.closest("details")!;
    details.open = false;
    fireEvent(details, new Event("toggle"));
    expect(screen.queryByRole("figure", { name: "Proposed architecture" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Key concepts from Book One" })).not.toBeInTheDocument();
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
