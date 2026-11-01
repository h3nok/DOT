import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DESCRIPTION, ArchitectureMap } from "./ConceptFilmMotifs";

const circle = (element: Element) => ["cx", "cy", "r"].map((name) => Number(element.getAttribute(name)));

describe("ArchitectureMap", () => {
  it("draws Little c within Big C and outside RF₀, as its description says", () => {
    const { container } = render(<svg><ArchitectureMap t={16} layer="all" /></svg>);
    const [bigX, bigY, bigR] = circle(container.querySelector("circle.cm-big-c[stroke-width]")!);
    const [rfX, rfY, rfR] = circle(container.querySelector("circle.cm-s.cm-rf")!);
    const [cX, cY, cR] = circle(container.querySelector("circle.cm-hollow.cm-local")!);

    expect(Math.hypot(cX - rfX, cY - rfY) - cR).toBeGreaterThan(rfR);
    expect(Math.hypot(cX - bigX, cY - bigY) + cR).toBeLessThan(bigR);
    expect(Math.hypot(rfX - bigX, rfY - bigY) + rfR).toBeLessThan(bigR);
    expect(ARCHITECTURE_DESCRIPTION).toContain("RF₀ and Little c inside Big C");
    expect(ARCHITECTURE_DESCRIPTION).toContain("T × E (speculative)");
  });
});
