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
  test("keeps the opening reading order concise", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("#threshold");
    await expect(
      hero.getByRole("heading", { name: "The observer belongs in the inquiry." }),
    ).toBeVisible();
    await expect(hero.locator(".home-hero-proposition ul")).toHaveCount(0);
    const inquiry = hero.getByRole("textbox", {
      name: "Ask a question about Digital Organism Theory",
    });
    await expect(inquiry).toHaveCount(1);
    if ((page.viewportSize()?.width ?? 0) >= 800) {
      await expect(inquiry).toBeVisible();
    }
    await expect(page.locator(".home-journey-nav ol")).toHaveCount(0);

    const caption = await hero.locator("figcaption").textContent();
    expect(caption?.trim().split(/\s+/).length).toBeLessThanOrEqual(120);
  });

  test("renders the proposition, the architecture figure and both actions", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator(".home-hero-statement")).toBeVisible();
    await expect(page.locator(".home-hero-architecture svg")).toBeVisible();

    const actions = page.getByRole("navigation", { name: "Begin exploring DOT" });
    const academy = actions.getByRole("link", { name: "Preview the Academy" });
    await expect(academy).toBeVisible();
    await expect(academy).toHaveAttribute("href", "/academy");
    await expect(actions.getByRole("link", { name: "Read Book One" })).toBeVisible();
  });

  test("the architecture figure keeps its layer and awareness labels legible", async ({
    page,
  }) => {
    await page.goto("/");
    const svg = page.locator(".home-hero-architecture__svg");
    await expect(svg).toHaveAttribute("viewBox", "0 0 700 700");
    const labels = svg.locator(".home-architecture-ring-label");
    await expect(labels).toHaveCount(5);
    expect(await labels.locator("text").allTextContents()).toEqual([
      "T · E",
      "Big C",
      "RF0",
      "Your awarenessradius",
      "Little c",
    ]);
    await expect(labels.locator("rect")).toHaveCount(0);
    await expect(svg.locator(".home-architecture-organism-node")).toHaveCount(8);

    const presentation = await labels.evaluateAll((items) => {
      const boxes = items.map((item) => (item as SVGGraphicsElement).getBBox());
      const overlap = boxes.some((box, index) =>
        boxes.slice(index + 1).some(
          (other) =>
            box.left < other.right &&
            box.right > other.left &&
            box.top < other.bottom &&
            box.bottom > other.top,
        ),
      );
      const styles = items.map((item) => {
        const text = item.querySelector("text");
        const style = text ? getComputedStyle(text) : null;
        return {
          color: style?.fill ?? "",
          family: style?.fontFamily ?? "",
          transform: style?.textTransform ?? "",
          stroke: style?.stroke ?? "",
          strokeWidth: Number.parseFloat(style?.strokeWidth ?? "0"),
        };
      });

      return {
        overlap,
        distinctColors: new Set(styles.map(({ color }) => color)).size,
        families: styles.map(({ family }) => family),
        transforms: styles.map(({ transform }) => transform),
        knockouts: styles.map(({ stroke, strokeWidth }) => ({ stroke, strokeWidth })),
      };
    });

    expect(presentation.overlap).toBe(false);
    expect(presentation.distinctColors).toBeGreaterThanOrEqual(4);
    expect(presentation.families.every((family) => family.includes("Space Grotesk"))).toBe(
      true,
    );
    expect(presentation.transforms.every((transform) => transform === "none")).toBe(true);
    expect(
      presentation.knockouts.every(
        ({ stroke, strokeWidth }) => stroke !== "none" && strokeWidth >= 4,
      ),
    ).toBe(true);
  });

  test("theory panels guide the reader from known ground to an explicit boundary", async ({
    page,
  }) => {
    await page.goto("/");

    const cards = page.locator(".home-theory-layer-card");
    await expect(cards).toHaveCount(4);

    const argumentOpacity = await page
      .locator("#big-c, #epistemic-boundary, #choose-path")
      .evaluateAll((items) => items.map((item) => getComputedStyle(item).opacity));
    expect(argumentOpacity.every((opacity) => opacity === "1")).toBe(true);

    await expect(cards.nth(0).locator(".home-theory-layer-status")).toHaveText(
      "Starting assumption",
    );
    await expect(cards.nth(1).locator(".home-theory-layer-status")).toHaveText(
      "Proposed explanation",
    );
    await expect(cards.nth(2).locator(".home-theory-layer-status")).toHaveText(
      "Observed universe; proposed origin",
    );
    await expect(cards.first().getByText("What we know")).toBeVisible();
    await expect(cards.first().getByText("Covers: Earliest measurable physical states")).toBeVisible();
    await expect(cards.first().getByText("The open question")).toBeVisible();
    await expect(cards.first().getByText("DOT proposes")).toBeVisible();
    await expect(cards.first().getByText("Test boundary")).toBeVisible();
    await expect(cards.first().locator(".home-theory-layer-conventional svg")).toHaveCount(0);
    await expect(cards.first().locator(".home-theory-layer-inquiry-steps > section")).toHaveCount(3);
    await expect(cards.first().getByText("Independent evidence")).toBeVisible();
    await expect(cards.first().getByText("DOT · Book One")).toBeVisible();

    const realityFrame = page.locator("#reality-frame");
    await expect(
      realityFrame.getByRole("heading", { name: "RF₀ is exactly the physical universe." }),
    ).toBeVisible();
    await expect(realityFrame.getByText(/spacetime governed by fields and laws/)).toBeVisible();
    await expect(realityFrame.getByText(/generated rather than fundamental/)).toBeVisible();
    const memoryPath = realityFrame.locator(".home-theory-memory-path span");
    await expect(memoryPath).toHaveCount(4);
    await expect(
      realityFrame.locator('.home-theory-memory-path span[data-active="true"]'),
    ).toHaveText("Consequence");
    await expect(
      realityFrame.getByText("A generated world is still a consequential world."),
    ).toBeVisible();
    await expect(realityFrame.getByText("From consequence to choice")).toBeVisible();

    const labels = cards.first().locator(
      ".home-theory-layer-status, .home-theory-layer-comparison-label, .home-theory-layer-scope, .home-theory-layer-step-label",
    );
    const presentation = await labels.evaluateAll((items) =>
      items.map((item) => {
        const style = getComputedStyle(item);
        return {
          size: Number.parseFloat(style.fontSize),
          transform: style.textTransform,
        };
      }),
    );

    expect(presentation.every(({ size }) => size >= 12)).toBe(true);
    expect(presentation.every(({ transform }) => transform === "uppercase" || transform === "none")).toBe(true);
  });

  test("the evidence boundary separates support, hypothesis and method legibly", async ({
    page,
  }) => {
    await page.goto("/");

    const boundary = page.locator("#epistemic-boundary");
    await expect(
      boundary.getByRole("heading", { name: "The model must show where evidence ends." }),
    ).toBeVisible();
    await expect(boundary.getByText("Publicly grounded")).toBeVisible();
    await expect(boundary.getByText("Still proposed")).toBeVisible();
    await expect(boundary.getByText("Academy standard")).toBeVisible();
    await expect(boundary.getByText("Evidence", { exact: true })).toBeVisible();
    await expect(boundary.getByText("Hypothesis", { exact: true })).toBeVisible();

    const presentation = await boundary
      .locator(
        ".home-evidence-invitation, .home-evidence-claims dd, .home-evidence-standard p",
      )
      .evaluateAll((items) =>
        items.map((item) => {
          const style = getComputedStyle(item);
          return {
            color: style.color,
            opacity: Number.parseFloat(style.opacity),
            size: Number.parseFloat(style.fontSize),
          };
        }),
      );

    expect(presentation).toHaveLength(4);
    expect(presentation.every(({ opacity }) => opacity === 1)).toBe(true);
    expect(presentation.every(({ size }) => size >= 15)).toBe(true);
    expect(presentation.every(({ color }) => color !== "rgba(0, 0, 0, 0)")).toBe(true);

    if ((page.viewportSize()?.width ?? 0) >= 800) {
      const copyWidth = await boundary.locator(".home-reality-copy").evaluate((element) =>
        element.getBoundingClientRect().width,
      );
      expect(copyWidth).toBeGreaterThanOrEqual(700);
    }

    await expect(
      boundary.getByRole("link", { name: "Test the strongest objections" }),
    ).toBeVisible();
  });
});

test.describe("academy", () => {
  test("keeps living inquiry and the fixed publication visibly separate", async ({
    page,
  }) => {
    await page.goto("/academy");

    await expect(
      page.getByRole("heading", { name: "A new Academy, in the literal sense." }),
    ).toBeVisible();
    await expect(page.getByText(/a place to learn how to see/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Book One remains a book." })).toBeVisible();

    const programs = page.locator("#academy-programs");
    await expect(programs.locator(".academy-program-card")).toHaveCount(3);
    await expect(programs.locator(".academy-program-card__area-item")).toHaveCount(8);
    await expect(programs.getByText("Experiments", { exact: true })).toBeVisible();
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
