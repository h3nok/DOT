import { describe, expect, it } from "vitest";

import {
  claimLevelFromLabel,
  claimStatementMarkdown,
  editorialFormFromText,
  editorialFormMarkdown,
  numberedClaimStatement,
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

  it("distinguishes a bridge boundary and a definition from evidence and hypotheses", () => {
    expect(numberedClaimStatement("Bridge boundary — DOT-B1: Access is not origin.")).toMatchObject({ id: "DOT-B1", kind: "boundary", claimLevel: undefined });
    expect(numberedClaimStatement("Definition — DOT-D2: A defined term.")).toMatchObject({ kind: "definition", claimLevel: undefined });
    expect(numberedClaimStatement("Observation — DOT-E0: Experience occurs.")).toMatchObject({ claimLevel: "observation" });
    expect(numberedClaimStatement("Architectural hypothesis — DOT-H2: A proposed architecture.")).toMatchObject({ claimLevel: "hypothesis" });
    expect(numberedClaimStatement("The next paragraph discusses Bridge boundary — DOT-B1: access.")).toBeNull();
  });
});
