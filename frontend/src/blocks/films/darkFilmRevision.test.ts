import { render } from "@testing-library/react";
import { createElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  CONCEPT_TOUR,
  CONCEPT_TOUR_KEYSTROKES,
  CONCEPT_TOUR_SECONDS,
  TOUR_OPENING_SECONDS,
  tourPartAt,
  type TourPart,
} from "./conceptTour";
import { DarkFilmFrame } from "./DarkFilmPlayer";
import { DarkFilmTrailer } from "./DarkFilmTrailer";
import {
  DARK_FILM_BODY_END,
  DARK_FILM_NARRATION,
  DARK_FILM_KEYSTROKES,
  DARK_FILM_SECONDS,
  DARK_FILM_STARTS,
  DARK_OPENING_SECONDS,
  DARK_TRAILER_KEYSTROKES,
  DARK_TRAILER_LINES,
  DARK_TRAILER_SHOTS,
  darkTrailerShot,
  describeDarkFilmTime,
  originalDarkFilmTime,
  trailerFilmTime,
} from "./darkFilmRevision";

const partIdentity = (part: TourPart) => {
  if (part.kind === "concept") return part.film.id;
  if (part.kind === "interlude") return part.interlude.id;
  if (part.kind === "scene") return part.scene.id;
  return "closing";
};

describe("the dark film's opening trailer", () => {
  const originalBody = CONCEPT_TOUR.filter((part) => part.kind !== "scene");

  it("runs twelve unbroken shots, from the DOT mark to the title, each long enough for its words", () => {
    expect(DARK_TRAILER_SHOTS.map((shot) => shot.kind)).toEqual([
      "mark", "normal", "confused", "health", "unfulfilled", "inherited", "turn", "author", "design", "architecture", "pause", "title",
    ]);
    expect(DARK_TRAILER_SHOTS[0].start).toBe(0);
    DARK_TRAILER_SHOTS.forEach((shot, index) => {
      expect(shot.end - shot.start, shot.kind).toBeGreaterThanOrEqual(shot.design - 1e-6);
      if (index) expect(shot.start).toBe(DARK_TRAILER_SHOTS[index - 1].end);
    });
    expect(DARK_OPENING_SECONDS).toBeGreaterThan(90);
    expect(DARK_OPENING_SECONDS).toBeLessThan(360);
  });

  it("is friendly to read: calm typing, a long hold, and an empty pause between lines", () => {
    for (const typed of DARK_TRAILER_LINES) {
      expect(typed.charsPerSecond, typed.text).toBeLessThanOrEqual(15);
      if (typed.role === "line") expect(typed.until - typed.end, typed.text).toBeGreaterThanOrEqual(2.49);
    }
    const spoken = DARK_TRAILER_LINES.filter((typed) => typed.role === "line");
    spoken.forEach((typed, index) => {
      if (index) expect(typed.start - spoken[index - 1].until, typed.text).toBeGreaterThanOrEqual(1 - 1e-9);
    });
  });

  it("lets the picture carry it: few words, one short line on screen at a time", () => {
    const words = DARK_TRAILER_LINES.reduce((total, typed) => total + typed.text.split(/\s+/).length, 0);
    expect(words).toBeLessThanOrEqual(340);
    for (const typed of DARK_TRAILER_LINES) {
      // Every line fits on a single caption row at the trailer's type size.
      expect(typed.text.length, typed.text).toBeLessThanOrEqual(57);
      expect(typed.end, typed.text).toBeLessThan(typed.until - 1);
      const shot = DARK_TRAILER_SHOTS.find((item) => item.kind === typed.shot)!;
      expect(typed.start, typed.text).toBeGreaterThanOrEqual(shot.start);
      expect(typed.until, typed.text).toBeLessThanOrEqual(shot.end);
    }
    const spoken = DARK_TRAILER_LINES.filter((typed) => typed.role === "line");
    spoken.forEach((typed, index) => {
      if (index) expect(typed.start, typed.text).toBeGreaterThanOrEqual(spoken[index - 1].until);
    });
  });

  it("makes its argument in order, with DOT's claims labelled", () => {
    const texts = DARK_TRAILER_LINES.map((typed) => typed.text);
    expect(texts).toEqual([
      "We go to work. We pay bills. We scroll. We compete.",
      "We call exhaustion adulthood, anxiety responsibility,",
      "isolation independence, and endless accumulation success.",
      "We pretend the picture is coherent.",
      "Let us be honest about why.",
      "Marketing fills every space we look at.",
      "Screens compete for every minute of our attention.",
      "Money speaks, and most of us listen.",
      "And slowly, we stop caring for each other.",
      "An unresolved thought could change sleep,",
      "muscle tension, digestion, attention, and behavior.",
      "Worth becomes achievement. Rest becomes laziness.",
      "Success may bring relief, but only briefly.",
      "A persistent sense that something essential is missing.",
      "Culture arrives through language, permitted emotions,",
      "authority, admired people, and expected futures.",
      "Schools, religions, entertainment, work, law, and markets",
      "carry it into daily life.",
      "Much of it is absorbed before it can be named.",
      "We are not immune to our culture or our surroundings.",
      "This culture works against human development.",
      "None of that is your fault.",
      "But undoing it is your responsibility.",
      "So where do you begin?",
      "The most immediate fact of your existence",
      "is not a measurement.",
      "It is that you are here to experience one.",
      "My name is Henok.",
      "I don’t claim to know everything.",
      "But I feel the erosion. I see the despair.",
      "I pursued these questions while raising a family,",
      "carrying debt, and making mistakes.",
      "I have spent my career in software and AI.",
      "Now I am stepping away from it to share this work.",
      "I call it Digital Organism Theory.",
      "I believe we need a cultural revolution,",
      "and DOT aims to be its foundation.",
      "You are Little c.",
      "Your living body is your interface to a Reality Frame.",
      "This world, RF₀, is an experience laboratory.",
      "Conditioning is real. Conditioning is not essence.",
      "What matters is what Little c does with the opening.",
      "Freedom is participation in the creation of possibility.",
      "Digital Organism Theory",
      "A school of thought for examining experience.",
    ]);
    const voiceOf = (text: string) => DARK_TRAILER_LINES.find((typed) => typed.text === text)!.voice;
    expect(voiceOf("You are Little c.")).toBe("dot");
    expect(voiceOf("Your living body is your interface to a Reality Frame.")).toBe("dot");
    expect(voiceOf("This world, RF₀, is an experience laboratory.")).toBe("dot");
    expect(DARK_TRAILER_LINES.filter((typed) => typed.voice)).toHaveLength(4);
  });

  it("reveals the architecture with T × E outermost, the field Big C emerged within (ADR-0026)", () => {
    const architecture = DARK_TRAILER_SHOTS.find((shot) => shot.kind === "architecture")!;
    expect(architecture.description).toContain("RF₀ and Little c are both within Big C");
    expect(architecture.description).toContain("Little c outside RF₀");
    expect(architecture.description).toContain("T × E is labelled Speculation");
    expect(architecture.description).not.toMatch(/capacit/i);
  });

  it("shows RF₀ as an experience laboratory and traces its Stream to Little c before the title", () => {
    const architecture = DARK_TRAILER_SHOTS.find((shot) => shot.kind === "architecture")!;
    const line = DARK_TRAILER_LINES.find((typed) => typed.shot === "architecture")!;
    expect(line.text).toBe("This world, RF₀, is an experience laboratory.");
    expect(line.voice).toBe("dot");
    expect(line.until - line.end).toBeGreaterThanOrEqual(2.9);

    const view = render(createElement(DarkFilmTrailer, { seconds: trailerFilmTime(architecture.designStart + 8), still: false }));
    const stream = view.container.querySelector(".dark-trailer-lab-stream")!;
    const receiver = view.container.querySelector(".dark-trailer-lab-receiver")!;
    expect(Number(stream.getAttribute("stroke-dashoffset"))).toBeGreaterThan(0);
    expect(Number(stream.getAttribute("stroke-dashoffset"))).toBeLessThan(1);
    expect(receiver).toHaveAttribute("opacity", "0");

    view.rerender(createElement(DarkFilmTrailer, { seconds: architecture.start, still: true }));
    expect(view.container.querySelector(".dark-trailer-lab-stream")).toHaveAttribute("stroke-dashoffset", "0");
    expect(view.container.querySelector(".dark-trailer-lab-receiver")).toHaveAttribute("stroke-dashoffset", "0");
    expect(view.getByText(line.text, { selector: ".sr-only" })).toBeInTheDocument();
    view.unmount();
  });

  it("stays with one person: no crowd, no illustrations, and options after the box dissolves", () => {
    for (const shot of DARK_TRAILER_SHOTS) {
      const view = render(createElement(DarkFilmTrailer, { seconds: (shot.start + shot.end) / 2 }));
      expect(view.container.querySelector("image"), shot.kind).toBeNull();
      view.unmount();
    }
    const options = render(createElement(DarkFilmTrailer, { seconds: trailerFilmTime(55.9) }));
    expect(options.container.querySelectorAll('.dark-trailer-drawing circle[r="14"]')).toHaveLength(6);
    options.unmount();
  });

  it("opens on the DOT mark, then an ordinary day, and names what the person's body carries", () => {
    const [mark, normal] = DARK_TRAILER_SHOTS;
    const view = render(createElement(DarkFilmTrailer, { seconds: mark.end - 1 }));
    expect(view.getByRole("img", { name: "DOT" })).toBeInTheDocument();
    expect(view.getByText("Digital Organism Theory")).toBeInTheDocument();
    view.rerender(createElement(DarkFilmTrailer, { seconds: normal.end - 2 }));
    expect(view.container.querySelector(".dark-trailer-drawing path")).not.toBeNull();
    const health = DARK_TRAILER_SHOTS.find((shot) => shot.kind === "health")!;
    view.rerender(createElement(DarkFilmTrailer, { seconds: health.end - 1 }));
    for (const name of ["SLEEP", "TENSION", "DIGESTION", "ATTENTION", "BEHAVIOR"]) expect(view.getByText(name)).toBeInTheDocument();
    view.unmount();
  });

  it("ends by holding on the DOT mark, with its name, until the film stops", () => {
    const frame = (seconds: number, burnIn: boolean) =>
      createElement(MemoryRouter, null, createElement(DarkFilmFrame, { seconds, still: false, burnIn }));
    const view = render(frame(DARK_FILM_SECONDS, true));
    expect(view.container.querySelector(".dark-trailer-mark .do-wordmark")).not.toBeNull();
    // Exported video shows the mark alone; the website adds the ways onward.
    expect(view.container.querySelector(".dark-trailer-mark-links")).toBeNull();
    view.rerender(frame(DARK_FILM_SECONDS, false));
    expect(view.getByRole("link", { name: "Read Book One" })).toHaveAttribute("href", "/book/digital-organism-theory");
    expect(view.container.querySelector(".dark-trailer-mark")).toHaveTextContent("dotheory.org");
    // No progress line over either splash.
    expect(view.container.querySelector(".dark-film-progress")).toBeNull();
    expect(view.container.querySelector(".dark-film-lesson")).toBeNull();
    view.rerender(frame(DARK_FILM_BODY_END - 1, false));
    expect(view.container.querySelector(".dark-trailer-mark")).toBeNull();
    view.unmount();
  });

  it("narrates every typed line of the opening, then each concept, the interlude and the closing, in order", () => {
    expect(DARK_FILM_NARRATION.slice(0, DARK_TRAILER_LINES.length).map(({ text }) => text)).toEqual(DARK_TRAILER_LINES.map(({ text }) => text));
    expect(DARK_FILM_NARRATION).toHaveLength(DARK_TRAILER_LINES.length + 17 + 1 + 1);
    DARK_FILM_NARRATION.forEach((line, index) => {
      expect(line.until, line.text).toBeGreaterThan(line.start);
      if (index) expect(line.start, line.text).toBeGreaterThan(DARK_FILM_NARRATION[index - 1].start);
    });
    expect(DARK_FILM_NARRATION.at(-1)!.text).toBe("Become a student of your own experience.");
  });

  it("draws in the tone it is given: light lines on the dark stage, dark lines on the light one", () => {
    const strokes = (tone: "dark" | "light") => {
      const view = render(createElement(DarkFilmTrailer, { seconds: DARK_TRAILER_SHOTS.find((shot) => shot.kind === "turn")!.start + 1, still: true, tone }));
      const figure = view.container.querySelector(".dark-trailer-drawing g[stroke]")!;
      const stroke = figure.getAttribute("stroke");
      view.unmount();
      return stroke;
    };
    expect(strokes("dark")).toBe("#f2f0e8");
    expect(strokes("light")).toBe("#17271f");
  });

  it("draws each shot, shows its words, and settles into a stable still frame under reduced motion", () => {
    for (const shot of DARK_TRAILER_SHOTS) {
      const view = render(createElement(DarkFilmTrailer, { seconds: shot.start + 0.01, still: true }));
      const section = view.container.querySelector("[data-trailer-shot]")!;
      expect(section).toHaveAttribute("data-trailer-shot", shot.kind);
      expect(view.getByText(shot.description)).toBeInTheDocument();
      const first = view.container.innerHTML;
      view.rerender(createElement(DarkFilmTrailer, { seconds: shot.end - 0.1, still: true }));
      expect(view.container.innerHTML, shot.kind).toBe(first);
      const lines = view.container.querySelectorAll(`[data-trailer-line="${shot.kind}"]`);
      // The mark is the one shot without typed words.
      if (shot.kind !== "mark") expect(lines.length, shot.kind).toBeGreaterThan(0);
      if (shot.kind === "title") {
        expect(Number((view.container.querySelector(".dark-trailer-arch") as HTMLElement).style.opacity)).toBeGreaterThanOrEqual(.8);
      }
      view.unmount();
    }
  });

  it("joins the trailer to every original concept, interlude, and closing without gaps", () => {
    expect(DARK_FILM_STARTS[0]).toBe(0);
    expect(DARK_FILM_STARTS[1]).toBe(DARK_OPENING_SECONDS);

    const body = DARK_FILM_STARTS.slice(1, -1);
    expect(DARK_FILM_STARTS.at(-1)).toBe(DARK_FILM_BODY_END);
    const visited = body.map((at) => tourPartAt(originalDarkFilmTime(at)));
    expect(visited.map(partIdentity)).toEqual(originalBody.map(partIdentity));

    const boundaries = [...body, DARK_FILM_BODY_END];
    originalBody.forEach((part, index) => {
      const start = boundaries[index];
      const end = boundaries[index + 1];
      expect(end - start, partIdentity(part)).toBe(part.end - part.start);
      expect(originalDarkFilmTime(start)).toBe(part.start);
      expect(tourPartAt(originalDarkFilmTime((start + end) / 2))).toBe(part);
    });
  });

  it("hands off at the exact trailer boundary and keeps each shot and the final frame addressable", () => {
    expect(DARK_OPENING_SECONDS).toBe(341);
    expect(DARK_FILM_SECONDS).toBe(643);
    expect(describeDarkFilmTime(DARK_OPENING_SECONDS - 0.001)).toBe("Opening: Digital Organism Theory");
    expect(originalDarkFilmTime(DARK_OPENING_SECONDS)).toBe(TOUR_OPENING_SECONDS);
    expect(describeDarkFilmTime(DARK_OPENING_SECONDS)).toMatch(/^Concept 1 of /);
    DARK_TRAILER_SHOTS.forEach((shot) => {
      expect(darkTrailerShot(shot.start)).toBe(shot);
      expect(darkTrailerShot(shot.end - 0.001)).toBe(shot);
    });
    expect(originalDarkFilmTime(DARK_FILM_SECONDS)).toBe(CONCEPT_TOUR_SECONDS);
    expect(describeDarkFilmTime(DARK_FILM_BODY_END - 0.001)).toBe("Closing title");
    expect(describeDarkFilmTime(DARK_FILM_SECONDS)).toBe("DOT");
  });

  it("types only the trailer's few words, rings four bells, then preserves every body keystroke", () => {
    const trailerKeys = DARK_FILM_KEYSTROKES.filter((key) => key.at < DARK_OPENING_SECONDS);
    expect(trailerKeys).toEqual(DARK_TRAILER_KEYSTROKES);
    const letters = DARK_TRAILER_LINES.reduce((total, typed) => total + typed.text.length, 0);
    expect(trailerKeys.filter((key) => key.kind !== "bell")).toHaveLength(letters);
    expect(trailerKeys.filter((key) => key.kind === "bell")).toHaveLength(4);

    const originalKeys = CONCEPT_TOUR_KEYSTROKES.filter((key) => key.at >= TOUR_OPENING_SECONDS);
    const bodyKeys = DARK_FILM_KEYSTROKES.filter((key) => key.at >= DARK_OPENING_SECONDS);
    expect(bodyKeys).toHaveLength(originalKeys.length);
    bodyKeys.forEach((key, index) => {
      expect(key.kind).toBe(originalKeys[index].kind);
      expect(originalDarkFilmTime(key.at)).toBeCloseTo(originalKeys[index].at, 8);
    });
  });
});
