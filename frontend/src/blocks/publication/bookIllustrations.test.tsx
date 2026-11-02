import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BookFigure, type BookFigureData } from "../../attention-os/reader/BookFigure";
import { headingSlug } from "../../attention-os/reader/headingSlug";
import { doctrineNodes } from "../../content/doctrine/doctrineData";
import { BOOK_CONCEPT_PLACEMENTS, bookFigureArtwork } from "./bookIllustrations";

const root = "public/publications/henok/digital-organism-theory/v5";
const manifest = JSON.parse(readFileSync(`${root}/manifest.json`, "utf8")) as { figures: BookFigureData[] };

beforeEach(() => { document.documentElement.dataset.motion = "still"; });
afterEach(() => { delete document.documentElement.dataset.motion; });

describe("digital book illustrations", () => {
  it.each(manifest.figures)("keeps $id beside its caption, with its sealed artwork for print", figure => {
    const data = { ...figure, src: `/publications/henok/digital-organism-theory/v5/${figure.src}` };
    const { container } = render(<BookFigure figure={data} artwork={bookFigureArtwork(data)} />);
    expect(container.querySelector(".book-figure__screen svg[role='img'] desc")).toHaveTextContent(figure.alt);
    expect(container.querySelector("figcaption")).toHaveTextContent(figure.caption);
    expect(container.querySelector("figcaption")).toHaveTextContent(figure.claimLevel);
    expect(container.querySelector('picture[data-print-only="true"] img')).toHaveAttribute("src", data.src);
    expect(container.querySelector("[data-playback]")).toHaveAttribute("data-playback", "still");
  });

  it("places each released concept once at a real heading", () => {
    expect(BOOK_CONCEPT_PLACEMENTS.map(([, , id]) => id).sort()).toEqual(doctrineNodes.map(node => node.id).sort());
    for (const [section, heading] of BOOK_CONCEPT_PLACEMENTS) {
      const text = readFileSync(`${root}/sections/${section}.md`, "utf8");
      let inDepth = false;
      const headings = text.split("\n").flatMap(line => {
        if (line.startsWith("::: depth")) inDepth = true;
        else if (line === ":::") inDepth = false;
        const heading = line.match(/^#{2,3} (.+)$/);
        return heading && !inDepth ? [headingSlug(heading[1])] : [];
      });
      expect(headings, `${section}#${heading}`).toContain(heading);
    }
  });

  it("leaves older editions and unknown figures with their original renderer", () => {
    expect(bookFigureArtwork({ ...manifest.figures[0], src: "/publications/henok/digital-organism-theory/v4/figures/avatar-canvas.svg" })).toBeNull();
    expect(bookFigureArtwork({ ...manifest.figures[0], id: "unknown", src: "/publications/henok/digital-organism-theory/v5/figures/unknown.svg" })).toBeNull();
  });
});
