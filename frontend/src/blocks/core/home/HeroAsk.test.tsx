import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeroAsk } from "./HeroAsk";

/**
 * The ask is a drawing over a real form, and the drawing is the part that can
 * quietly stop being a form. These pin what a reader depends on: the send mark
 * is a named button, ink means sendable, the marks are invisible to assistive
 * tech, and the stroke is measured against the text rather than guessed.
 */

const field = () => document.querySelector(".home-ask")!;
const nibMark = () => document.querySelector(".home-ask__nib-mark");

describe("HeroAsk", () => {
  it("keeps the send mark a real, named submit control", () => {
    render(<HeroAsk onAsk={vi.fn()} />);

    const nib = screen.getByRole("button", { name: /send/i });
    expect(nib).toHaveAttribute("type", "submit");
    // Nothing written yet, so it is not usable — and says so to assistive tech
    // rather than only by being drawn dry.
    expect(nib).toBeDisabled();
  });

  it("floods the mark only once there is something worth sending", () => {
    render(<HeroAsk onAsk={vi.fn()} />);

    expect(nibMark()).toHaveAttribute("data-charged", "false");

    fireEvent.change(screen.getByLabelText(/ask a question/i), {
      target: { value: "Is the Canvas prior to the Painting?" },
    });

    expect(nibMark()).toHaveAttribute("data-charged", "true");
    expect(screen.getByRole("button", { name: /send/i })).toBeEnabled();
  });

  it("treats a bare slash as no question, not as a short one", () => {
    render(<HeroAsk onAsk={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/ask a question/i), {
      target: { value: "/" },
    });

    // "/" opens the command menu; it is not itself a thing to ask.
    expect(nibMark()).toHaveAttribute("data-charged", "false");
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("measures the stroke against the text actually written", () => {
    render(<HeroAsk onAsk={vi.fn()} />);
    const mirror = document.querySelector(".home-ask__measure")!;

    expect(mirror.textContent).toBe("");

    fireEvent.change(screen.getByLabelText(/ask a question/i), {
      target: { value: "What is a Reality Frame?" },
    });

    // The mirror carries the value in the same face, which is the only way the
    // stroke can be exactly as long as the sentence. If this stops tracking,
    // the stroke silently reverts to underlining empty paper.
    expect(mirror.textContent).toBe("What is a Reality Frame?");
  });

  it("moves through the states as the writer does", () => {
    render(<HeroAsk onAsk={vi.fn()} />);
    const input = screen.getByLabelText(/ask a question/i);

    expect(field()).toHaveAttribute("data-pen", "resting");

    fireEvent.focus(input);
    expect(field()).toHaveAttribute("data-pen", "poised");

    fireEvent.change(input, { target: { value: "What is a Reality Frame?" } });
    expect(field()).toHaveAttribute("data-pen", "writing");
  });

  it("sends the question, then lifts", () => {
    vi.useFakeTimers();
    const onAsk = vi.fn();
    try {
      render(<HeroAsk onAsk={onAsk} />);
      const input = screen.getByLabelText(/ask a question/i);
      fireEvent.change(input, { target: { value: "What is Big C?" } });
      fireEvent.submit(input.closest("form")!);

      expect(field()).toHaveAttribute("data-pen", "striking");

      vi.runAllTimers();
      expect(onAsk).toHaveBeenCalledWith({ query: "What is Big C?", lens: "ground" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("hides the marks from assistive tech", () => {
    render(<HeroAsk onAsk={vi.fn()} />);

    // Stroke, mirror and send mark are material, not content. Read aloud they
    // would describe a picture of writing instead of a field to write in.
    for (const part of ["__stroke", "__measure", "__nib-mark"]) {
      const el = document.querySelector(`.home-ask${part}`);
      expect(el, part).not.toBeNull();
      expect(el).toHaveAttribute("aria-hidden", "true");
    }
  });
});
