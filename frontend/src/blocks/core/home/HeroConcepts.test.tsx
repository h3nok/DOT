/**
 * The hero sequence is only acceptable because it ends.
 *
 * A rotator that loops forever is an autoplay engine pointed at the reader (L2,
 * L3), and the book's own claim is that it is finite. These pin that the
 * concepts advance once, settle on the last line, and then stop scheduling
 * work — and that a reader who asked for reduced motion is given the settled
 * frame rather than the show.
 */

import { act, render, screen } from "@testing-library/react";
import type { ElementType, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// framer-motion drives exits on rAF, which fake timers do not advance — the
// outgoing line would never leave and the incoming one would never mount. These
// tests are about the sequence's logic, so the animation layer is passed through.
vi.mock("framer-motion", () => {
  type AnyProps = { children?: ReactNode } & Record<string, unknown>;

  const passthrough = (tag: string) => {
    const Tag = tag as unknown as ElementType;
    const Passthrough = (props: AnyProps) => {
      // Motion-only props would land on the DOM node and warn.
      const { children, initial, animate, exit, transition, mode, style, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      void mode;
      void style;
      return <Tag {...rest}>{children}</Tag>;
    };
    return Passthrough;
  };

  return {
    AnimatePresence: passthrough("span"),
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_target, key: string) => passthrough(key),
    }),
  };
});

import { DWELL_MS, HERO_CONCEPTS, HeroConcepts } from "./HeroConcepts";

const FIRST = HERO_CONCEPTS[0].text;
const LAST = HERO_CONCEPTS[HERO_CONCEPTS.length - 1].text;

// The rotator is aria-hidden, so assertions read the visual line directly.
const visibleLine = (text: string) =>
  screen
    // Query, not get: absence is a valid assertion here, not a test error.
    .queryAllByText(text)
    .some((node) => node.closest("[aria-hidden='true']") !== null);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("HeroConcepts", () => {
  it("opens on the first concept", () => {
    render(<HeroConcepts />);

    expect(visibleLine(FIRST)).toBe(true);
  });

  it("settles on the last line and schedules nothing further", () => {
    render(<HeroConcepts />);

    // One beat per concept, so each transition is observed rather than batched.
    for (let step = 0; step < HERO_CONCEPTS.length; step += 1) {
      act(() => {
        vi.advanceTimersByTime(DWELL_MS);
      });
    }

    expect(visibleLine(LAST)).toBe(true);
    // The proof it does not loop: no timer is left waiting to advance.
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(DWELL_MS * 5);
    });
    expect(visibleLine(LAST)).toBe(true);
  });

  it("opens on the first concept and never moves when motion is reduced", () => {
    render(<HeroConcepts autoAdvance={false} />);

    // A reader who cannot see it move is owed the start of the argument, not
    // whichever card the sequence would have ended on.
    expect(visibleLine(FIRST)).toBe(true);
    expect(visibleLine(LAST)).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("still runs for a reader returning to the page", () => {
    // Regression: the slideshow was handed the emergence's "already played in
    // this tab" flag, so every reload froze it on its final card — a returning
    // reader met "a restraint on certainty…" and nothing else.
    render(<HeroConcepts />);

    expect(visibleLine(FIRST)).toBe(true);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(DWELL_MS);
    });
    expect(visibleLine(HERO_CONCEPTS[1].text)).toBe(true);
  });

  it("gives assistive technology every concept at once", () => {
    const { container } = render(<HeroConcepts />);

    // No reader should have to wait out a rotation to learn what the page says.
    // The list interleaves term, claim level, and text, so read it as a whole.
    const spoken = container.querySelector(".sr-only")?.textContent ?? "";
    for (const concept of HERO_CONCEPTS) {
      expect(spoken).toContain(concept.text);
      expect(spoken).toContain(concept.term);
    }
  });

  it("carries the book's claim level on every concept", () => {
    // The preface says the observation/model/hypothesis distinction "governs
    // the entire book". A card that recites the vocabulary without its level
    // would overstate the theory on its own front page.
    for (const concept of HERO_CONCEPTS) {
      expect(["observation", "model", "hypothesis"]).toContain(concept.level);
    }

    // The largest metaphysical claim must never be presented as settled.
    const bigC = HERO_CONCEPTS.find((c) => c.id === "home.concept.bigc");
    expect(bigC?.level).toBe("hypothesis");
  });
});
