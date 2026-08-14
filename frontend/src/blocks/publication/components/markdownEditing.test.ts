import { describe, expect, it } from "vitest";

import {
  insertMarkdownBlock,
  prefixMarkdownLines,
  wrapMarkdownSelection,
} from "./markdownEditing";

describe("markdown editing", () => {
  it("wraps the current selection and keeps it selected", () => {
    const edit = wrapMarkdownSelection("A clear claim", 2, 7, "**", "**", "text");
    expect(edit.value).toBe("A **clear** claim");
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe("clear");
  });

  it("gives inserted blocks calm paragraph spacing", () => {
    const edit = insertMarkdownBlock("Before.\n\nAfter.", 9, 9, "> A passage.");
    expect(edit.value).toBe("Before.\n\n> A passage.\n\nAfter.");
  });

  it("prefixes every selected line", () => {
    const edit = prefixMarkdownLines("One\nTwo", 0, 7, "> ", "Quote");
    expect(edit.value).toBe("> One\n> Two");
  });
});
