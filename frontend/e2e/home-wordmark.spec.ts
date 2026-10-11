import { expect, test } from "@playwright/test";
import { openAppearancePanel } from "./helpers";

test("the home signature emerges once, settles, and honors saved stillness", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const home = page.getByRole("link", { name: "DO — Home", exact: true });
  const mark = home.getByRole("img", { name: "DO", exact: true });
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

test("system reduced motion keeps the whole home signature still, including keyboard focus", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const home = page.getByRole("link", { name: "DO — Home", exact: true });
  const mark = home.getByRole("img", { name: "DO", exact: true });
  await expect(mark).toBeVisible();
  await home.focus();
  await expect(home).toBeFocused();
  expect(await mark.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(mark.locator(".do-wordmark__o")).toHaveCSS("transform", "none");
  await expect(mark.locator(".nucleus-mark-core")).toHaveCSS("opacity", "1");
});
