import { expect, test, type Page } from "@playwright/test";

const API = "https://auth.example.test";
const member = { id: "owner-browser-fixture", display_name: "Fixture", role: "owner", is_owner: true };

async function mockCrossSiteAuth(page: Page, keepSession: boolean) {
  // Use the real fetch credential rules against a fictional HTTPS API. Every
  // API request is intercepted; no email or production account is involved.
  await page.addInitScript(api => {
    const original = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (typeof input === "string") {
        const url = new URL(input, location.href);
        if (url.pathname.startsWith("/v1/")) return original(`${api}${url.pathname}${url.search}`, init);
      }
      return original(input, init);
    };
  }, API);
  await page.route(`${API}/**`, async route => {
    const request = route.request();
    const headers = await request.allHeaders();
    const cors = {
      "Access-Control-Allow-Origin": headers.origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const path = new URL(request.url()).pathname;
    const signedIn = (headers.cookie || "").includes("dot_session=opaque-browser-fixture");
    if (path === "/v1/auth/otp/request") return route.fulfill({ headers: cors, json: { expires_in: 600 } });
    if (path === "/v1/auth/otp/verify") return route.fulfill({
      headers: { ...cors, "Set-Cookie": `dot_session=opaque-browser-fixture; Path=/; HttpOnly; Secure; SameSite=${keepSession ? "None; Partitioned" : "Lax"}` },
      json: { user: member },
    });
    if (path === "/v1/auth/session") return route.fulfill({ headers: cors, json: { user: signedIn ? member : null } });
    if (path === "/v1/auth/logout") return route.fulfill({
      headers: { ...cors, "Set-Cookie": "dot_session=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0" },
      json: { ok: true },
    });
    if (path === "/v1/contact/inbox") return route.fulfill({
      headers: cors, status: signedIn ? 200 : 401,
      json: signedIn ? { messages: [], page: 1, has_more: false } : { detail: "Sign in required" },
    });
    return route.fulfill({ headers: cors, status: 404, json: { detail: "Unexpected fixture request" } });
  });
}

async function enterCode(page: Page) {
  await page.goto("/studio/inbox");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("textbox", { name: "Email address" }).fill("owner@example.test");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "One-time code" }).fill("123456");
  await page.getByRole("dialog", { name: "Enter your code" }).getByRole("button", { name: "Sign in", exact: true }).click();
}

test("a cross-site cookie keeps the owner signed in after verification and reload", async ({ page }) => {
  await mockCrossSiteAuth(page, true);
  await enterCode(page);
  await expect(page.getByText("No messages yet.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Show conversations" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0);

  await page.evaluate(async api => {
    await fetch(`${api}/v1/auth/logout`, { method: "POST", credentials: "include" });
  }, API);
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
});

test("a rejected cookie shows a recoverable error instead of reloading to sign-in", async ({ page }) => {
  await mockCrossSiteAuth(page, false);
  let navigations = 0;
  page.on("request", request => { if (request.isNavigationRequest()) navigations += 1; });
  await enterCode(page);
  await expect(page.getByRole("alert")).toContainText("Your code was accepted, but sign-in did not complete");
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveValue("owner@example.test");
  await expect(page.getByRole("textbox", { name: "One-time code" })).toHaveCount(0);
  expect(navigations).toBe(1);
});
