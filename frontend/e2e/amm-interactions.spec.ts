import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow, openAppearancePanel } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
});

test("each part's artwork and copy share a clear hover, focus and reading action", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/amm/editions#amm-chapters");
  const chapter = page.getByRole("link", { name: "The Leech", exact: true });
  const part = page.locator(".amm-part").filter({ has: chapter });
  const art = part.locator("img");
  const title = part.locator(".amm-reading-title");
  await expect(chapter).toBeVisible();
  const originalColor = await title.evaluate(node => getComputedStyle(node).color);
  if (await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches)) {
    // A lazy image that loads late shifts the layout from under the pointer; hover once it has settled.
    await art.scrollIntoViewIfNeeded();
    await expect.poll(() => art.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await art.hover();
    await expect.poll(() => art.evaluate(node => new DOMMatrix(getComputedStyle(node).transform).m42)).toBeLessThan(-4);
    await expect.poll(() => title.evaluate(node => getComputedStyle(node).color)).not.toBe(originalColor);
    await page.mouse.move(0, 0);
    await expect(art).toHaveCSS("transform", "none");
  }
  await page.keyboard.press("Tab");
  await chapter.focus();
  await expect(chapter).toHaveCSS("outline-style", "solid");
  await expect(chapter).toHaveCSS("outline-width", "2px");
  await expect.poll(() => title.evaluate(node => getComputedStyle(node).color)).not.toBe(originalColor);
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Chapter One: The Leech" })).toBeVisible();
  await page.goto("/amm/editions");
  const edition = page.getByRole("heading", { level: 3, name: "The Host and the Infection" }).getByRole("link");
  await edition.click();
  await expect(page.getByRole("heading", { level: 1, name: "Chapter Three: The Host and the Infection" })).toBeVisible();
});

test("how power works exposes real section links, keyboard focus and a return path", async ({ page }) => {
  await page.goto("/amm/power");
  const nav = page.getByRole("navigation", { name: "The framework at a glance" });
  const capital = nav.getByRole("link", { name: "Power has moved", exact: true });
  const chain = nav.getByRole("link", { name: "The assault is economic", exact: true });
  await capital.focus();
  await page.keyboard.press("Tab");
  await expect(chain).toBeFocused();
  await expect(chain).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/amm\/power#assault$/);
  await expect(page.locator("#assault")).toBeInViewport();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole("link", { name: "AMM home", exact: true })).toHaveAttribute("href", "/amm");
});

for (const mode of ["reduced motion", "Hold still"] as const) {
  test(`${mode} keeps interaction feedback visible without moving artwork`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: mode === "reduced motion" ? "reduce" : "no-preference" });
    await page.goto("/amm");
    await expect(page.locator("#amm-title")).toBeVisible();
    if (mode === "Hold still") {
      const panel = await openAppearancePanel(page);
      await panel.locator("summary").filter({ hasText: "Fine tune environment" }).click();
      await panel.getByRole("switch", { name: "Hold the background still" }).click();
      await page.keyboard.press("Escape");
    }
    await expect(page.locator("html")).toHaveAttribute("data-motion", "still");
    const hero = page.locator(".amm-feature img");
    await hero.hover();
    await expect(hero).toHaveCSS("transform", "none");
    await expect(hero).toHaveCSS("transition-duration", "0s");
    await page.goto("/amm/editions#amm-chapters");
    const part = page.locator(".amm-part").first();
    await part.locator("img").hover();
    await expect(part.locator("img")).toHaveCSS("transform", "none");
    await expect(part.locator(".amm-path-art")).toHaveCSS("animation-name", "none");
    await page.goto("/amm/power#detachment");
    await expect(page.getByRole("heading", { name: "Capital leaves. Obligation stays." })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
