import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { UI_STYLE_OPTIONS } from "./appearanceOptions";
import { UI_STYLE_IDS } from "./types";

/**
 * The surface styles reach onto the reading surface by class name, and a class
 * name is the one kind of reference nothing checks: a selector for markup that
 * does not exist compiles, ships, and silently does nothing.
 *
 * That already happened. `.book-path-link` and `.book-reading-band` are defined
 * in index.css but no component has ever rendered them, so styling them looked
 * like differentiating four surface styles and changed nothing at all — while
 * the rules that *did* land went unexamined. AGENTS.md says to check for live
 * imports before editing; this is that check, for CSS.
 */

const SRC = join(process.cwd(), "src");
const STYLE_FILES = ["organism/organism.css", "organism/appearance.css"];

function collectMarkup(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectMarkup(full, out);
    else if (/\.(tsx|ts)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      out.push(readFileSync(full, "utf8"));
    }
  }
  return out;
}

describe("surface styles", () => {
  const markup = collectMarkup(SRC).join("\n");
  const indexCss = readFileSync(join(SRC, "index.css"), "utf8");
  const organismCss = readFileSync(join(SRC, "organism/organism.css"), "utf8");

  it("only styles reading-surface classes that something actually renders", () => {
    const orphans: string[] = [];

    for (const file of STYLE_FILES) {
      const css = readFileSync(join(SRC, file), "utf8");
      // Every `.book-…` class this stylesheet selects on.
      const classes = new Set(
        [...css.matchAll(/\.(book-[a-z0-9-]+)/g)].map((m) => m[1]),
      );
      for (const cls of classes) {
        // Word-boundary match: `book-reader` must not be satisfied by
        // `book-reader-quick-tools` appearing somewhere in a className.
        if (new RegExp(`\\b${cls}\\b`).test(markup)) continue;

        // A BEM-style modifier is often composed at render time
        // (`book-prose--${variant}`), so the whole name never appears in the
        // source. Accept it when the component builds that family
        // dynamically — but only then.
        const [family] = cls.split("--");
        if (cls.includes("--") && markup.includes(`${family}--\${`)) continue;

        orphans.push(`${file}: .${cls}`);
      }
    }

    expect(orphans).toEqual([]);
  });

  it("connects every selectable surface style to the shared UI contract", () => {
    expect(UI_STYLE_OPTIONS.map((option) => option.value)).toEqual(UI_STYLE_IDS);

    for (const style of UI_STYLE_IDS.filter((value) => value !== "default")) {
      expect(organismCss).toContain(`html[data-ui-style="${style}"]`);
    }

    for (const role of [
      "appearance-ui-panel",
      "appearance-ui-chrome",
      "appearance-ui-control",
    ]) {
      expect(organismCss).toContain(`.${role}`);
      expect(markup).toContain(role);
    }
  });

  it("keeps translucent edge accents out of manuscript foreground text", () => {
    expect(indexCss).not.toMatch(/color:\s*var\(--book-verdigris\)/);
    expect(indexCss).toContain("color: var(--book-ink);");
    expect(indexCss).toContain("font-size: 0.8em;");
  });
});
