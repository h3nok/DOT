import { expect, test } from '@playwright/test';
import { expectNoAxeViolations, expectNoHorizontalOverflow } from './helpers';
import AMM from '../src/content/amm.json' with { type: 'json' };

const CHAPTER_TWO = `/essays/${AMM.chapterSection.chapters[1].id}`;
const DIAGNOSIS = `/essays/${AMM.chapterSection.chapters[2].id}#3-the-inversion-in-practice`;
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/academy/delivery/catalog*', route => route.fulfill({ json: [] }));
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {} } }));
});

test('the figures behind Chapter Two: reached from the home and every footer, four sourced screens, and the way back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/amm');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: AMM.power.figuresNav, exact: true })).toHaveAttribute('href', AMM.power.figuresRoute);
  await page.locator('#amm-anatomy').getByRole('link', { name: AMM.model.figuresLink }).click();
  await expect(page).toHaveURL(/\/amm\/figures$/);
  await expect(page.getByRole('heading', { level: 1, name: AMM.power.figuresTitle })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(0);
  await expect(page.locator('section[id]')).toHaveCount(4);
  for (const id of ['wealth', 'equity', 'savings', 'housing'] as const) await expect(page.locator(`#${id}`).getByRole('heading', { level: 2 })).toHaveText(AMM.power.screens[id]);
  await expect(page.locator('#wealth')).toContainText('2.5%');
  await expect(page.locator('#equity')).toContainText('50.2%');
  await expect(page.locator('#sources')).toBeAttached();
  await expect(page.getByRole('link', { name: AMM.power.figuresBack })).toHaveAttribute('href', CHAPTER_TWO);
  await expectNoHorizontalOverflow(page);
  await expectNoAxeViolations(page, 'main');
});

test('published plain-text edits reach the figures page', async ({ page }) => {
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {
    'amm.power.figurestitle': '<b>Owner-edited figures heading</b>',
    'amm.power.screens.wealth': 'Owner-edited wealth heading',
  } } }));
  await page.goto('/amm/figures');
  await expect(page.getByRole('heading', { level: 1, name: '<b>Owner-edited figures heading</b>' })).toBeVisible();
  await expect(page.locator('#wealth').getByRole('heading', { level: 2 })).toHaveText('Owner-edited wealth heading');
});

test('the figures page stays readable on a narrow phone at double text size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/amm/figures');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  for (const id of ['wealth', 'equity', 'savings', 'housing', 'sources']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expectNoHorizontalOverflow(page);
  }
});

// The companion pages were folded into the book (the author, 2026-11-18): a chart opens its figure, the rest its chapter.
for (const [from, to] of [
  ['/amm/power', CHAPTER_TWO],
  ['/amm/power#wealth', '/amm/figures#wealth'],
  ['/amm/power#choices', CHAPTER_TWO],
  ['/amm/capital#holders', '/amm/figures#equity'],
  ['/amm/money', CHAPTER_TWO],
  ['/amm/money#housing', '/amm/figures#housing'],
  ['/amm/money/ownership', '/amm/figures#equity'],
  ['/amm/money/alternatives', CHAPTER_TWO],
  ['/amm/reflect', DIAGNOSIS],
] as const) {
  test(`${from} opens ${to}`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${escape(to)}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('a failed full-size painting leaves a useful fallback and a working close control', async ({ page }) => {
  await page.route('**/amm/media/host2-1536.webp', route => route.abort());
  await page.goto('/amm');
  const trigger = page.getByRole('button', { name: 'Inspect The Host', exact: true });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const viewer = page.getByRole('dialog', { name: 'The Host', exact: true });
  await expect(viewer.getByRole('status')).toContainText('The full-size image could not load.');
  await expect(viewer.getByRole('link', { name: 'Open the smaller image' })).toHaveAttribute('href', '/amm/media/host2-1280.webp');
  await viewer.getByRole('button', { name: 'Close illustration' }).click();
  await expect(trigger).toBeFocused();
});
