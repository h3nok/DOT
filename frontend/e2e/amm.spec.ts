import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";
import AMM from '../src/content/amm.json' with { type: 'json' };

const TITLE = "The American Millennial Manifesto";
// Copy assertions read the repository text, never a local editor's published overrides.
test.beforeEach(async ({ page }) => {
  await page.route("**/v1/site-content", route => route.fulfill({ json: { blocks: {} } }));
});
test("the hidden power page, chapters and portable figures work on a narrow screen", async ({ page }) => {
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  // How power works is hidden for now, but still opens at its own address.
  await page.goto("/amm/power");
  await expect(page.getByRole("heading", { level: 1, name: "The new power is economic." })).toBeVisible();
  await expect(page.locator("#holders .evidence-chart")).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("contentinfo").getByRole("link", { name: "Editions", exact: true }).click();
  await page.getByRole('link', { name: 'Read Chapter Two', exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Chapter Two: The Leech’s Anatomy" })).toBeVisible();
  await expect(page.locator(".evidence-chart")).toHaveCount(4);
  const chart = page.locator(".evidence-chart").first();
  await chart.getByRole("button", { name: "Inspect Apple Services: 109.2 USD billions" }).click();
  await expect(chart.getByText("Apple Services: 109.2 USD billions", { exact: true })).toBeVisible();
  await expect(chart.getByText(/not independently verified/)).toBeVisible();
  await chart.getByText("All values and sources").click();
  await expect(chart.getByRole("table")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("an adopted manuscript retains its address and never falls back after withdrawal", async ({ page }) => {
  const slug = "amm-chapter-three-the-host-and-the-infection";
  let withdrawn = false;
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [{ work_id: "adopted", work_slug: slug, title: "Revised host", summary: "Revised framing.", kind: "essay", release_number: 2, released_at: "2026-10-15T12:00:00Z", withdrawn_at: withdrawn ? "2026-10-15T13:00:00Z" : null, presentation: { series: TITLE } }] }));
  await page.route("**/v1/academy/delivery/works/adopted", route => route.fulfill({ json: withdrawn ? { withdrawn: true, title: "Revised host", reason: "Synthetic withdrawal" } : { manifest: { title: "Revised host", summary: "Revised framing.", release: { number: 2 }, revision: { content_hash: "fixture" }, claims: [], presentation: { series: TITLE, format: "essay" } }, body_ref: "academy/adopted.md" } }));
  await page.route("**/v1/academy/delivery/body/academy/adopted.md", route => route.fulfill({ contentType: "text/markdown", body: "New author-approved text." }));
  await page.goto(`/essays/${slug}`);
  await expect(page.getByText("New author-approved text.")).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/essays/${slug}$`));
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://dotheory.org/essays/${slug}`);
  withdrawn = true;
  await page.reload();
  await expect(page.getByText("This release has been withdrawn.")).toBeVisible();
  await expect(page.getByText(/AMM applies my systemic understanding/)).toHaveCount(0);
});

test("a Studio edition retains AMM's identity, title, and return path", async ({ page }) => {
  await page.route(/\/writing\/amm-fixture\/releases\/1$/, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace("</head>", '<link rel="icon" type="image/svg+xml" href="/amm/mark.svg" data-rh="true" /></head>') });
  });
  await page.route("**/v1/academy/delivery/works/amm-fixture/releases/1", route => route.fulfill({ json: {
    manifest: { title: "AMM reader fixture", summary: "Synthetic reader validation.", release: { number: 1 }, revision: { content_hash: "fixture" }, claims: [], presentation: { series: TITLE, format: "letter" } }, body_ref: "academy/amm-fixture.md",
  } }));
  await page.route("**/v1/academy/delivery/body/academy/amm-fixture.md", route => route.fulfill({ contentType: "text/markdown", body: "The complete synthetic letter." }));
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.goto("/writing/amm-fixture/releases/1");
  await expect(page).toHaveTitle(`AMM reader fixture — ${TITLE}`);
  await expect(page.getByRole("link", { name: "The American Millennial Manifesto — Home", exact: true })).toBeVisible();
  await expect(page.locator('link[rel="icon"][href="/amm/mark.svg"]')).toHaveCount(1);
  await expect(page.getByRole("link", { name: "All AMM editions", exact: true })).toHaveAttribute("href", "/amm/editions");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "All AMM editions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Letters from the present." })).toBeInViewport();
  await page.getByRole('navigation', { name: 'AMM footer' }).getByRole("link", { name: "Digital Organism Theory", exact: true }).click();
  await expect(page.locator(".amm-shell")).toHaveCount(0);
  await expect(page.locator('link[rel="icon"][href="/amm/mark.svg"]')).toHaveCount(0);
});

test("Chapter Three opens from the archive and the illustration has a readable description", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.goto("/amm");
  await expect(page.getByRole("link", { name: `${TITLE} — Home`, exact: true })).toBeVisible();
  await expect(page.getByRole("banner").getByRole("link")).toHaveCount(2);
  await expect(page.getByRole('banner').getByRole('link', { name: 'Digital Organism Theory — Home', exact: true })).toHaveAttribute('href', '/');
  await expect(page.getByRole("link", { name: "DOT — Home", exact: true })).toHaveCount(0);
  const illustration = page.getByRole("img", { name: /flag-patterned Host carries a two-headed Leech/ });
  await expect(illustration).toBeVisible();
  // The artwork retains its uncropped composition at the size the screen needs;
  // the full-size view below keeps the original 1536 × 1024.
  // srcset density-corrected natural sizes round to CSS pixels on phones.
  // Inspect the selected asset itself to check that its full frame is retained.
  await expect.poll(() => illustration.evaluate(async (node: HTMLImageElement) => {
    const original = new Image();
    original.src = node.currentSrc;
    // A busy dev server can fail a second decode of a large image; poll again rather than fail.
    try { await original.decode(); } catch { return 0; }
    return original.naturalWidth / original.naturalHeight;
  })).toBeCloseTo(1536 / 1024, 2);
  // The picture speaks through its description to assistive technology; no visible key or disclosure.
  await expect(illustration).toHaveAttribute("alt", /.+/);
  await expect(page.getByText("Read the illustration", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Inspect The Host", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Go to the source." })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Editions", exact: true }).click();
  await page.getByRole('link', { name: 'Read Chapter Three', exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Chapter Three: The Host and the Infection" })).toBeVisible();
  await expect(page.getByRole("link", { name: "The American Millennial Manifesto — Home", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "All AMM editions", exact: true })).toHaveAttribute("href", "/amm/editions");
  await expect(page.getByText(/AMM applies my systemic understanding of society/)).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText(/The standard remains specific enough to investigate/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("the landing has one reading action and keeps chapter and archive bookmarks usable", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.goto("/amm");
  await expect(page.locator(".amm-hero-actions .amm-button")).toHaveCount(1);
  await expect(page.locator(".amm-chapters")).toHaveCount(0);
  await expect(page.locator(".amm-analysis, .amm-principle, .amm-editions, .amm-movement, .amm-subscribe, .amm-end-support")).toHaveCount(0);
  // The finite home leads from its key ideas into the manuscript's three chapters.
  await expect(page.getByRole("list", { name: "The manifesto, in reading order" })).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Start with Chapter One', exact: true })).toHaveAttribute('href', '/essays/amm-chapter-one-the-leech');
  await expect(page.locator(".amm-footer")).toBeVisible();
  await page.getByRole("contentinfo").getByRole("link", { name: "Editions", exact: true }).click();
  await expect(page).toHaveURL(/\/amm\/editions$/);
  await expect(page.getByRole("heading", { level: 1, name: "Letters from the present." })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read Chapter Three', exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto("/amm#amm-chapters");
  await expect(page).toHaveURL(/\/amm\/editions#amm-chapters$/);
  await expect(page.getByRole("heading", { name: AMM.chapterSection.title })).toBeInViewport();
  // Previously shared newsletter and archive addresses remain usable.
  await page.goto("/amm#amm-subscribe");
  await expect(page).toHaveURL(/\/amm\/editions#amm-subscribe$/);
  await expect(page.getByRole("region", { name: "Subscribe to AMM", exact: true })).toBeInViewport();
  await page.goto("/amm?page=2#amm-editions");
  await expect(page).toHaveURL(/\/amm\/editions\?page=2#amm-editions$/);
});

test("AMM has its own landing, scoped signup and mobile layout", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: true, publications: ["all", "amm"] } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.route("**/essays/index.json", route => route.fulfill({ json: { schema: "dot.essays.v1", essays: [] } }));
  let selected: unknown;
  await page.route("**/v1/readers/subscribe", route => { selected = route.request().postDataJSON(); return route.fulfill({ status: 202, json: { status: "awaiting_confirmation", expires_in: 900 } }); });
  await page.route("**/v1/readers/confirm", route => { expect(route.request().postDataJSON()).toEqual({ email: "fixture@example.com", code: "123456", publication: "amm", include_all: false }); return route.fulfill({ json: { status: "subscribed", unsubscribe_token: "a".repeat(64) } }); });
  await page.goto("/amm");
  await expect(page.getByRole("heading", { name: AMM.headline.join(' ') })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto("/amm/editions#amm-subscribe");
  await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /other writing/ })).not.toBeChecked();
  await page.getByLabel("Email address").fill("fixture@example.com");
  await page.getByRole("button", { name: "Subscribe by email" }).click();
  expect(selected).toEqual({ email: "fixture@example.com", source: "amm", publication: "amm", include_all: false });
  await page.getByLabel("Confirmation code").fill("123456");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You’re subscribed to AMM." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Unsubscribe", exact: true })).toHaveAttribute("href", `/readers/leave?publication=amm#${"a".repeat(64)}`);
  await expectNoHorizontalOverflow(page);
  await page.route("**/v1/readers/unsubscribe", route => {
    expect(route.request().postDataJSON()).toEqual({ token: "a".repeat(64) });
    return route.fulfill({ json: { status: "unsubscribed" } });
  });
  await page.getByRole("link", { name: "Unsubscribe", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You have unsubscribed from AMM." })).toBeVisible();
  await expect(page.getByRole("link", { name: "The American Millennial Manifesto — Home", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/#a{64}/);
});

test("the AI letter presents an inspectable plot with a distinct projection", async ({ page }) => {
  await page.goto("/essays/amm-ai-will-not-kill-you");
  const cover = page.locator(".post-cover img");
  await expect(cover).toHaveAttribute("src", /electricity-plot\.png$/);
  await expect(cover).toHaveAttribute("alt", /485 TWh estimated.*950 TWh projected/);
  const chart = page.getByRole("figure", { name: "Electricity behind the interface" });
  await expect(chart).toBeVisible();
  const forecast = chart.getByRole("button", { name: "Inspect 2030 · projected: 950 TWh per year" });
  await forecast.click();
  await expect(forecast).toHaveAttribute("aria-pressed", "true");
  await expect(forecast).toHaveAttribute("data-kind", "projection");
  const plotSize = await forecast.locator("svg").boundingBox();
  expect(plotSize!.width).toBeGreaterThan(200);
  expect(plotSize!.height).toBe(48);
  await expect(chart.getByText("Hatched bar: projection")).toBeVisible();
  await expect(chart.locator(".evidence-chart-source a")).toHaveAttribute("href", "https://www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary");
  await chart.getByText("All values and sources").click();
  await expect(chart.getByRole("table")).toContainText("2025 · estimated485");
  await expect(chart.getByRole("table")).toContainText("2030 · projected950");
  await expectNoHorizontalOverflow(page);
});

test("newsletter delivery requires a separate review and explicit approval", async ({ page }) => {
  await page.route("**/v1/auth/session", route => route.fulfill({ json: { user: { id: "owner", role: "owner", display_name: "Fixture", is_owner: true } } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [{ work_id: "fixture", work_slug: "fixture", title: "Synthetic AMM edition", summary: "A test fixture.", kind: "essay", release_number: 1, released_at: "2026-10-15T00:00:00Z", withdrawn_at: null, presentation: { series: TITLE, format: "letter" } }] }));
  await page.route("**/v1/newsletters/status", route => route.fulfill({ json: { ready: true, reason: null, missing: [] } }));
  const campaign = { id: "mail_fixture", work_id: "fixture", release_number: 1, title: "Synthetic AMM edition", payload_hash: "a".repeat(64), approved_at: null as string | null, cancelled_at: null, eligible_readers: 1, counts: {} as Record<string, number>, envelope: { title: "Synthetic AMM edition", subject: "AMM · Synthetic AMM edition", from: "Fixture <fixture@example.com>", reply_to: "fixture@example.com", postal_address: "Synthetic test address", html: "<h1>Synthetic AMM edition</h1><p>Fixture body.</p>", text: "Fixture body.", url: "https://example.com/fixture" } };
  let approvals = 0;
  let sends = 0;
  await page.route("**/v1/newsletters/campaigns", route => route.fulfill({ json: route.request().method() === "GET" ? [] : campaign }));
  await page.route("**/v1/newsletters/campaigns/mail_fixture/approve", route => { approvals++; expect(route.request().postDataJSON()).toEqual({ approved: true, payload_hash: "a".repeat(64) }); campaign.approved_at = "2026-10-15T00:00:00Z"; campaign.counts = { pending: 1 }; return route.fulfill({ json: campaign }); });
  await page.route("**/v1/newsletters/campaigns/mail_fixture/dispatch", route => { sends++; campaign.counts = { accepted: 1 }; return route.fulfill({ json: campaign }); });
  await page.goto("/studio/newsletter");
  await expect(page.getByRole("heading", { name: "The newsletter.", exact: true })).toBeVisible();
  await page.getByLabel("Published AMM writing").selectOption("fixture");
  await page.getByRole("button", { name: "Prepare email preview" }).click();
  await expect(page.getByRole("button", { name: "Approve and send edition" })).toBeDisabled();
  expect(approvals).toBe(0); expect(sends).toBe(0);
  await page.getByText("Preview the email", { exact: true }).click();
  await expect(page.frameLocator('iframe[title="AMM email preview"]').getByText("Fixture body.")).toBeVisible();
  await page.getByRole("checkbox", { name: /I reviewed this email/ }).check();
  await page.getByRole("button", { name: "Approve and send edition" }).click();
  await expect(page.getByRole("status")).toContainText("Accepted by email provider: 1");
  expect(approvals).toBe(1); expect(sends).toBe(1);
  await expectNoHorizontalOverflow(page);
});

test("each part names its place, opens the contents, and ends with the next part and the two asks", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: true, publications: ["all", "amm"] } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.goto("/essays/amm-chapter-one-the-leech");
  const order = page.getByRole("navigation", { name: "Reading order" });
  await expect(order).toContainText("Part 1 of 3 published");
  await order.getByText("Contents", { exact: true }).click();
  await expect(order.getByRole("link", { name: /Chapter One · The Leech/ })).toHaveAttribute("aria-current", "page");
  const next = page.getByRole("navigation", { name: "Continue reading" }).getByRole("link", { name: "Next in the manifesto: The Leech’s Anatomy" });
  await expect(page.getByRole("region", { name: "Subscribe to AMM by email" }).getByRole("button", { name: "Subscribe by email" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Contribute once" })).toHaveAttribute("href", "/support?purpose=author&from=amm");
  await expectNoHorizontalOverflow(page);
  await next.click();
  await expect(page.getByRole("heading", { level: 1, name: "Chapter Two: The Leech’s Anatomy" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Reading order" })).toContainText("Part 2 of 3 published");
  await page.goto("/essays/amm-chapter-three-the-host-and-the-infection");
  await expect(page.getByText("This is the latest published chapter.", { exact: false })).toBeVisible();
  // The former standalone section opens at its place in Chapter Three, keeping a deep link's anchor.
  await page.goto("/essays/the-anatomy-of-the-host");
  await expect(page).toHaveURL(/\/essays\/amm-chapter-three-the-host-and-the-infection#the-anatomy-of-the-host$/);
  await expect(page.getByRole("heading", { level: 1, name: "Chapter Three: The Host and the Infection" })).toBeVisible();
  await page.goto("/essays/the-anatomy-of-the-host#class-and-the-head-of-the-host");
  await expect(page).toHaveURL(/\/essays\/amm-chapter-three-the-host-and-the-infection#class-and-the-head-of-the-host$/);
  await page.goto("/essays/amm-ai-will-not-kill-you");
  await expect(page.getByRole("navigation", { name: "Reading order" })).toContainText("A letter alongside the manifesto");
  await expect(page.getByRole("link", { name: "Begin the manifesto: The Leech" })).toHaveAttribute("href", "/essays/amm-chapter-one-the-leech");
});
