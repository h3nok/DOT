import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import identity from "../content/identity.json";
import theme from "../content/theme.json";
import { applyIdentityPalette } from "./identity";

function luminance(hex: string): number {
  const components = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * components[0] + 0.7152 * components[1] + 0.0722 * components[2];
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("the AMM signature theme (ADR-0061)", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
  });

  it("keeps body text at AAA contrast and supporting text/actions at AA in both lights", () => {
    for (const base of ["light", "dark"] as const) {
      const palette = theme[base];
      expect(contrast(palette.ink, palette.surface)).toBeGreaterThanOrEqual(7);
      expect(contrast(palette.muted, palette.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.accent, palette.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("publishes the theme, the book's own brand, and the font roles, and matches the browser chrome", () => {
    const root = document.documentElement;
    applyIdentityPalette(root);
    expect(root.dataset.palette).toBe("amm");
    expect(root.style.getPropertyValue("--identity-light-surface")).toBe(theme.light.surface);
    expect(root.style.getPropertyValue("--identity-dark-accent")).toBe(theme.dark.accent);
    expect(root.style.getPropertyValue("--brand-dark-surface")).toBe(identity.dark.surface);
    expect(root.style.getPropertyValue("--identity-display-font")).toBe('"Space Grotesk"');
    expect(document.querySelector("meta")?.getAttribute("content")).toBe(theme.light.surface);
    root.classList.add("dark");
    applyIdentityPalette(root);
    expect(document.querySelector("meta")?.getAttribute("content")).toBe(theme.dark.surface);
  });

  it("paints every page from the theme, keeps the theory's diagram colours, and the jacket's brand", () => {
    const identityCss = readFileSync(join(process.cwd(), "src/organism/identity.css"), "utf8");
    const tokensCss = readFileSync(join(process.cwd(), "src/shared/design-system/tokens.css"), "utf8");
    const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");

    expect(identityCss).toContain('html.dark[data-palette="amm"]');
    expect(identityCss).toContain("--organism-accent-strong: var(--identity-accent);");
    expect(identityCss).not.toContain("data-paper");
    expect(identityCss).not.toContain("data-identity-accent");
    // Big C, RF, and the field keep their meaning on the home's architecture.
    expect(identityCss).toContain("--identity-emerald: #5ee0ae;");
    expect(identityCss).toContain("--architecture-loop-inner: var(--identity-rf);");
    expect(identityCss).toContain("--book-paper: var(--brand-dark-surface);");

    expect(tokensCss).toContain(`--public-rust: ${theme.light.accent};`);
    expect(tokensCss).toContain(`--public-rust: ${theme.dark.accent};`);
    expect(tokensCss).not.toContain("--public-forest");

    // Before scripts run, the page already wears the theme.
    expect(indexHtml).toContain(`background: ${theme.light.surface}`);
    expect(indexHtml).toContain(`background: ${theme.dark.surface}`);
  });
});
