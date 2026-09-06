import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HeroProposition } from "./HeroProposition";

describe("HeroProposition", () => {
  const renderProposition = (reducedMotion = false) =>
    render(
      <MemoryRouter>
        <HeroProposition reducedMotion={reducedMotion} />
      </MemoryRouter>,
    );

  it("opens with the title and no self-advancing copy", () => {
    renderProposition(true);

    expect(
      screen.getByRole("heading", {
        name: "A theory of reality has to account for you.",
      }),
    ).toBeVisible();
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
    expect(document.querySelector(".home-hero-statement")).toBeNull();
  });

  it("offers the fixed book first and the assembling Academy second", () => {
    renderProposition();

    expect(screen.getByRole("link", { name: /read book one/i })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface",
    );
    expect(screen.getByRole("link", { name: /preview the academy/i })).toHaveAttribute(
      "href",
      "/academy",
    );
    expect(within(screen.getByRole("navigation", { name: "Begin exploring DOT" })).getAllByRole("link")).toHaveLength(2);
  });

  it("states the thesis boldly while labelling it an open hypothesis", () => {
    renderProposition();

    expect(screen.getByText("The thesis")).toBeVisible();
    expect(
      screen.getByText("Held as hypothesis · Open to challenge"),
    ).toBeVisible();
    expect(
      screen.getByText(/Consciousness means there is something it feels like to be you/i),
    ).toBeVisible();
    expect(
      screen.getByText(/DOT proposes that it precedes the physical universe/i),
    ).toBeVisible();
    expect(
      screen.getByText(/your body connects your experience to it/i),
    ).toBeVisible();
  });
});
