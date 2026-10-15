import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

const TITLE = "The American Millennial Manifesto";
test("chapters, reader-operated erosion and portable figures work on a narrow screen", async ({ page }) => {
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/amm");
  await expect(page.getByRole("heading", { name: "Read the manifesto." })).toBeVisible();
  await page.getByRole("button", { name: "03 Parallel systems" }).click();
  await expect(page.getByRole("heading", { name: "Can the terms be changed?" })).toBeVisible();
  await expect(page.getByText("A visual argument · no quantities or forecast implied")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "The Leech’s Anatomy", exact: true }).click();
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
  const slug = "the-anatomy-of-the-host";
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
  await expect(page.getByRole("navigation", { name: "AMM", exact: true })).toBeVisible();
  await expect(page.locator('link[rel="icon"][href="/amm/mark.svg"]')).toHaveCount(1);
  await expect(page.getByRole("link", { name: "All AMM editions", exact: true })).toHaveAttribute("href", "/amm#amm-editions");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "All AMM editions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Letters from the present." })).toBeInViewport();
  await page.getByRole("link", { name: "Digital Organism Theory", exact: true }).click();
  await expect(page.locator(".amm-shell")).toHaveCount(0);
  await expect(page.locator('link[rel="icon"][href="/amm/mark.svg"]')).toHaveCount(0);
});

test("the author's introduction opens from AMM and the illustration has a readable description", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.goto("/amm");
  await expect(page.getByRole("link", { name: `${TITLE} — Home`, exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "AMM", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "DOT — Home", exact: true })).toHaveCount(0);
  const illustration = page.getByRole("img", { name: /two-headed leech/ });
  await expect(illustration).toBeVisible();
  await expect.poll(() => illustration.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(1536);
  await page.getByText("Read the illustration", { exact: true }).click();
  await expect(page.getByText(/The Host is the people, pictured as a cow/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Open full-size illustration" })).toHaveAttribute("href", "/amm/the-slow-erosion-of-the-public.webp");
  await expect(page.getByRole("heading", { name: "Go to the source." })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Start with the introduction" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "The Anatomy of the Host" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "AMM", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "All AMM editions", exact: true })).toHaveAttribute("href", "/amm#amm-editions");
  await expect(page.getByText(/AMM applies my systemic understanding of society/)).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText(/The standard remains specific enough to investigate/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("AMM's analytical spine is reader-controlled and leads to the supporting passage", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: false } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/amm#amm-analysis");
  const conditions = page.getByRole("tab", { name: "01 Conditions" });
  await expect(conditions).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await expect(page.getByRole("tabpanel")).toContainText("Who sets the terms?");
  await conditions.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "02 Interpretation" })).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("What starts to feel natural?");
  await page.keyboard.press("End");
  await expect(page.getByRole("tabpanel")).toContainText("What gets reproduced—or corrected?");
  await page.keyboard.press("Home");
  await expect(conditions).toBeFocused();
  await page.getByRole("tab", { name: "03 Conduct" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Who has room to refuse?");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Examine it in the introduction", exact: true }).click();
  const target = page.locator("#authority-and-responsibility-within-the-model");
  await expect(target).toBeVisible();
  await expect.poll(() => target.evaluate(node => Math.abs(node.getBoundingClientRect().top))).toBeLessThan(150);
  await expect(page.getByRole("navigation", { name: "AMM", exact: true })).toBeVisible();
});

test("AMM has its own landing, scoped signup and mobile layout", async ({ page }) => {
  await page.route("**/v1/readers/status", route => route.fulfill({ json: { available: true, publications: ["all", "amm"] } }));
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.route("**/essays/index.json", route => route.fulfill({ json: { schema: "dot.essays.v1", essays: [] } }));
  let selected: unknown;
  await page.route("**/v1/readers/subscribe", route => { selected = route.request().postDataJSON(); return route.fulfill({ status: 202, json: { status: "awaiting_confirmation", expires_in: 900 } }); });
  await page.route("**/v1/readers/confirm", route => { expect(route.request().postDataJSON()).toEqual({ email: "fixture@example.com", code: "123456", publication: "amm", include_all: false }); return route.fulfill({ json: { status: "subscribed", unsubscribe_token: "a".repeat(64) } }); });
  await page.goto("/amm");
  await expect(page.getByRole("heading", { name: "A country is more than a market." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The next chapter starts here." })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Subscribe", exact: true }).click();
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
  await expect(page.getByRole("navigation", { name: "AMM", exact: true })).toBeVisible();
  await expect(page).not.toHaveURL(/#a{64}/);
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
