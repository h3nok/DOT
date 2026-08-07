import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookMarkdown } from "./BookMarkdown";

describe("BookMarkdown", () => {
  it("renders stable heading anchors, equations, and safe external links", () => {
    const { container } = render(
      <BookMarkdown
        content={[
          "## Love Creates Room for Truth",
          "",
          "$$C_{t+1} = U(C_t, E_t)$$",
          "",
          "[Research](https://doi.org/10.1038/s41586-025-08888-1)",
        ].join("\n")}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Love Creates Room for Truth" }),
    ).toHaveAttribute("id", "love-creates-room-for-truth");
    expect(container.querySelector(".katex")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Research" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
  });

  it("places a contextual reader element after its matching heading", () => {
    render(
      <BookMarkdown
        content={["## The Experience Loop", "", "The loop begins here."].join("\n")}
        afterHeading={{
          "the-experience-loop": <div data-testid="experience-loop">Interactive model</div>,
        }}
      />,
    );

    const heading = screen.getByRole("heading", { name: "The Experience Loop" });
    expect(heading.nextElementSibling).toBe(screen.getByTestId("experience-loop"));
  });
});
