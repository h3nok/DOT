import { expect, test } from "@playwright/test";

test("home keeps direct reading routes without the closing invitation copy", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const opening = page.locator("#threshold");
  await expect(opening.getByRole("heading", { level: 1, name: "Give your own life attention." })).toBeVisible();
  await expect(opening.getByRole("link", { name: "Read Book One", exact: true }))
    .toHaveAttribute("href", "/book/digital-organism-theory/preface?path=start-where-you-live");
  await expect(page.locator("#personal-platform")).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "On this page", includeHidden: true }).locator('a[href="#personal-platform"]')).toHaveCount(0);
  await expect(page.getByRole("region", { name: "An invitation to inquire" })).toHaveCount(0);
  await expect(page.getByText("Read. Inquire. Open up.")).toHaveCount(0);
  const reading = page.getByRole("region", { name: "Further reading" });
  await expect(reading.locator(".dot-focus-nav__primary"))
    .toHaveAttribute("href", "/book/digital-organism-theory");
  await expect(reading.getByRole("link", { name: "Read Book One", exact: true }))
    .toHaveAccessibleDescription("Complete and free · Fixed edition");
  await expect(reading.getByRole("link", { name: "Explore the Academy", exact: true }))
    .toHaveAttribute("href", "/academy");
});

test("home offers a reading path and readable theory comparisons", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const entry = page.getByRole("navigation", { name: "Begin exploring DOT" });
  const read = entry.getByRole("link", { name: "Read Book One" });
  await expect(read).toBeInViewport();
  await expect(read).toHaveAttribute("href", "/book/digital-organism-theory/preface?path=start-where-you-live");
  await page.screenshot({ path: testInfo.outputPath("home-opening.png") });

  for (const sectionId of ["possibility-field", "big-c", "reality-frame", "little-c"]) {
    const section = page.locator(`#${sectionId}`);
    await section.evaluate(element => element.scrollIntoView());
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(section.locator("h2")).toHaveCSS("text-align", "center");
    const prose = await section.locator(".home-theory-layer-copy").evaluate(copy => {
      const column = copy.getBoundingClientRect();
      return [...copy.querySelectorAll(".home-theory-layer-lede, .home-theory-layer-human-stakes, [data-step='status']")]
        .map(element => {
          const box = element.getBoundingClientRect();
          return {
            alignment: getComputedStyle(element).textAlign,
            offset: Math.abs(box.left - column.left),
          };
        });
    });
    expect(prose).toHaveLength(3);
    for (const content of prose) {
      expect(content.alignment).toBe("left");
      expect(content.offset).toBeLessThanOrEqual(1);
    }
    // The Little c close-up omits Big C; RF₀ and Canvas stay distinct.
    await expect(section.locator(".home-concept-architecture .home-architecture-surface"))
      .toHaveCount(sectionId === "little-c" ? 1 : 2);
    await expect(section.locator('.home-concept-architecture [data-entity="reality-frame"] .home-concept-frame-plane')).toHaveCount(1);
    await expect(section.locator('.home-concept-architecture [data-entity="canvas"]')).toHaveCount(1);
    const reasoning = section.locator("summary").filter({ hasText: "Explore the reasoning" });
    const boundaryElement = section.locator('[data-step="boundary"]');
    await expect(section.locator('[data-step="status"]')).toBeVisible();
    await expect(boundaryElement).not.toBeVisible();
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
    expect(boundary!.y).toBeGreaterThanOrEqual(Math.max(known!.y + known!.height, proposed!.y + proposed!.height) - 1);
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
    await expect(boundaryElement).not.toBeVisible();
    await expect(section.locator('[data-step="status"]')).toBeVisible();
  }
});
