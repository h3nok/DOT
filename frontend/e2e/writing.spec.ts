import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

const deliveryPath = "**/v1/academy/delivery/works/launch-letter/releases/1";
const delivery = {
  manifest: {
    title: "Reader journey fixture",
    summary: "A letter opened from a shared link.",
    release: { number: 1 },
    revision: { content_hash: "fixture" },
    claims: [{ statement: "A fixture claim", epistemic_level: "Observation", origin: "author_originated" }],
  },
  body_ref: "academy/fixture.md",
};

test("a shared piece has an end and a way back to its archive", async ({ page }) => {
  await page.route(deliveryPath, (route) => route.fulfill({ json: delivery }));
  await page.route("**/v1/academy/delivery/body/academy/fixture.md", (route) =>
    route.fulfill({ contentType: "text/markdown", body: "The complete letter fixture." }));
  await page.route("**/v1/academy/delivery/catalog*", (route) => route.fulfill({ json: [{
    work_id: "launch-letter", work_slug: "fixture", title: delivery.manifest.title,
    summary: delivery.manifest.summary, kind: "essay", release_number: 1,
    released_at: "2026-10-06T12:00:00Z", withdrawn_at: null,
  }] }));
  await page.route("**/essays/index.json", (route) => route.fulfill({ json: { schema: "dot.essays.v1", essays: [] } }));

  await page.goto("/writing/launch-letter/releases/1");
  await expect(page.getByRole("heading", { name: delivery.manifest.title })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("End of piece")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-organism-reading", "true");
  await expect(page.getByRole("button", { name: "Export sharing text" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "All writing", exact: true }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("link", { name: delivery.manifest.title })).toBeVisible();
  await expect(page.getByText(/That is everything posted here so far/)).toBeVisible();
});

test("old essay archive links resolve to the common blog", async ({ page }) => {
  await page.route("**/v1/academy/delivery/catalog*", (route) => route.fulfill({ json: [] }));
  await page.route("**/essays/index.json", (route) => route.fulfill({ json: { schema: "dot.essays.v1", essays: [] } }));
  await page.goto("/essays");
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { name: "Essays & letters" })).toBeVisible();
  await expect(page.getByText("Nothing has been posted here yet.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Letters on LinkedIn" }).getByRole("link")).toHaveAttribute("href", /^https:\/\/www\.linkedin\.com\/pulse\//);
  await expect(page.getByRole("navigation", { name: "Blog pages" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  const appearance = page.getByRole("button", { name: "Appearance settings" });
  await expect(appearance).toHaveCount(1);
  await expect(page.locator("header").getByRole("button", { name: "Appearance settings" })).toBeVisible();
  await appearance.click();
  await expect(page.getByRole("dialog", { name: "Appearance", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(appearance).toBeFocused();
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-organism-reading", "true");
  const fieldOpacity = await page.locator(".organism-membrane").evaluate((node) => Number(getComputedStyle(node).opacity));
  expect(fieldOpacity).toBeLessThanOrEqual(0.3);
  await page.getByRole("link", { name: "DOT", exact: true }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-organism-reading", "false");
});

test("paging a long archive starts the next page at the writing", async ({ page }) => {
  const entries = Array.from({ length: 11 }, (_, index) => ({
    work_id: `layout-${index}`, work_slug: `layout-${index}`,
    title: `A long archive title that stays readable on a narrow phone screen · Fixture ${index}`,
    summary: `A browser fixture with a long reference: https://example.test/${"reference".repeat(24)}`,
    kind: "essay", release_number: 1,
    released_at: `2026-09-${String(index + 1).padStart(2, "0")}T12:00:00Z`, withdrawn_at: null,
  }));
  await page.route("**/v1/academy/delivery/catalog*", (route) => route.fulfill({ json: entries }));
  await page.route("**/essays/index.json", (route) => route.fulfill({ json: { schema: "dot.essays.v1", essays: [] } }));
  await page.goto("/blog");
  const posts = page.getByRole("list", { name: "Posts, newest first" });
  await expect(posts.getByRole("link")).toHaveCount(10);
  await expectNoHorizontalOverflow(page);
  const older = page.getByRole("link", { name: "Older posts" });
  await older.focus();
  await older.press("Enter");
  await expect(page).toHaveURL(/\/blog\?page=2$/);
  const heading = page.getByRole("heading", { name: "Latest writing" });
  await expect(heading).toBeFocused();
  await expect(heading).toBeInViewport();
  await expect(posts.getByRole("link")).toHaveCount(1);
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("a temporary failure can be retried from the shared address", async ({ page }) => {
  let unavailable = true;
  await page.route(deliveryPath, (route) => {
    return unavailable
      ? route.fulfill({ status: 503, json: { detail: "Backend failure fixture" } })
      : route.fulfill({ json: delivery });
  });
  await page.route("**/v1/academy/delivery/body/academy/fixture.md", (route) =>
    route.fulfill({ contentType: "text/markdown", body: "The complete letter fixture." }));

  await page.goto("/writing/launch-letter/releases/1");
  await expect(page.getByRole("alert")).toContainText("This piece could not be loaded.");
  await expect(page.getByText("Backend failure fixture")).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { name: delivery.manifest.title })).toBeVisible();
  await expect(page).toHaveURL(/\/writing\/launch-letter\/releases\/1$/);
});
