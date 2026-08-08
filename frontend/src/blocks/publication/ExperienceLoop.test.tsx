import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExperienceLoop } from "./ExperienceLoop";

describe("ExperienceLoop", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("selects states directly and keeps one active transition", () => {
    const { container } = render(<ExperienceLoop initialStep="Reality Stream" />);

    expect(screen.getByRole("heading", { name: "A moment reaches you" })).toBeVisible();
    expect(screen.getByText("Consequence becomes context.")).toBeVisible();
    expect(container.querySelectorAll(".book-experience-node")).toHaveLength(5);
    expect(container.querySelector(".book-experience-orbit-line")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /DOT term: Intent$/ }));

    expect(screen.getByRole("heading", { name: "You choose what to do" })).toBeVisible();
    expect(
      screen.getByText(
        "React, wait, or ask what happened. More than one response is possible.",
      ),
    ).toBeVisible();
    expect(screen.getByText(/options together are the Decision Space/)).toBeVisible();
    expect(container.querySelectorAll(".book-experience-node.is-active")).toHaveLength(1);
    expect(screen.getByText(/remain hypotheses/)).toBeVisible();
  });

  it("wraps around the loop and supports directional keyboard navigation", () => {
    render(<ExperienceLoop initialStep="Reality Stream" />);
    const loop = screen.getByRole("group", { name: "The Experience Loop" });

    expect(screen.getByRole("heading", { name: "A moment reaches you" })).toBeVisible();

    act(() => {
      screen.getByRole("button", { name: /DOT term: Reality Stream$/ }).focus();
    });
    fireEvent.keyDown(loop, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "Your history gives it meaning" })).toBeVisible();
    expect(screen.getByRole("button", { name: /DOT term: Painting$/ })).toHaveFocus();

    fireEvent.keyDown(loop, { key: "End" });
    expect(screen.getByRole("heading", { name: "The result changes what comes next" })).toBeVisible();
    fireEvent.keyDown(loop, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "A moment reaches you" })).toBeVisible();

    fireEvent.keyDown(loop, { key: "Home" });
    expect(screen.getByRole("heading", { name: "A moment reaches you" })).toBeVisible();
  });

  it("never advances on its own", () => {
    // The figure is embedded inside a chapter. The release's reader contract
    // declares `autoplay: false` and ADR-0004 forbids autoplay outright, so
    // the loop may only move when the reader moves it.
    vi.useFakeTimers();
    render(<ExperienceLoop initialStep="Reality Stream" />);

    expect(screen.getByText('Your phone lights up: "Can we talk?"')).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(screen.getByRole("heading", { name: "A moment reaches you" })).toBeVisible();
  });

  it("offers no playback control, because there is nothing to pause", () => {
    render(<ExperienceLoop initialStep="Reality Stream" />);

    expect(screen.queryByRole("button", { name: /guided presentation/i })).toBeNull();
  });
});
