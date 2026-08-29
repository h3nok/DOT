import { expect, test } from "@playwright/test";
import { PUBLIC_ROUTES, htmlAttribute } from "./helpers";

/**
 * Runtime companions to src/test/manifesto-laws.test.ts. Source greps cannot see
 * what the built page actually loads or asks for at run time; these can.
 */
test.describe("attention laws at runtime", () => {
  test("no member surface talks to a third party (L9)", async ({ page }) => {
    const foreign = new Set<string>();

    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol === "data:" || url.protocol === "blob:") return;
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;
      foreign.add(url.hostname);
    });

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");
    }

    expect(
      [...foreign],
      "third-party requests are forbidden in member surfaces (ADR-0004)",
    ).toEqual([]);
  });

  test("nothing asks for notification permission (L4)", async ({ page }) => {
    await page.addInitScript(() => {
      const scope = window as unknown as Record<string, unknown>;
      scope.__notificationRequested = false;
      // Reached by string key so this guard does not itself trip the lint rule
      // that bans the global outright.
      const api = scope["Notification"] as { requestPermission?: unknown } | undefined;
      if (api) {
        api.requestPermission = () => {
          scope.__notificationRequested = true;
          return Promise.resolve("denied");
        };
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const requested = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__notificationRequested,
    );
    expect(requested).toBe(false);
  });
});

test.describe("stillness is honoured", () => {
  test("the hero settles instead of animating, and stays readable", async ({ page }) => {
    // Set explicitly: fixture-level reducedMotion did not reach matchMedia here.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const statement = page.locator(".home-hero-statement");
    await expect(statement).toBeVisible();
    await expect.poll(() => htmlAttribute(page, "data-motion")).toBe("still");

    // Entry transitions are fine and self-terminating; perpetual motion is not.
    const looping = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          return animation.playState === "running" && timing?.iterations === Infinity;
        }).length,
    );
    expect(looping, "looping animations survived prefers-reduced-motion").toBe(0);

    // Reduced motion must not mean reduced content.
    expect((await statement.innerText()).trim().length).toBeGreaterThan(20);
  });
});
