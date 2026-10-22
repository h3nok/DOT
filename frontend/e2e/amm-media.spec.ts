import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

test("AMM keeps frameless pictures without requesting video in reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const films: string[] = [];
  page.on("request", request => { if (/\.(mp4|webm)$/.test(request.url())) films.push(request.url()); });
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

test("the transparent Host autoplays and loops, with pause and offscreen suspension", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/amm");
  const feature = page.locator(".amm-feature");
  await feature.scrollIntoViewIfNeeded();
  const video = feature.locator("video");
  await expect(feature).toHaveAttribute("data-motion-ready", "true");
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => !clip.paused && clip.currentTime > 0)).toBe(true);
  expect(await video.evaluate((clip: HTMLVideoElement) => ({ muted: clip.muted, loop: clip.loop, inline: clip.playsInline }))).toEqual({ muted: true, loop: true, inline: true });
  const alpha = await video.evaluate((clip: HTMLVideoElement) => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 2;
    const context = canvas.getContext("2d")!;
    context.drawImage(clip, clip.videoWidth - 2, 0, 2, 2, 0, 0, 2, 2);
    return context.getImageData(0, 0, 1, 1).data[3];
  });
  expect(alpha).toBeLessThan(9);
  expect(await video.evaluate((clip: HTMLVideoElement) => [clip.videoWidth, clip.videoHeight])).toEqual([1280, 720]);
  await expect(video).toHaveCSS("border-top-width", "0px");
  await expect(video).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(video).toHaveCSS("box-shadow", "none");
  // A click retried while the hero settles can scroll its button to the top
  // edge, leaving the clip offscreen and suspended. Bring it back before judging.
  await feature.getByRole("button", { name: "Pause", exact: true }).click();
  await feature.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(true);
  await feature.getByRole("button", { name: "Play", exact: true }).click();
  await feature.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(false);
  await page.locator("#amm-overview").scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(true);
  await feature.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(false);
  await video.evaluate((clip: HTMLVideoElement) => { clip.currentTime = clip.duration - 0.2; });
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => !clip.paused && clip.currentTime < 3)).toBe(true);
  await expect(feature.getByRole("button", { name: "Replay", exact: true })).toHaveCount(0);
  await feature.getByRole("button", { name: "Inspect The Host", exact: true }).click();
  await expect.poll(() => video.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(true);
  await page.keyboard.press("Escape");
  await expectNoHorizontalOverflow(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).toHaveCount(0);
  await expect(feature.locator("picture")).toHaveCSS("opacity", "1");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(feature.getByRole("button", { name: "Play", exact: true })).toBeEnabled();
  expect(await video.evaluate((clip: HTMLVideoElement) => clip.paused)).toBe(true);
});

test("a failed hero clip leaves the original illustration and its inspection available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/host-hero-v1.webm", route => route.abort());
  await page.goto("/amm");
  const feature = page.locator(".amm-feature");
  await expect(feature.locator("picture")).toHaveCSS("opacity", "1");
  await expect(feature.locator("video")).toHaveCount(0);
  await expect(feature.getByRole("button", { name: "Inspect The Host", exact: true })).toBeVisible();
});

test("data saving keeps the still Host without a video request", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
  const films: string[] = [];
  page.on("request", request => { if (request.url().endsWith(".webm")) films.push(request.url()); });
  await page.goto("/amm");
  const feature = page.locator(".amm-feature");
  await expect(feature.getByRole("button", { name: "Inspect The Host", exact: true })).toBeVisible();
  await expect(feature.locator("video")).toHaveCount(0);
  expect(films).toEqual([]);
});

test("a decoder without transparency falls back to the still Host", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    // Simulate a browser decoder that supplies an opaque alpha channel.
    const original = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(...args: Parameters<typeof original>) {
      const result = original.apply(this, args);
      if (this.canvas.width === 2 && this.canvas.height === 2) result.data[3] = 255;
      return result;
    };
  });
  const films: string[] = [];
  page.on("request", request => { if (request.url().endsWith(".webm")) films.push(request.url()); });
  await page.goto("/amm");
  const feature = page.locator(".amm-feature");
  await expect.poll(() => films.length).toBeGreaterThan(0);
  await expect(feature.locator("video")).toHaveCount(0);
  await expect(feature.locator("picture")).toHaveCSS("opacity", "1");
  await expect(feature.getByRole("button", { name: "Inspect The Host", exact: true })).toBeVisible();
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
