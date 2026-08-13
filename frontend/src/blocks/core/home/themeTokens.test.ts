/**
 * The entry surface must not own a colour.
 *
 * The Appearance panel is the member's, not the page's: light/dark, accent
 * tint, stillness, and the living field all have to govern the front door the
 * same way they govern every reading surface. A literal colour anywhere in
 * these files is how that breaks — an earlier pass painted the hero on an
 * opaque black stage, which looked deliberate and silently overrode both the
 * theme and the member's tint.
 *
 * So this scans the hero for literals rather than trusting review to catch it.
 * Colour belongs in `var(--organism-accent*)`, `var(--background)`,
 * `var(--foreground)`, or a Tailwind token that resolves to them.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HERO_FILES = [
  "HomeV2Page.tsx",
  "EmergenceMark.tsx",
  "HeroConcepts.tsx",
  "HeroAsk.tsx",
  "ArchitectureDiagram.tsx",
  "StepOneUnlearning.tsx",
  "HomeMethod.tsx",
  "HomeWhatThisIs.tsx",
  "HomePractice.tsx",
] as const;

const HERE = join(process.cwd(), "src", "blocks", "core", "home");

/** `#fff`, `#f2ead9`, `rgb(...)`, `rgba(...)`, `hsl(...)` written literally. */
const LITERAL_COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe("home entry theme compatibility", () => {
  for (const file of HERO_FILES) {
    it(`${file} carries no literal colour`, () => {
      const source = readFileSync(join(HERE, file), "utf8");

      const offenders = source
        .split("\n")
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        .filter(({ line }) => LITERAL_COLOUR.test(line));

      expect(
        offenders,
        `Use a theme or organism-accent variable instead:\n${offenders
          .map((o) => `  ${file}:${o.number}  ${o.line}`)
          .join("\n")}`,
      ).toEqual([]);
    });
  }

  it("keeps the hero transparent so the living field shows through", () => {
    const source = readFileSync(join(HERE, "HomeV2Page.tsx"), "utf8");

    // An opaque stage on the section itself would seal the membrane out. The
    // one permitted `bg-background` is the veil, which animates away.
    expect(source).not.toMatch(/<section[^>]*\sclassName="[^"]*\bbg-(?!background\b)\S/);
  });

  it("treats Appearance-panel stillness as a reason not to animate", () => {
    const source = readFileSync(join(HERE, "HomeV2Page.tsx"), "utf8");

    expect(source).toContain("config.stillness");
    expect(source).toContain("config.enabled");
  });
});
