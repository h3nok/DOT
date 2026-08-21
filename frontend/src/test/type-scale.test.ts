import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The type scale, as a ratchet.
 *
 * `.dot-micro` in organism.css calls 0.6875rem (11px) "the floor", and
 * `.dot-label` is the system's label: mono, uppercase, tracked. Surfaces kept
 * inventing their own instead — an uppercase label with its own size, tracking
 * and colour — and several landed under the floor, the smallest at 0.48rem
 * (7.7px). Two of those were introduced while rebuilding the contents rail and
 * the chapter coda, which is how easily it happens.
 *
 * This works like `manifesto-laws.test.ts`: the known cases are listed, a new
 * one fails, and a listed one that no longer offends *also* fails, so the list
 * can only shrink. Compose `dot-label dot-micro` instead of writing another.
 */

const SRC = join(process.cwd(), "src");
/** 11px, named as the floor by `.dot-micro`. */
const FLOOR_REM = 0.6875;

/** Pre-existing rules under the floor. Only ever remove from this list. */
const QUARANTINE = [
  "index.css::.book-landing-spine-stop",
  "index.css::.book-concept-definition-status",
  "index.css::.book-contents-dialog .book-contents__cost",
  "dot/agent-workspace.css::.agent-workspace-kicker",
  "blocks/core/home/home.css::.home-scroll-cue",
  "blocks/core/home/home.css::.arch-mobile-observer > span",
  "blocks/core/home/home.css::.arch-mobile-node-copy small",
  "blocks/core/home/home.css::.arch-mobile-detail > span",
  "blocks/core/home/home.css::.arch-mobile-edge span",
  "blocks/core/home/home.css::.arch-bottom-role",
  "blocks/core/home/home.css::.arch-bottom-next",
];

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

function undersizedLabels(): string[] {
  const found: string[] = [];
  for (const file of stylesheets(SRC)) {
    const rel = relative(SRC, file).split(sep).join("/");
    // organism.css defines the scale; it is allowed to state the floor.
    if (rel === "organism/organism.css") continue;
    const css = readFileSync(file, "utf8");
    for (const match of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const body = match[2];
      if (!/text-transform:\s*uppercase/.test(body)) continue;
      const size = /font-size:\s*([\d.]+)rem/.exec(body);
      if (!size) continue;
      if (Number(size[1]) < FLOOR_REM) {
        const selector = match[1].trim().split("\n").pop()!.trim();
        found.push(`${rel}::${selector}`);
      }
    }
  }
  return found;
}

describe("type scale", () => {
  const found = undersizedLabels();

  it("adds no uppercase label under the 11px floor", () => {
    const unexpected = found.filter((entry) => !QUARANTINE.includes(entry));
    expect(
      unexpected,
      `Uppercase label below the ${FLOOR_REM}rem floor. Compose "dot-label dot-micro" rather than adding another label style:\n${unexpected.join("\n")}`,
    ).toEqual([]);
  });

  it("keeps the quarantine honest", () => {
    const stale = QUARANTINE.filter((entry) => !found.includes(entry));
    expect(stale, `No longer offends — delete from QUARANTINE:\n${stale.join("\n")}`).toEqual([]);
  });
});
