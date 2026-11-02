import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  test(`the ${theme} digital book uses theme-aware illustrations and retains print artwork`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/book/digital-organism-theory/the-decoupling-principle");
    const figure = page.locator("#figure-avatar-canvas");
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator(".book-figure__screen svg")).toBeVisible();
    await expect(figure.locator("[data-playback]")).toHaveAttribute("data-playback", "still");
    await expect(figure.locator("picture")).toBeHidden();
    await expect(figure.locator("button")).toHaveCount(0);
    await expect(page.locator("[data-book-concept]")).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
    await page.emulateMedia({ media: "print" });
    await expect(figure.locator(".book-figure__screen")).toBeHidden();
    await expect(figure.locator("picture")).toBeVisible();
    await expect.poll(() => page.locator(".book-figure__art img").evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await expect(figure.locator("picture img")).toHaveJSProperty("naturalWidth", 900);
    await expect(page.locator(".book-concept-study").first()).toBeHidden();
  });
}

test("an illustration pauses, stops offscreen, settles, and obeys site stillness", async ({ page }) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/book/digital-organism-theory/architecture-of-continuity");
  const art = page.locator('[data-diagram="architecture"]');
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute("data-playback", "playing");
  await art.getByRole("button", { name: "Pause illustration: The proposed architecture", exact: true }).click();
  await expect(art).toHaveAttribute("data-playback", "paused");
  const offsets = () => art.locator("path.book-diagram-flow").evaluateAll(paths => paths.map(path => path.getAttribute("stroke-dashoffset")));
  const paused = await offsets();
  await page.waitForTimeout(350);
  expect(await offsets()).toEqual(paused);
  await art.getByRole("button", { name: "Resume illustration: The proposed architecture", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(art).toHaveAttribute("data-playback", "waiting");
  const outside = await offsets();
  await page.waitForTimeout(350);
  expect(await offsets()).toEqual(outside);
  await art.scrollIntoViewIfNeeded();
  await expect(art).toHaveAttribute("data-playback", "complete", { timeout: 12000 });
  expect(await offsets()).toEqual(["0", "0"]);
  await art.getByRole("button", { name: "Replay illustration: The proposed architecture", exact: true }).click();
  await expect(art).toHaveAttribute("data-playback", "playing");
  await page.evaluate(() => { document.documentElement.dataset.motion = "still"; });
  await expect(art).toHaveAttribute("data-playback", "still");
  expect(await offsets()).toEqual(["0", "0"]);
  await expect(art.locator("button")).toHaveCount(0);
});
