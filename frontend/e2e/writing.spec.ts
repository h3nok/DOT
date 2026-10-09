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
  await expect(page.getByRole("heading", { name: /On building.*On being human/ })).toBeVisible();
  await expect(page.getByText("The archive starts here.")).toBeVisible();
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

test("the author publishes here and prepares full-text copies even when LinkedIn rejects sharing", async ({ page }, testInfo) => {
  let releases = 0;
  const fixtureBody = "Complete author-supplied fixture manuscript.";
  await page.route("**/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/v1/auth/session") return route.fulfill({ json: { user: { id: "author", is_owner: true, role: "owner", display_name: "Test author" } } });
    if (path === "/v1/academy/workspace") return route.fulfill({ json: { id: "space", slug: "dot-academy", title: "Test workspace" } });
    if (path === "/v1/academy/spaces/space/works") return route.fulfill({ json: route.request().method() === "POST" ? { id: "launch-letter", canonical_slug: "fixture-letter", kind: "essay" } : [] });
    if (path === "/v1/academy/works/launch-letter/revisions") return route.fulfill({ json: { id: "revision", revision_number: 1 } });
    if (path === "/v1/academy/revisions/revision/claims") return route.fulfill({ json: { id: "claim" } });
    if (path === "/v1/academy/works/launch-letter/releases") {
      releases += 1;
      return route.fulfill({ json: { release_number: 1, release_status: "released" } });
    }
    if (path === "/v1/distribution/linkedin") return route.fulfill({ json: { configured: true, connected: true, display_name: "Test author", expires_at: null } });
    if (path.endsWith("/releases/1/linkedin")) return route.fulfill({ json: { platform: "linkedin", status: "failed", external_url: null, error_code: "linkedin_rejected" } });
    if (path.endsWith("/copies")) return route.fulfill({ json: [] });
    if (path.endsWith("/delivery/works/launch-letter/releases/1")) return route.fulfill({ json: delivery });
    if (path.endsWith("/delivery/body/academy/fixture.md")) return route.fulfill({ body: fixtureBody, contentType: "text/markdown" });
    return route.fulfill({ status: 404, json: { detail: "No fixture" } });
  });
  await page.goto("/studio/writing");
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(delivery.manifest.title);
  await page.getByRole("textbox", { name: "Manuscript", exact: true }).fill(fixtureBody);
  await page.getByRole("textbox", { name: "Statement", exact: true }).fill("A fixture claim");
  await page.getByRole("combobox", { name: "Claim level", exact: true }).selectOption("Observation");
  await page.getByRole("checkbox", { name: /Also share a link/ }).check();
  await page.getByRole("checkbox", { name: /approve public release/ }).check();
  await page.getByRole("button", { name: "Publish on this website", exact: true }).click();
  await expect(page.getByText("Version 1 is published on this website.")).toBeVisible();
  await expect(page.getByText(/LinkedIn rejected the share/)).toBeVisible();
  await expect(page.getByText("Text unchanged")).toBeVisible();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open Medium editor" })).toHaveAttribute("href", "https://medium.com/p/import");
  await page.getByText("Export and inspect the complete piece").click();
  const exported = page.getByRole("textbox", { name: "Complete published text", exact: true });
  await expect(exported).toHaveValue(/Complete author-supplied fixture manuscript\./);
  await page.getByRole("textbox", { name: "Manuscript", exact: true }).fill("Private edits after release");
  await expect(exported).not.toHaveValue(/Private edits after release/);
  expect(releases).toBe(1);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `/tmp/dot-distribution-${testInfo.project.name}.png`, fullPage: true });
});
