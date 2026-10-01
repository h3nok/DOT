import { expect, test } from "@playwright/test";
import { htmlAttribute, openAppearancePanel } from "./helpers";
import identity from "../src/content/identity.json" with { type: "json" };

function renderedStyle(page: import("@playwright/test").Page, selector: string, property: string) {
  return page
    .locator(selector)
    .first()
    .evaluate(
      (node, cssProperty) =>
        getComputedStyle(node).getPropertyValue(cssProperty).trim(),
      property,
    );
}

async function openEnvironmentFineTune(
  panel: import("@playwright/test").Locator,
) {
  await panel.locator("summary").filter({ hasText: "Fine tune environment" }).click();
}

/**
 * These controls are the ones that regress silently: the attribute flips, the
 * unit tests pass, and the page looks identical. Each test asserts the rendered
 * document actually moved, not merely that state was recorded.
 */
test.describe("appearance controls change the rendered document", () => {
  test("translucent paper preserves DOT's selected surface in both lights", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".home-hero-environment")).toBeVisible();

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await expect.poll(() => htmlAttribute(page, "data-theme")).toBe(colorScheme);
      const surfaces = await page.evaluate((surface) => {
        const context = document.createElement("canvas").getContext("2d");
        if (!context) throw new Error("Cannot inspect the painted paper");
        const pixel = () => [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
        context.fillStyle = surface;
        context.fillRect(0, 0, 1, 1);
        const expected = pixel();
        return [".home-hero-environment", ".home-journey-nav__links"].map((selector) => {
          const node = document.querySelector(selector);
          if (!node) throw new Error(`Missing paper surface: ${selector}`);
          context.fillStyle = getComputedStyle(document.body).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          context.fillStyle = getComputedStyle(node).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return { selector, difference: Math.max(...pixel().map((value, i) => Math.abs(value - expected[i]))) };
        });
      }, identity[colorScheme].surface);
      for (const surface of surfaces) {
        expect(surface.difference, `${colorScheme} ${surface.selector} paper cast`).toBeLessThanOrEqual(2);
      }
    }
  });

  test("new readers get the shared identity and follow their system without saving an unchosen preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");
    await expect.poll(() => htmlAttribute(page, "data-palette")).toBe("dot");
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("light");
    await expect.poll(() => renderedStyle(page, "body", "background-color")).toBe("rgb(242, 240, 232)");
    await expect.poll(() => renderedStyle(page, ".nucleus-mark-core", "fill")).toBe("rgb(40, 92, 75)");
    await expect.poll(() => page.locator('meta[name="theme-color"]').getAttribute("content")).toBe("#f2f0e8");
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("dark");
    await expect.poll(() => renderedStyle(page, "body", "background-color")).toBe("rgb(12, 23, 21)");
    await expect.poll(() => renderedStyle(page, ".nucleus-mark-core", "fill")).toBe("rgb(145, 200, 177)");
    await expect.poll(() => page.locator('meta[name="theme-color"]').getAttribute("content")).toBe("#0c1715");
    expect(await page.evaluate(() => ({
      base: localStorage.getItem("dot_theme"),
      appearance: localStorage.getItem("dot_organism"),
    }))).toEqual({ base: null, appearance: null });
    const panel = await openAppearancePanel(page);
    await expect(panel.getByRole("button", { name: "DOT Night", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("old appearances are not silently rebranded; Reset explicitly adopts the new default", async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("dot_organism")) {
        localStorage.setItem("dot_theme", "light");
        localStorage.setItem("dot_organism", JSON.stringify({
          tint: 158, paperTone: "warm", preset: "radial",
          readingFont: "humanist", readingScale: 1.26,
        }));
      }
    });
    await page.goto("/");
    await expect.poll(() => htmlAttribute(page, "data-palette")).toBe("classic");
    await expect.poll(() => htmlAttribute(page, "data-reading")).toBe("humanist");
    const panel = await openAppearancePanel(page);
    await panel.getByRole("button", { name: "Reset", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-palette")).toBe("dot");
    await expect.poll(() => renderedStyle(page, "body", "background-color")).toBe("rgb(242, 240, 232)");
    await page.reload();
    await expect.poll(() => htmlAttribute(page, "data-palette")).toBe("dot");
  });

  test("radial defaults repaint, remain adjustable, and survive a reload", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("radial");
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("full");
    const pixels = () => page.locator(".organism-membrane canvas").evaluate(
      (canvas: HTMLCanvasElement) => canvas.toDataURL(),
    );
    const light = await pixels();
    const panel = await openAppearancePanel(page);
    await panel.getByRole("button", { name: "Quiet Night", exact: true }).click();
    await expect.poll(pixels).not.toBe(light);
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("radial");
    await openEnvironmentFineTune(panel);
    const dark = await pixels();
    await panel.getByRole("slider", { name: "Scale — Finer or coarser structure" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(pixels).not.toBe(dark);
    await panel.getByRole("button", { name: "Frame", exact: true }).click();
    await page.reload();
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("lattice");
    const reopened = await openAppearancePanel(page);
    await reopened.getByRole("button", { name: "Reset", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("radial");
    await expect.poll(() => renderedStyle(page, ".home-hero-environment", "background-image")).toBe("none");
  });

  test("the still radial field follows the architecture as the page scrolls", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".home-architecture-origin-boundary")).toBeVisible();
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("still");
    const pixels = () => page.locator(".organism-membrane canvas").evaluate(
      (canvas: HTMLCanvasElement) => canvas.toDataURL(),
    );
    const before = await pixels();
    await page.evaluate(() => window.scrollTo({ top: 160, behavior: "instant" }));
    await expect.poll(pixels).not.toBe(before);
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("still");
  });

  test("radial motion animates the cached layer and honours reduced motion", async ({ page }) => {
    await page.goto("/");
    // The loader also has an animated field. Measure only after the real
    // architecture mounts, so its handoff cannot invalidate the cached raster.
    await expect(page.locator(".home-architecture-origin-boundary")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const canvas = page.locator(".organism-membrane canvas");
    await expect.poll(() => canvas.evaluate((node) => node.getAnimations().length)).toBe(1);
    await expect.poll(() => htmlAttribute(page, "data-ui-style")).toBe("neural");
    // Let finite entrance animations and their layout work settle first.
    await page.evaluate(() => Promise.all(document.getAnimations()
      .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
      .map((animation) => animation.finished.catch(() => {}))));
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const raster = await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL());
    const transform = await canvas.evaluate((node) => getComputedStyle(node).transform);
    await expect.poll(() => canvas.evaluate((node) => getComputedStyle(node).transform)).not.toBe(transform);
    expect(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL()) === raster).toBe(true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => canvas.evaluate((node) => node.getAnimations().length)).toBe(0);
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("still");
    await expect(canvas).toBeVisible();
  });

  test("base tone switches the theme", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    await panel.getByRole("button", { name: "Quiet", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("light");
    const lightGround = await renderedStyle(
      page,
      ".home-hero-environment",
      "background-color",
    );

    await panel.getByRole("button", { name: "Quiet Night", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("dark");
    await expect
      .poll(() =>
        renderedStyle(page, ".home-hero-environment", "background-color"),
      )
      .not.toBe(lightGround);
  });

  test("tint recolours the hero architecture", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);
    await openEnvironmentFineTune(panel);

    const localCoreFill = () =>
      renderedStyle(page, ".home-architecture-local-core", "fill");

    await panel.getByRole("button", { name: "Jade", exact: true }).click();
    const jade = await localCoreFill();

    await panel.getByRole("button", { name: "Rose", exact: true }).click();
    await expect.poll(localCoreFill).not.toBe(jade);
  });

  test("ui style changes controls while keeping one home diagram", async ({ page }) => {
    test.slow();
    await page.goto("/");
    const panel = await openAppearancePanel(page);
    await openEnvironmentFineTune(panel);

    // Glass is the baseline style, so it reports as "default" rather than "glass".
    const styles = [
      ["Editorial", "editorial"],
      ["Minimal", "minimal"],
      ["Organic", "organic"],
      ["Glass", "default"],
    ] as const;

    const diagram = page.locator(".home-hero-architecture__svg");
    const geometry = await diagram.innerHTML();
    for (const [label, expected] of styles) {
      await panel.getByRole("button", { name: label, exact: true }).click();
      await expect.poll(() => htmlAttribute(page, "data-ui-style")).toBe(expected);

      await expect(diagram).toBeVisible();
      expect(await diagram.innerHTML()).toBe(geometry);
      await expect(page.locator('[class*="home-architecture-style--"]')).toHaveCount(0);
    }
  });

  test("paper tone reaches the landing and hero", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);
    await openEnvironmentFineTune(panel);
    const heroGround = () =>
      renderedStyle(page, ".home-hero-environment", "background-color");

    await panel.getByRole("button", { name: "Neutral paper" }).click();
    await expect.poll(() => htmlAttribute(page, "data-paper")).toBe("neutral");
    const neutral = await heroGround();

    await panel.getByRole("button", { name: "Sepia paper" }).click();
    await expect.poll(() => htmlAttribute(page, "data-paper")).toBe("sepia");
    await expect.poll(heroGround).not.toBe(neutral);
  });

  test("paper tone repaints the reading surface", async ({ page }) => {
    await page.goto("/book/digital-organism-theory/preface");
    const panel = await openAppearancePanel(page);
    await openEnvironmentFineTune(panel);

    const readPaper = () =>
      page
        .locator(".book-surface")
        .first()
        .evaluate((node) =>
          getComputedStyle(node).getPropertyValue("--book-paper").trim(),
        );

    await panel.getByRole("button", { name: "Neutral paper" }).click();
    await expect.poll(() => htmlAttribute(page, "data-paper")).toBe("neutral");
    const neutral = await readPaper();

    await panel.getByRole("button", { name: "Sepia paper" }).click();
    await expect.poll(() => htmlAttribute(page, "data-paper")).toBe("sepia");

    // The attribute flipping is not the contract; the surface changing is.
    await expect.poll(readPaper).not.toBe(neutral);
  });

  test("stillness removes the animated field", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);
    await openEnvironmentFineTune(panel);

    await panel.getByRole("button", { name: "Canvas", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("field");
    await expect.poll(() => page.locator("canvas").count()).toBe(1);

    await panel.getByRole("button", { name: "Still", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("off");
    await expect.poll(() => page.locator("canvas").count()).toBe(0);
    await expect
      .poll(() =>
        page
          .locator(".home-hero-environment")
          .evaluate((node) => getComputedStyle(node, "::before").opacity),
      )
      .toBe("0");
  });
});

test.describe("appearance panel dismissal", () => {
  test("Escape closes the panel and returns focus to its trigger", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    // Losing focus to <body> would strand a keyboard user at the top of the page.
    const focused = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    );
    expect(focused).toBe("Appearance settings");
  });

  test("a click outside closes the panel", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    await page.mouse.click(12, 640);
    await expect(panel).toBeHidden();
  });
});
