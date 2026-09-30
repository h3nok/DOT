import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  ESSAYS_DIR,
  essayIndex,
  parseEssay,
  parseFrontMatter,
  readEssays,
  // Plain ESM so the Vite plugin, the materializer, and these tests share it.
  // @ts-expect-error -- no declarations; this test is the contract instead.
} from "./essays.mjs";
import { doctrineNodes } from "../src/content/doctrine/doctrineData";

interface Essay {
  slug: string;
  title: string;
  published: string;
  levels: string[];
  concepts: string[];
  draft: boolean;
  words: number;
  readingMinutes: number;
  body: string;
}

const essay = (front: string, body = "The text begins here.") => `---\n${front}\n---\n\n${body}\n`;
const VALID = [
  "title: Is a language model a Digital Organism?",
  "summary: What DOT's definition says about machines.",
  "published: 2026-10-14",
  "levels: [model, hypothesis]",
].join("\n");

let dir: string | null = null;
function folder(files: Record<string, string>): string {
  dir = mkdtempSync(join(tmpdir(), "dot-essays-"));
  for (const [name, contents] of Object.entries(files)) writeFileSync(join(dir, name), contents);
  return dir;
}

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = null;
});

describe("essay front matter", () => {
  it("reads the fields an author writes, including lists, quotes, and comments", () => {
    const { data, body } = parseFrontMatter(
      essay(`# a note to myself\ntitle: "Fear: a model"\nlevels: [model, hypothesis]\ndraft: true`),
    );
    expect(data).toEqual({ title: "Fear: a model", levels: ["model", "hypothesis"], draft: true });
    expect(body).toBe("The text begins here.");
  });

  it("refuses a misspelt field instead of publishing without it", () => {
    expect(() => parseFrontMatter(essay("sumary: oops"))).toThrow(/unknown front matter field "sumary"/);
  });

  it("refuses a file without front matter", () => {
    expect(() => parseFrontMatter("Just text.")).toThrow(/must start with front matter/);
    expect(() => parseFrontMatter("---\ntitle: x\n")).toThrow(/never closed/);
  });
});

describe("a released essay", () => {
  it("states its claim levels (ADR-0030)", () => {
    const withoutLevels = VALID.replace("levels: [model, hypothesis]", "");
    expect(() => parseEssay(essay(withoutLevels), "on-machines")).toThrow(/levels/);
    expect(() =>
      parseEssay(essay(VALID.replace("[model, hypothesis]", "[model, certainty]")), "on-machines"),
    ).toThrow(/"certainty" is not a level/);
  });

  it("has a real date, and a revision cannot predate it", () => {
    expect(() =>
      parseEssay(essay(VALID.replace("2026-10-14", "2026-02-30")), "on-machines"),
    ).toThrow(/YYYY-MM-DD/);
    expect(() => parseEssay(essay(`${VALID}\nupdated: 2026-10-01`), "on-machines")).toThrow(
      /cannot be earlier/,
    );
  });

  it("does not repeat its title as a # heading", () => {
    expect(() => parseEssay(essay(VALID, "# Is a language model…\n\nText."), "on-machines")).toThrow(
      /starts with a # heading/,
    );
  });

  it("is addressed by a clean, unreserved file name", () => {
    expect(() => parseEssay(essay(VALID), "On Machines")).toThrow(/lowercase words/);
    expect(() => parseEssay(essay(VALID), "index")).toThrow(/reserved/);
  });

  it("promises the same reading time a chapter of that length would", () => {
    const words = Array.from({ length: 660 }, () => "word").join(" ");
    const parsed = parseEssay(essay(VALID, words), "on-machines") as Essay;
    expect(parsed.words).toBe(660);
    expect(parsed.readingMinutes).toBe(3); // 660 / 220, Book One's rate
  });
});

describe("the essays folder", () => {
  it("publishes newest first and withholds drafts and templates", () => {
    const essays = readEssays({
      dir: folder({
        "older.md": essay(VALID.replace("2026-10-14", "2026-09-01")),
        "newer.md": essay(VALID),
        "unfinished.md": essay(`${VALID}\ndraft: true`),
        "_template.md": "anything at all",
        "notes.txt": "not an essay",
      }),
    }) as Essay[];

    expect(essays.map((entry) => entry.slug)).toEqual(["newer", "older"]);
  });

  it("publishes an index without the text or the draft flag", () => {
    const [entry] = essayIndex(readEssays({ dir: folder({ "newer.md": essay(VALID) }) })).essays;
    expect(entry).not.toHaveProperty("body");
    expect(entry).not.toHaveProperty("draft");
    expect(entry).toMatchObject({ slug: "newer", levels: ["model", "hypothesis"], concepts: [] });
  });

  it("ships a template that is itself a valid essay, and never published", () => {
    const template = readFileSync(join(ESSAYS_DIR, "_template.md"), "utf8");
    const parsed = parseEssay(template, "template") as Essay;
    expect(parsed.draft).toBe(true);
    expect(readEssays().some((entry: Essay) => entry.slug === "template")).toBe(false);
  });

  it("links only to concepts that exist in the concept map", () => {
    const known = new Set(doctrineNodes.map((node) => node.id));
    for (const entry of readEssays({ includeDrafts: true }) as Essay[]) {
      for (const id of entry.concepts) expect(known.has(id), `${entry.slug}: ${id}`).toBe(true);
    }
  });
});
