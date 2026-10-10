import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HERO_CONCEPTS } from "./heroData";
import { HeroConceptSlideshow } from "./HeroConceptSlideshow";

const motion = vi.hoisted(() => ({ inView: true, reducedMotion: false }));
vi.mock("framer-motion", () => ({
  useReducedMotion: () => motion.reducedMotion,
  useInView: () => motion.inView,
}));

const TOTAL = HERO_CONCEPTS.length;
const slide = (position: number) => ({ name: `${position} of ${TOTAL}` });
/** Mirrors the component: a floor of 8s, or 300ms a word for longer passages. */
const readingTime = (concept: { text: string }) => Math.max(8_000, concept.text.split(/\s+/).length * 300);

function finishTyping(concept: { term: string; text: string }) {
  for (let index = 0; index < concept.term.length; index++) {
    act(() => vi.advanceTimersByTime(35));
  }
  for (let index = 0; index < concept.text.length; index++) {
    act(() => vi.advanceTimersByTime(20));
  }
}

beforeEach(() => {
  motion.inView = true;
  motion.reducedMotion = false;
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HeroConceptSlideshow", () => {
  it("offers every definition and claim level without wrapping", () => {
    render(<HeroConceptSlideshow reducedMotion />);
    const region = screen.getByRole("region", { name: "Key concepts and questions" });
    const previous = within(region).getByRole("button", { name: "Previous concept" });
    const next = within(region).getByRole("button", { name: "Next concept" });
    expect(HERO_CONCEPTS).toHaveLength(20);
    expect(previous).toBeDisabled();

    for (const [index, concept] of HERO_CONCEPTS.entries()) {
      const current = within(region).getByRole("group", slide(index + 1));
      expect(within(current).getByRole("heading", { name: concept.term })).toBeVisible();
      expect(current).toHaveTextContent(concept.text);
      expect(current).toHaveAttribute("data-epistemic-status", concept.level);
      expect(within(current).getByText(concept.text).tagName).toBe("P");
      expect(current).toHaveAttribute("aria-live", "polite");
      expect(region.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(1);
      if (index < HERO_CONCEPTS.length - 1) fireEvent.click(next);
    }
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(within(region).getByRole("heading", { name: "The Limit of Knowledge" })).toBeVisible();
    for (let index = TOTAL - 1; index > 0; index--) fireEvent.click(previous);
    expect(previous).toBeDisabled();
    expect(within(region).getByRole("heading", { name: "The Digital Organism" })).toBeVisible();
  });

  it("keeps the status quo and DOT's reply in their own frames, cited and at honest levels", () => {
    render(<HeroConceptSlideshow reducedMotion />);
    const region = screen.getByRole("region", { name: "Key concepts and questions" });
    const next = within(region).getByRole("button", { name: "Next concept" });
    const eyebrow = region.querySelector(".home-concept-slideshow-eyebrow")!;
    expect(eyebrow).not.toHaveAttribute("data-frame");
    expect(eyebrow).toHaveTextContent("DOT concept");

    fireEvent.click(next);
    const statusQuo = within(region).getByRole("group", slide(2));
    expect(within(statusQuo).getByRole("heading", { name: "The Closed Question" })).toBeVisible();
    expect(statusQuo).toHaveAttribute("data-frame", "status-quo");
    expect(statusQuo).toHaveAttribute("data-epistemic-status", "model");
    expect(within(statusQuo).getByRole("link", { name: "Chalmers, 1995" })).toHaveAttribute("href", "https://consc.net/papers/facing.pdf");
    expect(eyebrow).toHaveAttribute("data-frame", "status-quo");
    expect(eyebrow).toHaveTextContent("DOT rejects");

    fireEvent.click(next);
    expect(within(region).getByRole("group", slide(3))).toHaveAttribute("data-frame", "status-quo");
    expect(eyebrow).toHaveTextContent("Outside perspective");
    fireEvent.click(next);
    const humanism = within(region).getByRole("group", slide(4));
    expect(within(humanism).getByRole("heading", { name: "Secular Humanism" })).toBeVisible();
    expect(humanism).toHaveAttribute("data-epistemic-status", "model");
    expect(within(humanism).getByRole("link", { name: "Humanist Manifesto III, 2003" }))
      .toHaveAttribute("href", "https://americanhumanist.org/humanism/humanist-manifesto-iii/");
    fireEvent.click(next);
    const reply = within(region).getByRole("group", slide(5));
    expect(within(reply).getByRole("heading", { name: "DOT Rejects the Closed Question" })).toBeVisible();
    expect(reply).toHaveAttribute("data-frame", "reply");
    expect(reply).toHaveAttribute("data-epistemic-status", "model");
    expect(eyebrow).toHaveTextContent("DOT’s response");

    const rail = region.querySelectorAll(".home-concept-slideshow-rail > li");
    expect(rail[1]).toHaveAttribute("data-frame", "status-quo");
    expect(rail[4]).toHaveAttribute("data-frame", "reply");
    expect(rail[0]).not.toHaveAttribute("data-frame");
  });

  it("starts a finite sequence, allows reading time after typing, and never loops", () => {
    vi.useFakeTimers();
    render(<HeroConceptSlideshow />);

    for (const [index, concept] of HERO_CONCEPTS.entries()) {
      const current = screen.getByRole("group", slide(index + 1));
      expect(current).toHaveAttribute("aria-live", "off");
      expect(within(current).getByText(concept.text)).toBeVisible();
      if (index === HERO_CONCEPTS.length - 1) break;
      finishTyping(concept);
      expect(within(current).getByRole("heading")).toHaveTextContent(concept.term);
      act(() => vi.advanceTimersByTime(readingTime(concept) - 1));
      expect(current).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
    }
    expect(screen.getByRole("button", { name: "Concept introduction complete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next concept" })).toBeDisabled();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(120_000));
    expect(screen.getByRole("group", slide(TOTAL))).toBeVisible();
  // Every character of every slide is typed one tick at a time; the budget scales with the deck.
  }, 20_000);

  it("types the whole passage after the term while its full text holds its place", () => {
    vi.useFakeTimers();
    render(<HeroConceptSlideshow />);
    const [first] = HERO_CONCEPTS;
    const current = screen.getByRole("group", slide(1));
    const passage = current.querySelector("p");
    for (let index = 0; index < first.term.length; index++) {
      act(() => vi.advanceTimersByTime(35));
    }
    expect(passage?.querySelector('[data-typing="true"]')).toHaveTextContent(/^$/);
    for (let index = 0; index < 10; index++) {
      act(() => vi.advanceTimersByTime(20));
    }
    expect(passage?.querySelector('[data-typing="true"]')?.textContent).toBe(first.text.slice(0, 10));
    expect(passage).toHaveTextContent(first.text);
    act(() => vi.advanceTimersByTime(8_000));
    expect(screen.getByRole("group", slide(1))).toBeVisible();
  });

  it("pauses immediately, reveals the full title, and resumes only on Play", () => {
    vi.useFakeTimers();
    render(<HeroConceptSlideshow />);
    const title = screen.getByRole("heading", { name: "The Digital Organism" });
    expect(title).toHaveTextContent("");
    act(() => vi.advanceTimersByTime(35));
    expect(title).toHaveTextContent("T");
    fireEvent.click(screen.getByRole("button", { name: "Pause concept introduction" }));
    expect(title).toHaveTextContent("The Digital Organism");
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", slide(1))).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play concept introduction" }));
    act(() => vi.advanceTimersByTime(readingTime(HERO_CONCEPTS[0])));
    expect(screen.getByRole("group", slide(2))).toBeVisible();
  });

  it("stops for keyboard focus and manual paging until explicitly restarted", () => {
    vi.useFakeTimers();
    render(<HeroConceptSlideshow />);
    const next = screen.getByRole("button", { name: "Next concept" });
    act(() => next.focus());
    expect(screen.getByRole("button", { name: "Play concept introduction" })).toBeEnabled();
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", slide(1))).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "The Closed Question" }))
      .toHaveTextContent("The Closed Question");
    expect(screen.getByRole("group", slide(2))).toHaveAttribute("aria-live", "polite");
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", slide(2))).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play concept introduction" }));
    act(() => vi.advanceTimersByTime(readingTime(HERO_CONCEPTS[1])));
    expect(screen.getByRole("group", slide(3))).toBeVisible();
  });

  it("suspends offscreen and gives a full reading interval when returning", () => {
    vi.useFakeTimers();
    const { rerender } = render(<HeroConceptSlideshow />);
    finishTyping(HERO_CONCEPTS[0]);
    act(() => vi.advanceTimersByTime(4_000));
    motion.inView = false;
    rerender(<HeroConceptSlideshow />);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(90_000));
    motion.inView = true;
    rerender(<HeroConceptSlideshow />);
    act(() => vi.advanceTimersByTime(readingTime(HERO_CONCEPTS[0]) - 1));
    expect(screen.getByRole("group", slide(1))).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("group", slide(2))).toBeVisible();
  });

  it("suspends while the document is hidden", () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, "hidden", "get");
    const { unmount } = render(<HeroConceptSlideshow />);
    finishTyping(HERO_CONCEPTS[0]);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", slide(1))).toBeVisible();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(readingTime(HERO_CONCEPTS[0])));
    expect(screen.getByRole("group", slide(2))).toBeVisible();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["appearance", "system"])("has no typing or autoplay in %s stillness", source => {
    vi.useFakeTimers();
    motion.reducedMotion = source === "system";
    render(<HeroConceptSlideshow reducedMotion={source === "appearance"} />);
    expect(screen.getByRole("heading", { name: "The Digital Organism" }))
      .toHaveTextContent("The Digital Organism");
    expect(screen.getByRole("button", { name: "Autoplay unavailable in stillness mode" })).toBeDisabled();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", slide(1))).toBeVisible();
  });

  it("does not restart automatically when stillness is switched off", () => {
    vi.useFakeTimers();
    const { rerender } = render(<HeroConceptSlideshow />);
    rerender(<HeroConceptSlideshow reducedMotion />);
    expect(vi.getTimerCount()).toBe(0);
    rerender(<HeroConceptSlideshow />);
    expect(screen.getByRole("button", { name: "Play concept introduction" })).toBeEnabled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cleans up both unfinished typing and a pending slide advance", () => {
    vi.useFakeTimers();
    const first = render(<HeroConceptSlideshow />);
    expect(vi.getTimerCount()).toBe(1);
    first.unmount();
    expect(vi.getTimerCount()).toBe(0);
    const second = render(<HeroConceptSlideshow />);
    finishTyping(HERO_CONCEPTS[0]);
    expect(vi.getTimerCount()).toBe(1);
    second.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
