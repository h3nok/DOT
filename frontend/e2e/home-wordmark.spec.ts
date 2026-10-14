import { expect, test } from "@playwright/test";
import { openAppearancePanel } from "./helpers";

for (const route of ["/", "/about"]) {
  test(`${route} signature emerges once, settles, and honors saved stillness`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(route);
    const home = page.getByRole("link", { name: "DOT — Home", exact: true });
    const mark = home.getByRole("img", { name: "DOT", exact: true });
    await expect(mark).toBeVisible();
    expect((await home.boundingBox())?.height).toBeGreaterThanOrEqual(44);

    const animations = () => mark.evaluate((node) => node.getAnimations({ subtree: true }).map((animation) => ({
      state: animation.playState,
      iterations: animation.effect?.getTiming().iterations,
    })));
    expect((await animations()).length).toBeGreaterThan(0);
    await expect.poll(async () => (await animations()).every((animation) =>
      animation.state === "finished" && animation.iterations === 1,
    )).toBe(true);
    await expect(mark.locator(".nucleus-mark-core")).toHaveCSS("opacity", "1");

    const panel = await openAppearancePanel(page);
    await panel.locator("summary").filter({ hasText: "Fine tune environment" }).click();
    await panel.getByRole("switch", { name: "Hold the background still" }).click();
    await expect.poll(animations).toEqual([]);
    await page.reload();
    await expect(mark).toBeVisible();
    await expect.poll(animations).toEqual([]);
    await expect(mark.locator(".nucleus-mark-core")).toHaveCSS("opacity", "1");
  });

  test(`${route} system reduced motion keeps the whole signature still, including keyboard focus`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const home = page.getByRole("link", { name: "DOT — Home", exact: true });
    const mark = home.getByRole("img", { name: "DOT", exact: true });
    await expect(mark).toBeVisible();
    await home.focus();
    await expect(home).toBeFocused();
    expect(await mark.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(mark.locator(".do-wordmark__o")).toHaveCSS("transform", "none");
    await expect(mark.locator(".nucleus-mark-core")).toHaveCSS("opacity", "1");
  });
}

test("disabling the environment also keeps the shared page signature still", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("dot_organism", JSON.stringify({ enabled: false }));
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/about");
  await expect(page.locator("html")).toHaveAttribute("data-organism", "off");
  const mark = page.getByRole("link", { name: "DOT — Home", exact: true }).getByRole("img", { name: "DOT", exact: true });
  await expect(mark).toBeVisible();
  expect(await mark.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(mark.locator(".nucleus-mark-core")).toHaveCSS("opacity", "1");
});

test("the site signature stays consistent across public pages and studio sign-in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/about", "/blog", "/contact", "/readers", "/academy", "/publications",
    "/privacy", "/terms", "/book/digital-organism-theory", "/studio",
  ]) {
    await page.goto(route);
    const home = page.getByRole("link", { name: "DOT — Home", exact: true });
    await expect(home.getByRole("img", { name: "DOT", exact: true }), route).toBeVisible();
    expect((await home.boundingBox())?.height, route).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole("link", { name: "DOT", exact: true }), route).toHaveCount(0);
    const footer = page.locator("footer.site-colophon");
    if (await footer.count()) {
      await expect(footer.getByRole("img", { name: "DOT", exact: true }), route).toBeVisible();
    }
  }
});
