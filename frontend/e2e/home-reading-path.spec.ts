import { expect, test } from "@playwright/test";

test("home offers a reading path and readable theory comparisons", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const entry = page.getByRole("navigation", { name: "Begin exploring DOT" });
  const read = entry.getByRole("link", { name: "Read Book One" });
  await expect(read).toBeInViewport();
  await expect(read).toHaveAttribute("href", "/book/digital-organism-theory/preface");
  await page.screenshot({ path: testInfo.outputPath("home-opening.png") });

  for (const sectionId of ["possibility-field", "big-c", "reality-frame", "little-c"]) {
    const section = page.locator(`#${sectionId}`);
    await section.evaluate(element => element.scrollIntoView());
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
    const reasoning = section.locator("summary").filter({ hasText: "Explore the reasoning" });
    const boundaryElement = section.locator('[data-step="boundary"]');
    await expect(boundaryElement).toBeVisible();
    await expect(section.locator('[data-step="question"]')).not.toBeVisible();
    await reasoning.focus();
    await page.keyboard.press("Enter");
    const steps = section.locator(".home-theory-layer-inquiry-steps");
    const known = await steps.locator('[data-step="question"]').boundingBox();
    const proposed = await steps.locator('[data-step="proposal"]').boundingBox();
    const boundary = await boundaryElement.boundingBox();
    expect(known).not.toBeNull();
    expect(proposed).not.toBeNull();
    expect(boundary).not.toBeNull();
    if (testInfo.project.name === "desktop") {
      expect(Math.abs(known!.y - proposed!.y)).toBeLessThan(2);
      expect(proposed!.x).toBeGreaterThan(known!.x);
    } else {
      expect(proposed!.y).toBeGreaterThanOrEqual(known!.y + known!.height - 1);
    }
    expect(boundary!.y + boundary!.height).toBeLessThanOrEqual(known!.y);
    const overflow = await section.evaluate(element =>
      [...element.querySelectorAll("h2, p, a, .home-theory-layer-term")].some(child =>
        child.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
      ),
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: testInfo.outputPath(`${sectionId}.png`) });
    await reasoning.focus();
    await page.keyboard.press("Enter");
    await expect(section.locator('[data-step="question"]')).not.toBeVisible();
    await expect(boundaryElement).toBeVisible();
  }
});