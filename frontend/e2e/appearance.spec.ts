import { expect, test } from "@playwright/test";
import { cssVariable, htmlAttribute, openAppearancePanel } from "./helpers";

/**
 * These controls are the ones that regress silently: the attribute flips, the
 * unit tests pass, and the page looks identical. Each test asserts the rendered
 * document actually moved, not merely that state was recorded.
 */
test.describe("appearance controls change the rendered document", () => {
  test("base tone switches the theme", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    await panel.getByRole("button", { name: "dark", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("dark");

    await panel.getByRole("button", { name: "light", exact: true }).click();
    await expect.poll(() => htmlAttribute(page, "data-theme")).toBe("light");
  });

  test("tint moves the organism hue", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    // The hue keeps drifting as the organism breathes, so it never truly settles.
    // Compare tints to each other instead of pinning a constant.
    const hueAfter = async (tint: string) => {
      await panel.getByRole("button", { name: tint }).click();
      await page.waitForTimeout(3000);
      return Number(await cssVariable(page, "--organism-hue"));
    };

    const jade = await hueAfter("Jade");
    const rose = await hueAfter("Rose");

    expect(Number.isFinite(jade)).toBe(true);
    expect(Math.abs(rose - jade)).toBeGreaterThan(20);
  });

  test("ui style reaches the document root", async ({ page }) => {
    await page.goto("/");
    const panel = await openAppearancePanel(page);

    // Glass is the baseline style, so it reports as "default" rather than "glass".
    const styles = [
      ["Editorial", "editorial"],
      ["Minimal", "minimal"],
      ["Organic", "organic"],
      ["Glass", "default"],
    ] as const;

    for (const [label, expected] of styles) {
      await panel.getByRole("button", { name: label, exact: true }).click();
      await expect.poll(() => htmlAttribute(page, "data-ui-style")).toBe(expected);
    }
  });

  test("paper tone repaints the reading surface", async ({ page }) => {
    await page.goto("/book/digital-organism-theory/preface");
    const panel = await openAppearancePanel(page);

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

    await panel.getByRole("button", { name: "Still", exact: true }).click();
    await expect.poll(() => page.locator("canvas").count()).toBe(0);
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
