import { readFileSync } from "node:fs";
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
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  await menu.click();
  const navigation = page.getByRole("dialog", { name: "Menu", exact: true });
  await expect(navigation.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Writing" })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.getByText("End of piece")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-organism-reading", "true");
  await expect(page.getByRole("button", { name: "Export sharing text" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "All writing", exact: true }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("link", { name: delivery.manifest.title })).toBeVisible();
  await expect(page.getByText(/End of list/)).toBeVisible();
});

test("old essay archive links resolve to the common blog", async ({ page }) => {
  await page.route("**/v1/academy/delivery/catalog*", (route) => route.fulfill({ json: [] }));
  await page.route("**/essays/index.json", (route) => route.fulfill({ json: { schema: "dot.essays.v1", essays: [] } }));
  await page.goto("/essays");
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole("heading", { name: /On struggle.*On being human/ })).toBeVisible();
  await expect(page.getByText("No posts yet.")).toBeVisible();
  await page.getByText("Read a letter", { exact: true }).click();
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
  await page.getByRole("link", { name: "DOT — Home", exact: true }).click();
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
    const path = new URL(route.request().url()).pathname.replace(/^\/__dot-api/, "");
    if (path === "/v1/auth/session") return route.fulfill({ json: { user: { id: "author", is_owner: true, role: "owner", display_name: "Test author" } } });
    if (path === "/v1/academy/workspace") return route.fulfill({ json: { id: "space", slug: "dot-academy", title: "Test workspace" } });
    if (path === "/v1/academy/spaces/space/works") return route.fulfill({ json: route.request().method() === "POST" ? { id: "launch-letter", canonical_slug: "fixture-letter", kind: "essay" } : [] });
    if (path === "/v1/academy/works/launch-letter/drafts") return route.fulfill({ json: { id: "revision", revision_number: 1 } });
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
  await page.getByRole("button", { name: "Write a blank draft" }).click();
  await page.getByRole("textbox", { name: "Title", exact: true }).fill(delivery.manifest.title);
  await page.getByRole("textbox", { name: "Manuscript", exact: true }).fill(fixtureBody);
  await page.getByRole("textbox", { name: "Statement", exact: true }).fill("A fixture claim");
  await page.getByRole("combobox", { name: "Claim level", exact: true }).selectOption("Observation");
  await page.getByLabel("Add images", { exact: true }).setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: readFileSync("public/og/henok-writing.png") });
  await page.getByRole("button", { name: "Use as banner" }).click();
  await page.getByLabel("Banner description", { exact: true }).fill("A fixture banner");
  await page.getByLabel("Description for insertion", { exact: true }).fill("An inline fixture");
  await page.getByRole("button", { name: "Insert in text" }).click();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `/tmp/dot-writing-edit-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Save private revision" }).click();
  await expect(page.getByText("Revision 1 saved privately. Text, settings, images and claim notes are together.")).toBeVisible();
  await page.getByRole("button", { name: "3. Preview", exact: true }).click();
  await expect(page.getByRole("img", { name: "A fixture banner", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "An inline fixture", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `/tmp/dot-writing-preview-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "4. Publish", exact: true }).click();
  await page.getByRole("checkbox", { name: /approve public release/ }).check();
  await page.getByRole("button", { name: "Publish on this website", exact: true }).click();
  await expect(page.getByText("Version 1 is published on this website.")).toBeVisible();
  await page.getByRole("button", { name: "LinkedIn", exact: true }).click();
  await page.getByRole("button", { name: "Share released link on LinkedIn" }).click();
  await expect(page.getByText(/LinkedIn rejected the share/)).toBeVisible();
  await expect(page.getByText("Saved · revision 1")).toBeVisible();
  await page.getByRole("button", { name: "Medium", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open Medium editor" })).toHaveAttribute("href", "https://medium.com/p/import");
  await page.getByText("Export and inspect the complete piece").click();
  const exported = page.getByRole("textbox", { name: "Complete published text", exact: true });
  await expect(exported).toHaveValue(/Complete author-supplied fixture manuscript\./);
  await page.getByRole("button", { name: "2. Edit", exact: true }).click();
  await page.getByRole("textbox", { name: "Manuscript", exact: true }).fill("Private edits after release");
  await expect(exported).not.toHaveValue(/Private edits after release/);
  expect(releases).toBe(1);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `/tmp/dot-distribution-${testInfo.project.name}.png`, fullPage: true });
});

test("a Markdown file and its images can be saved, reopened and exported without publishing", async ({ page }) => {
  const bytes = readFileSync("public/og/henok-writing.png");
  const manuscript = '---\ntitle: Imported fixture\nsummary: Supplied metadata\nslug: imported-fixture\nformat: case-study\ndraft: false\ncover: fixture/banner.png\ncover_alt: Supplied banner description\nclaims:\n  - statement: Supplied claim\n    level: Model\n    origin: author_originated\n---\nSupplied prose.\n\n![Inline description](fixture/banner.png)\n';
  let snapshot: Record<string, unknown> | null = null;
  let releases = 0;
  let saves = 0;
  let creations = 0;
  const work = { id: "imported", canonical_slug: "imported-fixture", kind: "essay", lifecycle_state: "draft" };
  await page.route("**/v1/**", async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/__dot-api/, "");
    if (path === "/v1/auth/session") return route.fulfill({ json: { user: { id: "author", is_owner: true, role: "owner" } } });
    if (path === "/v1/academy/workspace") return route.fulfill({ json: { id: "space", slug: "dot-academy" } });
    if (path === "/v1/academy/spaces/space/works") {
      if (route.request().method() === "POST") creations += 1;
      return route.fulfill({ json: route.request().method() === "POST" ? work : snapshot ? [work] : [] });
    }
    if (path === "/v1/academy/works/imported/drafts") {
      expect(route.request().headers()["x-owner-id"]).toBeUndefined();
      snapshot = route.request().postDataJSON();
      saves += 1;
      expect(snapshot).toMatchObject({ title: "Imported fixture", base_revision_id: saves === 1 ? null : "saved-revision", presentation: { cover: { path: "fixture/banner.png" } }, assets: saves === 1 ? [{ path: "fixture/banner.png", data_base64: bytes.toString("base64") }] : [{ path: "fixture/banner.png", source_revision_id: "saved-revision" }] });
      return route.fulfill({ json: { id: saves === 1 ? "saved-revision" : "saved-revision-2", revision_number: saves } });
    }
    if (path === "/v1/academy/works/imported/revisions") return route.fulfill({ json: [{ id: "saved-revision", revision_number: 1, title: snapshot?.title, summary: snapshot?.summary }] });
    if (path === "/v1/academy/revisions/saved-revision/body") return route.fulfill({ json: { ...snapshot, assets: [{ id: "banner", path: "fixture/banner.png", width: 1200, height: 630, bytes: bytes.length, source_revision_id: "saved-revision", src: "/v1/academy/revisions/saved-revision/media/banner" }] } });
    if (path === "/v1/academy/revisions/saved-revision/media/banner") return route.fulfill({ body: bytes, contentType: "image/png" });
    if (path.endsWith("/releases")) releases += 1;
    return route.fulfill({ status: 404, json: { detail: "No public fixture" } });
  });
  await page.goto("/studio/writing");
  await page.getByLabel("Import manuscript", { exact: true }).setInputFiles({ name: "imported-fixture.md", mimeType: "text/markdown", buffer: Buffer.from(manuscript) });
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Imported fixture");
  await page.getByLabel("Add images", { exact: true }).setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: bytes });
  await page.getByRole("button", { name: "Save private revision" }).click();
  await expect(page.getByText("Saved · revision 1")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /imported fixture/ }).click();
  await expect(page.getByRole("textbox", { name: "Statement", exact: true })).toHaveValue("Supplied claim");
  await expect(page.locator(".writing-artwork-card img")).toHaveJSProperty("naturalWidth", 1200);
  await page.getByRole("button", { name: "3. Preview", exact: true }).click();
  await expect(page.getByRole("img", { name: "Supplied banner description", exact: true })).toHaveJSProperty("naturalWidth", 1200);
  await expect(page.getByRole("img", { name: "Inline description", exact: true })).toHaveJSProperty("naturalWidth", 1200);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download .md", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("imported-fixture.md");
  const exported = readFileSync((await download.path())!, "utf8");
  expect(exported).toContain("draft: true");
  expect(exported).toContain("statement: Supplied claim");
  expect(exported).toContain("![Inline description](fixture/banner.png)");
  expect(exported).not.toContain("data_base64");
  await page.getByRole("button", { name: "1. Import", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bring in a revised manuscript." })).toBeVisible();
  await page.getByLabel("Import manuscript", { exact: true }).setInputFiles({ name: "updated-copy.md", mimeType: "text/markdown", buffer: Buffer.from(manuscript.replace("Supplied prose.", "Revised prose.")) });
  await page.getByRole("button", { name: "Save private revision" }).click();
  await expect(page.getByText("Saved · revision 2")).toBeVisible();
  expect(saves).toBe(2);
  expect(creations).toBe(1);
  expect(releases).toBe(0);
  await expectNoHorizontalOverflow(page);
});
