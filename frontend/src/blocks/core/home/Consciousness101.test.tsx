import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Consciousness101 } from "./Consciousness101";

describe("Consciousness101", () => {
  it("presents Love and relationships as purpose within DOT, not another architecture layer", () => {
    render(<MemoryRouter><Consciousness101 /></MemoryRouter>);
    const purpose = screen.getByRole("region", { name: "Consciousness 101" });
    expect(within(purpose).getByText("Love and relationships")).toBeVisible();
    expect(within(purpose).getByText(/In DOT, the purpose of Little c is to develop toward Love/)).toBeVisible();
    expect(within(purpose).getByText(/boundaries, accountability, and repair/)).toBeVisible();
    expect(purpose.querySelector("svg.home-concept-architecture")).toBeNull();
    expect(within(purpose).getByRole("link", { name: /Continue with the Academy/ }))
      .toHaveAttribute("href", "#choose-path");
    expect(within(purpose).getByRole("link", { name: "Book One · Love Must Become Operational" }))
      .toHaveAttribute("href", "/book/digital-organism-theory/the-painting#love-must-become-operational");
  });
});
