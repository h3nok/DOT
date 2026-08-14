import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NucleusMark } from "./NucleusMark";

/** Every drawn shape and the values that give it its form. */
function geometry(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("circle, path")).map((shape) =>
    [
      shape.tagName,
      shape.getAttribute("d"),
      shape.getAttribute("cx"),
      shape.getAttribute("cy"),
      shape.getAttribute("r"),
      shape.getAttribute("stroke"),
      shape.getAttribute("stroke-width"),
      shape.getAttribute("fill"),
      shape.getAttribute("opacity"),
    ].join("|"),
  );
}

describe("NucleusMark", () => {
  it("thinks as itself: the working mark draws the settled logo exactly", () => {
    // Minty's working state has to *be* DOT's mark, not a lookalike that
    // resembles it. Anything added or resized while it thinks fails here.
    const settled = render(<NucleusMark size={40} />);
    const thinking = render(<NucleusMark size={40} thinking />);

    expect(geometry(thinking.container)).toEqual(geometry(settled.container));
  });

  it("marks the working state for the motion to attach to", () => {
    const { container } = render(<NucleusMark thinking />);
    expect(container.querySelector(".nucleus-mark")).toHaveAttribute(
      "data-thinking",
      "true",
    );
  });

  it("stays still for a reader who asked for less motion", () => {
    const { container } = render(<NucleusMark thinking reducedMotion />);
    const mark = container.querySelector(".nucleus-mark");
    expect(mark).not.toHaveAttribute("data-thinking");
    expect((mark as HTMLElement).style.animation).toBe("");
  });
});
