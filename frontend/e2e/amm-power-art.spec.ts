import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/academy/delivery/catalog*', route => route.fulfill({ json: [] }));
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {} } }));
});

test('the two illustrations explain separate parts of the argument and allow inspection without leaving the page', async ({ page }) => {
  await page.goto('/amm/power');
  const trigger = page.getByRole('button', { name: 'Inspect The anatomy of the Host' });
  await expect(page.getByRole('img', { name: /^The erosion of the public:/ })).toBeVisible();
  await expect(page.getByRole('definition')).toHaveText([
    'The public that supplies it.', 'Power built on recurring claims.', 'What keeps the arrangement normal.',
  ]);
  await page.getByRole('link', { name: 'The Host', exact: false }).click();
  await expect(page).toHaveURL(/#assault$/);
  await expect(trigger).toBeVisible();
  const anatomy = trigger.locator('img');
  await expect.poll(() => anatomy.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/host-anatomy-v2-\d+\.webp$/);
  await expect(page.locator('#assault .explainer-ledger li')).toHaveCount(8);
  await trigger.focus();
  await page.keyboard.press('Enter');
  const viewer = page.getByRole('dialog', { name: 'The anatomy of the Host' });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('img')).toHaveAttribute('src', '/amm/media/host-anatomy-v2-1536.webp');
  await expect.poll(() => viewer.getByRole('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(viewer.getByRole('status')).toHaveCount(0);
  await viewer.getByRole('button', { name: 'Zoom in' }).click();
  await expect(viewer.getByRole('button', { name: 'Fit image' })).toHaveAttribute('aria-pressed', 'true');
  const canvas = viewer.locator('.explainer-art-viewport');
  await expect.poll(() => canvas.evaluate(node => node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight)).toBe(true);
  // Native modal focus stays inside; Escape restores the exact point in the reading.
  await page.keyboard.press('Tab');
  expect(await viewer.evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(viewer.getByRole('button', { name: 'Zoom in' })).toHaveAttribute('aria-pressed', 'false');
  await viewer.getByRole('button', { name: 'Close illustration' }).click();
  await expect(trigger).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test('a failed full-size image leaves a useful fallback and a working close control', async ({ page }) => {
  await page.route('**/amm/media/host-anatomy-v2-1536.webp', route => route.abort());
  await page.goto('/amm/power');
  const trigger = page.getByRole('button', { name: 'Inspect The anatomy of the Host' });
  await trigger.click();
  const viewer = page.getByRole('dialog', { name: 'The anatomy of the Host' });
  await expect(viewer.getByRole('status')).toContainText('The full-size image could not load.');
  await expect(viewer.getByRole('link', { name: 'Open the smaller image' })).toHaveAttribute('href', '/amm/media/host-anatomy-v2-1024.webp');
  await viewer.getByRole('button', { name: 'Close illustration' }).click();
  await expect(trigger).toBeFocused();
});

test('published image keys and captions are editable plain text', async ({ page }) => {
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {
    'amm.capital.imagekey.host.meaning': 'Edited account of the public.',
    'amm.capital.anatomycaption': 'Edited anatomy caption.',
  } } }));
  await page.goto('/amm/power');
  await expect(page.getByText('Edited account of the public.')).toBeVisible();
  await expect(page.locator('#assault figcaption').filter({ hasText: 'Edited anatomy caption.' })).toBeVisible();
});
