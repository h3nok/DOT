import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import filmsData from "../../../content/films.json";
import { doctrineNodes } from "../../../content/doctrine/doctrineData";
import { CONCEPT_TOUR } from "../../films/conceptTour";
import { HomeFilmSection } from "./HomeFilmSection";

const tour = filmsData.conceptTour;

const renderSection = () =>
  render(
    <MemoryRouter>
      <HomeFilmSection />
    </MemoryRouter>,
  );

afterEach(() => { vi.unstubAllGlobals(); });

describe("HomeFilmSection", () => {
  it("offers one silent film through every concept, opening on the preface", () => {
    renderSection();

    const region = screen.getByRole("region", { name: tour.title });
    expect(within(region).getByText(`${tour.label} · 3:01`)).toBeInTheDocument();
    expect(within(region).getByRole("heading", { level: 3, name: tour.opening.line })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: `Play ${tour.title} (3:01, silent)` })).toBeInTheDocument();
    expect(within(region).queryByRole("button", { name: /voiceover|mute/i })).not.toBeInTheDocument();
  });

  it("plays in silence: no sound is made and none is offered", () => {
    const audioContext = vi.fn();
    const audio = vi.fn();
    vi.stubGlobal("AudioContext", audioContext);
    vi.stubGlobal("Audio", audio);
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: `Play ${tour.title} (3:01, silent)` }));

    expect(screen.getByRole("button", { name: "Pause film" })).toBeInTheDocument();
    expect(screen.getByText("Silent")).toBeInTheDocument();
    expect(audioContext).not.toHaveBeenCalled();
    expect(audio).not.toHaveBeenCalled();
  });

  it("shows each concept in the Concept Map's own words when the reader moves to it", () => {
    const { container } = renderSection();
    const love = CONCEPT_TOUR.find((part) => part.kind === "concept" && part.film.id === "love")!;
    const node = doctrineNodes.find((item) => item.id === "love")!;

    fireEvent.change(screen.getByRole("slider", { name: "Seek timeline in seconds" }), {
      target: { value: String(love.start + 8) },
    });

    expect(screen.getByRole("heading", { level: 3, name: node.title })).toBeInTheDocument();
    // The unseen sizers repeat every part's words; read the part on screen.
    const shown = container.querySelector(".concept-film-copy:not(.concept-tour-sizer)")!;
    expect(shown.querySelector(".concept-film-eyebrow")).toHaveTextContent(
      `Concept 15 of ${doctrineNodes.length} · ${node.source.claimLevel}`,
    );
    expect(shown.querySelector(".concept-film-definition")).toHaveTextContent(node.oneLine);
    expect(screen.getByRole("img", { name: /narrowed fan of responses widens/ })).toBeInTheDocument();
  });
});
