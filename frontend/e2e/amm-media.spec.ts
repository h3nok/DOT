import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

test("AMM uses the supplied pictures without frames without requesting video", async ({ page }) => {
  const films: string[] = [];
  page.on("request", request => { if (request.url().endsWith(".mp4")) films.push(request.url()); });
  await page.goto("/amm");
  const picture = page.locator(".amm-feature picture img");
  await expect(picture).toBeVisible();
  await expect.poll(() => picture.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/\/amm\/media\/host2-\d+\.webp$/);
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByText(/Watch the motion study/)).toHaveCount(0);
  expect(films).toEqual([]);
  await expect(page.locator(".amm-chapter-image img")).toHaveCount(0);
  // Transparent artwork must sit on the page, including its chapter previews.
  for (const selector of [".amm-feature", ".amm-feature .explainer-artwork-open", ".amm-path-art", ".amm-edition-art"]) {
    const elements = page.locator(selector);
    for (const element of await elements.all()) {
      await expect(element).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(element).toHaveCSS("border-top-width", "0px");
      await expect(element).toHaveCSS("border-right-width", "0px");
      await expect(element).toHaveCSS("box-shadow", "none");
    }
  }
  await expect(page.locator(".amm-feature")).toHaveCSS("padding", "0px");
  await expectNoHorizontalOverflow(page);
  // Each part of the reading path carries the author's artwork for it.
  await page.goto("/amm/editions#amm-chapters");
  const path = page.getByRole("list", { name: "The manifesto, in reading order" });
  await expect(path.locator(".amm-path-art img")).toHaveCount(3);
  await expect.poll(() => path.locator(".amm-path-art img").evaluateAll(images => images.map(image => (image as HTMLImageElement).currentSrc.split("/").pop()?.replace(/-\d+\.webp$/, "")))).toEqual(["leech", "leech-anatomy", "host-anatomy-v2"]);
  await page.goto("/amm/power");
  await expect(page.getByRole("img", { name: /The erosion of the public/ })).toBeVisible();
  expect(films).toEqual([]);
  await expectNoHorizontalOverflow(page);
});

test("the Host illustration can be inspected without leaving the reading place", async ({ page }) => {
  await page.goto("/amm");
  const trigger = page.getByRole("button", { name: "Inspect The Host", exact: true });
  await trigger.click();
  const viewer = page.getByRole("dialog", { name: "The Host", exact: true });
  await expect(viewer).toBeVisible();
  const image = viewer.getByRole("img");
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(image).toHaveAttribute("src", "/amm/media/host2-1536.webp");
  await viewer.getByRole("button", { name: "Zoom in" }).click();
  await expect(viewer.getByRole("button", { name: "Fit image" })).toHaveAttribute("aria-pressed", "true");
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Escape");
  await expect(viewer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(viewer.getByRole("button", { name: "Zoom in" })).toHaveAttribute("aria-pressed", "false");
  await viewer.getByRole("button", { name: "Close illustration" }).click();
  await expect(trigger).toBeFocused();
});
