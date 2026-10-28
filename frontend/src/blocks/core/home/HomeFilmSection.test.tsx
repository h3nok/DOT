import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import filmsData from "../../../content/films.json";
import { doctrineNodes } from "../../../content/doctrine/doctrineData";
import { CONCEPT_MOTIFS } from "../../films/conceptFilms";
import { CONCEPT_TOUR, CONCEPT_TOUR_SECONDS } from "../../films/conceptTour";
import { formatDuration } from "../../films/filmTime";
import { HomeFilmSection } from "./HomeFilmSection";

const tour = filmsData.conceptTour;
const length = formatDuration(CONCEPT_TOUR_SECONDS);

const renderSection = () =>
  render(
    <MemoryRouter>
      <HomeFilmSection />
    </MemoryRouter>,
  );

/** Just enough of an AudioContext for the typewriter to open one and make no sound. */
class QuietAudioContext {
  static opened = 0;
  sampleRate = 48000;
  state = "running";
  currentTime = 0;
  destination = {};
  constructor() {
    QuietAudioContext.opened += 1;
  }
  createGain() {
    return { gain: { value: 1 }, connect: () => undefined };
  }
  createBuffer(_channels: number, frames: number) {
    return { getChannelData: () => new Float32Array(frames) };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  QuietAudioContext.opened = 0;
});

describe("HomeFilmSection", () => {
  it("offers one typed film through every concept, opening on the struggle it answers", () => {
    renderSection();

    const region = screen.getByRole("region", { name: tour.title });
    expect(within(region).getByText(`${tour.label} · ${length}`)).toBeInTheDocument();
    expect(within(region).getByRole("heading", { level: 3, name: tour.scenes[0].title })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: `Play ${tour.title} (${length})` })).toBeInTheDocument();
    expect(within(region).queryByRole("button", { name: /voiceover/i })).not.toBeInTheDocument();
  });

  it("makes no sound until Play, and its typewriter sound can be turned off", () => {
    vi.stubGlobal("AudioContext", QuietAudioContext);
    const audio = vi.fn();
    vi.stubGlobal("Audio", audio);
    renderSection();

    expect(QuietAudioContext.opened).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: `Play ${tour.title} (${length})` }));
    expect(screen.getByRole("button", { name: "Pause film" })).toBeInTheDocument();
    expect(QuietAudioContext.opened).toBe(1);
    expect(audio).not.toHaveBeenCalled();

    const sound = screen.getByRole("button", { name: "Typewriter sound" });
    expect(sound).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(sound);
    expect(sound).toHaveAttribute("aria-pressed", "false");
  });

  it("shows each concept in the Concept Map's own words, with its analogy, when the reader moves to it", () => {
    const { container } = renderSection();
    const love = CONCEPT_TOUR.find((part) => part.kind === "concept" && part.film.id === "love")!;
    const node = doctrineNodes.find((item) => item.id === "love")!;

    fireEvent.change(screen.getByRole("slider", { name: "Seek timeline in seconds" }), {
      target: { value: String(love.start + 11) },
    });

    expect(screen.getByRole("heading", { level: 3, name: node.title })).toBeInTheDocument();
    // The unseen sizers repeat every part's words; read the part on screen.
    const shown = container.querySelector(".concept-film-copy:not(.concept-tour-sizer)")!;
    expect(shown.querySelector(".concept-film-eyebrow")).toHaveTextContent(
      `Concept 15 of ${doctrineNodes.length} · ${node.source.claimLevel}`,
    );
    expect(shown.querySelector(".concept-film-definition")).toHaveTextContent(node.oneLine);
    expect(shown.querySelector(".concept-film-analogy")).toHaveTextContent(CONCEPT_MOTIFS.love.analogy);
    expect(screen.getByRole("img", { name: /narrowed fan of responses widens/ })).toBeInTheDocument();
  });

  it("steps from one concept to the next and ends on links into the book", () => {
    const { container } = renderSection();
    const shownTitle = () =>
      container.querySelector(".concept-film-copy:not(.concept-tour-sizer) .concept-film-name .sr-only")?.textContent;

    fireEvent.click(screen.getByRole("button", { name: "Next concept" }));
    expect(shownTitle()).toBe(doctrineNodes[0].title);
    fireEvent.click(screen.getByRole("button", { name: "Next concept" }));
    expect(shownTitle()).toBe(doctrineNodes[1].title);

    fireEvent.change(screen.getByRole("slider", { name: "Seek timeline in seconds" }), {
      target: { value: String(CONCEPT_TOUR_SECONDS) },
    });
    expect(shownTitle()).toBe(tour.closing.title);
    expect(screen.getByRole("button", { name: "Next concept" })).toBeDisabled();
    for (const link of tour.closing.links) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.to);
    }
  });
});
