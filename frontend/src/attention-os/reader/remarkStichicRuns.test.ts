import { describe, expect, it } from "vitest";

import { remarkStichicRuns, type ParagraphNode } from "./remarkStichicRuns";

interface TestRoot {
  type: "root";
  children: { type: string; data?: { hProperties?: Record<string, unknown> } }[];
}

function paragraph(value: string): ParagraphNode {
  return { type: "paragraph", children: [{ type: "text", value }] };
}

function run(...lines: string[]): TestRoot {
  const tree: TestRoot = { type: "root", children: lines.map(paragraph) };
  remarkStichicRuns()(tree);
  return tree;
}

function marks(tree: TestRoot): (string | undefined)[] {
  return tree.children.map(
    (node) => node.data?.hProperties?.["data-draft-position"] as string | undefined,
  );
}

describe("remarkStichicRuns", () => {
  it("marks a run of stacked one-sentence lines as one cluster", () => {
    const tree = run(
      "Leave.",
      "Stay and be polite.",
      "Tell the truth.",
      "Do not disturb the group.",
      "Check the phone.",
      "Focus.",
    );

    expect(marks(tree)).toEqual([
      "first",
      "middle",
      "middle",
      "middle",
      "middle",
      "last",
    ]);
    expect(
      tree.children[0].data?.hProperties?.className,
    ).toBe("book-draft-line");
  });

  it("leaves isolated rhetorical beats alone", () => {
    // Deliberate single lines, not a catalogue. Marking them as a run would
    // invent a relationship the prose does not claim.
    const tree = run(
      "The Frame permits many trajectories.",
      "It does not make them equally coherent.",
    );

    expect(marks(tree)).toEqual([undefined, undefined]);
  });

  it("does not gather ordinary prose paragraphs", () => {
    const tree = run(
      "Intent is not every thought, impulse, image, fear, or desire that appears.",
      "The Canvas can raise many possible movements at once, and many are never chosen.",
      "Intent is the movement from proposal to commitment, which is a different act.",
    );

    expect(marks(tree)).toEqual([undefined, undefined, undefined]);
  });

  it("stops the run where the prose resumes", () => {
    const tree = run(
      "Leave.",
      "Tell the truth.",
      "Focus.",
      "These are pre-Intent drafts: proposals generated from the current situation.",
    );

    expect(marks(tree)).toEqual(["first", "middle", "last", undefined]);
  });

  it("leaves a paragraph carrying emphasis or links untouched", () => {
    const tree: TestRoot = {
      type: "root",
      children: [
        paragraph("Leave."),
        {
          type: "paragraph",
          children: [{ type: "strong" }],
        } as ParagraphNode,
        paragraph("Focus."),
      ],
    };
    remarkStichicRuns()(tree);

    expect(marks(tree)).toEqual([undefined, undefined, undefined]);
  });
});
