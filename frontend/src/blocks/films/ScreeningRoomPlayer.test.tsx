import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import filmsData from "../../content/films.json";
import spokenTrailerCaptions from "../../content/inquiry-trailer-captions.json";
import {
  ScreeningRoomPlayer,
  type ScreeningFilmMeta,
} from "./ScreeningRoomPlayer";

const trailer = (filmsData.screeningFilms as ScreeningFilmMeta[]).find(
  (film) => film.id === "inquiry-trailer",
)!;

describe("ScreeningRoomPlayer with the narrated film", () => {
  it("lets a phone reader choose a scene without starting playback", () => {
    const { container } = render(<ScreeningRoomPlayer film={trailer} />);
    expect(container.querySelector(".films-play-hero-btn")).toBeInTheDocument();
    const scenes = screen.getByRole("combobox", { name: "Jump to trailer scene" });
    fireEvent.change(scenes, { target: { value: "scene-11" } });

    expect(scenes).toHaveValue("scene-11");
    expect(container.querySelector(".films-play-hero-btn")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play film" })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Jump to Scene 11: 11 // LOVE AS INTELLECTUAL COURAGE",
    })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("slider", { name: "Seek timeline in seconds" }))
      .toHaveAttribute("aria-valuetext", expect.stringContaining(`of ${trailer.duration.padStart(5, "0")}`));
  });

  it("shows spoken caption words independently of narration and clears them after the final cue", () => {
    const { container } = render(<ScreeningRoomPlayer film={trailer} />);
    fireEvent.click(screen.getByRole("button", { name: "Show synchronized caption bar" }));
    fireEvent.click(screen.getByRole("button", { name: "Disable synchronized voiceover" }));
    const timeline = screen.getByRole("slider", { name: "Seek timeline in seconds" });
    const first = spokenTrailerCaptions[0];
    fireEvent.change(timeline, { target: { value: String(first.startSeconds + 0.05) } });
    const caption = container.querySelector(".films-live-caption-lines");
    expect(caption).toHaveTextContent(first.text.replace(/\s+/g, " "));
    expect(screen.getByRole("button", { name: "Enable synchronized voiceover" })).toBeInTheDocument();

    const final = spokenTrailerCaptions[spokenTrailerCaptions.length - 1];
    fireEvent.change(timeline, { target: { value: String(final.endSeconds + 0.1) } });
    expect(caption).toBeEmptyDOMElement();
  });

  it("resolves theme-matched Dark and Light YouTube video IDs and URLs", () => {
    const dualFilm = {
      ...trailer,
      youtubeId: "darkVideo123",
      youtubeIdLight: "lightVideo456",
      youtubeUrl: "https://www.youtube.com/@dotheory",
      youtubeUrlLight: "https://www.youtube.com/@dotheory",
    };

    document.documentElement.setAttribute("data-theme", "dark");
    const darkView = render(<ScreeningRoomPlayer film={dualFilm} />);
    fireEvent.click(screen.getByRole("button", { name: "YouTube" }));
    expect(screen.getByRole("link", { name: /Open @dotheory on YouTube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=darkVideo123",
    );
    darkView.unmount();

    document.documentElement.setAttribute("data-theme", "light");
    const lightView = render(<ScreeningRoomPlayer film={dualFilm} />);
    fireEvent.click(screen.getByRole("button", { name: "YouTube" }));
    expect(screen.getByRole("link", { name: /Open @dotheory on YouTube/i })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=lightVideo456",
    );
    fireEvent.click(screen.getByRole("button", { name: /Load YouTube Player/i }));
    expect(screen.getByTitle(/YouTube \(Privacy-Enhanced Mode\)/i)).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/lightVideo456?rel=0",
    );
    lightView.unmount();
    document.documentElement.removeAttribute("data-theme");
  });
});
