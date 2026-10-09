import { expect, test } from "@playwright/test";

test("native project intake keeps a failed draft and receives a retry once", async ({ page }) => {
  await page.route("**/v1/contact/status", route => route.fulfill({ json: { available: true } }));
  const submissions: Array<{ key: string; body: Record<string, unknown> }> = [];
  await page.route("**/v1/contact/messages", route => {
    submissions.push({ key: route.request().headers()["idempotency-key"], body: route.request().postDataJSON() });
    return route.fulfill(submissions.length === 1 ? { status: 503, json: { detail: "Please try again. Your message is still here." } } : { status: 201, json: { status: "received", reference: "inq_browser_test" } });
  });
  await page.goto("/contact?purpose=project");
  await expect(page.getByRole("radio", { name: /Discuss a project/ })).toBeChecked();
  await page.getByRole("textbox", { name: "Your name" }).fill("Example visitor");
  await page.getByRole("textbox", { name: "Email address" }).fill("visitor@example.org");
  await page.getByRole("textbox", { name: "Your message" }).fill("I would like to discuss building a digital product.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("alert")).toContainText("Your message is still here");
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveValue("I would like to discuss building a digital product.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByRole("heading", { name: "Your message was received." })).toBeFocused();
  expect(submissions).toHaveLength(2);
  expect(submissions[0].key).toBe(submissions[1].key);
  expect(submissions[1].body.purpose).toBe("project");
  await expect(page.getByText("inq_browser_test")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("contact failure offers email without collecting details", async ({ page }) => {
  await page.route("**/v1/contact/status", route => route.fulfill({ json: { available: false } }));
  await page.goto("/contact?purpose=privacy");
  await expect(page.getByRole("heading", { name: "Please use email for now." })).toBeVisible();
  await expect(page.getByRole("link", { name: "henok@sullix.com" })).toHaveAttribute("href", "mailto:henok@sullix.com");
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("private inbox offers sign-in without requesting private messages anonymously", async ({ page }) => {
  await page.route("**/v1/auth/session", route => route.fulfill({ json: { user: null } }));
  let opened = false;
  await page.route("**/v1/contact/inbox**", route => { opened = true; return route.fulfill({ status: 401, json: {} }); });
  await page.goto("/studio/inbox");
  await expect(page.getByRole("heading", { name: "Contact inbox", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Sign in", exact: true })).toBeVisible();
  expect(opened).toBe(false);
});

test("private inbox refuses a member session", async ({ page }) => {
  await page.route("**/v1/auth/session", route => route.fulfill({ json: { user: { id: "member_123", display_name: "Member", role: "member", is_owner: false } } }));
  let opened = false;
  await page.route("**/v1/contact/inbox**", route => { opened = true; return route.fulfill({ status: 403, json: {} }); });
  await page.goto("/studio/inbox");
  await expect(page.getByRole("heading", { name: "Owner workspace" })).toBeVisible();
  expect(opened).toBe(false);
});

test("owner reads a message, retries a reply, and explicitly confirms deletion", async ({ page }) => {
  await page.route("**/v1/auth/session", route => route.fulfill({ json: { user: { id: "member_owner", display_name: "Henok", role: "owner", is_owner: true } } }));
  const item = { id: "inq_owner", purpose: "project", name: "Example visitor", email: "visitor@example.org", message: "Please help build a useful product.", organization: "", timeline: "", budget: "", status: "new", notification_status: "accepted", created_at: "2026-10-09T12:00:00Z", replies: [] as Array<Record<string, unknown>> };
  let deleted = false;
  const keys: string[] = [];
  await page.route("**/v1/contact/inbox**", route => {
    const request = route.request();
    if (request.method() === "DELETE") { deleted = true; return route.fulfill({ status: 204 }); }
    if (request.method() === "POST") {
      keys.push(request.headers()["idempotency-key"]);
      item.replies = [{ id: "reply_1", message: request.postDataJSON().message, status: keys.length === 1 ? "failed" : "sent", submission_key: keys[0], created_at: item.created_at }];
      return route.fulfill({ json: { id: "reply_1", status: keys.length === 1 ? "failed" : "sent" } });
    }
    if (new URL(request.url()).pathname.endsWith("inq_owner")) return route.fulfill({ json: item });
    return route.fulfill({ json: { messages: deleted ? [] : [item], page: 1, has_more: false } });
  });
  await page.goto("/studio/inbox");
  await page.getByRole("link", { name: /Example visitor/ }).click();
  await page.getByRole("textbox", { name: "Your reply" }).fill("Thank you for the context. Let's discuss scope.");
  await page.getByRole("button", { name: "Send reply by email" }).click();
  await expect(page.getByRole("alert")).toContainText("could not be confirmed");
  await page.getByRole("button", { name: "Retry this reply" }).click();
  await expect(page.getByRole("status")).toContainText("accepted for email delivery");
  expect(keys[0]).toBe(keys[1]);
  await page.getByRole("button", { name: "Delete conversation…" }).click();
  expect(deleted).toBe(false);
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("No messages yet.", { exact: false })).toBeVisible();
  expect(deleted).toBe(true);
});
