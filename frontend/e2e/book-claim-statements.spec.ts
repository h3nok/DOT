import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

for (const theme of ["light", "dark"] as const) {
  test(`numbered book claims and the bridge boundary stand out in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/book/digital-organism-theory/the-digital-organism");
    await expect(page.locator(".book-numbered-statement")).toHaveCount(6);
    const boundary = page.locator('[data-claim-id="DOT-B1"]');
    await boundary.scrollIntoViewIfNeeded();
    await expect(boundary).toBeVisible();
    await expect(boundary).toHaveCSS("border-inline-start-width", "4px");
    await expect(boundary.locator(".book-numbered-statement__label")).toHaveText("Bridge boundary — DOT-B1:");
    await expect(boundary.locator(".book-numbered-statement__body")).toHaveText("Epistemic priority does not entail ontological fundamentality.");
    await expect(boundary).not.toHaveAttribute("data-claim-level");
    await expect(page.locator('[data-claim-id="DOT-H1"]')).toHaveAttribute("data-claim-level", "hypothesis");
    await expect(page.locator('[data-claim-id="DOT-E0"]')).toHaveAttribute("data-claim-level", "observation");
    await expectNoHorizontalOverflow(page);
    await page.emulateMedia({ media: "print" });
    await expect(boundary).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(boundary).toHaveCSS("color", "rgb(0, 0, 0)");
  });
}
