import { act, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroProposition } from "./HeroProposition";
import {
  HERO_STATEMENT_DWELL_MS,
  HERO_STATEMENTS,
  HERO_TYPE_INTERVAL_MS,
} from "./heroData";

const visibleStatement = () =>
  document.querySelector(".home-hero-statement-copy")?.textContent;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("HeroProposition", () => {
  const renderProposition = (reducedMotion = false) =>
    render(
      <MemoryRouter>
        <HeroProposition reducedMotion={reducedMotion} />
      </MemoryRouter>,
    );

  const typeStatement = (statement: string) => {
    for (let index = 0; index < statement.length; index += 1) {
      act(() => vi.advanceTimersByTime(HERO_TYPE_INTERVAL_MS));
    }
  };

  it("types the first-person data proposition character by character", () => {
    renderProposition();

    expect(visibleStatement()).toBe("");
    act(() => vi.advanceTimersByTime(HERO_TYPE_INTERVAL_MS));
    expect(visibleStatement()).toBe("A");

    typeStatement(HERO_STATEMENTS[0].slice(1));
    expect(visibleStatement()).toBe(
      "A framework where first-person experience is data—not automatically truth.",
    );
    expect(document.querySelector(".home-hero-statement-nav")).toBeNull();
  });

  it("advances once through the finite sequence and stops", () => {
    renderProposition();

    for (let index = 0; index < HERO_STATEMENTS.length; index += 1) {
      typeStatement(HERO_STATEMENTS[index]);
      expect(visibleStatement()).toBe(HERO_STATEMENTS[index]);

      if (index === HERO_STATEMENTS.length - 1) break;
      act(() => vi.advanceTimersByTime(HERO_STATEMENT_DWELL_MS));
      expect(visibleStatement()).toBe("");
    }

    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(HERO_STATEMENT_DWELL_MS * 3));
    expect(visibleStatement()).toBe(HERO_STATEMENTS.at(-1));
  });

  it("pauses typing while the statement is being attended to", () => {
    renderProposition();
    const stage = document.querySelector(".home-hero-statement")!;

    fireEvent.mouseEnter(stage);
    act(() => vi.advanceTimersByTime(HERO_TYPE_INTERVAL_MS * 10));
    expect(visibleStatement()).toBe("");

    fireEvent.mouseLeave(stage);
    act(() => vi.advanceTimersByTime(HERO_TYPE_INTERVAL_MS));
    expect(visibleStatement()).toBe("A");
  });

  it("stays on the opening statement when stillness is requested", () => {
    renderProposition(true);

    act(() => vi.advanceTimersByTime(HERO_STATEMENT_DWELL_MS * 5));
    expect(visibleStatement()).toBe(HERO_STATEMENTS[0]);
    expect(document.querySelector(".home-hero-typewriter-cursor")).toBeNull();
  });
});
