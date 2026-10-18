import { expect, test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";
import AMM from '../src/content/amm.json' with { type: 'json' };

test("the owner can edit AMM copy privately, reopen it, and publish deliberately", async ({ page }) => {
  let owner = true;
  const rows: Record<string, { key: string; draft_value: string; published_value: string | null; updated_at: string; published_at: string | null }> = {};
  const writes: Array<{ value: string; publish: boolean; expected_updated_at: string | null }> = [];
  await page.route("**/v1/**", async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/__dot-api/, "");
    if (path === "/v1/auth/session") return route.fulfill({ json: { user: owner ? { id: "fixture-owner", role: "owner", is_owner: true } : null } });
    if (path === "/v1/site-content/drafts") return route.fulfill({ json: { blocks: Object.values(rows) } });
    if (path === "/v1/site-content") return route.fulfill({ json: { blocks: Object.fromEntries(Object.values(rows).filter(row => row.published_value).map(row => [row.key, row.published_value])) } });
    if (path.startsWith("/v1/site-content/") && route.request().method() === "PUT") {
      const key = decodeURIComponent(path.split("/").at(-1)!);
      const body = route.request().postDataJSON(); writes.push(body);
      rows[key] = { key, draft_value: body.value, published_value: body.publish ? body.value : rows[key]?.published_value ?? null, updated_at: `2026-10-15T10:00:0${writes.length}Z`, published_at: null };
      return route.fulfill({ json: rows[key] });
    }
    if (path.startsWith("/v1/academy/delivery/catalog")) return route.fulfill({ json: [] });
    if (path === "/v1/readers/status") return route.fulfill({ json: { available: false } });
    return route.fulfill({ status: 404, json: { detail: "No fixture" } });
  });
  await page.goto("/amm/");
  await page.getByRole("link", { name: "Edit this page", exact: true }).click();
  const field = page.getByRole("region", { name: "Opening paragraph", exact: true });
  await expect(field.getByRole('textbox')).toHaveValue(AMM.home.premise);
  await field.getByRole("textbox").fill("Synthetic private opening");
  await field.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(field.getByText("Draft saved privately.")).toBeVisible();
  expect(writes[0]).toMatchObject({ publish: false, expected_updated_at: null });
  await page.reload();
  await expect(field.getByRole("textbox")).toHaveValue("Synthetic private opening");
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "View the page", exact: true }).click();
  await expect(page.locator('.amm-home-premise')).toHaveText(AMM.home.premise);
  await page.getByRole("link", { name: "Edit this page", exact: true }).click();
  await field.getByRole("button", { name: "Publish change", exact: true }).click();
  await expect(field.getByText("Published on the page.")).toBeVisible();
  expect(writes[1]).toMatchObject({ publish: true, expected_updated_at: "2026-10-15T10:00:01Z" });
  const debt = page.locator('.page-copy-sections > details').filter({ has: page.getByText('How power works · The debt payment', { exact: true }) });
  await expect(debt.getByRole('textbox')).toHaveCount(0);
  await debt.locator(':scope > summary').click();
  const explanation = debt.getByRole('textbox', { name: 'How the payment works', exact: true });
  await explanation.fill('Synthetic owner revision of the debt explanation.');
  await debt.locator(':scope > summary').click();
  await debt.locator(':scope > summary').click();
  await expect(explanation).toHaveValue('Synthetic owner revision of the debt explanation.');
  const paymentField = debt.getByRole('region', { name: 'How the payment works', exact: true });
  await paymentField.getByRole('button', { name: 'Publish change', exact: true }).click();
  await expect(paymentField.getByText('Published on the page.')).toBeVisible();
  const delusion = page.locator('.page-copy-sections > details').filter({ has: page.getByText('Home · Cultural delusion', { exact: true }) });
  await delusion.locator(':scope > summary').click();
  const script = delusion.getByRole('region', { name: 'Script', exact: true });
  await script.getByRole('textbox').fill('Synthetic cultural message, edited by the owner.');
  await script.getByRole('button', { name: 'Publish change', exact: true }).click();
  await expect(script.getByText('Published on the page.')).toBeVisible();
  await page.getByRole('link', { name: 'View How power works', exact: true }).click();
  await expect(page.getByText('Synthetic owner revision of the debt explanation.')).toBeVisible();
  owner = false;
  await page.goto("/amm");
  await expect(page.locator('.amm-home-premise')).toHaveText("Synthetic private opening");
  await expect(page.getByRole("link", { name: "Edit this page" })).toHaveCount(0);
  await page.locator('#amm-overview .explainer-story-steps > li').nth(2).evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(page.locator('#amm-overview .explainer-story-steps h3').nth(2)).toContainText('Synthetic cultural message, edited by the owner.');
  await page.goto("/studio/pages/amm");
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("the owner can enter the exact chapter editor from its public page", async ({ page }) => {
  await page.route("**/v1/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/session")) return route.fulfill({ json: { user: { id: "owner", role: "owner", is_owner: true } } });
    if (path.includes("/delivery/catalog")) return route.fulfill({ json: [] });
    if (path.endsWith("/academy/workspace")) return route.fulfill({ json: { id: "space", slug: "dot-academy", title: "Workspace" } });
    if (path.endsWith("/spaces/space/works")) return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { detail: "No fixture" } });
  });
  await page.goto("/essays/amm-chapter-one-the-leech");
  await page.getByRole("link", { name: "Edit this chapter", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Chapter One: The Leech");
  await expect(page.getByRole("link", { name: "The American Millennial Manifesto — Home", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "DOT — Home", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Original text and artwork opened/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
