import { describe, expect, it } from "vitest";
import { ESSENTIAL_EQUATIONS, foldDepthPassages, foldFormalNotes, type DepthNode } from "./remarkDepthPassages";

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

describe("foldFormalNotes", () => {
  const p = (...children: DepthNode[]): DepthNode => ({ type: "paragraph", children });
  const t = (value: string): DepthNode => ({ type: "text", value });
  const symbol = (value: string): DepthNode => ({ type: "inlineMath", value });
  const equation = (tag: string): DepthNode => ({ type: "math", value: `x \\tag{${tag}}` });
  const label = (node: DepthNode) => node.children?.[0]?.children?.[0]?.value;

  it("folds an equation with its lead-in and explanation into a closed formal note", () => {
    const folded = foldFormalNotes([
      p(t("A better first model is an interval:")),
      equation("2.2"),
      p(t("In Equation (2.2), "), symbol("I_t"), t(" is the interval.")),
      p(t("The argument continues.")),
    ]);
    expect(folded).toHaveLength(2);
    expect(folded[0].data?.hName).toBe("details");
    expect(label(folded[0])).toBe("Formal note · Equation 2.2");
    expect(folded[0].children).toHaveLength(4);
    expect(folded[1]).toEqual(p(t("The argument continues.")));
  });

  it("keeps the essential relationships in the reading line, with the words that explain them", () => {
    expect(ESSENTIAL_EQUATIONS).toEqual(["2.5", "5.7", "5.8", "6.1"]);
    const nodes = [equation("5.8"), p(t("Equation (5.8) expresses narrowing: "), symbol("D^{Fear}"), t("."))];
    expect(foldFormalNotes(nodes)).toEqual(nodes);
  });

  it("leaves prose that merely mentions a symbol, and folds lines that only name notation", () => {
    const prose = p(t("Our clocks do not measure T itself. DOT uses "), symbol("t_{RF}"), t(" for it."));
    const notation = p(t("The notation "), symbol("x"), t(" will replace "), symbol("y"), t("."));
    const folded = foldFormalNotes([prose, notation]);
    expect(folded[0]).toBe(prose);
    expect(label(folded[1])).toBe("Formal note");
  });
});
