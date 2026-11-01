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
import amm from "../../content/amm.json";
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
  TRAILER_PLATES,
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

  it("runs thirteen unbroken shots, from the DOT mark to the title, each long enough for its words", () => {
    expect(DARK_TRAILER_SHOTS.map((shot) => shot.kind)).toEqual([
      "mark", "normal", "pretence", "struggle", "blame", "taught", "cost", "erosion", "turn", "design", "architecture", "pause", "title",
    ]);
    expect(DARK_TRAILER_SHOTS[0].start).toBe(0);
    DARK_TRAILER_SHOTS.forEach((shot, index) => {
      expect(shot.end - shot.start, shot.kind).toBeGreaterThanOrEqual(shot.design);
      if (index) expect(shot.start).toBe(DARK_TRAILER_SHOTS[index - 1].end);
    });
    expect(DARK_OPENING_SECONDS).toBeGreaterThan(90);
    expect(DARK_OPENING_SECONDS).toBeLessThan(230);
  });

  it("is friendly to read: calm typing, a long hold, and an empty pause between lines", () => {
    for (const typed of DARK_TRAILER_LINES) {
      expect(typed.charsPerSecond, typed.text).toBeLessThanOrEqual(15);
      if (typed.role === "line") expect(typed.until - typed.end, typed.text).toBeGreaterThanOrEqual(2.49);
    }
    const spoken = DARK_TRAILER_LINES.filter((typed) => typed.role === "line");
    spoken.forEach((typed, index) => {
      if (index) expect(typed.start - spoken[index - 1].until, typed.text).toBeGreaterThanOrEqual(1);
    });
  });

  it("lets the picture carry it: few words, one short line on screen at a time", () => {
    const words = DARK_TRAILER_LINES.reduce((total, typed) => total + typed.text.split(/\s+/).length, 0);
    expect(words).toBeLessThanOrEqual(185);
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
      "The body tightens. Attention fragments.",
      "Trust declines. Meaning thins.",
      "The citizen is blamed. The architecture remains.",
      "A society may generate enormous wealth",
      "and still fail to teach people how to confront fear,",
      "govern attention, inspect inherited identity,",
      "or distinguish freedom from consumption.",
      "A public can lose the habit",
      "of requiring power to answer for its conduct",
      "while continuing to describe itself as free.",
      "Without a truthful framework, morality erodes.",
      "So where does a truthful framework begin?",
      "The most immediate fact of your existence",
      "is not a measurement.",
      "It is that you are here to experience one.",
      "You are Little c.",
      "Your living body is your interface to a Reality Frame.",
      "RF₀ is an experience laboratory for Little cs.",
      "Conditioning is real. Conditioning is not essence.",
      "What matters is what Little c does with the opening.",
      "Freedom is participation in the creation of possibility.",
      "Digital Organism Theory",
      "A school of thought for examining experience.",
    ]);
    const voiceOf = (text: string) => DARK_TRAILER_LINES.find((typed) => typed.text === text)!.voice;
    expect(voiceOf("You are Little c.")).toBe("dot");
    expect(voiceOf("Your living body is your interface to a Reality Frame.")).toBe("dot");
    expect(voiceOf("RF₀ is an experience laboratory for Little cs.")).toBe("dot");
    // The author's thesis is labelled as a proposal, never stated as settled fact.
    expect(voiceOf("Without a truthful framework, morality erodes.")).toBe("dot");
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
    expect(line.text).toBe("RF₀ is an experience laboratory for Little cs.");
    expect(line.voice).toBe("dot");
    expect(line.until - line.end).toBeGreaterThan(3);

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

  it("brings the culture's own messages to the one person, then opens that person's options", () => {
    const culture = render(createElement(DarkFilmTrailer, { seconds: trailerFilmTime(40.5) }));
    expect(culture.container.querySelector(".dark-trailer-drawing")).toHaveTextContent("You have no choice.");
    expect(amm.home.concepts.map((concept) => concept.script)).toContain("You have no choice.");
    culture.unmount();

    const options = render(createElement(DarkFilmTrailer, { seconds: trailerFilmTime(55.9) }));
    expect(options.container.querySelectorAll('.dark-trailer-drawing circle[r="14"]')).toHaveLength(6);
    options.unmount();
  });

  it("opens on an ordinary day, then shows the AMM's illustrations with their disclosure", () => {
    const [mark, normal, pretence] = DARK_TRAILER_SHOTS;
    const view = render(createElement(DarkFilmTrailer, { seconds: normal.end - 2 }));
    expect(view.container.querySelector(".dark-trailer-drawing rect")).not.toBeNull();
    expect(view.container.querySelector(".dark-trailer-plate")).toBeNull();
    for (const kind of Object.keys(TRAILER_PLATES)) {
      const shot = DARK_TRAILER_SHOTS.find((item) => item.kind === kind)!;
      view.rerender(createElement(DarkFilmTrailer, { seconds: shot.start + 2 }));
      expect(view.container.querySelector(".dark-trailer-plate image")).toHaveAttribute("href", TRAILER_PLATES[kind as keyof typeof TRAILER_PLATES].src);
      expect(view.getByText("AI-generated illustration, directed by the author. A visual metaphor.")).toBeInTheDocument();
    }
    expect(pretence.kind).toBe("pretence");
    view.rerender(createElement(DarkFilmTrailer, { seconds: mark.end - 1 }));
    expect(view.getByRole("img", { name: "DOT" })).toBeInTheDocument();
    expect(view.getByText("Digital Organism Theory")).toBeInTheDocument();
    view.unmount();
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
    expect(DARK_OPENING_SECONDS).toBe(206);
    expect(DARK_FILM_SECONDS).toBe(503);
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
