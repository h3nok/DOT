import { describe, expect, it } from "vitest";

import {
  claimLevelFromLabel,
  claimStatementMarkdown,
  editorialFormFromText,
  editorialFormMarkdown,
} from "./editorialGrammar";

describe("editorial grammar", () => {
  it("recognizes an authored passage without publication-specific code", () => {
    expect(editorialFormFromText("Working definition\nA digital organism...")).toBe(
      "working-definition",
    );
  });

  it("creates portable blockquote Markdown from selected prose", () => {
    expect(editorialFormMarkdown("plain-language", "Life carries change.")).toBe(
      ["> **In plain language**", ">", "> Life carries change."].join("\n"),
    );
  });

  it("creates and recognizes explicit claim levels", () => {
    expect(claimStatementMarkdown("hypothesis", "Consciousness is fundamental.")).toBe(
      "**Hypothesis:** Consciousness is fundamental.",
    );
    expect(claimLevelFromLabel("Hypothesis:")).toBe("hypothesis");
  });
});
