import identity from "../content/identity.json";
import theme from "../content/theme.json";

/**
 * Publishes the site's one theme: the AMM signature, in light and dark (ADR-0061).
 *
 * `theme.json` paints every page. `identity.json` stays DOT's print and channel
 * brand (the book jacket, PDF, and video kit); it reaches the site only as the
 * `--brand-*` colours of the on-page Book One cover, and as the font roles.
 */
export function applyIdentityPalette(root: HTMLElement): void {
  root.dataset.palette = "amm";
  for (const base of ["light", "dark"] as const) {
    for (const [role, color] of Object.entries(theme[base])) {
      root.style.setProperty(`--identity-${base}-${role}`, color);
    }
    for (const [role, color] of Object.entries(identity[base])) {
      root.style.setProperty(`--brand-${base}-${role}`, color);
    }
  }
  for (const [role, font] of Object.entries(identity.fonts)) {
    root.style.setProperty(`--identity-${role}-font`, `"${font}"`);
  }
  const base = root.classList.contains("dark") ? "dark" : "light";
  root.ownerDocument.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme[base].surface);
}
