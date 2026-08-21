import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookMarkdown } from "./BookMarkdown";
import type { BookConceptDefinition } from "../../content/publications/dotBookOne";

const canvasConcept: BookConceptDefinition = {
  id: "canvas",
  title: "Canvas",
  aliases: ["Canvas"],
  definition: "The capacity to carry consequential change forward.",
  context: "The Canvas carries the effects of experience across moments.",
  boundary: "It is a model, not a physically located object.",
  claimLevel: "Model",
  sourceHref: "/book/digital-organism-theory/the-canvas#canvas-painting-and-character",
  mapHref: "/doctrine/canvas",
};

describe("BookMarkdown", () => {
  it("renders stable heading anchors, equations, and safe external links", () => {
    const { container } = render(
      <BookMarkdown
        content={[
          "## Love Creates Room for Truth",
          "",
          "$$C_{t+1} = U(C_t, E_t)$$",
          "",
          "[Research](https://doi.org/10.1038/s41586-025-08888-1)",
        ].join("\n")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Love Creates Room for Truth" }),
    ).toHaveAttribute("id", "love-creates-room-for-truth");
    expect(
      container.querySelector(".book-section-heading__marker"),
    ).toHaveTextContent("§ 01");
    expect(container.querySelector(".katex")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Research" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(container.querySelector(".book-prose--chapter")).toBeInTheDocument();
  });

  it("marks notes and sources for its denser publication treatment", () => {
    const { container } = render(
      <BookMarkdown content="A source note." variant="references" />,
    );

    expect(container.querySelector(".book-prose--references")).toBeInTheDocument();
    expect(container.querySelector(".book-prose--chapter")).not.toBeInTheDocument();
  });

  it("places a contextual reader element after its matching heading", () => {
    render(
      <BookMarkdown
        content={["## The Experience Loop", "", "The loop begins here."].join("\n")}
        afterHeading={{
          "the-experience-loop": <div data-testid="experience-loop">Interactive model</div>,
        }}
      />,
    );

    const heading = screen.getByRole("heading", { name: "The Experience Loop" });
    expect(heading.nextElementSibling).toBe(screen.getByTestId("experience-loop"));
  });

  it("previews a numbered source without navigating away from the passage", () => {
    render(
      <BookMarkdown
        content="A supported claim.[¹](/book/digital-organism-theory/references#reference-1)"
        references={
          new Map([
            [
              1,
              {
                number: 1,
                markdown: "A. Researcher, *A Source*. [Open](https://example.com).",
              },
            ],
          ])
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open reference 1" }));

    expect(screen.getByRole("dialog", { name: "Reference 1" })).toHaveTextContent(
      "A. Researcher",
    );
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("defines a concept at first use without marking every repetition", () => {
    render(
      <BookMarkdown
        content="The Canvas carries. The Canvas updates."
        concepts={[canvasConcept]}
      />,
    );

    const definitionTrigger = screen.getByRole("button", {
      name: "Define Canvas",
    });
    expect(definitionTrigger).toHaveTextContent("Canvas");
    expect(screen.getByText(/The Canvas updates/)).toBeInTheDocument();

    fireEvent.click(definitionTrigger);

    expect(screen.getByRole("dialog", { name: "Canvas" })).toHaveTextContent(
      "The capacity to carry consequential change forward.",
    );
    expect(screen.getByText("Boundary:").parentElement).toHaveTextContent(
      "It is a model, not a physically located object.",
    );
    expect(screen.getByRole("link", { name: "Read the source passage" })).toHaveAttribute(
      "href",
      canvasConcept.sourceHref,
    );
  });

  it("gives authored passage forms semantic hooks without changing their words", () => {
    const { container } = render(
      <BookMarkdown
        content={[
          "> **Epistemic key**",
          ">",
          "> Some are observations.",
          ">",
          "> Some are models.",
        ].join("\n")}
      />,
    );

    const passage = container.querySelector(
      '[data-editorial-form="epistemic-key"]',
    );
    expect(passage).toHaveClass("book-editorial-form");
    expect(passage).toHaveAttribute("aria-label", "Epistemic key");
    expect(passage).toHaveTextContent("Some are observations. Some are models.");
  });

  it("keeps wide tables inside the reading measure", () => {
    const { container } = render(
      <BookMarkdown
        content={[
          "| Claim | Status |",
          "| --- | --- |",
          "| Experience occurs | Observation |",
        ].join("\n")}
      />,
    );

    const table = screen.getByRole("table");
    expect(table.parentElement).toHaveClass("book-table-scroll");
    expect(container.querySelector(".book-table-scroll")).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("renders explicit claim levels through the shared editorial grammar", () => {
    const { container } = render(
      <BookMarkdown content="**Hypothesis:** Consciousness is fundamental." />,
    );

    expect(container.querySelector('[data-claim-level="hypothesis"]')).toHaveTextContent(
      "Consciousness is fundamental.",
    );
  });
});
