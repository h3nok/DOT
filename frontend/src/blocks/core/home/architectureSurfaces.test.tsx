import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURE_RADII as R, FRAME_CENTRE } from "./architectureGeometry";
import { ConceptArchitecture } from "./ConceptArchitecture";
import { HeroArchitecture } from "./HeroArchitecture";

const LAYERS = ["origin", "big-c", "reality-frame", "little-c"] as const;
const DIAGRAM_SELECTOR = ".home-hero-architecture__svg, .home-concept-architecture";

describe("architecture surface lighting", () => {
  it("shows RF₀ as one of several Reality Frames Big C develops, the others hypothesized", () => {
    const { container } = render(<HeroArchitecture />);
    const frames = [...container.querySelectorAll(".home-architecture-other-frame")];

    expect(frames.map(frame => frame.textContent)).toEqual(["RF1", "RF2", "RFn"]);
    expect(new Set(frames.map(frame => frame.getAttribute("data-rules"))).size).toBe(3);
    for (const frame of frames) {
      // Structure, not organisms: no living surface, and every one lies inside Big C, outside RF₀.
      expect(frame.querySelector(".home-architecture-surface")).toBeNull();
      const zone = frame.querySelector(".home-architecture-other-frame-zone")!;
      const [x, y, r] = ["cx", "cy", "r"].map(name => Number(zone.getAttribute(name)));
      const distance = Math.hypot(x - FRAME_CENTRE.x, y - FRAME_CENTRE.y);
      expect(distance - r).toBeGreaterThan(R.frame + 8);
      expect(distance + r).toBeLessThan(R.bigC - 8);
    }
    expect(container.textContent).toContain("hypothesized, may follow different rules");
  });

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
      // RF₀ is structure, not a conscious organism: only Big C and Little c are living surfaces.
      expect(surfaces).toHaveLength(2);
      for (const [index, surface] of surfaces.entries()) {
        const radius = [R.bigC, R.local][index];
        if (surface.tagName.toLowerCase() === "circle") {
          expect(Number(surface.getAttribute("r"))).toBe(radius);
        } else {
          const coordinates = surface.getAttribute("d")!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
          expect(coordinates).toHaveLength(192);
          for (let offset = 0; offset < coordinates.length; offset += 2) {
            const distance = Math.hypot(coordinates[offset] - FRAME_CENTRE.x, coordinates[offset + 1] - FRAME_CENTRE.y);
            expect(Math.abs(distance - radius)).toBeLessThan(radius * 0.08);
          }
        }
      }
      expect(diagram).not.toHaveAttribute("filter");
      expect(diagram.querySelectorAll(".home-architecture-surface-gradient")).toHaveLength(2);
      expect(diagram.querySelector('[data-material="frame"]')).toBeNull();
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
