import { expect, test } from "@playwright/test";

test("a chapter's related concepts open their own Concept Map pages", async ({ page }) => {
  await page.goto("/book/digital-organism-theory/the-painting");
  const related = page.getByRole("region", { name: "Related concepts" });
  await expect(related.locator("a.book-coda__concept").first()).toBeAttached({ timeout: 15_000 });
  const hrefs = await related.locator("a.book-coda__concept").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs).toContain("/doctrine/fear-gating");
  expect(hrefs).not.toContain("/doctrine/culture");
  for (const href of hrefs) {
    await page.goto(href!);
    await expect(page).toHaveURL(href!);
  }
});

test("an address for a concept the map lacks opens the map, not another concept", async ({ page }) => {
  await page.goto("/doctrine/culture");
  await expect(page).toHaveURL(/\/doctrine$/);
});
