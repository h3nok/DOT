import { expect, test, type Locator } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

async function thumbControl(control: Locator) {
  await expect(control).toBeVisible();
  const box = await control.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
}

test.beforeEach(async ({ page, isMobile }) => {
  // Cover the smallest supported phone and a larger phone in the two projects.
  await page.setViewportSize({ width: isMobile ? 320 : 430, height: 640 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
});

test("phone navigation opens deliberately, dismisses, routes, and yields to desktop navigation", async ({ page }) => {
  await page.goto("/blog");
  const menu = page.getByRole("button", { name: "Menu", exact: true });
  await thumbControl(menu);
  await menu.click();
  const panel = page.getByRole("dialog", { name: "Site navigation" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("link")).toHaveCount(6);
  await expect(panel.getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("aria-current", "page");
  for (const link of await panel.getByRole("link").all()) await thumbControl(link);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(menu).toBeFocused();
  await menu.click();
  await panel.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL("/contact");
  await expect(panel).toHaveCount(0);
  await menu.click();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(panel).toHaveCount(0);
  await expect(menu).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Contact", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("phone intake uses a native purpose selector and preserves the draft when purpose changes", async ({ page }) => {
  await page.route("**/v1/contact/status", route => route.fulfill({ json: { available: true } }));
  await page.goto("/contact?purpose=project");
  const purpose = page.getByRole("combobox", { name: "What brings you here?" });
  await expect(purpose).toHaveValue("project");
  const name = page.getByRole("textbox", { name: "Your name" });
  await expect(name).toBeInViewport();
  await name.fill("Example builder");
  const message = page.getByRole("textbox", { name: "Your message" });
  await message.fill("A draft that should survive a change of purpose.");
  await purpose.selectOption("writing");
  await expect(page.getByRole("textbox", { name: "Timeline" })).toHaveCount(0);
  await expect(message).toHaveValue("A draft that should survive a change of purpose.");
  await expect(name).toHaveValue("Example builder");
  await purpose.selectOption("project");
  await expect(page.getByRole("textbox", { name: "Timeline" })).toBeVisible();
  for (const field of await page.getByRole("textbox").all()) {
    expect(await field.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
  }
  // Exactly one visible appearance control; none covers the form.
  await expect(page.getByRole("button", { name: "Appearance settings" })).toHaveCount(1);
  await thumbControl(page.getByRole("button", { name: "Send message" }));
  await expectNoHorizontalOverflow(page);
});

test("Book One starts above the phone fold and its contents remain usable on a short screen", async ({ page }) => {
  await page.goto("/book/digital-organism-theory");
  const begin = page.getByRole("link", { name: "Begin with lived experience", exact: true });
  await expect(begin).toBeInViewport({ ratio: 1 });
  await thumbControl(begin);
  await begin.click();
  await expect(page).toHaveURL(/\/preface\?path=start-where-you-live/);
  const toolbar = page.locator(".book-chrome");
  for (const button of await toolbar.getByRole("button").all()) await thumbControl(button);
  await toolbar.getByRole("button", { name: "Open book contents" }).click();
  await page.setViewportSize({ width: 320, height: 400 });
  const contents = page.getByRole("dialog", { name: "The argument" });
  const close = contents.getByRole("button", { name: "Close contents" });
  await thumbControl(close);
  const finalSection = contents.locator('a[href*="/references"]').last();
  await finalSection.scrollIntoViewIfNeeded();
  await expect(finalSection).toBeInViewport();
  await expect(close).toBeInViewport({ ratio: 1 });
  await finalSection.click();
  await expect(contents).toHaveCount(0);
  await expect(page).toHaveURL(/\/references/);
  await expectNoHorizontalOverflow(page);
});

test("appearance fits a short phone viewport and larger high-contrast reading still reflows", async ({ page }) => {
  await page.goto("/book/digital-organism-theory/architecture-of-continuity");
  const trigger = page.getByRole("button", { name: "Appearance settings" });
  await trigger.click();
  await page.setViewportSize({ width: 320, height: 420 });
  const panel = page.getByRole("dialog", { name: "Appearance", exact: true });
  const close = panel.getByRole("button", { name: "Close appearance panel" });
  await thumbControl(close);
  await expect(close).toBeInViewport({ ratio: 1 });
  await panel.getByRole("tab", { name: "Reading", exact: true }).click();
  await panel.getByRole("button", { name: "Text size XL" }).click();
  await panel.getByRole("switch", { name: "High contrast" }).click();
  await expect(close).toBeInViewport({ ratio: 1 });
  await close.click();
  await expect(trigger).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expectNoHorizontalOverflow(page);
});

test("sign-in fields and recovery stay reachable when the phone viewport shrinks", async ({ page }) => {
  await page.route("**/v1/auth/session", route => route.fulfill({ json: { user: null } }));
  await page.route("**/v1/auth/otp/request", route => route.fulfill({ json: { expires_in: 600 } }));
  await page.goto("/studio/inbox");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const email = page.getByRole("textbox", { name: "Email address" });
  expect(await email.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
  await email.fill("a-long-owner-address@example.test");
  await page.setViewportSize({ width: 320, height: 360 });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Enter your code" });
  await expect(dialog.getByRole("textbox", { name: "One-time code" })).toBeVisible();
  const recovery = dialog.getByRole("button", { name: "Use a different email" });
  await recovery.scrollIntoViewIfNeeded();
  await thumbControl(recovery);
  const close = dialog.getByRole("button", { name: "Close", exact: true });
  await thumbControl(close);
  await expect(close).toBeInViewport({ ratio: 1 });
  await recovery.click();
  await expect(email).toHaveValue("a-long-owner-address@example.test");
  await page.getByRole("dialog", { name: "Sign in", exact: true }).getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("Minty's composer and dismissal stay inside a short phone viewport", async ({ page }) => {
  await page.goto("/book/digital-organism-theory/preface");
  const trigger = page.getByRole("button", { name: "Ask Minty about this book" });
  await trigger.click();
  await page.setViewportSize({ width: 320, height: 360 });
  const panel = page.getByRole("dialog", { name: "Minty, the DOT Companion" });
  const composer = panel.getByRole("textbox", { name: /Ask Minty about Digital Organism Theory/ });
  await expect(composer).toBeInViewport({ ratio: 1 });
  expect(await composer.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
  await composer.fill("A question kept as an unsent draft.");
  const close = panel.getByRole("button", { name: "Close", exact: true });
  await thumbControl(close);
  await expect(close).toBeInViewport({ ratio: 1 });
  await close.click();
  await expect(panel).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("phone panels follow keyboard viewport events without resizing for pinch zoom", async ({ page }) => {
  // Emulate a keyboard shrinking only the visible viewport, not page layout.
  await page.addInitScript(() => {
    const viewport = Object.assign(new EventTarget(), {
      height: innerHeight, width: innerWidth, offsetTop: 0, offsetLeft: 0, scale: 1,
    });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: viewport });
  });
  await page.goto("/book/digital-organism-theory/preface");
  await page.getByRole("button", { name: "Ask Minty about this book" }).click();
  const panel = page.getByRole("dialog", { name: "Minty, the DOT Companion" });
  await page.evaluate(() => {
    Object.assign(window.visualViewport!, { height: 360, offsetTop: 20 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
    window.visualViewport!.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(async () => (await panel.boundingBox())?.height).toBe(360);
  expect((await panel.boundingBox())?.y).toBe(20);
  const composer = panel.getByRole("textbox", { name: /Ask Minty about Digital Organism Theory/ });
  const box = await composer.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(380);
  await page.evaluate(() => {
    Object.assign(window.visualViewport!, { height: 180, scale: 2 });
    window.visualViewport!.dispatchEvent(new Event("resize"));
  });
  expect((await panel.boundingBox())?.height).toBe(360);
  await panel.getByRole("button", { name: "Close", exact: true }).click();
  await expect(panel).toHaveCount(0);
});

test("phone diagram destinations and footer links have distinct touch targets", async ({ page }) => {
  await page.goto("/");
  const map = page.getByRole("navigation", { name: "Read the diagram" });
  for (const link of await map.getByRole("link").all()) await thumbControl(link);
  await map.getByRole("link", { name: "Big C", exact: true }).click();
  await expect(page.locator("#big-c")).toBeInViewport();
  await page.goto("/about");
  const footer = page.getByRole("contentinfo");
  for (const link of await footer.getByRole("link").all()) await thumbControl(link);
  await footer.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL("/contact");
  await expectNoHorizontalOverflow(page);
});
