import { expect, test } from "@playwright/test";

import author from "../src/content/author.json" with { type: "json" };
import { collectPageProblems, expectNoHorizontalOverflow } from "./helpers";

const TOKEN = "a".repeat(64);
const EMAIL = "reader@example.com";
const BYLINE = author.suffix ? `${author.name}, ${author.suffix}` : author.name;
const CONTACT = author.email.trim()
  ? { href: `mailto:${author.email.trim()}`, label: author.email.trim() }
  : { href: author.links.linkedin, label: "LinkedIn" };

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("About offers named book navigation and the configured contact", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/about");

  await expect(page.getByRole("heading", { name: BYLINE, exact: true })).toBeVisible();
  const book = page.getByRole("navigation", { name: "Primary", exact: true })
    .getByRole("link", { name: "Book One", exact: true });
  await expect(book).toBeVisible();
  await expect(book).toHaveAttribute("href", "/book/digital-organism-theory");
  await expect(page.getByRole("region", { name: "Contact" })
    .getByRole("link", { name: CONTACT.label, exact: true }))
    .toHaveAttribute("href", CONTACT.href);
  await expect(page.getByRole("main").getByRole("link", { name: "LinkedIn", exact: true }))
    .toHaveAttribute("href", author.links.linkedin);
  await expectNoHorizontalOverflow(page);
  await book.click();
  await expect(page).toHaveURL("/book/digital-organism-theory");
  await expect(page.locator("h1").first()).toBeVisible();
  expect(problems).toEqual([]);
});

test("a closed reader list does not ask for an address", async ({ page }) => {
  await page.route("**/v1/readers/status", (route) => route.fulfill({
    json: { available: false },
  }));
  await page.goto("/readers");

  await expect(page.getByRole("heading", { name: "The list is not open yet." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("link", { name: "Book One", exact: true }))
    .toHaveAttribute("href", "/book/digital-organism-theory");
  await expectNoHorizontalOverflow(page);
});

test("the homepage readers’ list link opens subscription rather than membership", async ({ page }) => {
  await page.route("**/v1/readers/status", (route) => route.fulfill({
    json: { available: false },
  }));
  await page.goto("/");
  await page.getByRole("link", { name: "Join the readers’ list", exact: true }).click();

  await expect(page).toHaveURL("/readers");
  await expect(page.getByRole("heading", { name: "The list is not open yet." })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("the header offers strangers the readers’ list; members sign in from the footer", async ({ page }) => {
  await page.route("**/v1/readers/status", (route) => route.fulfill({
    json: { available: true },
  }));
  await page.goto("/");

  const header = page.locator('header[aria-label="Site Header"]');
  await expect(header.getByRole("button", { name: "Sign in" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Readers’ list", exact: true }))
    .toHaveAttribute("href", "/readers");

  await page.getByRole("button", { name: "Member sign-in", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
});

test("while the list is closed, the header offers the book instead of a closed door", async ({ page }) => {
  await page.route("**/v1/readers/status", (route) => route.fulfill({
    json: { available: false },
  }));
  await page.goto("/");

  const header = page.locator('header[aria-label="Site Header"]');
  await expect(header.getByRole("link", { name: "Book One", exact: true }))
    .toHaveAttribute("href", "/book/digital-organism-theory");
  await expect(header.getByRole("link", { name: "Readers’ list", exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Sign in" })).toHaveCount(0);
});

test("a reader-list outage is not presented as a closed list", async ({ page }) => {
  await page.route("**/v1/readers/status", (route) => route.abort());
  await page.goto("/readers");

  const error = page.getByRole("alert");
  await expect(error).toContainText("The reader list could not be reached.");
  await expect(error.getByRole("link", { name: CONTACT.label, exact: true }))
    .toHaveAttribute("href", CONTACT.href);
  await expect(page.getByRole("heading", { name: "The list is not open yet." })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("reader signup requires a correct code and never requests membership", async ({ page }) => {
  const sent: Array<{ path: string; body: unknown }> = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/v1/")) {
      sent.push({ path: new URL(request.url()).pathname, body: request.postDataJSON() });
    }
  });
  await page.route("**/v1/readers/status", (route) => route.fulfill({
    json: { available: true },
  }));
  await page.route("**/v1/readers/subscribe", (route) => route.fulfill({
    json: { status: "ok", expires_in: 900 },
  }));
  await page.route("**/v1/readers/confirm", (route) => route.fulfill(
    route.request().postDataJSON().code === "123456"
      ? { json: { status: "ok", unsubscribe_token: TOKEN } }
      : { status: 400, json: { detail: "Incorrect code. 4 attempts left." } },
  ));
  await page.goto("/readers");
  await page.getByRole("textbox", { name: "Email address" }).fill(EMAIL);
  await page.getByRole("button", { name: "Send me a code" }).click();

  const code = page.getByRole("textbox", { name: "Confirmation code" });
  await expect(code).toBeVisible();
  await expect(page.getByRole("heading", { name: "You will hear when there is more." })).toHaveCount(0);
  await expect(page.getByText("This is not membership and not a queue", { exact: false })).toBeVisible();
  await code.fill("000000");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Incorrect code. 4 attempts left.");
  await expect(page.getByRole("heading", { name: "You will hear when there is more." })).toHaveCount(0);

  await code.fill("123456");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "You will hear when there is more." })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("main")).toContainText("removes you in one click");
  expect(sent).toEqual([
    { path: "/v1/readers/subscribe", body: { email: EMAIL, source: "front" } },
    { path: "/v1/readers/confirm", body: { email: EMAIL, code: "000000" } },
    { path: "/v1/readers/confirm", body: { email: EMAIL, code: "123456" } },
  ]);
  await expectNoHorizontalOverflow(page);
});

for (const status of [204, 503]) {
  test(`leaving needs no sign-in or second confirmation and handles HTTP ${status}`, async ({ page }) => {
    const requests: string[] = [];
    const unsubscribe: unknown[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.route("**/v1/readers/unsubscribe", (route) => {
      unsubscribe.push(route.request().postDataJSON());
      return route.fulfill(
        status === 204
          ? { status }
          : { status, json: { detail: "The reader list is unavailable." } },
      );
    });
    await page.goto(`/readers/leave#${TOKEN}`);

    await expect(page.getByRole("heading", {
      name: status === 204 ? "You have left the reader list." : "That did not go through.",
      exact: true,
    })).toBeVisible();
    await expect(page).toHaveURL("/readers/leave");
    expect(unsubscribe).toEqual([{ token: TOKEN }]);
    expect(requests.every((url) => !url.includes(TOKEN))).toBe(true);
    await expect(page.getByRole("textbox")).toHaveCount(0);
    if (status === 503) {
      await expect(page.getByRole("link", { name: CONTACT.label, exact: true }))
        .toHaveAttribute("href", CONTACT.href);
    }
    await expectNoHorizontalOverflow(page);
  });
}
