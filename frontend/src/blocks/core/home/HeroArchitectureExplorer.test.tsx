import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURE_PARTS } from "./architectureModel";
import { HeroArchitecture } from "./HeroArchitecture";

const parts = () => within(screen.getByRole("group", { name: "Explore the architecture" }));
const explorer = () => document.querySelector<HTMLElement>(".home-architecture-explorer__detail")!;
const focus = (container: HTMLElement) =>
  container.querySelector(".home-hero-architecture__svg")?.getAttribute("data-focus");

describe("architecture explorer", () => {
  it("names RF₀ as the frame physics governs, and brings its Little c forward with it", () => {
    const { container } = render(<HeroArchitecture />);
    fireEvent.click(parts().getByRole("button", { name: "RF₀" }));

    expect(parts().getByRole("button", { name: "RF₀" })).toHaveAttribute("aria-pressed", "true");
    expect(focus(container)).toBe("rf0");
    expect(screen.getByText(/Physics: the measurable laws of nature/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read about RF₀" })).toHaveAttribute("href", "#reality-frame");
  });

  it("selects a frame drawn in the figure, and Escape returns the whole picture", () => {
    const { container } = render(<HeroArchitecture />);
    fireEvent.click(container.querySelector('[data-part="rf2"] .home-architecture-other-frame-zone')!);

    expect(focus(container)).toBe("rf2");
    expect(screen.getByText("RF₂ · Hypothesis")).toBeInTheDocument();
    fireEvent.keyDown(parts().getByRole("button", { name: "RF₂" }), { key: "Escape" });
    expect(focus(container)).toBeNull();
  });

  it("states Big C's emergence and self-maintenance, and Little c as its downstream process", () => {
    render(<HeroArchitecture />);
    fireEvent.click(parts().getByRole("button", { name: "Big C" }));
    expect(screen.getByText(/emerged within T × E and began maintaining itself/)).toBeInTheDocument();

    fireEvent.click(parts().getByRole("button", { name: "Little c" }));
    expect(within(explorer()).getByText(/downstream, local implementation of Big C’s own process/)).toBeInTheDocument();
  });

  it("leaves the layer links as links rather than selections", () => {
    const { container } = render(<HeroArchitecture />);
    fireEvent.click(container.querySelector('a[href="#big-c"] text')!);
    expect(focus(container)).toBeNull();
  });

  it("gives every other frame its own rules, and a stabilized Little c somewhere to go", () => {
    for (const part of ARCHITECTURE_PARTS.filter(({ id }) => ["rf1", "rf2", "rfn"].includes(id))) {
      expect(part.status).toBe("Hypothesis");
      expect(part.rules).toMatch(/Its own rules/);
    }
    expect(ARCHITECTURE_PARTS.find(({ id }) => id === "rf0")?.summary)
      .toMatch(/stabilize your own consciousness[\s\S]*explore other realities and expand your decision space/);
  });
});
