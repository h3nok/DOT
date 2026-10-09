import { readFileSync } from "node:fs";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AboutPage from "./AboutPage";
import { author, authorByline } from "../../content/author";
import { builder, builderProjects, career, projectInquiryHref, resumeHref } from "../../content/builder";

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
  it("uses one shared book link in the header", () => {
    renderPage();

    const context = within(screen.getByRole("navigation", { name: "Primary" }));
    expect(context.getByRole("link", { name: "Book One" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory",
    );
    expect(screen.queryByRole("navigation", { name: "Page context" })).toBeNull();
    expect(screen.getByRole("link", { name: "Essays and letters" })).toHaveAttribute("href", "/blog");
  });

  it("introduces the author in their own words", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: authorByline })).toBeInTheDocument();
    expect(screen.getByText(author.role)).toBeInTheDocument();
    expect(screen.getByText(author.summary)).toBeInTheDocument();
    // The origin is the released preface, not a second biography.
    fireEvent.click(screen.getByText("Where the work comes from"));
    expect(screen.getByText(/For nearly two decades/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "preface to Book One" })).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/preface",
    );
  });

  it("can always be answered, even before the site has an address", () => {
    renderPage();

    const contact = within(screen.getByRole("region", { name: "Contact" }));
    expect(contact.getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", "/contact");
    const reach = contact.getAllByRole("link").find(link => link.getAttribute("href") === (author.email ? `mailto:${author.email}` : author.links.linkedin))!;
    expect(reach).toHaveAttribute(
      "href",
      author.email ? `mailto:${author.email}` : author.links.linkedin,
    );
  });

  it("gives the released edition's citation", async () => {
    renderPage();

    expect(await screen.findByText(/^Ghebrechristos, H\. \(\d{4}\)\. Consciousness/)).toBeInTheDocument();
  });

  it("uses the supplied degree and thesis without linking to the old dissertation", () => {
    renderPage();

    const education = within(screen.getByRole("region", { name: "Education" }));
    for (const credential of author.credentials) {
      expect(education.getByText(credential.degree)).toBeInTheDocument();
      expect(education.getByText(new RegExp(credential.institution))).toBeInTheDocument();
      if (credential.dissertation) {
        expect(education.getByText(credential.dissertation.title)).toBeInTheDocument();
        if (credential.dissertation.url) {
          expect(education.getByRole("link", { name: credential.dissertation.title, hidden: true }))
            .toHaveAttribute("href", credential.dissertation.url);
        }
      }
    }
    expect(education.queryByRole("link", { name: /Patch-Based Optimization/ })).toBeNull();
  });

  it("shows no placeholder portrait", () => {
    renderPage();

    if (!author.photo) expect(screen.queryByRole("img")).toBeNull();
  });

  it("leads with independent work and native project intake", () => {
    renderPage();

    expect(screen.getByText(builder.title)).toBeVisible();
    const inquiry = screen.getByRole("link", { name: "Discuss a project" });
    const href = inquiry.getAttribute("href")!;
    expect(href).toBe("/contact?purpose=project");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows real products and does not send Sullix visitors to DOT's homepage", () => {
    renderPage();

    const products = within(screen.getByRole("region", { name: "Selected work" }));
    for (const project of builderProjects) {
      expect(products.getByRole("heading", { name: project.name })).toBeVisible();
    }
    expect(products.getByRole("link", { name: "Hermetic Knowledge Isolation" }))
      .toHaveAttribute("href", "https://github.com/h3nok/HKI");
    expect(products.queryByRole("link", { name: /Sullix/ })).toBeNull();
  });

  it("offers a real résumé with generic employer labels and the requested research title", () => {
    renderPage();

    const resume = within(screen.getByRole("region", { name: "Career & résumé" }));
    const download = resume.getByRole("link", { name: "Download résumé" });
    expect(download).toHaveAttribute("href", author.resumeUrl);
    expect(download).toHaveAttribute("download");
    const file = readFileSync(`public${author.resumeUrl}`);
    expect(file.subarray(0, 5).toString()).toBe("%PDF-");
    expect(resume.getByRole("link", { name: "Read online" }))
      .toHaveAttribute("href", author.resumeOnlineUrl);
    const online = readFileSync(`public${author.resumeOnlineUrl}`, "utf8");
    expect(online).toContain("Research Scientist");
    expect(online).toContain("Enterprise applied research");
    expect(online).not.toMatch(/Costco|AI Principal|Avia Solutions LLC|<h3>Sullix<\/h3>/i);
    expect(screen.queryByText(/Costco Wholesale/)).toBeNull();
    expect(online).toContain(author.credentials[0].dissertation!.title);
    for (const job of career.experience) {
      expect(resume.getByRole("heading", { name: job.company })).toBeVisible();
      expect(resume.getByText(job.role)).toBeVisible();
      expect(resume.getByText(job.period)).toBeVisible();
    }
    expect(resume.queryByRole("heading", { name: "Stay" })).toBeNull();
    expect(resumeHref({ ...author, resumeUrl: "" }))
      .toBe(`mailto:${author.email}?subject=R%C3%A9sum%C3%A9%20request`);
    expect(resumeHref({ ...author, resumeUrl: "/henok-resume.pdf" })).toBe("/henok-resume.pdf");
    expect(resumeHref({ ...author, resumeUrl: "javascript:alert(1)" }))
      .toContain("mailto:");
  });

  it("uses the public profile when email is not configured", () => {
    const withoutEmail = { ...author, email: "", resumeUrl: "" };
    expect(projectInquiryHref()).toBe("/contact?purpose=project");
    expect(resumeHref(withoutEmail)).toBe(author.links.linkedin);
  });

  it("keeps the builder page usable when the optional citation cannot load", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("offline"));
    renderPage();

    expect(screen.getByRole("link", { name: "Discuss a project" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Career & résumé" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Contact" })).toBeVisible();
  });
});
