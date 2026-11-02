import { expect, test, type Page } from "@playwright/test";

async function paintedPalette(page: Page) {
  return page.locator(".dark-film-player").evaluate((player) => {
    const style = (selector: string) => getComputedStyle(player.querySelector(selector)!);
    return {
      picture: style(".dark-film-frame").backgroundImage,
      caption: style(".dark-trailer-line").color,
      figure: style('.dark-trailer-drawing [stroke="#f2f0e8"]').stroke,
      controls: style(".films-transport-shell").backgroundColor,
      controlInk: style(".films-transport-time").color,
    };
  });
}

test("the film's own address opens on the film, waiting for Play", async ({ page }) => {
  await page.goto("/film");
  await expect(page.getByRole("heading", { level: 1, name: "Book One, concept by concept" })).toBeVisible();
  const play = page.getByRole("button", { name: /^Play Book One, concept by concept/ });
  await expect(play).toBeVisible();
  await expect(page.getByRole("slider", { name: "Seek timeline in seconds" })).toHaveValue("0");
  await expect(page.getByRole("slider", { name: "Seek timeline in seconds" })).toHaveAttribute("max", "785");
  await expect(page.locator('[data-trailer-shot="normal"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "After the film" }).getByRole("link", { name: "Read Book One" }))
    .toHaveAttribute("href", "/book/digital-organism-theory");
  await expect(page).toHaveTitle(/^Book One, concept by concept — /);
});

test("the revised title stays readable in either theme with reduced motion", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const theme of ["light", "dark"]) {
    await page.goto("/film");
    await page.evaluate(value => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(value);
      document.documentElement.setAttribute("data-theme", value);
    }, theme);
    const timeline = page.getByRole("slider", { name: "Seek timeline in seconds" });
    await expect(page.getByRole("button", { name: "Typewriter sound" })).toHaveCount(0);
    await timeline.fill("479");
    const title = page.locator(".dark-trailer-title");
    const subtitle = page.locator(".dark-trailer-subtitle");
    await expect(title).toHaveText(/Digital Organism Theory/);
    await expect(subtitle).toHaveText(/A school of thought for examining experience/);
    const titleBox = (await title.boundingBox())!;
    const subtitleBox = (await subtitle.boundingBox())!;
    const architectureBox = (await page.locator(".dark-trailer-arch .home-hero-architecture__svg").boundingBox())!;
    expect(architectureBox.width).toBeGreaterThan(100);
    expect(architectureBox.height).toBeGreaterThan(100);
    expect(architectureBox.y + architectureBox.height).toBeLessThan(titleBox.y);
    expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(subtitleBox.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.locator(".dark-film-player").screenshot({ path: testInfo.outputPath(`revised-film-${theme}.png`) });
  }
});

test("the picture and controls follow the reader's theme without restarting the film", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/film");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const timeline = page.getByRole("slider", { name: "Seek timeline in seconds" });
  await timeline.fill("74");
  const light = await paintedPalette(page);

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const property of Object.keys(light) as (keyof typeof light)[]) {
    await expect.poll(async () => (await paintedPalette(page))[property], property).not.toBe(light[property]);
  }
  await expect(timeline).toHaveValue("74");
  await expect(page.getByRole("button", { name: "Play film", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Play film", exact: true }).click();
  await expect.poll(async () => Number(await timeline.inputValue())).toBeGreaterThan(74.1);
  const beforeSwitch = Number(await timeline.inputValue());
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Pause film", exact: true })).toBeVisible();
  expect(Number(await timeline.inputValue())).toBeGreaterThanOrEqual(beforeSwitch);
  await page.getByRole("button", { name: "Pause film", exact: true }).click();
  await expect.poll(async () => (await paintedPalette(page)).picture).toBe(light.picture);
});

test("transport controls remain separate touch targets, including on a narrow phone", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/film");
  const player = page.locator(".dark-film-player");
  await expect(player.getByRole("button", { name: "Typewriter sound" })).toBeVisible();
  const targets = await player.locator(".films-transport-btn").evaluateAll((buttons) => buttons.map((button) => {
    const { x, y, width, height } = button.getBoundingClientRect();
    return { label: button.getAttribute("aria-label"), x, y, width, height };
  }));
  expect(targets.length).toBeGreaterThanOrEqual(5);
  for (const [index, target] of targets.entries()) {
    expect(target.width, `${target.label} width`).toBeGreaterThanOrEqual(44);
    expect(target.height, `${target.label} height`).toBeGreaterThanOrEqual(44);
    for (const other of targets.slice(index + 1)) {
      const overlapX = Math.min(target.x + target.width, other.x + other.width) - Math.max(target.x, other.x);
      const overlapY = Math.min(target.y + target.height, other.y + other.height) - Math.max(target.y, other.y);
      expect(overlapX > 1 && overlapY > 1, `${target.label} overlaps ${other.label}`).toBe(false);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
