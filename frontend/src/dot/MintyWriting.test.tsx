import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MintyWriting } from "./MintyWriting";

/**
 * The waiting state's one job is to say something true. The stream reports only
 * deltas, so anything resembling progress would be invented — these pin that it
 * never starts claiming to know more than it does, and that Stillness is
 * honoured.
 */

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const stroke = () => document.querySelector(".minty-writing__stroke") as SVGElement | null;

describe("MintyWriting", () => {
  it("claims nothing it cannot know", () => {
    render(<MintyWriting reducedMotion={false} />);

    const text = document.querySelector(".minty-writing")!.textContent ?? "";
    // No percentage, no step count, no source tally: the stream sends deltas
    // and nothing else, so any of these would be fabricated.
    expect(text).not.toMatch(/\d+\s*%/);
    expect(text).not.toMatch(/step\s*\d|\d+\s*of\s*\d+|passage\s*\d/i);
  });

  it("admits a long wait rather than repeating itself", () => {
    render(<MintyWriting reducedMotion={false} />);

    expect(screen.getByText(/^Reading Book One…$/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(7100);
    });

    // Elapsed time is the one honest thing to report, so it is the only thing
    // that changes.
    expect(screen.getByText(/^Still reading Book One…$/)).toBeInTheDocument();
  });

  it("draws once and holds when stillness is asked for", () => {
    render(<MintyWriting reducedMotion={true} />);

    const before = stroke()!.getAttribute("style");

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // No redraw loop: the width set on mount is the width it keeps.
    expect(stroke()!.getAttribute("style")).toBe(before);
  });

  it("keeps redrawing while the answer is still coming", () => {
    render(<MintyWriting reducedMotion={false} />);
    const widths = new Set<string>();

    for (let i = 0; i < 8; i++) {
      widths.add(stroke()!.getAttribute("style") ?? "");
      act(() => {
        vi.advanceTimersByTime(1100);
      });
    }

    // A hand writes in strokes of differing length. One fixed width would read
    // as a stalled bar rather than as work in progress.
    expect(widths.size).toBeGreaterThan(1);
  });

  it("names the sections it opened once the stream reports them", () => {
    render(
      <MintyWriting
        reducedMotion={false}
        sources={["The Canvas", "Reality Frames"]}
      />,
    );

    const text = document.querySelector(".minty-writing")!.textContent ?? "";
    expect(text).toContain("The Canvas");
    expect(text).toContain("Reality Frames");
    // Naming sources replaces the generic line rather than stacking with it.
    expect(text).not.toMatch(/Reading Book One/);
  });

  it("falls back cleanly on an orchestrator that sends no retrieval event", () => {
    render(<MintyWriting reducedMotion={false} sources={[]} />);

    // Older servers simply never send it; the wait must still say something.
    expect(screen.getByText(/^Reading Book One…$/)).toBeInTheDocument();
  });

  it("never turns retrieved sources into progress", () => {
    render(
      <MintyWriting
        reducedMotion={false}
        sources={["The Canvas", "Reality Frames", "The Painting"]}
      />,
    );

    const text = document.querySelector(".minty-writing")!.textContent ?? "";
    // Knowing what was opened is not knowing how far along the writing is.
    expect(text).not.toMatch(/\d+\s*%|\d+\s*of\s*\d+|step\s*\d/i);
  });

  it("stays out of the accessibility tree as a graphic", () => {
    render(<MintyWriting reducedMotion={false} />);

    // The stroke is material; the note carries the meaning, and the surrounding
    // region is the live one.
    expect(stroke()).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector(".minty-writing__note")).not.toBeNull();
  });
});
