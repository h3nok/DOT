import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers';
import AMM from '../src/content/amm.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/academy/delivery/catalog*', route => route.fulfill({ json: [] }));
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {} } }));
});

test('how power works is hidden: unlinked from AMM, out of search, still at its own address', async ({ page }) => {
  for (const path of ['/amm', '/amm/editions', '/essays/amm-chapter-two-the-leechs-anatomy']) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('a[href^="/amm/power"]')).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'AMM reading companion' })).toHaveCount(0);
  }
  await page.goto('/amm/power');
  await expect(page.getByRole('heading', { level: 1, name: 'The new power is economic.' })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  // 01 · One payment followed up the power map: capital above the state, the citizen paying straight up.
  const story = page.locator('#power');
  await expect(story.locator('.explainer-tier')).toHaveCount(4);
  await expect(story.locator('.explainer-rail')).toContainText('Rent, interest, fees, data, attention');
  await expect(story.getByRole('heading', { level: 3 })).toHaveText(['You pay.', 'The payment goes up.', 'Capital collects.', 'The state protects it.', 'The guards keep it beyond correction.', 'The story makes it feel natural.']);
  await expect(page.locator('#holders')).toContainText('50.2% of corporate equity is held by the top 1%');
  await expect(page.locator('#holders .evidence-chart')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
});

test('the power map follows the step being read, and every step reads without it', async ({ page }) => {
  await page.goto('/amm/power');
  const steps = page.locator('#power .explainer-story-steps > li');
  const tier = (id: string) => page.locator('#power .explainer-tier').nth(['capital', 'state', 'guards', 'citizen'].indexOf(id));
  await steps.nth(0).scrollIntoViewIfNeeded();
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  await expect(tier('citizen')).toHaveAttribute('data-state', 'lit');
  await expect(tier('capital')).toHaveAttribute('data-state', 'dim');
  await steps.nth(3).evaluate(node => node.scrollIntoView({ block: 'center' }));
  await expect(steps.nth(3)).toHaveAttribute('aria-current', 'step');
  await expect(tier('state')).toHaveAttribute('data-state', 'lit');
  await expect(tier('citizen')).toHaveAttribute('data-state', 'dim');
  await expect(steps.nth(3)).toContainText('The state is simultaneously its customer, financier, regulator, and protector.');
  // The last step returns the whole map to full strength.
  await steps.nth(5).evaluate(node => node.scrollIntoView({ block: 'center' }));
  await expect(steps.nth(5)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#power [data-state]')).toHaveCount(0);
});

// While How power works is hidden, the former money guide's addresses open the AMM home.
for (const from of ['/amm/capital', '/amm/capital#holders', '/amm/money', '/amm/money#housing', '/amm/money/ownership', '/amm/money/alternatives']) {
  test(`${from} opens the AMM home`, async ({ page }) => {
    await page.goto(from);
    await expect(page).toHaveURL(/\/amm$/);
    await expect(page.getByRole('heading', { level: 1, name: AMM.headline.join(' ') })).toBeVisible();
  });
}

test('published plain-text edits reach the hidden page', async ({ page }) => {
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {
    'amm.money.examples.borrowing.mechanic': 'Owner-edited borrowing explanation.',
    'amm.capital.chaintitle': 'Owner-edited chain heading.',
  } } }));
  await page.goto('/amm/power#borrowing');
  await page.locator('#borrowing summary').click();
  await expect(page.getByText('Owner-edited borrowing explanation.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Owner-edited chain heading.' })).toBeVisible();
});
