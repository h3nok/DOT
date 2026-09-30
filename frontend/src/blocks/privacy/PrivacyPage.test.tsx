import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./PrivacyPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  );

describe("PrivacyPage", () => {
  it("is dated, so a reader can tell when it last changed", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByText(/^Last updated/)).toBeInTheDocument();
  });

  it("names every outside service that handles a reader's data", () => {
    const { container } = renderPage();
    const text = container.textContent ?? "";

    // One entry per third party the code actually calls. A new one belongs
    // here, and on the page, in the same change that adds it.
    for (const service of [
      "GitHub Pages",
      "Plausible",
      "Gemini",
      "Semantic Scholar",
      "Crossref",
      "Resend",
      "Stripe",
      "Google Cloud",
    ]) {
      expect(text, service).toContain(service);
    }
  });

  it("says plainly what leaving the reader list does and does not erase", () => {
    renderPage();

    expect(screen.getByText(/the encrypted address stays/)).toBeInTheDocument();
    expect(screen.getByText(/Ask, and it is deleted outright/)).toBeInTheDocument();
  });

  it("sends data requests somewhere that answers", () => {
    renderPage();

    expect(within(screen.getByRole("main")).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
  });
});
