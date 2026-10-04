import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HERO_CONCEPTS } from "./heroData";
import { HeroConceptSlideshow } from "./HeroConceptSlideshow";

const motion = vi.hoisted(() => ({ inView: true, reducedMotion: false }));
vi.mock("framer-motion", () => ({
  useReducedMotion: () => motion.reducedMotion,
  useInView: () => motion.inView,
}));

function finishTyping(term: string) {
  for (let index = 0; index < term.length; index++) {
    act(() => vi.advanceTimersByTime(35));
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
  it("offers all ten existing definitions and claim levels without wrapping", () => {
    render(<HeroConceptSlideshow reducedMotion />);
    const region = screen.getByRole("region", { name: "Key concepts from Book One" });
    const previous = within(region).getByRole("button", { name: "Previous concept" });
    const next = within(region).getByRole("button", { name: "Next concept" });
    expect(HERO_CONCEPTS).toHaveLength(10);
    expect(previous).toBeDisabled();

    for (const [index, concept] of HERO_CONCEPTS.entries()) {
      const slide = within(region).getByRole("group", { name: `${index + 1} of 10` });
      expect(within(slide).getByRole("heading", { name: concept.term })).toBeVisible();
      expect(slide).toHaveTextContent(concept.text);
      expect(slide).toHaveAttribute("data-epistemic-status", concept.level);
      expect(within(slide).getByText(concept.text).tagName).toBe("P");
      expect(slide).toHaveAttribute("aria-live", "polite");
      expect(region.querySelectorAll('[aria-roledescription="slide"]')).toHaveLength(1);
      if (index < HERO_CONCEPTS.length - 1) fireEvent.click(next);
    }
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(within(region).getByRole("heading", { name: "The Limit of Knowledge" })).toBeVisible();
    for (let index = 9; index > 0; index--) fireEvent.click(previous);
    expect(previous).toBeDisabled();
    expect(within(region).getByRole("heading", { name: "The Digital Organism" })).toBeVisible();
  });

  it("starts a finite sequence, allows reading time after typing, and never loops", () => {
    vi.useFakeTimers();
    render(<HeroConceptSlideshow />);

    for (const [index, concept] of HERO_CONCEPTS.entries()) {
      const slide = screen.getByRole("group", { name: `${index + 1} of 10` });
      expect(slide).toHaveAttribute("aria-live", "off");
      expect(within(slide).getByText(concept.text)).toBeVisible();
      if (index === HERO_CONCEPTS.length - 1) break;
      finishTyping(concept.term);
      expect(within(slide).getByRole("heading")).toHaveTextContent(concept.term);
      const readingTime = Math.max(8_000, concept.text.split(/\s+/).length * 300);
      act(() => vi.advanceTimersByTime(readingTime - 1));
      expect(slide).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
    }
    expect(screen.getByRole("button", { name: "Concept introduction complete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next concept" })).toBeDisabled();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(120_000));
    expect(screen.getByRole("group", { name: "10 of 10" })).toBeVisible();
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
    expect(screen.getByRole("group", { name: "1 of 10" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play concept introduction" }));
    act(() => vi.advanceTimersByTime(8_000));
    expect(screen.getByRole("group", { name: "2 of 10" })).toBeVisible();
  });

  it("stops for keyboard focus and manual paging until explicitly restarted", () => {
    vi.useFakeTimers();
    render(<HeroConceptSlideshow />);
    const next = screen.getByRole("button", { name: "Next concept" });
    act(() => next.focus());
    expect(screen.getByRole("button", { name: "Play concept introduction" })).toBeEnabled();
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", { name: "1 of 10" })).toBeVisible();
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "The Subjective Data Principle" }))
      .toHaveTextContent("The Subjective Data Principle");
    expect(screen.getByRole("group", { name: "2 of 10" })).toHaveAttribute("aria-live", "polite");
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", { name: "2 of 10" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play concept introduction" }));
    act(() => vi.advanceTimersByTime(8_000));
    expect(screen.getByRole("group", { name: "3 of 10" })).toBeVisible();
  });

  it("suspends offscreen and gives a full reading interval when returning", () => {
    vi.useFakeTimers();
    const { rerender } = render(<HeroConceptSlideshow />);
    finishTyping(HERO_CONCEPTS[0].term);
    act(() => vi.advanceTimersByTime(4_000));
    motion.inView = false;
    rerender(<HeroConceptSlideshow />);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(90_000));
    motion.inView = true;
    rerender(<HeroConceptSlideshow />);
    act(() => vi.advanceTimersByTime(7_999));
    expect(screen.getByRole("group", { name: "1 of 10" })).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("group", { name: "2 of 10" })).toBeVisible();
  });

  it("suspends while the document is hidden", () => {
    vi.useFakeTimers();
    const hidden = vi.spyOn(document, "hidden", "get");
    const { unmount } = render(<HeroConceptSlideshow />);
    finishTyping(HERO_CONCEPTS[0].term);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(90_000));
    expect(screen.getByRole("group", { name: "1 of 10" })).toBeVisible();
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(8_000));
    expect(screen.getByRole("group", { name: "2 of 10" })).toBeVisible();
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
    expect(screen.getByRole("group", { name: "1 of 10" })).toBeVisible();
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
    finishTyping(HERO_CONCEPTS[0].term);
    expect(vi.getTimerCount()).toBe(1);
    second.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
