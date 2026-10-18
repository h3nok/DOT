import { describe, expect, it } from "vitest";
import { exportManuscript, importManuscript } from "./manuscriptFile";
import { exportArtworkMarkdown, manuscriptImages, writingReadiness } from "./manuscriptMedia";

describe("portable author-supplied manuscripts", () => {
  it("round-trips quoted metadata, claim notes and untouched Markdown", () => {
    const source = '---\ntitle: "A question: why?"\nsummary: >-\n  A multiline\n  summary.\nformat: case-study\nseries: Fixture series\ncover: fixture/banner.png\ncover_alt: A landscape\nlevels: [model]\nclaims:\n  - statement: A provisional claim\n    level: ""\n    origin: author_originated\n---\n\n## Body\n\n  Indentation stays.\n\n![An image](fixture/figure.png "Caption")\n';
    const imported = importManuscript(source, "fixture.md");
    expect(imported.draft.title).toBe("A question: why?");
    expect(imported.draft.summary).toBe("A multiline summary.");
    const restored = importManuscript(exportManuscript(imported.draft, imported.claims, imported.slug), "fixture.md");
    expect(restored).toEqual(imported);
    expect(restored.draft.body).toContain("  Indentation stays.");
  });
  it("accepts ordinary Markdown and never imports permission to publish", () => {
    expect(importManuscript("# Supplied title\n\nBody.\n", "draft.md").draft).toMatchObject({ title: "Supplied title", body: "Body.\n" });
    const imported = importManuscript("---\ntitle: Supplied\ndraft: false\n---\nText", "draft.md");
    expect(exportManuscript(imported.draft, imported.claims)).toContain("draft: true");
  });
  it.each([
    "---\ntitle: One\ntitle: Two\n---\nBody",
    "---\ntitle: &title Hello\nsummary: *title\n---\nBody",
    "---\nunrecognized: never discard this silently\n---\nBody",
    "---\npublished: 2026-02-30\n---\nBody",
    "---\npublished: 2026-03-01\nupdated: 2026-02-01\n---\nBody",
    "---\ntitle: Unclosed",
  ])("rejects invalid metadata without a partial import", source => {
    expect(() => importManuscript(source, "draft.md")).toThrow();
  });
  it("opens existing JSON backups", () => {
    expect(importManuscript(JSON.stringify({ schema: "dot.writing-draft.v1", title: "Backup", summary: "", body: "Saved text", claims: [] }), "draft.json").draft.body).toBe("Saved text");
  });
  it("recognizes reference-style images but ignores examples in code", () => {
    expect(manuscriptImages('![A figure][id]\n\n[id]: ./post/figure.png\n\n```md\n![Example](missing.png)\n```')).toEqual([{ path: "post/figure.png", alt: "A figure" }]);
  });
  it("keeps missing artwork and unfinished claims out of publication", () => {
    const { draft } = importManuscript('---\ntitle: Supplied\ncover: post/banner.png\n---\n![](https://external.test/tracker.png)', "draft.md");
    expect(writingReadiness(draft, [])).toEqual(expect.arrayContaining([
      "Declare the material claims in this piece.", "Attach the banner: post/banner.png.", "Describe the banner image.",
      "Attach https://external.test/tracker.png, or remove its image markup.",
    ]));
  });
});

it("exports both inline and reference artwork without rewriting the manuscript", () => {
  const body = 'Unchanged prose.\n\n![Inline](post/a.png "Credit")\n\n![Referenced][figure]\n\n[figure]: ./post/a.png\n';
  const output = exportArtworkMarkdown(body, [{ path: "post/a.png", src: "https://api.example.test/public/image", width: 1200, height: 800, bytes: 200 }], "https://dotheory.org");
  expect(output).toContain('![Inline](https://api.example.test/public/image "Credit")');
  expect(output).toContain("[figure]: https://api.example.test/public/image");
  expect(output).toContain("![Referenced][figure]");
  expect(output.startsWith("Unchanged prose.\n\n")).toBe(true);
});
