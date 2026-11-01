import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import FilmsPage from "./FilmsPage";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";
import filmsData from "../../content/films.json";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import { CONCEPT_MOTIFS } from "./conceptFilms";

const renderFilmsPage = (initialEntry = "/academy/films") => {
  window.history.replaceState(null, "", initialEntry);
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <FilmsPage />
    </MemoryRouter>,
    { wrapper: PublicPageTestProvider },
  );
};

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("FilmsPage", () => {
  it("opens the screening room on the first concept's film and marks Academy current in primary nav", () => {
    renderFilmsPage();

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "Academy" },
      ),
    ).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.getByRole("heading", { level: 1, name: filmsData.title })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "A short film for each concept" }),
    ).toBeInTheDocument();
    const first = doctrineNodes[0];
    expect(screen.getByRole("heading", { level: 3, name: first.title })).toBeInTheDocument();
    expect(screen.getByText(first.oneLine, { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("offers one film for every concept in the concept map, in the map's order", () => {
    renderFilmsPage();

    const index = screen.getByRole("navigation", { name: "Concept films" });
    const items = within(index).getAllByRole("button");
    expect(items).toHaveLength(doctrineNodes.length);
    doctrineNodes.forEach((node, position) => {
      expect(items[position]).toHaveTextContent(node.title);
      expect(CONCEPT_MOTIFS[node.id]).toBeDefined();
    });
    expect(items[0]).toHaveAttribute("aria-current", "true");

    fireEvent.click(items[9]);
    expect(items[9]).toHaveAttribute("aria-current", "true");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("heading", { level: 3, name: doctrineNodes[9].title }),
    ).toBeInTheDocument();
    expect(window.location.search).toBe(`?concept=${doctrineNodes[9].id}`);
  });

  it("opens the film a link asks for and leads from it into the book and the concept map", () => {
    renderFilmsPage("/academy/films?concept=big-c");

    const bigC = doctrineNodes.find((node) => node.id === "big-c")!;
    expect(screen.getByRole("heading", { level: 3, name: bigC.title })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: CONCEPT_MOTIFS["big-c"].description }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `Read the passage · ${bigC.source.sectionTitle}` }),
    ).toHaveAttribute("href", bigC.source.href);
    expect(screen.getByRole("link", { name: "Open in the concept map" }))
      .toHaveAttribute("href", "/doctrine/big-c");

    fireEvent.click(screen.getByRole("button", { name: `Next film: ${doctrineNodes[3].title}` }));
    expect(screen.getByRole("heading", { level: 3, name: doctrineNodes[3].title })).toBeInTheDocument();
  });

  it("keeps every film silent: no media elements, no sound or voiceover controls", () => {
    const { container } = renderFilmsPage();

    expect(container.querySelector("audio, video, iframe")).toBeNull();
    expect(screen.queryByRole("button", { name: /voiceover|mute|unmute/i })).toBeNull();
    expect(screen.getByText("Silent")).toBeInTheDocument();
    expect(container.querySelector(".films-play-hero-btn")).toBeInTheDocument();
  });

  it("starts a film only when asked, and the film never moves on by itself", () => {
    const { container } = renderFilmsPage();
    const first = doctrineNodes[0];

    expect(screen.getByRole("button", { name: "Play film" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `Play the ${first.title} film (0:16, silent)` }));
    expect(screen.getByRole("button", { name: "Pause film" })).toBeInTheDocument();
    expect(container.querySelector(".films-play-hero-btn")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("slider", { name: "Seek timeline in seconds" }), {
      target: { value: "16" },
    });
    expect(screen.getByRole("heading", { level: 3, name: first.title })).toBeInTheDocument();
  });

  it("enforces Law 9: loads zero third-party iframes and offers YouTube only as a link", () => {
    const { container } = renderFilmsPage();

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(filmsData.privacyNote)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /@dotheory on YouTube/ }),
    ).toHaveAttribute("href", "https://www.youtube.com/@dotheory");
  });

  it("lets each series episode open its concept's film", () => {
    renderFilmsPage();

    fireEvent.click(screen.getByRole("button", { name: "Watch the film: Limits and Unpaid Debts" }));
    expect(
      screen.getByRole("heading", { level: 3, name: "Limits and Unpaid Debts" }),
    ).toBeInTheDocument();
  });

  it("presents the 3 finite @dotheory channel streams and ends with a finite completion boundary (Law 3)", () => {
    renderFilmsPage();

    for (const stream of filmsData.streams) {
      expect(
        screen.getByRole("heading", { level: 3, name: stream.title }),
      ).toBeInTheDocument();
    }

    expect(screen.getByText(filmsData.completionNote)).toBeInTheDocument();
  });
});
