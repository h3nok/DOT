import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Consciousness101 } from "./Consciousness101";

describe("Consciousness101", () => {
  it("connects the cultural critique to DOT’s direction and its book source", () => {
    render(<MemoryRouter><Consciousness101 /></MemoryRouter>);
    const purpose = screen.getByRole("region", { name: "A society can be productive and still be lost." });
    expect(within(purpose).getByText(/rewarding short-term gain/)).toBeVisible();
    expect(within(purpose).getByText("What is all this progress for?")).toBeVisible();
    expect(within(purpose).getByText(/Its proposed direction is Love/)).toBeVisible();
    expect(within(purpose).getByText("Love is the condition in which Fear no longer governs you.")).toBeVisible();
    expect(within(purpose).queryByRole("list")).not.toBeInTheDocument();
    expect(purpose.querySelector("svg.home-concept-architecture")).toBeNull();
    expect(within(purpose).getByRole("link", { name: "Explore the proposed architecture" }))
      .toHaveAttribute("href", "#possibility-field");
    expect(within(purpose).getByRole("link", { name: "Book One · The Culture Inside You" }))
      .toHaveAttribute("href", "/book/digital-organism-theory/the-painting#the-culture-inside-you");
    expect(within(purpose).getByRole("link", { name: "Continue in The American Millennial Manifesto" }))
      .toHaveAttribute("href", "/amm");
  });
});
