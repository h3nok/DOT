import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow } from "./helpers";
import AMM from "../src/content/amm.json" with { type: "json" };
import MODEL from "../src/content/amm-model.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/v1/academy/delivery/catalog*", route => route.fulfill({ json: [] }));
  await page.route("**/v1/site-content", route => route.fulfill({ json: { blocks: {} } }));
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the AMM home meets WCAG 2.2 AA", async ({ page }) => {
  await page.goto("/amm");
  await expect(page.locator("#amm-book")).toBeAttached();
  await expectNoAxeViolations(page, "main");
});

test("a primary action keeps its light ink when a pointer rests on it", async ({ page }) => {
  // Regression: a scene's text-link hover once turned the rust button's words rust (1.24:1).
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/amm");
  const action = page.locator("#amm-inversion").getByRole("link", { name: AMM.model.readDiagnosis });
  await action.scrollIntoViewIfNeeded();
  await action.hover();
  await expect(action).toHaveCSS("color", "rgb(255, 248, 237)");
  if (await page.evaluate(() => matchMedia("(hover: hover)").matches)) await expect(action).toHaveCSS("background-color", "rgb(116, 36, 28)");
});

test("the inquirer's page gathers everything needed to test the work, and keeps the reader's notes private", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", request => { if (request.method() !== "GET") sent.push(`${request.method()} ${request.url()}`); });
  // Reached from the footer of every AMM page, not from the home's reading path.
  await page.goto("/amm");
  await page.getByRole("contentinfo").getByRole("link", { name: AMM.inquiry.eyebrow }).click();
  await expect(page).toHaveURL(/\/amm\/inquiry$/);
  await expect(page.getByRole("heading", { level: 1, name: AMM.inquiry.title })).toBeVisible();
  const contents = page.getByRole("navigation", { name: AMM.inquiry.contentsLabel }).getByRole("link");
  await expect(contents).toHaveCount(10);
  await expect(page.getByRole("list", { name: AMM.inquiry.levelsLabel }).or(page.getByLabel(AMM.inquiry.levelsLabel)).locator("dt")).toHaveText(MODEL.levels.items.map(level => level.label));
  await expect(page.locator(".inq-term")).toHaveCount(MODEL.terms.length);
  await expect(page.locator("#term-canvas").getByRole("link", { name: "Canvas" }).last()).toHaveAttribute("href", "/doctrine/canvas");
  await expect(page.locator(".inq-record")).toHaveCount(MODEL.records.length);

  const power = page.getByRole("textbox", { name: /Power/ });
  await power.fill("The landlord sets the renewal terms.");
  expect(await page.evaluate(() => sessionStorage.getItem("amm-inquiry-notebook"))).toContain("landlord");
  expect(await page.evaluate(() => localStorage.getItem("amm-inquiry-notebook"))).toBeNull();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: AMM.inquiry.notebookSave }).click();
  expect((await download).suggestedFilename()).toBe(AMM.inquiry.notebookFile);
  await page.getByRole("button", { name: AMM.inquiry.notebookClear }).click();
  await page.getByRole("button", { name: AMM.inquiry.notebookConfirm }).click();
  await expect(power).toHaveValue("");
  expect(sent.filter(request => !/\/v1\//.test(request))).toEqual([]);

  await expect(page.getByRole("button", { name: `${AMM.inquiry.citeCopy}: ${AMM.title}` })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page, ".amm-inquiry");
});
