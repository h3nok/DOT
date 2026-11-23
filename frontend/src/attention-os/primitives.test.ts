import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Attention OS primitives answer the keyboard and the eye the same way: one focus ring,
 * nothing under the 11px floor, one motion vocabulary that stays still for anyone who asks,
 * and perceptual colour mixing. The shared values live in shared/design-system/tokens.css.
 * L1 (calm) and L7 (nothing hidden from keyboard or low-vision readers) depend on it.
 */

const ROOT = join(process.cwd(), "src", "attention-os");
const FLOOR_REM = 0.6875;

function stylesheets(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) stylesheets(full, out);
    else if (entry.endsWith(".css")) out.push(full);
  }
  return out;
}

const sheets = stylesheets(ROOT).map((file) => ({
  name: relative(ROOT, file).split(sep).join("/"),
  css: readFileSync(file, "utf8"),
}));

describe("Attention OS primitives", () => {
  it("draw every focus ring from the shared tokens", () => {
    const stray = sheets.flatMap(({ name, css }) =>
      [...css.matchAll(/outline:\s*([^;}]+)/g)]
        .map((match) => match[1].trim())
        .filter((value) => value !== "none" && !value.includes("var(--focus-ring-color)"))
        .map((value) => `${name}: outline: ${value}`),
    );
    expect(stray).toEqual([]);
  });

  it("set no text below the 11px floor", () => {
    const small = sheets.flatMap(({ name, css }) =>
      [...css.matchAll(/font(?:-size)?:\s*(?:italic\s+)?(?:\d{3}\s+)?(\d*\.?\d+)rem/g)]
        .filter((match) => Number(match[1]) < FLOOR_REM)
        .map((match) => `${name}: ${match[0]}`),
    );
    expect(small).toEqual([]);
  });

  it("move only with the shared motion tokens, and only for readers who have not asked for stillness", () => {
    for (const { name, css } of sheets) {
      const timings = [...css.matchAll(/(?:transition|animation)(?:-duration)?:\s*([^;}]+)/g)].map((match) => match[1]);
      for (const timing of timings) {
        if (timing.trim() === "none") continue;
        expect(timing, name).not.toMatch(/(?<![\w-])\d*\.?\d+m?s\b/);
      }
      if (timings.some((timing) => timing.trim() !== "none")) {
        expect(css, name).toMatch(/prefers-reduced-motion:\s*no-preference/);
      }
    }
  });

  it("mix colours perceptually", () => {
    const srgb = sheets.filter(({ css }) => /color-mix\(in srgb/.test(css)).map(({ name }) => name);
    expect(srgb).toEqual([]);
  });

  it("give every explainer link and disclosure a visible keyboard focus", () => {
    const explainer = sheets.find(({ name }) => name === "explainer/explainer.css")!.css;
    expect(explainer).toMatch(/a:focus-visible/);
    expect(explainer).toMatch(/summary:focus-visible/);
  });
});
