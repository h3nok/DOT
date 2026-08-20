import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The reading controls, guarded at the source.
 *
 * `--reading-scale` once had no effect on chapter prose above 640px: the only
 * `font-size` for `.book-prose p` lived inside `@media (max-width: 640px)`,
 * among grid rules for the chapter nav plane. Headings scaled, body text did
 * not, and the phone was set larger than the desktop — the tell that the rules
 * had been written into whichever block happened to be open.
 *
 * No unit test could catch it: jsdom evaluates neither media queries nor the
 * cascade, so this reads the stylesheet the way the earlier gate reads source
 * for forbidden mechanisms. It is coarse on purpose — it asks only whether the
 * declaration exists outside any `@media`, which is the exact property that was
 * missing.
 */

const CSS = readFileSync(join(process.cwd(), "src/index.css"), "utf8");

/** Declarations sitting at the top level, with every `@media` block removed. */
function unconditional(css: string): string {
  const out: string[] = [];
  let depth = 0;
  let skipping = false;
  let skipDepth = 0;

  for (const line of css.split("\n")) {
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;

    if (!skipping && /@media/.test(line)) {
      skipping = true;
      skipDepth = depth;
    }
    if (!skipping) out.push(line);

    depth += opens - closes;
    if (skipping && depth <= skipDepth) skipping = false;
  }
  return out.join("\n");
}

describe("reading controls reach the prose", () => {
  const base = unconditional(CSS);

  it("sizes chapter body text at every width, not only on a phone", () => {
    // The rule the Size control multiplies. Scoped to a width, it silently
    // stops working on the screens most reading happens on.
    const rule = /\.book-prose p,\s*\n\s*\.book-prose li \{[^}]*font-size:[^;]*--reading-scale/;
    expect(rule.test(base)).toBe(true);
  });

  it("leaves line-height to the Leading control", () => {
    // `.book-prose > p:first-child` outranks `html[data-leading="…"]
    // .book-prose p`, so a line-height here pins the opening paragraph of every
    // chapter and Leading stops moving it.
    const firstChild = /\.book-prose > p:first-child,[\s\S]{0,160}?\{([^}]*)\}/.exec(base);
    expect(firstChild, "first-child sizing rule is missing").not.toBeNull();
    expect(firstChild![1]).not.toMatch(/line-height/);
  });
});
