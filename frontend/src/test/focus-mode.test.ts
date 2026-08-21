import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Focus mode, guarded at the source.
 *
 * `book-focus-hidden` is applied to the header, the footer, the reading tools,
 * the mobile contents link and the appearance dock, and the rule that hides
 * them was deleted by a dead-CSS sweep (76548b5). Nothing failed: the class
 * stayed in the markup, the selector vanished, and focus mode quietly stopped
 * hiding anything but the contents rail.
 *
 * A class with no rule cannot be caught by a type check, a lint pass or a
 * render test — the markup is still valid and the page still renders. So this
 * asserts the pairing itself, in both directions.
 */

const SRC = join(process.cwd(), "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!["node_modules", "dist", "coverage", "assets"].includes(entry)) walk(full, out);
      continue;
    }
    if (/\.(tsx?|css)$/.test(entry) && !/\.(test|spec)\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(SRC).map((f) => ({
  path: relative(SRC, f).split(sep).join("/"),
  text: readFileSync(f, "utf8"),
}));

const css = files.filter((f) => f.path.endsWith(".css"));
const markup = files.filter((f) => !f.path.endsWith(".css"));

describe("focus mode", () => {
  it("hides the chrome it marks as hidden", () => {
    const used = markup.some((f) => f.text.includes("book-focus-hidden"));
    const styled = css.some((f) =>
      /\[data-book-focus="true"\][^{]*\.book-focus-hidden[^{]*\{[^}]*display:\s*none/.test(f.text),
    );

    expect(used, "no component marks anything book-focus-hidden").toBe(true);
    expect(
      styled,
      "book-focus-hidden is applied in the reader but nothing hides it — focus mode will leave the chrome on screen",
    ).toBe(true);
  });

  it("keeps the class and its rule from drifting apart", () => {
    // The inverse: a rule left behind after the markup stopped using it is dead
    // weight the next sweep will remove, taking the live half with it if the
    // markup ever comes back.
    const styled = css.some((f) => f.text.includes(".book-focus-hidden"));
    const used = markup.some((f) => f.text.includes("book-focus-hidden"));
    expect(styled).toBe(used);
  });
});
