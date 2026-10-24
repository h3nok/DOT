import { expect, test } from "@playwright/test";

import COMMUNITY from "../src/content/community.json" with { type: "json" };
import BLOG from "../src/content/blog.json" with { type: "json" };
import { collectPageProblems, expectNoHorizontalOverflow } from "./helpers";

test("a reader can move from the invitation to a private writing conversation", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/v1/contact/status", route => route.fulfill({ json: { available: true } }));
  await page.goto("/");
  await page.getByRole("navigation", { name: "Quiet links" }).getByRole("link", { name: "Community", exact: true }).click();
  await expect(page).toHaveURL("/community");
  await expect(page.getByRole("heading", { name: COMMUNITY.heading })).toBeVisible();
  await expect(page.getByText(BLOG.startingPoint.quote, { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: BLOG.startingPoint.linkLabel })).toHaveAttribute("href", BLOG.startingPoint.to);
  await expect(page.getByText(COMMUNITY.status)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: COMMUNITY.conversationAction, exact: true }).click();
  await expect(page).toHaveURL("/contact?purpose=writing");
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeEnabled();
  const purpose = page.getByRole("combobox", { name: "What brings you here?" });
  if (await purpose.isVisible()) await expect(purpose).toHaveValue("writing");
  else await expect(page.getByRole("radio", { name: /Writing & inquiry/ })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "Budget range" })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("following, membership, and optional support stay separate choices", async ({ page }) => {
  await page.goto("/community");
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Open the reader list" })).toHaveAttribute("href", "/readers");
  await expect(main.getByRole("link", { name: "Follow with RSS" })).toHaveAttribute("href", "/feed.xml");
  await expect(main.getByRole("link", { name: "Request an invitation" })).toHaveAttribute("href", "/join");
  await expect(main.getByRole("link", { name: COMMUNITY.supportAction })).toHaveAttribute("href", "/support?purpose=author");
  await expect(main.getByText(COMMUNITY.supportDescription)).toBeVisible();
  await expect(main.getByRole("textbox")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
