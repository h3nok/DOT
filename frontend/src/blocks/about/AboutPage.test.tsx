import { readFileSync } from "node:fs";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AboutPage from "./AboutPage";
import { author, authorByline } from "../../content/author";

const manifest = readFileSync(
  "public/publications/henok/digital-organism-theory/v4/manifest.json",
  "utf8",
);

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(manifest));
});

afterEach(() => {
  vi.restoreAllMocks();
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );

describe("AboutPage", () => {
  it("names the book navigation even when its visible text is hidden on mobile", () => {
    renderPage();

    const context = within(screen.getByRole("navigation", { name: "Page context" }));
    expect(context.getByRole("link", { name: "Book One" })).toHaveAttribute(
      "aria-label",
      "Book One",
    );
  });

  it("introduces the author in their own words", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: authorByline })).toBeInTheDocument();
    expect(screen.getByText(author.role)).toBeInTheDocument();
    expect(screen.getByText(author.summary)).toBeInTheDocument();
    // The origin is the released preface, not a second biography.
    expect(screen.getByText(/For nearly two decades/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "preface to Book One" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface",
    );
  });

  it("can always be answered, even before the site has an address", () => {
    renderPage();

    const contact = within(screen.getByRole("region", { name: "Contact" }));
    const reach = contact.getAllByRole("link")[0];
    expect(reach).toHaveAttribute(
      "href",
      author.email ? `mailto:${author.email}` : author.links.linkedin,
    );
  });

  it("gives the released edition's citation", async () => {
    renderPage();

    expect(await screen.findByText(/^Ghebrechristos, H\. \(\d{4}\)\. Consciousness/)).toBeInTheDocument();
  });

  it("lists each degree, and links a dissertation to where it is published", () => {
    renderPage();

    const education = within(screen.getByRole("region", { name: "Education" }));
    for (const credential of author.credentials) {
      expect(education.getByText(credential.degree)).toBeInTheDocument();
      expect(education.getByText(new RegExp(credential.institution))).toBeInTheDocument();
      if (credential.dissertation) {
        expect(
          education.getByRole("link", { name: credential.dissertation.title }),
        ).toHaveAttribute("href", credential.dissertation.url);
      }
    }
  });

  it("shows no placeholder portrait", () => {
    renderPage();

    if (!author.photo) expect(screen.queryByRole("img")).toBeNull();
  });
});
