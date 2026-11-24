import { expect, test } from "@playwright/test";
import { htmlAttribute, openAppearancePanel } from "./helpers";
import theme from "../src/content/theme.json" with { type: "json" };

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
      }, theme[colorScheme].surface);
      for (const surface of surfaces) {
        expect(surface.difference, `${colorScheme} ${surface.selector} paper cast`).toBeLessThanOrEqual(2);
      }
    }
  });

  test("the opening reading action uses the shared button appearance in both themes", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");
    const action = page.locator("#threshold").getByRole("link", { name: "Read Book One", exact: true });
    const sharedAction = page.locator("#choose-path .dot-focus-nav__primary");
    await expect(action).toBeVisible();

    const appearance = (target: import("@playwright/test").Locator) => target.evaluate((node) => {
      const style = getComputedStyle(node);
      const label = getComputedStyle(node.querySelector("strong")!);
      return { paper: style.backgroundColor, ink: style.color, radius: style.borderRadius, type: label.fontFamily };
    });
    const papers: string[] = [];

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await expect.poll(() => htmlAttribute(page, "data-theme")).toBe(colorScheme);
      const shared = await appearance(sharedAction);
      await expect.poll(() => appearance(action)).toEqual(shared);
      papers.push(shared.paper);
    }
    expect(papers[0]).not.toBe(papers[1]);
  });

  test("new readers get the signature theme and follow their system without saving an unchosen preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto("/");
    await expect.poll(() => htmlAttribute(page, "data-palette")).toBe("amm");
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("light");
    await expect.poll(() => renderedStyle(page, "body", "background-color")).toBe("rgb(246, 241, 231)");
    await expect.poll(() => page.locator('meta[name="theme-color"]').getAttribute("content")).toBe(theme.light.surface);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("dark");
    await expect.poll(() => renderedStyle(page, "body", "background-color")).toBe("rgb(32, 34, 34)");
    await expect.poll(() => page.locator('meta[name="theme-color"]').getAttribute("content")).toBe(theme.dark.surface);
    expect(await page.evaluate(() => ({
      base: localStorage.getItem("dot_theme"),
      appearance: localStorage.getItem("dot_organism"),
    }))).toEqual({ base: null, appearance: null });
    const panel = await openAppearancePanel(page);
    await expect(panel.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  });

  test("an appearance saved under a retired environment lands in the signature theme with its reading choices", async ({ page }) => {
    await page.addInitScript(() => {
      if (!localStorage.getItem("dot_organism")) {
        localStorage.setItem("dot_theme", "light");
        localStorage.setItem("dot_organism", JSON.stringify({
          palette: "classic", tint: 265, paperTone: "sepia", preset: "lattice", uiStyle: "minimal",
          readingFont: "humanist", readingScale: 1.26,
        }));
      }
    });
    await page.goto("/");
    await expect.poll(() => htmlAttribute(page, "data-palette")).toBe("amm");
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("radial");
    await expect.poll(() => htmlAttribute(page, "data-ui-style")).toBe("neural");
    await expect.poll(() => htmlAttribute(page, "data-paper")).toBe("neutral");
    await expect.poll(() => htmlAttribute(page, "data-reading")).toBe("humanist");
    await expect.poll(() => renderedStyle(page, "body", "background-color")).toBe("rgb(246, 241, 231)");
  });

  test("the radial field repaints for the other light and survives a reload", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("radial");
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("full");
    const pixels = () => page.locator(".organism-membrane canvas").evaluate(
      (canvas: HTMLCanvasElement) => canvas.toDataURL(),
    );
    const light = await pixels();
    const panel = await openAppearancePanel(page);
    await panel.getByRole("button", { name: "Dark", exact: true }).click();
    await expect.poll(pixels).not.toBe(light);
    await page.reload();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("dark");
    await expect.poll(() => htmlAttribute(page, "data-field")).toBe("radial");
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
    await page.locator(".home-hero-architecture").scrollIntoViewIfNeeded();
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

  test("light and dark switch the page", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    await panel.getByRole("button", { name: "Light", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("light");
    const lightGround = await renderedStyle(page, ".home-hero-environment", "background-color");

    await panel.getByRole("button", { name: "Dark", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("dark");
    await expect.poll(() => renderedStyle(page, ".home-hero-environment", "background-color")).not.toBe(lightGround);
  });

  test("the reading surface wears the theme's paper in both lights", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/book/digital-organism-theory/preface");
    const readPaper = () =>
      page.locator(".book-surface").first().evaluate((node) =>
        getComputedStyle(node).getPropertyValue("--book-paper").trim().toLowerCase(),
      );
    await expect.poll(readPaper).toBe(theme.light.surface);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(readPaper).toBe(theme.dark.surface);
  });

  test("Hold still stops the field without removing it", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator(".organism-membrane canvas");
    await expect(canvas).toHaveCount(1);
    const panel = await openAppearancePanel(page);
    await panel.getByRole("switch", { name: "Hold the page still" }).click();
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("still");
    await expect.poll(() => canvas.evaluate((node) => node.getAnimations().length)).toBe(0);
    await expect(canvas).toHaveCount(1);
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
