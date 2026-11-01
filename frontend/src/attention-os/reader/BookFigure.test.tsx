import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookMarkdown } from "./BookMarkdown";
import type { BookFigureData } from "./BookFigure";

const figure: BookFigureData = {
  id: "avatar-canvas",
  number: 1,
  title: "A body and a continuing history",
  alt: "A living body exchanges signals with the Canvas.",
  caption: "The arrows describe the proposed exchange; they do not locate consciousness physically.",
  claimLevel: "Model",
  src: "/_book-v5/figures/avatar-canvas.svg",
  width: 1200,
  height: 800,
  mobileSrc: "/_book-v5/figures/avatar-canvas-mobile.svg",
  mobileWidth: 600,
  mobileHeight: 960,
};

describe("manuscript figures in the Reader", () => {
  it("keeps an illustration, its claim and its caption together at its manuscript position", () => {
    const { container } = render(<BookMarkdown
      content={`Before the figure.\n\n![Body and Canvas](${figure.src})\n\nAfter the figure.`}
      figures={{ [figure.src]: figure }}
    />);
    const shown = screen.getByRole("figure");
    expect(shown).toHaveAccessibleName(/Figure 1 · Model A body and a continuing history/);
    expect(within(shown).getByText(figure.caption)).toBeVisible();
    const image = within(shown).getByRole("img", { name: figure.alt });
    expect(image).toHaveAttribute("width", "1200");
    expect(image).toHaveAttribute("height", "800");
    expect(shown.querySelector("source")).toHaveAttribute("srcset", figure.mobileSrc);
    expect(shown.querySelector("source")).toHaveAttribute("width", "600");
    expect(shown.querySelector("source")).toHaveAttribute("height", "960");
    expect(shown.previousElementSibling).toHaveTextContent("Before the figure.");
    expect(shown.nextElementSibling).toHaveTextContent("After the figure.");
    expect(container.querySelector("p figure")).toBeNull();
  });

  it("preserves the released reader's image rendering without an explicit figure inventory", () => {
    const { container } = render(<BookMarkdown content="![Existing diagram](/publications/v4/figure.svg)" />);
    expect(screen.getByRole("img", { name: "Existing diagram" })).toHaveAttribute("src", "/publications/v4/figure.svg");
    expect(container.querySelector("figure")).toBeNull();
  });
});
