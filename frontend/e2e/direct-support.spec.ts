import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

test.beforeEach(async ({ page }) => {
  // A confirmed-recipient fixture, served only to this browser. No real transfer.
  await page.route("**/src/content/support.json*", route => route.fulfill({
    contentType: "application/javascript",
    body: `export default ${JSON.stringify({ preferredMethod: "zelle", zelle: { recipient: "author@example.com", recipientName: "Example Author" }, cashApp: { url: "https://cash.app/$example" } })}`,
  }));
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("direct support works without the card service and keeps provider confirmation honest", async ({ page }) => {
  let cardRequests = 0;
  await page.route("**/v1/support/options", route => { cardRequests++; return route.abort(); });
  await page.goto("/support?purpose=author");
  await expect(page.getByRole("heading", { name: "Support the author" })).toBeVisible();
  await expect(page.getByText("author@example.com", { exact: true })).toBeVisible();
  await expect(page.getByText("Example Author", { exact: true })).toBeVisible();
  await expect(page.getByText(/This page cannot confirm a direct transfer/)).toBeVisible();
  await page.getByRole("combobox", { name: "Support method" }).selectOption("cashapp");
  await expect(page.getByRole("link", { name: "Continue to Cash App" })).toHaveAttribute("href", "https://cash.app/$example");
  expect(cardRequests).toBe(0);
  await expectNoHorizontalOverflow(page);
});

test("a reader can return to direct support when card checkout is unavailable", async ({ page }) => {
  await page.route("**/v1/support/options", route => route.fulfill({ json: { available: false, tiers: [], purposes: [], min_custom_minor: 200, max_custom_minor: 500000, currency: "usd" } }));
  await page.goto("/support?purpose=author");
  await page.getByRole("button", { name: "Use card checkout instead" }).click();
  await expect(page.getByRole("heading", { name: "Not open yet" })).toBeVisible();
  await page.getByRole("button", { name: "Back to direct support methods" }).click();
  await expect(page.getByText("author@example.com", { exact: true })).toBeVisible();
});
