import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import {
  CONCEPT_TOUR,
  CONCEPT_TOUR_KEYSTROKES,
  CONCEPT_TOUR_SECONDS,
  TOUR_OPENING_SECONDS,
  tourPartAt,
  type TourPart,
} from "./conceptTour";
import { DarkFilmTrailer } from "./DarkFilmTrailer";
import {
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
} from "./darkFilmRevision";

const partIdentity = (part: TourPart) => {
  if (part.kind === "concept") return part.film.id;
  if (part.kind === "interlude") return part.interlude.id;
  if (part.kind === "scene") return part.scene.id;
  return "closing";
};

describe("the dark film's opening trailer", () => {
  const originalBody = CONCEPT_TOUR.filter((part) => part.kind !== "scene");

  it("runs nine unbroken shots, from the body to the title, each long enough for its words", () => {
    expect(DARK_TRAILER_SHOTS.map((shot) => shot.kind)).toEqual([
      "body", "senses", "design", "mistake", "pain", "nudge", "pause", "architecture", "title",
    ]);
    expect(DARK_TRAILER_SHOTS[0].start).toBe(0);
    DARK_TRAILER_SHOTS.forEach((shot, index) => {
      expect(shot.end - shot.start, shot.kind).toBeGreaterThanOrEqual(shot.design);
      if (index) expect(shot.start).toBe(DARK_TRAILER_SHOTS[index - 1].end);
    });
    expect(DARK_OPENING_SECONDS).toBeGreaterThan(90);
    expect(DARK_OPENING_SECONDS).toBeLessThan(180);
  });

  it("is friendly to read: calm typing, a long hold, and an empty pause between lines", () => {
    for (const typed of DARK_TRAILER_LINES) {
      expect(typed.charsPerSecond, typed.text).toBeLessThanOrEqual(15);
      if (typed.role === "line") expect(typed.until - typed.end, typed.text).toBeGreaterThanOrEqual(2.5);
    }
    const spoken = DARK_TRAILER_LINES.filter((typed) => typed.role === "line");
    spoken.forEach((typed, index) => {
      if (index) expect(typed.start - spoken[index - 1].until, typed.text).toBeGreaterThanOrEqual(1);
    });
  });

  it("lets the picture carry it: few words, one short line on screen at a time", () => {
    const words = DARK_TRAILER_LINES.reduce((total, typed) => total + typed.text.split(/\s+/).length, 0);
    expect(words).toBeLessThanOrEqual(110);
    for (const typed of DARK_TRAILER_LINES) {
      // Every line fits on a single caption row at the trailer's type size.
      expect(typed.text.length, typed.text).toBeLessThanOrEqual(56);
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

  it("speaks as a careful scientist: observation first, DOT's claims and the prevailing view each labelled", () => {
    const texts = DARK_TRAILER_LINES.map((typed) => typed.text);
    expect(texts).toEqual([
      "Every observation begins as an experience.",
      "Your perception is formed from sensory data.",
      "The sensory apparatus is not the whole story.",
      "You are Little c.",
      "The body is your interface.",
      "“You’re nothing but a pack of neurons.”",
      "Yet experience itself stays outside the equations.",
      "We map the world in detail; ourselves, far less.",
      "Others fill the gap: markets, platforms, ideologies.",
      "The body protests: stress, anxiety, burnout.",
      "We treat the signal more than its source.",
      "The costs compound: division, despair, conflict.",
      "At root, this is a problem of knowledge.",
      "Notice who is experiencing.",
      "Test this against your own experience.",
      "Digital Organism Theory",
      "A pragmatic, testable framework for experience.",
    ]);
    const voiceOf = (text: string) => DARK_TRAILER_LINES.find((typed) => typed.text === text)!.voice;
    expect(voiceOf("You are Little c.")).toBe("dot");
    expect(voiceOf("The body is your interface.")).toBe("dot");
    // The prevailing view is quoted from its source, never paraphrased into a straw man.
    const quote = DARK_TRAILER_LINES.find((typed) => typed.voice === "prevailing")!;
    expect(quote.text).toBe("“You’re nothing but a pack of neurons.”");
    expect(quote.cite).toBe("Francis Crick, The Astonishing Hypothesis, 1994");
    expect(voiceOf("Yet experience itself stays outside the equations.")).toBeUndefined();
    expect(DARK_TRAILER_LINES.filter((typed) => typed.voice)).toHaveLength(3);
    const senses = DARK_TRAILER_SHOTS.find((shot) => shot.kind === "senses")!;
    for (const sense of ["sight", "sound", "smell", "touch", "taste"]) expect(senses.description).toContain(sense);
  });

  it("reveals the architecture with T × E outermost, the field Big C emerged within (ADR-0026)", () => {
    const architecture = DARK_TRAILER_SHOTS.find((shot) => shot.kind === "architecture")!;
    expect(architecture.description).toMatch(/RF₀ and Big C to the T × E field that Big C emerged within/);
    expect(architecture.description).not.toMatch(/capacit/i);
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
      // The architecture speaks through its own labels.
      if (shot.kind !== "architecture") expect(lines.length, shot.kind).toBeGreaterThan(0);
      view.unmount();
    }
  });

  it("joins the trailer to every original concept, interlude, and closing without gaps", () => {
    expect(DARK_FILM_STARTS[0]).toBe(0);
    expect(DARK_FILM_STARTS[1]).toBe(DARK_OPENING_SECONDS);

    const visited = DARK_FILM_STARTS.slice(1).map((at) => tourPartAt(originalDarkFilmTime(at)));
    expect(visited.map(partIdentity)).toEqual(originalBody.map(partIdentity));

    const boundaries = [...DARK_FILM_STARTS.slice(1), DARK_FILM_SECONDS];
    originalBody.forEach((part, index) => {
      const start = boundaries[index];
      const end = boundaries[index + 1];
      expect(end - start, partIdentity(part)).toBe(part.end - part.start);
      expect(originalDarkFilmTime(start)).toBe(part.start);
      expect(tourPartAt(originalDarkFilmTime((start + end) / 2))).toBe(part);
    });
  });

  it("hands off at the exact trailer boundary and keeps each shot and the final frame addressable", () => {
    expect(describeDarkFilmTime(DARK_OPENING_SECONDS - 0.001)).toBe("Opening: Digital Organism Theory");
    expect(originalDarkFilmTime(DARK_OPENING_SECONDS)).toBe(TOUR_OPENING_SECONDS);
    expect(describeDarkFilmTime(DARK_OPENING_SECONDS)).toMatch(/^Concept 1 of /);
    DARK_TRAILER_SHOTS.forEach((shot) => {
      expect(darkTrailerShot(shot.start)).toBe(shot);
      expect(darkTrailerShot(shot.end - 0.001)).toBe(shot);
    });
    expect(originalDarkFilmTime(DARK_FILM_SECONDS)).toBe(CONCEPT_TOUR_SECONDS);
    expect(describeDarkFilmTime(DARK_FILM_SECONDS)).toBe("Closing title");
  });

  it("types only the trailer's few words, rings three bells, then preserves every body keystroke", () => {
    const trailerKeys = DARK_FILM_KEYSTROKES.filter((key) => key.at < DARK_OPENING_SECONDS);
    expect(trailerKeys).toEqual(DARK_TRAILER_KEYSTROKES);
    const letters = DARK_TRAILER_LINES.reduce((total, typed) => total + typed.text.length, 0);
    expect(trailerKeys.filter((key) => key.kind !== "bell")).toHaveLength(letters);
    expect(trailerKeys.filter((key) => key.kind === "bell")).toHaveLength(3);

    const originalKeys = CONCEPT_TOUR_KEYSTROKES.filter((key) => key.at >= TOUR_OPENING_SECONDS);
    const bodyKeys = DARK_FILM_KEYSTROKES.filter((key) => key.at >= DARK_OPENING_SECONDS);
    expect(bodyKeys).toHaveLength(originalKeys.length);
    bodyKeys.forEach((key, index) => {
      expect(key.kind).toBe(originalKeys[index].kind);
      expect(originalDarkFilmTime(key.at)).toBeCloseTo(originalKeys[index].at, 8);
    });
  });
});
