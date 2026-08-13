import { fireEvent, render, screen } from "@testing-library/react";
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

  it("previews a numbered source without navigating away from the passage", () => {
    render(
      <BookMarkdown
        content="A supported claim.[¹](/book/digital-organism-theory/references#reference-1)"
        references={
          new Map([
            [
              1,
              {
                number: 1,
                markdown: "A. Researcher, *A Source*. [Open](https://example.com).",
              },
            ],
          ])
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open reference 1" }));

    expect(screen.getByRole("dialog", { name: "Reference 1" })).toHaveTextContent(
      "A. Researcher",
    );
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });
});
