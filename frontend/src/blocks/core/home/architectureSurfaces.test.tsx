import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURE_RADII as R } from "./architectureGeometry";
import { ConceptArchitecture } from "./ConceptArchitecture";
import { HeroArchitecture } from "./HeroArchitecture";

const LAYERS = ["origin", "big-c", "reality-frame", "little-c"] as const;
const DIAGRAM_SELECTOR = ".home-hero-architecture__svg, .home-concept-architecture";

describe("architecture surface lighting", () => {
  it("preserves the shared geometry and each concept's focus", () => {
    const { container } = render(
      <>
        <HeroArchitecture />
        {LAYERS.map(layer => <ConceptArchitecture key={layer} layer={layer} />)}
      </>,
    );
    const diagrams = container.querySelectorAll(DIAGRAM_SELECTOR);
    expect(diagrams).toHaveLength(5);

    for (const diagram of diagrams) {
      const surfaces = [...diagram.querySelectorAll(".home-architecture-surface")];
      expect(surfaces.map(surface => Number(surface.getAttribute("r"))))
        .toEqual([R.bigC, R.frame, R.local]);
      expect(diagram).not.toHaveAttribute("filter");
      expect(diagram.querySelectorAll(".home-architecture-surface-gradient")).toHaveLength(3);
      expect(diagram.querySelectorAll("feDropShadow")).toHaveLength(1);
      expect(diagram.querySelector("feDropShadow")).toHaveAttribute("dy", "3");
      expect(diagram.querySelector("feDropShadow")).toHaveAttribute("stdDeviation", "1.5");
    }

    for (const [index, diagram] of [...diagrams].slice(1).entries()) {
      const contours = diagram.querySelectorAll(".home-concept-contour");
      expect(contours).toHaveLength(4);
      for (const [contourIndex, contour] of [...contours].entries()) {
        expect(contour).toHaveAttribute("data-active", String(contourIndex === index));
      }
    }
  });

  it("keeps every definition local to its SVG even with repeated diagrams", () => {
    const { container } = render(
      <>
        <HeroArchitecture />
        <HeroArchitecture />
        {LAYERS.map(layer => <ConceptArchitecture key={layer} layer={layer} />)}
        <ConceptArchitecture layer="big-c" />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const diagram of container.querySelectorAll(DIAGRAM_SELECTOR)) {
      for (const node of diagram.querySelectorAll("[fill], [stroke], [filter], [clip-path], [marker-end]")) {
        for (const attribute of ["fill", "stroke", "filter", "clip-path", "marker-end"]) {
          const reference = node.getAttribute(attribute)?.match(/^url\(#(.+)\)$/)?.[1];
          if (!reference) continue;
          const definition = document.getElementById(reference);
          expect(definition, `Missing ${attribute} definition ${reference}`).not.toBeNull();
          expect(diagram.contains(definition), `${reference} belongs to a different SVG`).toBe(true);
        }
      }
    }
  });
});
