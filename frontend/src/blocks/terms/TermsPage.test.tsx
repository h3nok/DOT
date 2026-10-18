import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";
import { describe, expect, it } from "vitest";

import TermsPage from "./TermsPage";

const renderPage = () =>
  render(
    <MemoryRouter>
      <TermsPage />
    </MemoryRouter>, { wrapper: PublicPageTestProvider },
  );

describe("TermsPage", () => {
  it("is dated, so a reader can tell when it last changed", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Terms and refunds" })).toBeInTheDocument();
    expect(screen.getByText(/^Last updated/)).toBeInTheDocument();
  });

  it("names who runs the site and says a payment is not a charitable donation", () => {
    const { container } = renderPage();
    const text = container.textContent ?? "";

    expect(text).toContain("run by Henok Ghebrechristos, an individual author");
    expect(text).toContain("not a charitable donation");
    expect(text).toContain("no recurring charge");
  });

  it("states a refund window and an address that answers", () => {
    renderPage();

    expect(screen.getByText(/within 30 days of the payment/)).toBeInTheDocument();
    const contact = within(screen.getByRole("main"))
      .getAllByRole("link")
      .find((link) => link.getAttribute("href")?.startsWith("mailto:"));
    expect(contact?.getAttribute("href")).toMatch(/^mailto:[^@\s]+@[^@\s]+\.[a-z]+$/);
  });
});
