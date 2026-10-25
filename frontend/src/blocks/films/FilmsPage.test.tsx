import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import FilmsPage from "./FilmsPage";
import { PublicPageTestProvider } from "../../test/PublicPageTestProvider";
import filmsData from "../../content/films.json";
import spokenTrailerCaptions from "../../content/inquiry-trailer-captions.json";
import { INQUIRY_VIDEOS } from "../../../scripts/channel-inquiry-video.mjs";

const renderFilmsPage = (initialEntry = "/films") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <FilmsPage />
    </MemoryRouter>,
    { wrapper: PublicPageTestProvider },
  );

describe("FilmsPage", () => {
  it("renders the Screening Room, film selector tabs, and marks Films current in primary nav", () => {
    renderFilmsPage("/films");

    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "Films" },
      ),
    ).toHaveAttribute("aria-current", "page");

    expect(
      screen.getByRole("heading", { level: 1, name: filmsData.title }),
    ).toBeInTheDocument();

    const tablist = screen.getByRole("tablist", {
      name: "Select film to screen",
    });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveTextContent(
      filmsData.screeningFilms[0].title,
    );

    // Switch to FILM 02 (30s Identity Film)
    fireEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Consciousness: A Digital Organism",
      }),
    ).toBeInTheDocument();
  });

  it("enforces Law 9: loads zero third-party iframes and offers YouTube only as a link while no film is uploaded", () => {
    const { container } = renderFilmsPage("/films");

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText(filmsData.privacyNote)).toBeInTheDocument();
    // The privacy-mode embed is reachable only from a film with a YouTube upload.
    expect(screen.queryByRole("button", { name: "YouTube" })).toBeNull();
    expect(
      screen.getByRole("link", { name: /@dotheory on YouTube/ }),
    ).toHaveAttribute("href", "https://www.youtube.com/@dotheory");
  });

  it("lets a phone reader choose a scene without starting playback", () => {
    renderFilmsPage("/films");
    const scenes = screen.getByRole("combobox", { name: "Jump to trailer scene" });
    fireEvent.change(scenes, { target: { value: "scene-11" } });

    expect(scenes).toHaveValue("scene-11");
    expect(screen.getByRole("button", { name: "Play film" })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Jump to Scene 11: 11 // LOVE, RESPONSIBILITY, AND REPAIR",
    })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("slider", { name: "Seek timeline in seconds" }))
      .toHaveAttribute("aria-valuetext", expect.stringContaining(`of ${filmsData.screeningFilms[0].duration.padStart(5, "0")}`));
  });

  it("connects every trailer act to its timestamp and Book One chapter, and exposes the synchronized transcript", () => {
    renderFilmsPage("/films");

    const actsList = screen.getByRole("list", {
      name: "Film acts and chapter timestamps",
    });
    const actItems = within(actsList).getAllByRole("listitem");
    expect(actItems).toHaveLength(4);

    expect(
      within(actsList).getByRole("link", {
        name: "Chapter 1 · The Digital Organism",
      }),
    ).toHaveAttribute(
      "href",
      "/book/digital-organism-theory/the-digital-organism",
    );
    expect(
      within(actsList).getByRole("link", {
        name: "Chapter 6 · The Painting",
      }),
    ).toHaveAttribute("href", "/book/digital-organism-theory/the-painting");

    const transcriptSummary = screen.getByText("Read the transcript");
    fireEvent.click(transcriptSummary);
    const transcript = screen.getByRole("list", { name: "Film transcript" });
    const trailer = INQUIRY_VIDEOS.find((video) => video.name === "inquiry-trailer")!;
    expect(within(transcript).getAllByRole("listitem")).toHaveLength(trailer.captions.length);
    for (const caption of trailer.captions) {
      expect(within(transcript).getByText(caption.primaryStatement!)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", {
        name: "Jump to Scene 11: 11 // LOVE, RESPONSIBILITY, AND REPAIR",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Disable synchronized voiceover",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps claim levels available in a closed disclosure", () => {
    renderFilmsPage("/films");
    const summary = screen.getByText("About this film’s claims");
    const disclosure = summary.closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    fireEvent.click(summary);
    expect(disclosure).toHaveAttribute("open");
    expect(disclosure).toHaveTextContent(filmsData.screeningFilms[0].claimLevels.join(" · "));
    fireEvent.click(summary);
    expect(disclosure).not.toHaveAttribute("open");
  });

  it("shows spoken caption words independently of narration and clears them after the final cue", () => {
    const { container } = renderFilmsPage("/films");
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

  it("retains the identity film’s caption text and notes when no narration paragraph exists", () => {
    renderFilmsPage("/films");
    const tabs = within(screen.getByRole("tablist", { name: "Select film to screen" })).getAllByRole("tab");
    fireEvent.click(tabs[1]);
    fireEvent.click(screen.getByText("Read the transcript"));
    const transcript = screen.getByRole("list", { name: "Film transcript" });
    const intro = INQUIRY_VIDEOS.find((video) => video.name === "inquiry-intro")!;
    for (const caption of intro.captions) {
      expect(within(transcript).getByText(caption.lines.join(" "))).toBeInTheDocument();
      for (const note of caption.notes ?? (caption.note ? [caption.note] : [])) {
        expect(within(transcript).getByText(note)).toBeInTheDocument();
      }
    }
  });

  it("presents the 3 finite @dotheory channel streams and ends with a finite completion boundary (Law 3)", () => {
    renderFilmsPage("/films");

    for (const stream of filmsData.streams) {
      expect(
        screen.getByRole("heading", { level: 3, name: stream.title }),
      ).toBeInTheDocument();
    }

    expect(screen.getByText(filmsData.completionNote)).toBeInTheDocument();
  });

  it("keeps the player chrome to the transport: no edition or source switches, acts listed once on the page", () => {
    renderFilmsPage("/films");

    expect(
      screen.queryByRole("group", { name: "Film colour edition" }),
    ).toBeNull();
    expect(screen.queryByRole("group", { name: "Playback source" })).toBeNull();
    // The page lists the acts with their chapters, so the player does not repeat them.
    expect(
      screen.queryByRole("group", { name: "Jump to film act" }),
    ).toBeNull();

    const captionToggle = screen.getByRole("button", {
      name: "Show synchronized caption bar",
    });
    expect(captionToggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(captionToggle);
    expect(
      screen.getByRole("button", { name: "Hide synchronized caption bar" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
