import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, openAppearancePanel } from './helpers';

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
  });
}

test('a first-time reader sees the moral question, visible concepts and one reading action', async ({ page }) => {
  await page.goto('/amm');
  await expect(page.getByRole('heading', { level: 1, name: 'When harm becomes normal.' })).toBeVisible();
  // The short premise gives the artwork context; one primary reading action remains.
  const hero = page.locator('.amm-hero');
  await expect(hero.getByRole('link')).toHaveCount(1);
  await expect(hero.getByRole('button', { name: 'Inspect The Host', exact: true })).toBeVisible();
  await expect(hero.locator('.amm-hero-actions').getByRole('link')).toHaveCount(1);
  await expect(hero.getByText('Why this manifesto · Moral erosion')).toBeVisible();
  await expect(hero.getByText('AMM examines an inversion of priorities: life serves accumulation, while power escapes accountability.')).toBeVisible();
  await expect(hero.locator('.amm-home-concern')).toHaveCount(0);
  await expect(hero.locator('details, figcaption')).toHaveCount(0);
  const overview = page.getByRole('region', { name: 'What AMM is trying to address.', exact: true });
  await expect(overview.getByRole('heading', { name: 'Read the manifesto.', exact: true })).toHaveCount(0);
  await expect(page.locator('#amm-start').getByRole('heading', { name: 'Read the manifesto.', exact: true })).toBeVisible();
  await expect(overview.getByText('Before you read', { exact: true })).toBeVisible();
  await expect(overview.getByRole('link', { name: 'Go to the chapters' })).toHaveAttribute('href', '#amm-start');
  await expect(overview.getByRole('heading', { name: 'Where does this show up in us?' })).toHaveCount(0);
  const concerns = page.locator('.amm-home-concern');
  await expect(concerns).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'Worth reduced to status.', exact: true })).toBeVisible();
  const positions = await concerns.evaluateAll(nodes => nodes.map(node => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom })));
  expect(positions[1].top).toBeGreaterThanOrEqual(positions[0].bottom);
  expect(positions[2].top).toBeGreaterThanOrEqual(positions[1].bottom);
  expect(await page.locator('.site-page-main').evaluate(node => node.getBoundingClientRect().width)).toBeLessThanOrEqual(1312);
  const concepts = page.getByRole('tablist', { name: 'The concepts behind the critique' });
  await expect(concepts.getByRole('tab')).toHaveText([
    'ConditioningWhat becomes normal', 'FearWhat feels at stake', 'Self-protectionWhat we defend',
    'Moral erosionWhat we excuse', 'AccountabilityWhat we answer for',
  ]);
  if (page.viewportSize()!.width <= 900) {
    const picture = await page.locator('.amm-feature').boundingBox();
    const action = await page.locator('.amm-hero-actions').boundingBox();
    expect(action!.y).toBeGreaterThanOrEqual(picture!.y + picture!.height);
  }
  await expectNoHorizontalOverflow(page);
  expect(await overview.locator('.concept-explorer-explanation p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(17);
  await page.getByRole('link', { name: 'Understand the Leech', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Chapter One: The Leech' })).toBeVisible();
});

test('concepts respond deliberately, retain layout, and expose the limits of the model', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/amm');
  const explorer = page.locator('.concept-explorer');
  const first = page.getByRole('tab', { name: 'Conditioning', exact: true });
  const fear = page.getByRole('tab', { name: 'Fear', exact: true });
  await first.focus();
  await page.evaluate(() => document.fonts.ready);
  const before = await explorer.boundingBox();
  await first.press('ArrowRight');
  await expect(fear).toBeFocused();
  await expect(fear).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Fear');
  await expect(page.getByRole('tabpanel')).toContainText('Fear may signal real danger');
  await expect.poll(() => explorer.evaluate(node => node.getAnimations({ subtree: true }).every(a => a.playState === 'finished' && a.effect?.getTiming().iterations === 1))).toBe(true);
  await fear.press('End');
  await expect(page.getByRole('tab', { name: 'Accountability', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Responsibility follows what someone knows');
  const after = await explorer.boundingBox();
  expect(Math.abs(after!.height - before!.height)).toBeLessThan(2);
  await page.getByRole('tab', { name: 'Accountability', exact: true }).press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
  await expect(page.locator('.amm-home-concern .explainer-questions').getByRole('listitem')).toHaveCount(6);
  await page.getByText('Conditioning, character, and responsibility', { exact: true }).click();
  await expect(page.getByText(/Temperament, basic protective responses/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

for (const mode of ['system reduced motion', 'saved stillness', 'environment disabled'] as const) {
  test(`${mode} keeps concept changes still`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: mode === 'system reduced motion' ? 'reduce' : 'no-preference' });
    if (mode === 'environment disabled') await page.addInitScript(() => localStorage.setItem('dot_organism', JSON.stringify({ enabled: false })));
    await page.goto('/amm');
    await expect(page.getByRole('tab', { name: 'Conditioning', exact: true })).toBeVisible();
    if (mode === 'saved stillness') {
      const panel = await openAppearancePanel(page);
      await panel.locator('summary').filter({ hasText: 'Fine tune environment' }).click();
      await panel.getByRole('switch', { name: 'Hold the background still' }).click();
      await page.reload();
    }
    await page.getByRole('tab', { name: 'Moral erosion', exact: true }).click();
    await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Moral erosion');
    expect(await page.locator('.concept-explorer').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
  });
}

test('published concept wording reaches the public home', async ({ page }) => {
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {
    'amm.home.reasons.worth.title': 'Published reason for this manifesto.',
    'amm.home.concepts.fear.text': 'Published author revision of fear.',
    'amm.home.reflections.honesty.text': 'Published author question about honesty.',
  } } }));
  await page.goto('/amm');
  await page.getByRole('tab', { name: 'Fear', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Published author revision of fear.');
  await expect(page.getByText('Published author question about honesty.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Published reason for this manifesto.' })).toBeVisible();
});
