import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  HERO_ARGUMENT,
  HERO_TYPE_INTERVAL_MS,
} from "./heroData";
import { HeroProposition } from "./HeroProposition";

describe("HeroProposition", () => {
  afterEach(() => vi.useRealTimers());

  const renderProposition = (reducedMotion = false) =>
    render(
      <MemoryRouter>
        <HeroProposition reducedMotion={reducedMotion} />
      </MemoryRouter>,
    );

  it("shows the complete observation without motion when reduced motion is requested", () => {
    renderProposition(true);

    expect(
      screen.getByRole("heading", {
        name: "The observer belongs in the inquiry.",
      }),
    ).toBeVisible();
    expect(screen.getByText(HERO_ARGUMENT.text)).toBeVisible();
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
  });

  it("types the observation once and then rests", () => {
    vi.useFakeTimers();
    renderProposition();

    expect(document.querySelector(".home-hero-typewriter-cursor")).not.toBeNull();
    act(() =>
      vi.advanceTimersByTime(HERO_ARGUMENT.text.length * HERO_TYPE_INTERVAL_MS + 20),
    );

    expect(document.querySelector(".home-hero-argument-text")?.textContent).toBe(
      HERO_ARGUMENT.text,
    );
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
    expect(screen.queryByRole("button", { name: /show the/i })).toBeNull();
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
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("states the thesis boldly while labelling it an open hypothesis", () => {
    renderProposition();

    expect(screen.getByText("The thesis")).toBeVisible();
    expect(
      screen.getByText("Held as hypothesis · Open to challenge"),
    ).toBeVisible();
    expect(
      screen.getByText(/consciousness is fundamental/i),
    ).toBeVisible();
    expect(
      screen.getByText(/the interface — not the source/i),
    ).toBeVisible();
    expect(
      screen.getByText(/person reading this/i),
    ).toBeVisible();
  });
});
