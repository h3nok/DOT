import { describe, expect, it } from "vitest";
import { foldDepthPassages, type DepthNode } from "./remarkDepthPassages";

const paragraph = (value: string): DepthNode => ({
  type: "paragraph",
  children: [{ type: "text", value }],
});

describe("foldDepthPassages", () => {
  it("folds a marked passage into a closed disclosure without dropping its text", () => {
    const folded = foldDepthPassages([
      paragraph("Core argument."),
      paragraph("::: depth Formal definition of Rendering Latency"),
      { type: "heading", children: [{ type: "text", value: "Rendering Latency" }] },
      paragraph("RL is the interval between Intent and the first measurable change."),
      paragraph(":::"),
      paragraph("The argument continues."),
    ]);

    expect(folded.map((node) => node.type)).toEqual(["paragraph", "depthPassage", "paragraph"]);
    const [, passage] = folded;
    expect(passage.data?.hName).toBe("details");
    expect(passage.data?.hProperties).toMatchObject({
      dataDepthLabel: "Formal definition of Rendering Latency",
      dataDepthMinutes: 1,
    });
    const [summary, ...body] = passage.children ?? [];
    expect(summary.data?.hName).toBe("summary");
    expect(summary.children?.[0].value).toBe("Formal definition of Rendering Latency");
    expect(body.map((node) => node.type)).toEqual(["heading", "paragraph"]);
  });

  it("never shows stray or unlabelled markers as reading text", () => {
    const folded = foldDepthPassages([
      paragraph(":::"),
      paragraph("::: depth"),
      paragraph("Unclosed detail runs to the end of the section."),
    ]);

    expect(folded).toHaveLength(1);
    expect(folded[0].children?.[0].children?.[0].value).toBe("Technical detail");
    expect(folded[0].children).toHaveLength(2);
  });

  it("leaves ordinary text that merely starts with colons alone", () => {
    const nodes = [paragraph("::: not a depth marker"), paragraph("Text.")];
    expect(foldDepthPassages(nodes)).toEqual(nodes);
  });
});
