import { expect, test } from "@playwright/test";
import {
  PUBLIC_ROUTES,
  collectPageProblems,
  expectNoHorizontalOverflow,
} from "./helpers";

test.describe("public routes", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} renders without runtime errors or sideways scroll`, async ({
      page,
    }) => {
      const problems = collectPageProblems(page);

      await page.goto(route.path);
      await expect(page.locator("h1").first()).toBeVisible();
      await page.waitForLoadState("networkidle");

      await expectNoHorizontalOverflow(page);
      expect(problems, `${route.path} logged errors`).toEqual([]);
    });
  }
});

test.describe("hero", () => {
  test("renders the proposition, the architecture figure and both actions", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator(".home-hero-statement")).toBeVisible();
    await expect(page.locator(".home-hero-architecture svg")).toBeVisible();

    const actions = page.getByRole("navigation", { name: "Begin exploring Book One" });
    await expect(actions.getByRole("link", { name: "Read Book One" })).toBeVisible();
    await expect(actions.getByRole("link", { name: "Concept map" })).toBeVisible();
  });

  test("the architecture figure keeps its label rail inside the viewBox", async ({
    page,
  }) => {
    await page.goto("/");
    const svg = page.locator(".home-hero-architecture__svg");
    await expect(svg).toHaveAttribute("viewBox", "30 0 830 700");

    // Labels drawn past the right edge silently disappear; the earlier rail at
    // x=576 collided with the outer circle, so the position is load-bearing.
    const labelOverflow = await svg.evaluate((node) => {
      const viewBoxRight = 30 + 830;
      return [...node.querySelectorAll("text")].filter((text) => {
        const x = Number(text.getAttribute("x") ?? "0");
        return x < 30 || x > viewBoxRight;
      }).length;
    });
    expect(labelOverflow).toBe(0);
  });
});

test.describe("book reader", () => {
  test("renders prose and lets a reader move to the next section", async ({ page }) => {
    await page.goto("/book/digital-organism-theory/preface");

    const prose = page.locator(".book-prose").first();
    await expect(prose).toBeVisible();
    expect((await prose.innerText()).length).toBeGreaterThan(400);
  });
});
