import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ARCHITECTURE_RADII as R, BIG_C_CENTRE, FRAME_CENTRE, LOCAL_CENTRE } from "./architectureGeometry";
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
      const frameDistance = Math.hypot(x - FRAME_CENTRE.x, y - FRAME_CENTRE.y);
      const bigDistance = Math.hypot(x - BIG_C_CENTRE.x, y - BIG_C_CENTRE.y);
      expect(frameDistance - r).toBeGreaterThan(R.frame + 4);
      expect(bigDistance + r).toBeLessThan(R.bigC - 8);
    }
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
      // The local detail omits the outer Big C context. RF₀ remains structure.
      const radii = diagram.getAttribute("data-focus") === "little-c" ? [R.local] : [R.bigC, R.local];
      expect(surfaces).toHaveLength(radii.length);
      for (const [index, surface] of surfaces.entries()) {
        const radius = radii[index];
        if (surface.tagName.toLowerCase() === "circle") {
          expect(Number(surface.getAttribute("r"))).toBe(radius);
        } else {
          const coordinates = surface.getAttribute("d")!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
          expect(coordinates).toHaveLength(192);
          for (let offset = 0; offset < coordinates.length; offset += 2) {
            const centre = radius === R.bigC ? BIG_C_CENTRE : LOCAL_CENTRE;
            const distance = Math.hypot(coordinates[offset] - centre.x, coordinates[offset + 1] - centre.y);
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

  it("embodies Little c through an Avatar in RF₀ without placing the experiencer inside that Frame", () => {
    const { container } = render(<HeroArchitecture />);
    const frame = container.querySelector(".home-architecture-frame-boundary")!;
    const local = container.querySelector(".home-architecture-local-core")!;
    const big = container.querySelector(".home-architecture-big-c-zone")!;
    const geometry = (node: Element) => ["cx", "cy", "r"].map(name => Number(node.getAttribute(name)));
    const [fx, fy, fr] = geometry(frame), [cx, cy] = geometry(local), [bx, by, br] = geometry(big);
    expect(Math.hypot(cx - fx, cy - fy) - R.local).toBeGreaterThan(fr);
    expect(Math.hypot(cx - bx, cy - by) + R.awareness).toBeLessThan(br);
    expect(Math.hypot(fx - bx, fy - by) + fr).toBeLessThan(br);
    for (const avatar of container.querySelectorAll(".home-architecture-avatar")) {
      const [x, y, scale] = avatar.getAttribute("transform")!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      expect(Math.hypot(x - fx, y - fy) + 58 * scale).toBeLessThan(fr);
      expect(avatar.closest('[data-entity="reality-frame"]')).not.toBeNull();
    }
    expect(local.closest('[data-entity="reality-frame"]')).toBeNull();
    expect(container.querySelector('[data-flow="reality-stream"]')).toHaveAttribute("marker-end");
    expect(container.querySelector('[data-flow="embodied-action"]')).toHaveAttribute("marker-end");
    expect(container.querySelector('[data-entity="canvas"]')).not.toBeNull();
    expect(container.querySelector("desc")?.textContent).toContain("Little c is outside RF₀ and embodied by a living body inside it");
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
