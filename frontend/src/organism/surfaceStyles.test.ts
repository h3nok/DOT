import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

  it("keeps the primary entrance distinguishable in every surface style", () => {
    // Each style paints the two entrances with one shared treatment. Whenever
    // that treatment covers the ground the modifiers use to tell them apart,
    // the style owes the primary a distinction of its own — otherwise the
    // landing page offers two identical cards and no primary action.
    const css = readFileSync(join(SRC, "organism/organism.css"), "utf8");
    const styles = new Set(
      [...css.matchAll(/html\[data-ui-style="([a-z]+)"\] \.book-entrance\b(?!-)/g)].map(
        (m) => m[1],
      ),
    );
    expect(styles.size).toBeGreaterThan(0);

    for (const style of styles) {
      const block = new RegExp(
        `html\\[data-ui-style="${style}"\\] \\.book-entrance[^{]*\\{([^}]*)\\}`,
      );
      const shared = css.match(block)?.[1] ?? "";
      const flattensGround = /(^|;|\s)background\s*:/.test(shared);
      if (!flattensGround) continue;

      const hasPrimaryRule = new RegExp(
        `html\\[data-ui-style="${style}"\\] \\.book-entrance--primary`,
      ).test(css);
      expect(hasPrimaryRule, `${style} flattens the entrance ground`).toBe(true);
    }
  });
});
