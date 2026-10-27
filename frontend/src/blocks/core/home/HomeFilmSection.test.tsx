import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import filmsData from "../../../content/films.json";
import { HomeFilmSection } from "./HomeFilmSection";

const intro = filmsData.screeningFilms.find((film) => film.id === "inquiry-intro")!;

const renderSection = () =>
  render(
    <MemoryRouter>
      <HomeFilmSection />
    </MemoryRouter>,
  );

afterEach(() => { vi.unstubAllGlobals(); });

describe("HomeFilmSection", () => {
  it("plays the short introduction, which has no voiceover to toggle", () => {
    renderSection();

    expect(screen.getByRole("region", { name: intro.title })).toBeInTheDocument();
    expect(screen.getByText(`Academy · Visual inquiry · ${intro.duration}`)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /synchronized voiceover/ }),
    ).not.toBeInTheDocument();
  });

  it("plays the introduction in silence: no sound is made and none is offered", () => {
    const audioContext = vi.fn();
    const audio = vi.fn();
    vi.stubGlobal("AudioContext", audioContext);
    vi.stubGlobal("Audio", audio);
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: `Play ${intro.title} (${intro.duration})` }));

    expect(screen.getByText("Silent")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mute film audio/i })).not.toBeInTheDocument();
    expect(audioContext).not.toHaveBeenCalled();
    expect(audio).not.toHaveBeenCalled();
  });
});
