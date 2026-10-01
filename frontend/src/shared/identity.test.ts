import { beforeEach, describe, expect, it } from "vitest";

import identity from "../content/identity.json";
import { defaultConfigFor, themePreset } from "../organism/themePresets";
import { resolveOrganismConfig } from "../organism/types";
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

describe("shared DOT identity", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
  });

  it("keeps body text at AAA contrast and supporting text/actions at AA in both lights", () => {
    for (const base of ["light", "dark"] as const) {
      const palette = identity[base];
      expect(contrast(palette.ink, palette.surface)).toBeGreaterThanOrEqual(7);
      expect(contrast(palette.muted, palette.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.accent, palette.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("publishes the shared colours and font roles, and matches the browser chrome", () => {
    const root = document.documentElement;
    applyIdentityPalette(root, "dot");
    expect(root.dataset.palette).toBe("dot");
    expect(root.style.getPropertyValue("--identity-light-surface")).toBe(identity.light.surface);
    expect(root.style.getPropertyValue("--identity-dark-accent")).toBe(identity.dark.accent);
    expect(root.style.getPropertyValue("--identity-display-font")).toBe('"Space Grotesk"');
    expect(document.querySelector("meta")?.getAttribute("content")).toBe(identity.light.surface);
    root.classList.add("dark");
    applyIdentityPalette(root, "dot");
    expect(document.querySelector("meta")?.getAttribute("content")).toBe(identity.dark.surface);
  });

  it("does not rebrand an older saved appearance, even if it already used warm jade", () => {
    const old = { tint: identity.accentHue, paperTone: "warm", readingFont: "humanist", readingScale: 1.26 };
    const restored = resolveOrganismConfig(old);
    expect(restored.palette).toBe("classic");
    expect(restored).toMatchObject(old);
    expect(themePreset("quiet").config.palette).toBe("classic");
    expect(themePreset("quiet-night").config.palette).toBe("classic");
  });

  it("restores the new palette without changing a saved reading arrangement", () => {
    const config = { ...defaultConfigFor("dark"), readingScale: 1.26, readingFont: "humanist", readingLeading: "loose" };
    expect(resolveOrganismConfig(JSON.parse(JSON.stringify(config)))).toMatchObject(config);
  });

  it("uses the same environment settings on both sides of a system-theme change", () => {
    expect(defaultConfigFor("light")).toEqual(defaultConfigFor("dark"));
  });
});
