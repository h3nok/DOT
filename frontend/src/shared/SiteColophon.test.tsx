import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SiteColophon } from "./SiteColophon";

const renderColophon = (essaysPublished: boolean) =>
  render(
    <MemoryRouter>
      <SiteColophon essaysPublished={essaysPublished} />
    </MemoryRouter>,
  );

const siteLinks = () =>
  within(screen.getByRole("navigation", { name: "Site" }))
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);

describe("SiteColophon", () => {
  it("names the author and offers quiet doors, with no funding ask (ADR-0022)", () => {
    renderColophon(false);

    expect(screen.getByText(/Written by Henok Ghebrechristos/)).toBeInTheDocument();
    expect(siteLinks()).toEqual([
      ["About", "/about"],
      ["Blog", "/blog"],
      ["Publications", "/publications"],
      ["Essays", "/essays"],
      ["Reader list", "/readers"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ]);
    expect(screen.queryByText(/support|donate|fund/i)).toBeNull();
    expect(screen.queryByRole("link", { name: "RSS" })).toBeNull();
  });

  it("links only the author's real profiles, as plain links", () => {
    renderColophon(false);

    const elsewhere = within(screen.getByRole("navigation", { name: "Elsewhere" }));
    expect(elsewhere.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("rel", "noreferrer me");
    expect(elsewhere.queryByRole("link", { name: "YouTube" })).toBeNull();
    expect(elsewhere.getByRole("link", { name: "The Millennial Manifesto" })).toBeInTheDocument();
  });

  it("sends readers to the reader list, never the invitation queue (ADR-0025)", () => {
    renderColophon(false);

    const hrefs = siteLinks().map(([, href]) => href);
    expect(hrefs).toContain("/readers");
    expect(hrefs).not.toContain("/join");
  });

  it("offers essays and their feed only once one is published", () => {
    renderColophon(true);

    expect(siteLinks()).toEqual([
      ["About", "/about"],
      ["Blog", "/blog"],
      ["Publications", "/publications"],
      ["Essays", "/essays"],
      ["RSS", "/feed.xml"],
      ["Reader list", "/readers"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ]);
  });
});
