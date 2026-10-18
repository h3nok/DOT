import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, openAppearancePanel } from './helpers';
import AMM from '../src/content/amm.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/academy/delivery/catalog*', route => route.fulfill({ json: [] }));
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {} } }));
});

test('the open flame kindles, settles, and responds to keyboard focus without looping', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/amm');
  const brand = page.locator('.amm-brand');
  const mark = brand.locator('.amm-mark');
  await expect(mark).toBeVisible();
  await expect(mark).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(mark.locator('rect')).toHaveCount(0);
  const animations = () => mark.evaluate(node => node.getAnimations({ subtree: true }).map(animation => ({ state: animation.playState, iterations: animation.effect?.getTiming().iterations })));
  expect((await animations()).length).toBeGreaterThan(0);
  await expect.poll(async () => (await animations()).every(animation => animation.state === 'finished' && animation.iterations === 1)).toBe(true);
  await brand.focus();
  await expect(brand).toBeFocused();
  await expect(brand).toHaveCSS('outline-style', 'solid');
  await expect.poll(async () => (await animations()).some(animation => animation.state === 'running')).toBe(true);
  await expect.poll(async () => (await animations()).every(animation => animation.state === 'finished' && animation.iterations === 1)).toBe(true);
  await expectNoHorizontalOverflow(page);
  await page.goto('/amm/editions');
  await expect(page.locator('.amm-footer .amm-mark')).toBeVisible();
  // Multiple marks must resolve their own gradients, including the still footer.
  const gradients = await page.locator('.amm-mark linearGradient').evaluateAll(nodes => nodes.map(node => node.id));
  expect(gradients.length).toBeGreaterThanOrEqual(4);
  expect(new Set(gradients).size).toBe(gradients.length);
  expect(await page.locator('.amm-footer .amm-mark').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
});

for (const mode of ['system reduced motion', 'saved stillness', 'environment disabled'] as const) {
  test(`${mode} keeps the AMM flame still on entry and focus`, async ({ page }) => {
    if (mode === 'environment disabled') await page.addInitScript(() => localStorage.setItem('dot_organism', JSON.stringify({ enabled: false })));
    await page.emulateMedia({ reducedMotion: mode === 'system reduced motion' ? 'reduce' : 'no-preference' });
    await page.goto('/amm');
    await expect(page.locator('.amm-brand .amm-mark')).toBeVisible();
    if (mode === 'saved stillness') {
      const panel = await openAppearancePanel(page);
      await panel.locator('summary').filter({ hasText: 'Fine tune environment' }).click();
      await panel.getByRole('switch', { name: 'Hold the background still' }).click();
      await page.reload();
    }
    const brand = page.locator('.amm-brand');
    const mark = brand.locator('.amm-mark');
    await expect(mark).toBeVisible();
    await brand.focus();
    expect(await mark.evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(mark.locator('.amm-mark-core')).toHaveCSS('opacity', '1');
    await expect(page.locator('.amm-feature video')).toHaveCount(0);
  });
}

test('the hero separates its artwork and copy and offers one wide reading action', async ({ page }) => {
  await page.goto('/amm');
  const hero = page.locator('.amm-hero');
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText(AMM.headline.join(' '));
  await expect(hero.locator('.amm-home-premise')).toHaveText(AMM.home.premise);
  await expect(hero.getByRole('button', { name: 'Inspect The Host', exact: true })).toBeVisible();
  const action = hero.locator('.amm-hero-actions').getByRole('link');
  await expect(action).toHaveCount(1);
  const picture = await hero.locator('.amm-hero-visual').boundingBox();
  const copy = await hero.locator('.amm-hero-copy').boundingBox();
  const button = await action.boundingBox();
  if (page.viewportSize()!.width > 900) {
    expect(picture!.x).toBeGreaterThanOrEqual(copy!.x + copy!.width + 32);
    expect(button!.width).toBeGreaterThanOrEqual(320);
  } else {
    expect(button!.y).toBeGreaterThanOrEqual(picture!.y + picture!.height);
    expect(button!.width).toBeCloseTo(copy!.width, 0);
  }
  await expect(page.locator('main .amm-eyebrow')).toHaveCount(0);
  await expect(page.locator('main details')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await action.click();
  await expect(page).toHaveURL(/#amm-overview$/);
  await expect(page.getByRole('heading', { level: 2, name: AMM.home.overviewTitle })).toBeInViewport();
  await expect(page.locator('#amm-overview .amm-overview-claim')).toHaveText(AMM.home.overviewClaim);
  const source = page.locator('.amm-overview-source').getByRole('link', { name: AMM.home.overviewSource, exact: true });
  await expect(source).toHaveAttribute('href', '/essays/amm-chapter-two-the-leechs-anatomy');
  await source.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Chapter Two: The Leech’s Anatomy' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 2, name: AMM.home.overviewTitle })).toBeInViewport();
});

test('six concepts remain in reading order and the artwork follows the scene', async ({ page }) => {
  await page.goto('/amm');
  const overview = page.locator('#amm-overview');
  const steps = overview.locator('.explainer-story-steps > li');
  await expect(steps.locator('h3')).toHaveText(AMM.home.concepts.map(concept => `“${concept.script}”`));
  await expect(overview.getByRole('navigation')).toHaveCount(0);
  await expect(overview.getByRole('tab')).toHaveCount(0);
  await expect(overview.locator('.amm-concept-diagram')).toHaveCount(0);
  const art = overview.locator('.explainer-story-figure img');
  await expect(art).toHaveCount(1);
  await expect(overview.locator('.explainer-story-figure')).toBeVisible();
  for (const index of [1, 2, 4, 5]) {
    const step = steps.nth(index);
    await step.locator('h3').evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(step).toHaveAttribute('aria-current', 'step');
    await expect(step.locator('.amm-story-flame')).toBeVisible();
    await expect(step).toHaveCSS('border-left-width', '0px');
    await expect(art).toHaveAttribute('src', `/amm/media/${index < 4 ? 'host-at-home-v1' : 'erosion'}-1024.webp`);
    await expect.poll(() => art.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(step.locator('blockquote')).toContainText(AMM.home.concepts[index].argument);
    await expect(step.locator('cite')).toHaveText(AMM.home.concepts[index].source);
  }
  expect(await steps.first().locator('.explainer-story-kicker').evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16);
  await expectNoHorizontalOverflow(page);
});

for (const mode of ['system reduced motion', 'saved stillness', 'environment disabled'] as const) {
  test(`${mode} keeps the illustration and flame still while the argument changes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: mode === 'system reduced motion' ? 'reduce' : 'no-preference' });
    if (mode === 'environment disabled') await page.addInitScript(() => localStorage.setItem('dot_organism', JSON.stringify({ enabled: false })));
    await page.goto('/amm');
    await expect(page.locator('.amm-brand .amm-mark')).toBeVisible();
    if (mode === 'saved stillness') {
      const panel = await openAppearancePanel(page);
      await panel.locator('summary').filter({ hasText: 'Fine tune environment' }).click();
      await panel.getByRole('switch', { name: 'Hold the background still' }).click();
      await page.reload();
    }
    const step = page.locator('#amm-overview .explainer-story-steps > li').nth(4);
    await step.locator('h3').evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(step).toHaveAttribute('aria-current', 'step');
    expect(await page.locator('#amm-overview .explainer-story-figure').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
    expect(await step.locator('.amm-story-flame').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(page.locator('.amm-feature video')).toHaveCount(0);
  });
}

test('published opening, concept and chapter wording reaches the public page', async ({ page }) => {
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {
    'amm.home.premise': 'Published author introduction.',
    'amm.home.overviewclaim': 'Published author statement of the central argument.',
    'amm.home.overviewsource': 'Chapter One · Published overview source.',
    'amm.home.concepts.fear.text': 'Published author revision of fear.',
    'amm.home.concepts.fear.script': 'An edited cultural message.',
    'amm.home.concepts.fear.argument': 'Published author argument about fear.',
    'amm.home.concepts.fear.source': 'Published chapter source.',
    'amm.home.scenealt': 'Published description of the Host at home.',
    'amm.chaptersection.chapters.amm-chapter-two-the-leechs-anatomy.line': 'Published Chapter Two introduction.',
  } } }));
  await page.goto('/amm');
  await expect(page.locator('.amm-home-premise')).toHaveText('Published author introduction.');
  await expect(page.locator('#amm-overview .amm-overview-claim')).toHaveText('Published author statement of the central argument.');
  await expect(page.locator('.amm-overview-source').getByRole('link', { name: 'Chapter One · Published overview source.', exact: true })).toHaveAttribute('href', '/essays/amm-chapter-one-the-leech');
  await expect(page.getByText('Published author revision of fear.')).toBeVisible();
  await expect(page.getByText('Published Chapter Two introduction.')).toBeVisible();
  const step = page.locator('#amm-overview .explainer-story-steps > li').nth(1);
  await expect(step.locator('h3')).toHaveText('“An edited cultural message.”');
  await expect(step.locator('blockquote')).toContainText('Published author argument about fear.');
  await expect(step.locator('cite')).toHaveText('Published chapter source.');
  await step.locator('h3').evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(step).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('.amm-everyday-art img')).toHaveAttribute('alt', 'Published description of the Host at home.');
});

test('the introduction leads into the three chapters with clear reading actions and times', async ({ page }) => {
  await page.goto('/amm');
  await expect(page.locator('.amm-home-sections > section')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'On this page' })).toHaveCount(0);
  await expect(page.locator('#amm-concerns, #amm-diagnosis, #amm-cure, #amm-movement, .amm-latest')).toHaveCount(0);
  const book = page.locator('#amm-start');
  await expect(book.getByRole('heading', { level: 2 })).toHaveText(AMM.chapterSection.title);
  const parts = book.locator('.amm-part');
  await expect(parts).toHaveCount(3);
  await expect(parts.locator('.amm-part-name')).toHaveText(['The Leech', 'The Leech’s Anatomy', 'The Host and the Infection']);
  for (let index = 0; index < 3; index++) {
    await expect(parts.nth(index).locator('.amm-part-line')).toHaveText(AMM.chapterSection.chapters[index].line);
    await expect(parts.nth(index).getByRole('link')).toHaveCount(1);
    await expect(parts.nth(index).locator('.amm-part-time')).toContainText(/\d+ min read/);
  }
  const start = book.getByRole('link', { name: AMM.introduction.label, exact: true });
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Chapter One: The Leech' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('a narrow phone keeps the pinned scene compact and every concept readable beneath it', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/amm');
  const overview = page.locator('#amm-overview');
  const figure = overview.locator('.explainer-story-figure');
  await expect(figure.locator('img')).toHaveCount(1);
  for (const index of [1, 4, 5]) {
    const step = overview.locator('.explainer-story-steps > li').nth(index);
    await step.locator('h3').evaluate(node => node.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await step.locator('h3').evaluate(node => {
      const pinned = node.closest('.explainer-story')!.querySelector('.explainer-story-figure')!.getBoundingClientRect();
      window.scrollBy(0, node.getBoundingClientRect().top - pinned.bottom - 20);
    });
    await expect(step).toHaveAttribute('aria-current', 'step');
    await expect(step.locator('h3')).toBeInViewport();
    const picture = await figure.boundingBox();
    const heading = await step.locator('h3').boundingBox();
    expect(picture!.height).toBeLessThan(568 * .4);
    expect(heading!.y).toBeGreaterThanOrEqual(picture!.y + picture!.height);
    expect(heading!.y + heading!.height).toBeLessThanOrEqual(568);
    await step.locator('blockquote').evaluate(node => node.scrollIntoView({ block: 'end', behavior: 'instant' }));
    await expect(step.locator('blockquote')).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  }
  // Enlarged text must reflow, including the long hero and chapter headings.
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await overview.locator('.amm-overview-source a').scrollIntoViewIfNeeded();
  await expect(overview.locator('.amm-overview-source .amm-mark')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
