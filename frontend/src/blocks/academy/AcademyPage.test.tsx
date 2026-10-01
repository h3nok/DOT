import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AcademyPage from "./AcademyPage";

describe("AcademyPage", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <AcademyPage />
      </MemoryRouter>,
    );

  it("explains the inquiry and offers material readers can use now", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Study the theory. Question its claims." }),
    ).toBeVisible();
    expect(screen.getByText(/DOT Academy · In development/i)).toBeVisible();
    const start = screen.getByRole("navigation", { name: "Begin exploring the Academy" });
    expect(within(start).getByRole("link", { name: "Explore the concept map" }))
      .toHaveAttribute("href", "/doctrine");
    expect(within(start).getByRole("link", { name: "Review open questions" }))
      .toHaveAttribute("href", "/applied");
    expect(screen.getByText(/No experiment is recorded yet/)).toBeVisible();
    expect(screen.getByText(/No Academy response has been released yet/)).toBeVisible();
    expect(screen.getByRole("heading", { name: "Book One remains a book." })).toBeVisible();
  });

  it("presents the four invariants of the intellectual revolution", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "The Observer in the Inquiry" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Sovereign Attention" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Epistemic Discipline" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Permanent Dissent & Open Seams" })).toBeVisible();
  });

  it("holds all eight work forms across the three programs under assembly", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Theory" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Critical inquiry" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Writing" })).toBeVisible();

    expect(screen.getByText("Definitions")).toBeVisible();
    expect(screen.getByText("Diagrams")).toBeVisible();
    expect(screen.getByText("Hypotheses")).toBeVisible();
    expect(screen.getByText("Objections")).toBeVisible();
    expect(screen.getByText("Responses")).toBeVisible();
    expect(screen.getByText("Experiments")).toBeVisible();
    expect(screen.getByText("Excerpts")).toBeVisible();
    expect(screen.getByText("Essays")).toBeVisible();
  });

  it("exposes the epistemic and provenance standard", () => {
    renderPage();

    expect(screen.getByText("Observation · Model · Hypothesis · Speculation")).toBeVisible();
    expect(screen.getByText("Source · edition · relationship to earlier work")).toBeVisible();
    expect(screen.getByText("Open · revised · inconclusive · not supported")).toBeVisible();
  });
});
