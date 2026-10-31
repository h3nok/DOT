import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AcademyPage from "./AcademyPage";
import { READING_PATHS } from "../../attention-os/reader/readingPaths";
import { openSeams } from "../../content/applied/openSeams";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import { CONCEPT_MOTIFS } from "../films/conceptFilms";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/academy"]}>
      <AcademyPage />
    </MemoryRouter>,
    { wrapper: PublicPageTestProvider },
  );
}

describe("AcademyPage", () => {
  it("opens with reading and plays no film itself", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "DOT Academy" })).toBeVisible();
    expect(screen.getByRole("img", { name: /T × E outside, Big C within it/ })).toBeInTheDocument();
    const sections = screen.getByRole("main").querySelectorAll("section");
    expect(sections[0]).toContainElement(screen.getByRole("list", { name: "Reading paths" }));
    expect(screen.getByRole("main").querySelector("video, audio, iframe, canvas")).toBeNull();
  });

  it("uses the real reader paths into the same fixed publication", () => {
    renderPage();

    const paths = screen.getByRole("list", { name: "Reading paths" });
    expect(within(paths).getAllByRole("listitem")).toHaveLength(READING_PATHS.length);
    for (const path of READING_PATHS) {
      expect(within(paths).getByRole("link", { name: new RegExp(path.label) }))
        .toHaveAttribute("href", `/book/digital-organism-theory/${path.steps[0].slug}?path=${path.id}`);
      expect(within(paths).getByText(path.purpose)).toBeVisible();
    }
    expect(screen.getByRole("link", { name: "View Book One and its contents" }))
      .toHaveAttribute("href", "/book/digital-organism-theory");
  });

  it("shows every concept in the map's order with its drawing, claim level, definition and analogy", () => {
    renderPage();

    const concepts = within(screen.getByRole("list", { name: "Concepts" })).getAllByRole("link");
    expect(concepts).toHaveLength(doctrineNodes.length);
    doctrineNodes.forEach((node, index) => {
      expect(concepts[index]).toHaveAttribute("href", `/doctrine/${node.id}`);
      expect(concepts[index]).toHaveTextContent(node.title);
      expect(concepts[index]).toHaveTextContent(node.oneLine);
      expect(concepts[index]).toHaveTextContent(node.source.claimLevel);
      expect(concepts[index]).toHaveTextContent(CONCEPT_MOTIFS[node.id].analogy);
      // The drawing is decorative inside the link, so its long description never becomes the link's name.
      expect(concepts[index].querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("names both films as destinations", () => {
    renderPage();

    const films = within(screen.getByRole("list", { name: "Films" })).getAllByRole("link");
    expect(films.map((film) => film.getAttribute("href"))).toEqual(["/film", "/academy/films"]);
  });

  it("lists the book's open seams, each linked to its entry in the register", () => {
    renderPage();

    const seams = within(screen.getByRole("list", { name: "Open questions" })).getAllByRole("link");
    expect(seams.map((seam) => seam.getAttribute("href"))).toEqual(openSeams.map((seam) => `/applied#${seam.id}`));
    expect(seams[0]).toHaveTextContent(openSeams[0].title);
    const next = screen.getByRole("navigation", { name: "Continue the inquiry" });
    expect(within(next).getByRole("link", { name: /View all open questions/ })).toHaveAttribute("href", "/applied");
    expect(within(next).getByRole("link", { name: /Ask a question/ }))
      .toHaveAttribute("href", "/contact?purpose=writing");
    expect(screen.getByRole("link", { name: /Open the concept map/ })).toHaveAttribute("href", "/doctrine");
  });

  it("indexes its parts on the page and claims no course or assessment", () => {
    renderPage();

    const contents = screen.getByRole("navigation", { name: "In the Academy" });
    for (const link of within(contents).getAllByRole("link")) {
      const target = link.getAttribute("href")!.slice(1);
      expect(document.getElementById(target)).not.toBeNull();
    }
    // The page's own framing, not the book's words (an analogy may speak of a lesson).
    const framing = [
      ...screen.getAllByRole("heading"),
      ...screen.getByRole("main").querySelectorAll(".dot-label, .academy-hub-heading > p"),
    ].map((element) => element.textContent).join(" ");
    expect(framing).not.toMatch(/\b(course|enrol|enroll|lesson|certificate|quiz|assessment)/i);
  });
});
