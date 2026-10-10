import { expect, test, type Page } from "@playwright/test";
import { HERO_CONCEPTS } from "../src/blocks/core/home/heroData";
import { expectNoHorizontalOverflow } from "./helpers";

const TOTAL = HERO_CONCEPTS.length;
const PENULTIMATE = HERO_CONCEPTS[TOTAL - 2];

/** The title types at 35 ms a character, then the passage at 20 ms. */
const typingTime = (concept: { term: string; text: string }) =>
  concept.term.length * 35 + concept.text.length * 20 + 400;

/** Each typed character schedules the next timer only after React commits, so step the clock. */
async function runUntil(page: Page, done: () => Promise<boolean>) {
  await expect.poll(async () => {
    if (await done()) return true;
    await page.clock.runFor(2_000);
    return done();
  }, { intervals: [10], timeout: 30_000 }).toBe(true);
}

test("still concepts visibly explain every idea without clipping or shifting the reading action", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const concepts = page.getByRole("region", { name: "Key concepts from Book One" });
  const previous = concepts.getByRole("button", { name: "Previous concept" });
  const next = concepts.getByRole("button", { name: "Next concept" });
  const read = page.getByRole("navigation", { name: "Begin exploring DOT" })
    .getByRole("link", { name: "Question what you know", exact: true });
  const opening = await read.boundingBox();
  expect(opening).not.toBeNull();
  await expect(read).toBeInViewport({ ratio: 1 });
  const openingDocumentY = opening!.y + await page.evaluate(() => window.scrollY);
  await expect(previous).toBeDisabled();

  for (const [index, concept] of HERO_CONCEPTS.entries()) {
    const slide = concepts.getByRole("group", { name: `${index + 1} of ${TOTAL}` });
    await expect(slide.getByRole("heading", { name: concept.term, exact: true })).toHaveText(concept.term);
    await expect(slide.getByText(concept.text, { exact: true })).toBeVisible();
    await expect(slide).toHaveAttribute("data-epistemic-status", concept.level);
    await expect(slide).toHaveAttribute("aria-live", "polite");
    const fits = await slide.locator("h2, p").evaluateAll(elements => elements.every(element => {
      const box = element.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].every(rect =>
        rect.left >= box.left - 1 && rect.right <= box.right + 1 &&
        rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1);
    }));
    expect(fits, `${concept.term}: the complete title and explanation must fit`).toBe(true);
    const position = await read.boundingBox();
    expect(position).not.toBeNull();
    // Focusing controls below the fold can scroll the page; compare document
    // coordinates so that normal keyboard scrolling is not a layout shift.
    const documentY = position!.y + await page.evaluate(() => window.scrollY);
    expect(Math.abs(documentY - openingDocumentY), "Changing concepts must not move the reading action").toBeLessThanOrEqual(1);
    if (index < HERO_CONCEPTS.length - 1) {
      await next.focus();
      await page.keyboard.press("Enter");
    }
  }
  await expect(next).toBeDisabled();
  await previous.focus();
  await page.keyboard.press("Enter");
  await expect(concepts.getByRole("heading", { name: PENULTIMATE.term, exact: true })).toBeVisible();
  await expect(concepts.getByRole("group", { name: `${TOTAL - 1} of ${TOTAL}` }))
    .toHaveAttribute("data-epistemic-status", PENULTIMATE.level);
  await expectNoHorizontalOverflow(page);
});

test("autoplay explains the concepts once, then stops without looping or announcing automatic updates", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const concepts = page.getByRole("region", { name: "Key concepts from Book One" });
  await concepts.scrollIntoViewIfNeeded();
  await expect(concepts).toHaveAttribute("data-playback", "playing");
  await page.clock.runFor(typingTime(HERO_CONCEPTS[0]));
  await expect(concepts.getByRole("heading", { name: "The Digital Organism" }))
    .toHaveText("The Digital Organism");
  await expect(concepts.getByRole("group", { name: `1 of ${TOTAL}` })).toHaveAttribute("aria-live", "off");
  await page.clock.fastForward(6_000);
  await expect(concepts.getByRole("group", { name: `1 of ${TOTAL}` })).toBeVisible();
  await page.clock.fastForward(2_000);
  await expect(concepts.getByRole("group", { name: `2 of ${TOTAL}` })).toBeVisible();
  for (const [index, concept] of HERO_CONCEPTS.entries()) {
    if (index === 0 || index === HERO_CONCEPTS.length - 1) continue;
    const slide = concepts.getByRole("group", { name: `${index + 1} of ${TOTAL}` });
    await expect(slide).toBeVisible();
    await runUntil(page, async () => await slide.locator(".home-concept-slideshow-untyped").count() === 0);
    await expect(concepts.getByRole("heading", { name: concept.term })).toHaveText(concept.term);
    const next = concepts.getByRole("group", { name: `${index + 2} of ${TOTAL}` });
    await runUntil(page, () => next.isVisible());
  }
  await expect(concepts).toHaveAttribute("data-playback", "complete");
  await expect(concepts.getByRole("heading", { name: "The Limit of Knowledge" }))
    .toHaveText("The Limit of Knowledge");
  await expect(concepts.getByRole("button", { name: "Concept introduction complete" })).toBeDisabled();
  await expect(concepts.getByRole("button", { name: "Next concept" })).toBeDisabled();
  await page.clock.fastForward(90_000);
  await expect(concepts.getByRole("group", { name: `${TOTAL} of ${TOTAL}` })).toBeVisible();
});

test("Pause and Play work with pointer focus, and manual paging stays paused", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const concepts = page.getByRole("region", { name: "Key concepts from Book One" });
  await concepts.scrollIntoViewIfNeeded();
  await expect(concepts).toHaveAttribute("data-playback", "playing");
  await page.clock.runFor(1_000);
  await concepts.getByRole("button", { name: "Pause concept introduction" }).click();
  await expect(concepts.getByRole("button", { name: "Play concept introduction" })).toBeVisible();
  await page.clock.fastForward(90_000);
  await expect(concepts.getByRole("group", { name: `1 of ${TOTAL}` })).toBeVisible();
  await concepts.getByRole("button", { name: "Next concept" }).click();
  await page.clock.fastForward(90_000);
  await expect(concepts.getByRole("group", { name: `2 of ${TOTAL}` })).toBeVisible();
  await concepts.getByRole("button", { name: "Play concept introduction" }).click();
  await concepts.scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Explore the model", exact: true }).hover();
  await expect(concepts).toHaveAttribute("data-playback", "playing");
  await page.clock.fastForward(8_100);
  await expect(concepts.getByRole("group", { name: `3 of ${TOTAL}` })).toBeVisible();
});

test("hover and leaving the hero suspend autoplay instead of consuming unread concepts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Touch has no reading hover.");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const concepts = page.getByRole("region", { name: "Key concepts from Book One" });
  await concepts.scrollIntoViewIfNeeded();
  await expect(concepts).toHaveAttribute("data-playback", "playing");
  await page.clock.runFor(typingTime(HERO_CONCEPTS[0]));
  await concepts.hover();
  await expect(concepts).toHaveAttribute("data-playback", "paused");
  await page.clock.fastForward(90_000);
  await expect(concepts.getByRole("group", { name: `1 of ${TOTAL}` })).toBeVisible();
  await page.mouse.move(0, 0);
  await page.locator("#little-c").scrollIntoViewIfNeeded();
  await expect(concepts).toHaveAttribute("data-playback", "paused");
  await page.clock.fastForward(90_000);
  await expect(concepts.getByRole("group", { name: `1 of ${TOTAL}` })).toBeVisible();
  await concepts.scrollIntoViewIfNeeded();
  await expect(concepts).toHaveAttribute("data-playback", "playing");
  await page.clock.fastForward(7_900);
  await expect(concepts.getByRole("group", { name: `1 of ${TOTAL}` })).toBeVisible();
  await page.clock.fastForward(200);
  await expect(concepts.getByRole("group", { name: `2 of ${TOTAL}` })).toBeVisible();
});

test("Consciousness 101 follows Little c and leads to inquiry or its book source", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const purpose = page.getByRole("region", { name: "Consciousness 101" });
  await expect(purpose).toBeVisible();
  const order = await page.locator("#little-c, #consciousness-101, #choose-path")
    .evaluateAll(sections => sections.map(section => section.id));
  expect(order).toEqual(["little-c", "consciousness-101", "choose-path"]);
  await page.locator("#little-c").getByRole("link", { name: /Continue to Consciousness 101/ }).click();
  await expect(page).toHaveURL(/#consciousness-101$/);
  await expect(purpose.getByRole("heading", { name: "Consciousness 101", exact: true })).toBeVisible();
  await expect(purpose.getByText("Love and relationships", { exact: true })).toBeVisible();
  await expect(purpose.getByText(/In DOT, the purpose of Little c/)).toBeVisible();
  await expect(purpose.getByRole("link", { name: /Read and inquire/ }))
    .toHaveAttribute("href", "#choose-path");
  await expect(page.getByRole("navigation", { name: "On this page", includeHidden: true })
    .getByRole("link", { name: "Consciousness 101: Love and relationships", includeHidden: true }))
    .toHaveAttribute("href", "#consciousness-101");
  await expectNoHorizontalOverflow(page);
  await purpose.getByRole("link", { name: "Book One · Love Must Become Operational" }).click();
  await expect(page.getByRole("heading", { name: "Love Must Become Operational", exact: true })).toBeVisible();
});
