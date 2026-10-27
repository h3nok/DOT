import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import filmsData from "../../../content/films.json";
import { HomeFilmSection } from "./HomeFilmSection";

describe("HomeFilmSection", () => {
  it("plays the short introduction, which has no voiceover to toggle", () => {
    const intro = filmsData.screeningFilms.find((film) => film.id === "inquiry-intro")!;
    render(
      <MemoryRouter>
        <HomeFilmSection />
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: intro.title })).toBeInTheDocument();
    expect(screen.getByText(`Academy · Visual inquiry · ${intro.duration}`)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /synchronized voiceover/ }),
    ).not.toBeInTheDocument();
  });
});
