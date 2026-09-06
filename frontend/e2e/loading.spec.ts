import { expect, test } from "@playwright/test";

for (const scheme of ["light", "dark"] as const) {
  test(`loading dot shares the field centre and hands off to the diagram in ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    let release!: () => void;
    const ready = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/blocks/core/home/HomePage.tsx*", async (route) => {
      await ready;
      await route.continue();
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("status", { name: "Loading", exact: true })).toBeVisible();
    const dot = await page.locator(".splash-emergence__dot").boundingBox();
    const viewport = page.viewportSize()!;
    expect(Math.abs(dot!.x + dot!.width / 2 - viewport.width / 2)).toBeLessThan(1);
    expect(Math.abs(dot!.y + dot!.height / 2 - viewport.height / 2)).toBeLessThan(1);
    const fieldOrigin = () => page.locator(".organism-membrane canvas").evaluate(
      (canvas) => getComputedStyle(canvas).transformOrigin.split(" ").map(parseFloat),
    );
    await expect.poll(fieldOrigin).toEqual([viewport.width / 2, viewport.height / 2]);
    release();
    await expect(page.locator(".home-hero-architecture__svg")).toBeVisible();
    await expect(page.locator(".splash-emergence")).toHaveCount(0);
    const diagram = await page.locator(".home-architecture-origin-boundary").boundingBox();
    await expect.poll(async () => {
      const [x, y] = await fieldOrigin();
      return Math.hypot(x - diagram!.x - diagram!.width / 2, y - diagram!.y - diagram!.height / 2);
    }).toBeLessThan(1);

    // Unmounting the diagram releases its anchor. A cached return registers
    // it again without leaving a loading mark or a stale viewport origin.
    await page.getByRole("link", { name: "Enter DOT Academy", exact: true }).click();
    await expect(page).toHaveURL(/\/academy$/);
    await expect(page.locator(".splash-emergence")).toHaveCount(0);
    await expect.poll(fieldOrigin).toEqual([viewport.width / 2, viewport.height / 2]);
    await page.goBack();
    await expect(page.locator(".home-hero-architecture__svg")).toBeVisible();
    await expect(page.locator(".splash-emergence")).toHaveCount(0);
    await expect.poll(async () => {
      const bounds = await page.locator(".home-architecture-origin-boundary").boundingBox();
      const [x, y] = await fieldOrigin();
      return bounds ? Math.hypot(x - bounds.x - bounds.width / 2, y - bounds.y - bounds.height / 2) : Infinity;
    }).toBeLessThan(1);
  });
}
