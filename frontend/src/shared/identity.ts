import identity from "../content/identity.json";
import type { OrganismConfig } from "../organism/types";

export function applyIdentityPalette(
  root: HTMLElement,
  palette: OrganismConfig["palette"],
): void {
  root.dataset.palette = palette;
  for (const base of ["light", "dark"] as const) {
    for (const [role, color] of Object.entries(identity[base])) {
      root.style.setProperty(`--identity-${base}-${role}`, color);
    }
  }
  for (const [role, font] of Object.entries(identity.fonts)) {
    root.style.setProperty(`--identity-${role}-font`, `"${font}"`);
  }
  const base = root.classList.contains("dark") ? "dark" : "light";
  const chrome = palette === "dot"
    ? identity[base].surface
    : base === "dark" ? "#171717" : "#fafafa";
  root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute("content", chrome);
}
