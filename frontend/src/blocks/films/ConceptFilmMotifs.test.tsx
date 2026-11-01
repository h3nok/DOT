import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchitectureGlyph, ArchitectureMap, BigC, type ArchitectureLayer } from "./ConceptFilmMotifs";

const layers: ArchitectureLayer[] = ["all", "big-c", "reality-frame", "reality-stream", "little-c"];

function checkTopology(markup: string) {
  const document = new DOMParser().parseFromString(markup, "text/html");
  const circle = (role: string) => {
    const node = document.querySelector(`circle[data-model-role="${role}"]`);
    expect(node, `The film must locate ${role}`).not.toBeNull();
    return ["cx", "cy", "r"].map((attribute) => Number(node?.getAttribute(attribute)));
  };
  const big = circle("big-c");
  const frame = circle("reality-frame");
  const local = circle("little-c");
  const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  expect(distance(big, frame) + frame[2]).toBeLessThan(big[2]);
  expect(distance(big, local) + local[2]).toBeLessThan(big[2]);
  expect(distance(frame, local)).toBeGreaterThan(frame[2] + local[2]);
  return document;
}

describe("film architecture", () => {
  it("keeps RF₀ and Little c distinct within Big C as the scene develops", () => {
    for (const t of [1, 5, 12]) {
      const document = checkTopology(renderToStaticMarkup(<svg><BigC t={t} /></svg>));
      if (t === 12) expect(document.querySelector('[data-model-role="avatar"]')).not.toBeNull();
      if (t === 12) expect(document.body.textContent).toContain("T × E · Speculation");
    }
  });

  it.each(layers)("preserves containment and separation while focusing on %s", (layer) => {
    for (const t of [0, 1.5, 12]) {
      const document = checkTopology(renderToStaticMarkup(<svg><ArchitectureMap t={t} layer={layer} /></svg>));
      if (t === 12) expect(document.querySelector('[data-model-role="avatar"]')).not.toBeNull();
      expect(document.querySelector('[data-model-role="reality-stream"]')).not.toBeNull();
    }
    checkTopology(renderToStaticMarkup(<ArchitectureGlyph layer={layer} />));
  });
});
