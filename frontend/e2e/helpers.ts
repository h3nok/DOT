import { expect, type Page } from "@playwright/test";

/** Every public route, as a route-under-test plus a human name for the report. */
export const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/academy", name: "academy" },
  { path: "/doctrine", name: "doctrine" },
  { path: "/applied", name: "applied" },
  { path: "/join", name: "join" },
  { path: "/support", name: "support" },
  { path: "/studio", name: "studio" },
  { path: "/book/digital-organism-theory", name: "book landing" },
  { path: "/book/digital-organism-theory/preface", name: "book section" },
] as const;

/**
 * Noise the dev server emits that says nothing about product health.
 * Keep this list short — anything added here is a blind spot.
 */
const IGNORED_CONSOLE = [
  /favicon/i,
  /manifest\.json/i,
  /service ?worker/i,
  /sw\.js/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  // This suite runs the frontend alone, so orchestrator calls are expected to
  // fail. That the pages still render is the point, not an accident to hide.
  /:8000/,
  /\/v1\//,
  /net::ERR_FAILED/,
];

export function collectPageProblems(page: Page) {
  const problems: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (IGNORED_CONSOLE.some((pattern) => pattern.test(text))) return;
    problems.push(`console: ${text}`);
  });

  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`);
  });

  return problems;
}

/**
 * A page that scrolls sideways is broken on every phone, but reads fine on the
 * desktop the author used. 1px of slack absorbs sub-pixel layout rounding.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth };
  });
  expect(
    overflow.scrollWidth,
    `document scrolls sideways: ${overflow.scrollWidth}px of content in ${overflow.clientWidth}px`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

export function htmlAttribute(page: Page, name: string) {
  return page.evaluate((attr) => document.documentElement.getAttribute(attr), name);
}

export function cssVariable(page: Page, name: string) {
  return page.evaluate(
    (variable) =>
      getComputedStyle(document.documentElement).getPropertyValue(variable).trim(),
    name,
  );
}

export async function openAppearancePanel(page: Page) {
  await page.getByRole("button", { name: "Appearance settings" }).click();
  const panel = page.locator(".appearance-panel");
  await expect(panel).toBeVisible();
  return panel;
}
