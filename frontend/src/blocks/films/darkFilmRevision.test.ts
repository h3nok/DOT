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
import { DarkFilmTrailer, LONG_LINE } from "./DarkFilmTrailer";
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

  it("runs thirteen unbroken shots, from the DOT mark to the title, each long enough for its words", () => {
    expect(DARK_TRAILER_SHOTS.map((shot) => shot.kind)).toEqual([
      "mark", "normal", "confused", "erosion", "health", "inherited", "unfulfilled", "turn", "purpose", "design", "architecture", "pause", "title",
    ]);
    expect(DARK_TRAILER_SHOTS[0].start).toBe(0);
    DARK_TRAILER_SHOTS.forEach((shot, index) => {
      expect(shot.end - shot.start, shot.kind).toBeGreaterThanOrEqual(shot.design - 1e-6);
      if (index) expect(shot.start).toBe(DARK_TRAILER_SHOTS[index - 1].end);
    });
    expect(DARK_OPENING_SECONDS).toBeGreaterThan(90);
    expect(DARK_OPENING_SECONDS).toBeLessThan(700);
  });

  it("is friendly to read: calm typing, a long hold, and an empty pause between lines", () => {
    for (const typed of DARK_TRAILER_LINES) {
      expect(typed.charsPerSecond, typed.text).toBeLessThanOrEqual(15);
      if (typed.role === "line") expect(typed.until - typed.end, typed.text).toBeGreaterThanOrEqual(1.99);
    }
    const spoken = DARK_TRAILER_LINES.filter((typed) => typed.role === "line");
    spoken.forEach((typed, index) => {
      if (index) expect(typed.start - spoken[index - 1].until, typed.text).toBeGreaterThanOrEqual(0.6 - 1e-9);
    });
  });

  it("keeps one line on screen at a time: one row, or two smaller rows for a long line", () => {
    for (const typed of DARK_TRAILER_LINES) {
      // Past one caption row, a line is set smaller and wraps; it must still fit in two rows.
      expect(typed.text.length, typed.text).toBeLessThanOrEqual(LONG_LINE * 2.8);
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
      "We speak proudly of freedom.",
      "Then we go quiet when exercising it might cost us our place.",
      "Here in America, we are very comfortable calling ourselves advanced.",
      "But advanced at what? Producing more? Predicting behavior? Getting people to comply?",
      "I am asking whether the person is developing along with the machinery.",
      "Are we becoming more capable of examining our beliefs, choosing deliberately, and caring for one another?",
      "Because if those capacities are diminishing, I call that regression. Our machines cannot develop our awareness on our behalf.",
      "Beneath all of this is a moral erosion.",
      "We are taught that anyone can be anything.",
      "It sounds like freedom. It is unrealistic, and it is no moral foundation.",
      "We learn what we could become. We are rarely asked what is good.",
      "And the establishment has to answer for its part in this. The scientific community included.",
      "Scientific institutions are part of society. They do not float above money, prestige, or power.",
      "What gets funded? Which questions become respectable? And whose purposes does the work serve?",
      "When your research makes people easier to predict, persuade, and control, whose freedom are you expanding?",
      "You cannot help build those tools and declare their consequences somebody else’s problem.",
      "Nor can you present your assumptions as established knowledge simply because you have a title.",
      "Show us the evidence. Explain its limits. Respect for expertise should not require the surrender of judgment.",
      "And helping a worker endure more does not answer whether more should be demanded of them.",
      "Civilization does not arrive inside you labeled civilization. It arrives as ordinary life.",
      "Through what your family praises, what your school rewards, and what your employer will tolerate.",
      "It teaches you what to want, whom to believe, and which questions might cost you your place.",
      "Eventually, its expectations begin to sound like your own thoughts.",
      "By the time you question the world, much of that world is already participating in the questioning.",
      "You inherited a Painting already begun. I did too.",
      "You tell yourself you are fine. But at night, you rehearse the words you were afraid to say.",
      "Then, in the morning, you go back to proving your worth. Somewhere along the way, earning a living became proving that you deserve one.",
      "I am not describing this to look down on the person caught inside it. I am asking how we help one another get free.",
      "An arrangement can benefit from the very condition that is hurting the people inside it.",
      "If insecurity keeps you buying and fear keeps you obedient, somebody can profit from keeping you unsettled.",
      "No one has to coordinate every part of it. The rewards can keep it going.",
      "In the American Millennial Manifesto, I call this extractive logic the Leech.",
      "DOT asks what it would mean for the person inside that arrangement to develop, rather than merely adapt.",
      "The most immediate fact of your existence is not a measurement.",
      "It is that you are here to experience one. The observer belongs in the inquiry.",
      "Feeling must be treated as data. But feeling is not automatically truth.",
      "Digital Organism Theory is the framework I have been building around these questions.",
      "It is a construction, not a revelation. Examine it. I am not asking you to replace their authority with mine.",
      "In DOT, the purpose is expansion of awareness.",
      "I do not mean collecting more information. I mean becoming more capable of seeing, understanding, and choosing.",
      "That requires mental focus. The ability to stay with experience long enough to examine it, including what you would rather avoid.",
      "In DOT, that capacity depends on internal coherence—on becoming less divided by fear, self-deception, and the defense of identity.",
      "Coherence is not certainty. You can be very certain and very wrong. There has to be room for correction.",
      "The purpose is not to become better at defending what you already believe. It is to become capable of understanding what you could not see before.",
      "And we can help one another do this. We can make it possible to question, to admit uncertainty, and to change without humiliation.",
      "DOT calls the local experiencer Little c.",
      "It proposes that your living body is your interface to a Reality Frame, not the whole of what you are.",
      "Think of a musician and an instrument. They work together, but they are not the same thing.",
      "This world, RF₀, is modeled as an experience laboratory. You act within its rules, encounter consequences, and carry something of the experience forward.",
      "But experience does not automatically become understanding. What matters is what you do with it.",
      "Conditioning is real. But in DOT’s language, the Painting is not the painter.",
      "You can notice an impulse without immediately obeying it. The conditioning is still there, but your relationship to it can change.",
      "Freedom is participation in the creation of possibility. That includes making room for someone else’s freedom.",
      "This cannot remain private work. We need time to think, enough security to speak honestly, and institutions that do not punish us for questioning them.",
      "That is what I believe a civilization should be for. Helping awareness expand—not making human beings easier to manage.",
      "Digital Organism Theory",
      "A school of thought for examining experience and expanding awareness.",
    ]);
    const voiceOf = (text: string) => DARK_TRAILER_LINES.find((typed) => typed.text === text)!.voice;
    expect(voiceOf("In DOT, the purpose is expansion of awareness.")).toBe("dot");
    expect(voiceOf("DOT calls the local experiencer Little c.")).toBe("dot");
    expect(voiceOf("It proposes that your living body is your interface to a Reality Frame, not the whole of what you are.")).toBe("dot");
    expect(voiceOf("But experience does not automatically become understanding. What matters is what you do with it.")).toBeUndefined();
    expect(DARK_TRAILER_LINES.filter((typed) => typed.voice)).toHaveLength(6);
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
    const line = DARK_TRAILER_LINES.find((typed) => typed.shot === "architecture" && typed.text.startsWith("This world"))!;
    expect(line.text).toBe("This world, RF₀, is modeled as an experience laboratory. You act within its rules, encounter consequences, and carry something of the experience forward.");
    expect(line.voice).toBe("dot");
    expect(line.until - line.end).toBeGreaterThanOrEqual(2);

    const view = render(createElement(DarkFilmTrailer, { seconds: trailerFilmTime(architecture.designStart + 8), still: false }));
    const stream = view.container.querySelector(".dark-trailer-lab-stream")!;
    const receiver = view.container.querySelector(".dark-trailer-lab-receiver")!;
    expect(Number(stream.getAttribute("stroke-dashoffset"))).toBeGreaterThan(0);
    expect(Number(stream.getAttribute("stroke-dashoffset"))).toBeLessThan(1);
    expect(receiver).toHaveAttribute("opacity", "0");

    view.rerender(createElement(DarkFilmTrailer, { seconds: architecture.start, still: true }));
    expect(view.container.querySelector(".dark-trailer-lab-stream")).toHaveAttribute("stroke-dashoffset", "0");
    expect(view.container.querySelector(".dark-trailer-lab-receiver")).toHaveAttribute("stroke-dashoffset", "0");
    // Reduced motion holds the shot's last line.
    expect(view.getByText("But experience does not automatically become understanding. What matters is what you do with it.", { selector: ".sr-only" })).toBeInTheDocument();
    view.unmount();
  });

  it("stays with one person, but for the AMM's own illustration of moral erosion, which says it is AI-generated", () => {
    for (const shot of DARK_TRAILER_SHOTS) {
      const view = render(createElement(DarkFilmTrailer, { seconds: (shot.start + shot.end) / 2 }));
      if (shot.kind === "erosion") {
        expect(view.container.querySelector("image")).toHaveAttribute("href", "/amm/media/erosion-1536.webp");
        expect(view.container.querySelector(".dark-trailer-plate-note")).toHaveTextContent("AI-generated illustration, directed by the author. A visual metaphor.");
      } else {
        expect(view.container.querySelector("image"), shot.kind).toBeNull();
        expect(view.container.querySelector(".dark-trailer-plate-note"), shot.kind).toBeNull();
      }
      view.unmount();
    }
    const options = render(createElement(DarkFilmTrailer, { seconds: trailerFilmTime(55.9) }));
    expect(options.container.querySelectorAll('.dark-trailer-drawing circle[r="14"]')).toHaveLength(6);
    options.unmount();
  });

  it("opens on the DOT mark, then an ordinary day, and marks what research can be made to do to a person", () => {
    const [mark, normal] = DARK_TRAILER_SHOTS;
    const view = render(createElement(DarkFilmTrailer, { seconds: mark.end - 1 }));
    expect(view.getByRole("img", { name: "DOT" })).toBeInTheDocument();
    expect(view.getByText("Digital Organism Theory")).toBeInTheDocument();
    view.rerender(createElement(DarkFilmTrailer, { seconds: normal.end - 2 }));
    expect(view.container.querySelector(".dark-trailer-drawing path")).not.toBeNull();
    const health = DARK_TRAILER_SHOTS.find((shot) => shot.kind === "health")!;
    view.rerender(createElement(DarkFilmTrailer, { seconds: health.end - 1 }));
    for (const name of ["PREDICTED", "PERSUADED", "CONTROLLED", "ENDURE MORE"]) expect(view.getByText(name)).toBeInTheDocument();
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

  it("with the author's voice, shows a few whole pull quotes, never fragments, and names DOT's claims steadily", () => {
    const cards = DARK_TRAILER_LINES.filter((typed) => typed.card);
    expect(cards.map(({ card }) => card)).toEqual([
      "We call exhaustion adulthood",
      "But advanced at what?",
      "We are rarely asked what is good.",
      "Respect for expertise should not require the surrender of judgment.",
      "You inherited a Painting already begun.",
      "earning a living became proving that you deserve one.",
      "somebody can profit from keeping you unsettled.",
      "Feeling must be treated as data.",
      "It is a construction, not a revelation.",
      "In DOT, the purpose is expansion of awareness.",
      "Coherence is not certainty.",
      "DOT calls the local experiencer Little c.",
      "the Painting is not the painter.",
      "Helping awareness expand—not making human beings easier to manage.",
    ]);
    for (const typed of cards) expect(typed.text).toContain(typed.card);
    // The film introduces the theory, not its author.
    expect(DARK_TRAILER_SHOTS.map(({ kind }) => kind as string)).not.toContain("author");
    expect(DARK_TRAILER_LINES.some((typed) => /\bmy name\b/i.test(typed.text))).toBe(false);

    // A line without a pull quote leaves the picture alone.
    const line = DARK_TRAILER_LINES.find((typed) => typed.text === "We go to work. We pay bills. We scroll. We compete.")!;
    const view = render(createElement(DarkFilmTrailer, { seconds: line.until - 1, captions: "spoken" }));
    expect(view.container.querySelector(".dark-trailer-pull")).toBeNull();
    expect(view.container.querySelector(".dark-trailer-line")).toBeNull();
    const quote = DARK_TRAILER_LINES.find((typed) => typed.card === "Coherence is not certainty.")!;
    view.rerender(createElement(DarkFilmTrailer, { seconds: quote.until - 1, captions: "spoken" }));
    expect(view.container.querySelector(".dark-trailer-pull p")).toHaveTextContent(/^Coherence is not certainty\.$/);
    // A quote taken from mid-sentence still opens as a sentence.
    const middle = DARK_TRAILER_LINES.find((typed) => typed.card === "somebody can profit from keeping you unsettled.")!;
    view.rerender(createElement(DarkFilmTrailer, { seconds: middle.until - 1, captions: "spoken" }));
    expect(view.container.querySelector(".dark-trailer-pull p")).toHaveTextContent(/^Somebody can profit from keeping you unsettled\.$/);
    // One label holds through the pauses between DOT's lines.
    const [first, second] = DARK_TRAILER_LINES.filter((typed) => typed.shot === "design");
    view.rerender(createElement(DarkFilmTrailer, { seconds: (first.until + second.start) / 2, captions: "spoken" }));
    expect(view.container.querySelector(".dark-trailer-pull .dark-trailer-voice")).toHaveTextContent("DOT proposes");
    // The website still types every line.
    view.rerender(createElement(DarkFilmTrailer, { seconds: line.until - 1 }));
    expect(view.container.querySelector(".dark-trailer-line")).toHaveTextContent(line.text);
    view.unmount();
  });

  it("reads the concepts, the interlude and the closing in the author's own spoken wording", () => {
    const spoken = DARK_FILM_NARRATION.map(({ speech }) => speech);
    expect(spoken.join(" ")).not.toContain("Little cs");
    expect(spoken).toContain("Physical Sciences as Frame Derivations. Physics describes this world’s regularities. DOT interprets those regularities as properties of the Reality Frame.");
    expect(spoken).toContain("Ego. The defense of the Character Little c has learned to call itself.");
    expect(spoken.at(-1)).toBe("Become a student of your own experience. Help make room for others to do the same. We can do this together.");
    // What is typed on screen stays the Concept Map's own line.
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
    expect(DARK_OPENING_SECONDS).toBe(648);
    expect(DARK_FILM_SECONDS).toBe(950);
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
