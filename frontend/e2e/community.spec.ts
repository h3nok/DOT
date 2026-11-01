import { expect, test } from "@playwright/test";

import { collectPageProblems } from "./helpers";

test("the retired Community address opens Contact", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.route("**/v1/contact/status", route => route.fulfill({ json: { available: true } }));
  await page.goto("/community");
  await expect(page).toHaveURL("/contact");
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Community", exact: true })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("the Academy's conversation link opens a private writing conversation", async ({ page }) => {
  await page.route("**/v1/contact/status", route => route.fulfill({ json: { available: true } }));
  await page.goto("/academy");
  await page.getByRole("link", { name: /Ask a question/ }).click();
  await expect(page).toHaveURL("/contact?purpose=writing");
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeVisible();
  const purpose = page.getByRole("combobox", { name: "Purpose" });
  if (await purpose.isVisible()) await expect(purpose).toHaveValue("writing");
  else await expect(page.getByRole("radio", { name: /Writing and research/ })).toBeChecked();
});
