import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow } from "./helpers";

const COPY_ROUTE = "/book/digital-organism-theory/copy";

test("the complete PDF downloads without an account or working backend", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/v1/**", (route) => route.abort());
  const commerceRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/v1/commerce")) commerceRequests.push(request.url());
  });
  await page.goto(COPY_ROUTE);
  await expect(page.getByRole("heading", { name: "Read freely. Keep a copy." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Support the author · optional/ }))
    .toHaveAttribute("href", "/support?purpose=author");
  await expectNoHorizontalOverflow(page);
  const downloading = page.waitForEvent("download");
  await page.getByRole("link", { name: /Download the free PDF/ }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe("Digital-Organism-Theory-Book-One-Digital-Edition.pdf");
  const path = await download.path();
  expect(path).not.toBeNull();
  const pdf = await readFile(path!);
  expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  expect(pdf.byteLength).toBeGreaterThan(100_000);
  expect(commerceRequests).toEqual([]);
});

test("author support is a changeable one-time contribution and closing returns to the book", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/v1/support/options", (route) => route.fulfill({
    json: {
      tiers: [], purposes: [{ id: "author", label: "Independent writing and research" }],
      currency: "usd", min_custom_minor: 200, max_custom_minor: 500_000, available: true,
    },
  }));
  await page.route("**/v1/support/checkout-sessions", (route) => route.fulfill({
    status: 503, json: { detail: "Support provider is unavailable." },
  }));
  await page.goto("/support?purpose=author");
  await expect(page.getByRole("heading", { name: "Support the author" })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Contribution amount" })).toHaveValue("20");
  await page.getByRole("spinbutton", { name: "Contribution amount" }).fill("7.25");
  const requesting = page.waitForRequest((request) =>
    request.url().endsWith("/v1/support/checkout-sessions") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Continue to Stripe" }).click();
  expect((await requesting).postDataJSON()).toEqual({
    tier: "custom", purpose: "author", custom_amount_minor: 725,
  });
  await expect(page.getByRole("alert")).toHaveText("Support provider is unavailable.");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(page).toHaveURL(COPY_ROUTE);
  await expect(page.getByRole("link", { name: /Download the free PDF/ })).toBeVisible();
});

test("closed support does not block the free download", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/v1/support/options", (route) => route.fulfill({
    json: { tiers: [], purposes: [], currency: "usd", min_custom_minor: 200, max_custom_minor: 500_000, available: false },
  }));
  await page.goto("/support?purpose=author");
  await expect(page.getByRole("heading", { name: "Not open yet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to Stripe" })).toHaveCount(0);
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
  await expect(page.getByRole("link", { name: /Download the free PDF/ })).toBeVisible();
});

test("the released two-row equation renders in the reader without page overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book/digital-organism-theory/the-canvas");
  await expect(page.locator(".katex-display").first()).toBeVisible();
  await expect(page.locator(".katex-error")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
