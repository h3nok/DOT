import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Radius scales, as law.
 *
 * `--appearance-ui-control-radius` is the *control* scale: several UI styles
 * legitimately resolve it to `999px`, which is right for a pill button and
 * catastrophic for a card — paragraphs collide with the curved corners and the
 * surface reads as an oval. Cards must use the surface-scale token
 * `--dot-card-radius` (organism.css), which is never a pill.
 *
 * This guards the distinction the same way `type-scale.test.ts` guards the
 * floor: any CSS rule whose selector names a card may not borrow the control
 * radius.
 */

const SRC = join(process.cwd(), "src");

function stylesheets(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!["node_modules", "dist", "coverage", "assets"].includes(entry)) stylesheets(full, out);
      continue;
    }
    if (entry.endsWith(".css")) out.push(full);
  }
  return out;
}

function cardRulesUsingControlRadius(): string[] {
  const found: string[] = [];
  for (const file of stylesheets(SRC)) {
    const rel = relative(SRC, file).split(sep).join("/");
    const css = readFileSync(file, "utf8");
    for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const selector = match[1].trim().split("\n").pop()!.trim();
      const body = match[2];
      if (!/card/i.test(selector)) continue;
      if (body.includes("--appearance-ui-control-radius")) {
        found.push(`${rel}::${selector}`);
      }
    }
  }
  return found;
}

describe("surface radius", () => {
  it("never applies the control (pill-capable) radius to a card", () => {
    expect(
      cardRulesUsingControlRadius(),
      "Cards use var(--dot-card-radius) — the control radius becomes a pill in some UI styles:",
    ).toEqual([]);
  });
});
