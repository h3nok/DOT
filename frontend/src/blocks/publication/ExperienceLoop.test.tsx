import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperienceLoop } from "./ExperienceLoop";

describe("ExperienceLoop", () => {
  it("selects states directly and keeps one active transition", () => {
    const { container } = render(<ExperienceLoop initialStep="Reality Stream" />);

    expect(screen.getByRole("heading", { name: "Reality Stream" })).toBeVisible();
    expect(container.querySelectorAll(".book-loop-flow-signal")).toHaveLength(1);
    expect(container.querySelector('[data-connection="return-little-c"]')).toBeInTheDocument();
    expect(
      container.querySelector('[data-connection="return-reality-stream"]'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Decision Space$/ })).not.toBeInTheDocument();
    expect(screen.getByText("Decision Space")).toBeVisible();
    expect(screen.getByText("available pre-Intent drafts")).toBeVisible();
    expect(container.querySelectorAll(".book-loop-state")).toHaveLength(5);
    expect(container.querySelectorAll(".book-loop-draft")).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: /Intent$/ }));

    expect(screen.getByRole("heading", { name: "Intent" })).toBeVisible();
    expect(
      screen.getByText(
        "Little c selects one visible pre-Intent draft. That movement from proposal to commitment is Intent.",
      ),
    ).toBeVisible();
    expect(container.querySelectorAll(".book-loop-state.is-active")).toHaveLength(1);
    expect(container.querySelectorAll(".book-loop-flow-signal")).toHaveLength(1);
  });

  it("stops at the endpoints and supports directional keyboard navigation", () => {
    render(<ExperienceLoop initialStep="Reality Stream" />);
    const loop = screen.getByRole("group", { name: "The Experience Loop" });

    expect(screen.getByRole("button", { name: "Previous state" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Reality Stream" })).toBeVisible();

    screen.getByRole("button", { name: /Reality Stream$/ }).focus();
    fireEvent.keyDown(loop, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "Painting" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Painting$/ })).toHaveFocus();

    fireEvent.keyDown(loop, { key: "End" });
    expect(screen.getByRole("heading", { name: "Return" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next state" })).toBeDisabled();
    fireEvent.keyDown(loop, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "Return" })).toBeVisible();

    fireEvent.keyDown(loop, { key: "Home" });
    expect(screen.getByRole("heading", { name: "Reality Stream" })).toBeVisible();
  });
});