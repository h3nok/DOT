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

    const nib = screen.getByRole("button", { name: /ask book one/i });
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
    expect(screen.getByRole("button", { name: /ask book one/i })).toBeEnabled();
  });

  it("keeps the writing line free of redundant chrome", () => {
    render(<HeroAsk onAsk={vi.fn()} />);

    // Suggestions are a focus affordance, not permanent furniture.
    expect(
      screen.queryByRole("button", { name: "State the core claim" }),
    ).toBeNull();
    expect(document.querySelector(".home-inquiry__header")).toBeNull();
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

  it("sends the question immediately with the selected lens", () => {
    const onAsk = vi.fn();
    render(<HeroAsk onAsk={onAsk} />);
    const input = screen.getByLabelText(/ask a question/i);
    fireEvent.click(screen.getByRole("button", { name: "Test" }));
    fireEvent.change(input, { target: { value: "What is Big C?" } });
    fireEvent.submit(input.closest("form")!);

    expect(onAsk).toHaveBeenCalledWith({ query: "What is Big C?", lens: "test" });
    expect(input).toHaveValue("");
    expect(field()).toHaveAttribute("data-pen", "resting");
  });

  it("keeps both inquiry lenses available as pressed-state controls", () => {
    render(<HeroAsk onAsk={vi.fn()} />);

    const ground = screen.getByRole("button", { name: "Ground" });
    const test = screen.getByRole("button", { name: "Test" });
    expect(ground).toHaveAttribute("aria-pressed", "true");
    expect(test).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(test);
    expect(ground).toHaveAttribute("aria-pressed", "false");
    expect(test).toHaveAttribute("aria-pressed", "true");
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
