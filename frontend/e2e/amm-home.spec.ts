import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, openAppearancePanel } from './helpers';
import AMM from '../src/content/amm.json' with { type: 'json' };
import MODEL from '../src/content/amm-model.json' with { type: 'json' };

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

const CHAPTERS = ['Chapter One: The Leech — The Attitude of Dominance', 'Chapter Two: The Anatomy of Dominance', 'Chapter Three: The Host and the Infection', 'Chapter Four: Authorship Without Dominance'];
const DIAGNOSIS = '/essays/amm-book-chapter-three-the-host-and-the-infection#3-the-inversion-in-practice';

test('the hero opens in two columns and offers one action: start reading Chapter One', async ({ page }) => {
  await page.goto('/amm');
  const hero = page.locator('.amm-hero');
  await expect(hero.getByRole('heading', { level: 1 })).toHaveText(AMM.model.heroTitle);
  await expect(hero.locator('.amm-home-premise')).toHaveText(AMM.model.heroLine);
  // The author's title and the two countries, and nothing else (2026-11-19).
  await expect(hero.locator('.amm-hero-copy > p')).toHaveCount(1);
  await expect(hero.getByText('The system is dying')).toHaveCount(0);
  await expect(hero.getByRole('button', { name: 'Inspect The Host', exact: true })).toBeVisible();
  const action = hero.locator('.amm-hero-actions').getByRole('link');
  await expect(action).toHaveCount(1);
  await expect(action).toHaveText(AMM.heroAction);
  await expect(action).toHaveAttribute('href', AMM.introduction.route);
  const picture = await hero.locator('.amm-hero-visual').boundingBox();
  const copy = await hero.locator('.amm-hero-copy').boundingBox();
  const button = await action.boundingBox();
  if (page.viewportSize()!.width > 900) {
    expect(picture!.x).toBeGreaterThanOrEqual(copy!.x + copy!.width + 32);
    expect(button!.height).toBeGreaterThanOrEqual(44);
    expect(button!.width).toBeLessThan(copy!.width);
  } else {
    expect(button!.y).toBeGreaterThanOrEqual(picture!.y + picture!.height);
  }
  await expect(hero.locator('.amm-eyebrow, .amm-hero-guide, .amm-screen-foot')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: CHAPTERS[0] })).toBeVisible();
});

const SCREENS = ['amm-thesis', 'amm-inversion', 'amm-host', 'amm-leech', 'amm-anatomy', 'amm-feeding', 'amm-way-out', 'amm-book'];
const marks = (lines: ReadonlyArray<{ mark?: string }>) => lines.filter(line => line.mark).length;

test('the home opens on why stability matters, then the Inversion, the Host, the Leech, its body and how it feeds, the book, and closes on the way out—with no mention of "model"', async ({ page }) => {
  await page.goto('/amm');
  await expect(page.locator('#amm-way-out')).toBeAttached();
  const ids = await page.locator('main section[id]').evaluateAll(nodes => nodes.map(node => node.id));
  expect(ids).toEqual(SCREENS);

  // The opening painting's one-line key: the mirror is the country described.
  await expect(page.locator('.amm-hero .amm-hero-key')).toHaveText(AMM.model.mirrorKey);

  // The Inversion, the primary diagnosis, in the book's words, and the way into Chapter Three.
  const inversion = page.locator('#amm-inversion');
  await expect(inversion.getByRole('heading', { level: 2 })).toHaveText(MODEL.home.inversion.heading.text);
  // The Inversion is always set in the flame (the author, 2026-11-19): here as the term heading, and in the thesis.
  await expect(inversion.locator('h2 .amm-term')).toHaveText('The Inversion');
  await expect(inversion.locator('h2 .amm-term-cue')).toHaveText('professing virtue, and practicing the exact opposite.');
  await expect(page.locator('#amm-thesis .amm-thesis-column-label mark.inq-mark')).toHaveText('The Inversion');
  await expect(inversion.locator('.amm-screen-line')).toHaveText(MODEL.home.inversion.lines.map(line => line.text));
  await expect(inversion.locator('a.amm-button')).toHaveCount(1);
  await expect(inversion.getByRole('link', { name: AMM.model.readDiagnosis })).toHaveAttribute('href', DIAGNOSIS);
  await expect(inversion.getByRole('link', { name: 'A Letter to an American Adult', exact: true })).toHaveAttribute('href', '/essays/amm-letter-to-an-american-adult');

  // Each part of the model: where it sits among the five, its term over what it means (read
  // aloud as one heading), the book's sentences with their key phrases in the flame, its sources, and its painting.
  const PATH = ['Inversion', 'Host', 'Leech', 'Oligarchy', 'Feeding point'];
  await expect(inversion.locator('.amm-model-path li')).toHaveText(PATH);
  await expect(inversion.locator('.amm-model-path [aria-current="step"]')).toHaveText('Inversion');
  for (const [index, [id, title, quotes]] of ([
    ['amm-host', AMM.model.hostTitle, MODEL.home.host],
    ['amm-leech', AMM.model.leechTitle, MODEL.home.leech],
    ['amm-anatomy', AMM.model.anatomyTitle, MODEL.home.anatomy],
    ['amm-feeding', AMM.model.feedingTitle, MODEL.home.feeding],
  ] as const).entries()) {
    const screen = page.locator(`#${id}`);
    await expect(screen.getByRole('heading', { level: 2 })).toHaveText(title);
    await expect(screen.locator('.amm-term')).toHaveText(title.split(': ')[0]);
    await expect(screen.locator('.amm-term-cue')).toHaveText(title.split(': ')[1]);
    await expect(screen.locator('.amm-model-path [aria-current="step"]')).toHaveText(PATH[index + 1]);
    await expect(screen.locator('.amm-screen-line')).toHaveText(quotes.lines.map(line => line.text));
    await expect(screen.locator('.inq-mark')).toHaveCount(marks(quotes.lines));
    await expect(screen.locator('.amm-screen-source a').first()).toBeVisible();
    await expect(screen.getByText(AMM.reflect.disclosure, { exact: true })).toHaveCount(1);
  }
  // The oligarchy: the earlier Chapter Three's words, its caution about workers, and the figures.
  const anatomy = page.locator('#amm-anatomy');
  await expect(anatomy.locator('.amm-screen-note')).toHaveText(MODEL.home.anatomy.note.text);
  await expect(anatomy.getByRole('link', { name: AMM.model.figuresLink })).toHaveAttribute('href', AMM.power.figuresRoute);
  await expect(anatomy.getByRole('link', { name: 'Chapter Three, earlier edition', exact: true })).toHaveAttribute('href', '/essays/amm-chapter-three-the-host-and-the-infection#the-leech-and-the-logic-it-carries');
  // Each painting appears once on the page.
  for (const name of ['inversion-empty-frame', 'host-anatomy-v2', 'the-leech-portrait', 'leech-anatomy', 'belief-4-the-feeding']) {
    await expect(page.locator(`main img[src$="/${name}-1024.webp"]`)).toHaveCount(1);
  }

  // The AMM thesis as a manifesto (the author, 2026-11-20; "Manifesto style", 2026-11-22): AMM's conviction in
  // the book's words, then seven numbered articles, the purpose (closed by the book's hinge) facing the Inversion.
  const thesis = page.locator('#amm-thesis');
  await expect(thesis.getByRole('heading', { level: 2 })).toHaveText(AMM.model.thesisTitle);
  await expect(thesis.locator('.amm-thesis-conviction')).toHaveText(MODEL.home.thesis.worth.text);
  await expect(thesis.getByRole('heading', { level: 3 })).toHaveText([AMM.model.thesisPurposeLabel, AMM.model.thesisInversionLabel]);
  await expect(thesis.locator('.amm-article-number')).toHaveText(['01', '02', '03', '04', '05', '06', '07']);
  await expect(thesis.locator('.amm-article-text')).toHaveText([AMM.model.thesisSociety, AMM.model.thesisHonor, MODEL.home.thesis.judged.text, AMM.model.thesisInverts, AMM.model.thesisMyth, AMM.model.thesisBelief, AMM.model.thesisCharacter]);
  await expect(thesis.locator('.amm-article-text mark.inq-mark')).toHaveText(['preserve that order or reverse it', 'inverts this purpose', 'a conditioned character']);
  await expect(thesis.getByRole('link', { name: 'Chapter Four', exact: true })).toHaveAttribute('href', '/essays/amm-book-chapter-four-authorship-without-dominance#13-what-we-owe-the-next-life');
  await expect(thesis.getByRole('link', { name: 'Chapter One, earlier edition', exact: true })).toHaveAttribute('href', '/essays/amm-chapter-one-the-leech');
  // Set in type, not boxes: no card background or shadow on the articles.
  await expect(thesis.locator('.amm-articles').first()).toHaveCSS('box-shadow', 'none');
  // Side by side on a wide screen, the Inversion after the purpose on a narrow one.
  const [purpose, inverted] = [await thesis.locator('.amm-thesis-column').first().boundingBox(), await thesis.locator('.amm-thesis-column--inverted').boundingBox()];
  if ((page.viewportSize()?.width ?? 0) >= 900) expect(inverted!.x).toBeGreaterThan(purpose!.x + purpose!.width / 2);
  else expect(inverted!.y).toBeGreaterThan(purpose!.y + purpose!.height / 2);
  await expect(page.getByText('worthy of care')).toHaveCount(0);
  await expect(page.getByText('Why stability matters')).toHaveCount(0);
  await expect(page.getByText('Every person needs some degree of safety')).toHaveCount(0);
  await expect(page.getByText('The purpose of life is Love.')).toHaveCount(0);

  // The book: four chapters in order, without paintings (the screens above show them), and one way to every edition.
  const book = page.locator('#amm-book');
  await expect(book.locator('.amm-chapter-title')).toHaveText(CHAPTERS.map(name => name.split(': ')[1]));
  for (const [index, name] of CHAPTERS.entries()) await expect(book.getByRole('link', { name, exact: true })).toHaveAttribute('href', `/essays/${AMM.chapterSection.chapters[index].id}`);
  await expect(book.locator('img')).toHaveCount(0);
  await expect(book.getByRole('link', { name: AMM.model.closingBook })).toHaveAttribute('href', '/amm/editions');
  await expect(book.locator('.amm-chapter-number').first()).toHaveCSS('text-transform', 'uppercase');

  // The way out closes the home (the author, 2026-11-19): only a cultural revolution, Chapter Four's sentence, and the chapter.
  const wayOut = page.locator('#amm-way-out');
  await expect(wayOut.getByRole('heading', { level: 2 })).toHaveText(AMM.model.revolutionLine);
  await expect(wayOut.locator('.amm-way-out-line')).toHaveText(MODEL.home.revolution.lines.map(line => line.text));
  await expect(wayOut.locator('.amm-screen-source a')).toHaveText('Chapter Four');
  await expect(wayOut.getByRole('link', { name: AMM.model.revolutionAction })).toHaveAttribute('href', `/essays/${AMM.chapterSection.chapters[3].id}`);
  if (page.viewportSize()!.width > 960) {
    const tops = await book.locator('.amm-chapter').evaluateAll(nodes => nodes.map(node => Math.round(node.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  }

  // No step eyebrows or share pills; one illustration note per picture: the opening and the five screens.
  await expect(page.locator('main .amm-model-step, main .amm-share')).toHaveCount(0);
  await expect(page.locator('main').getByText(AMM.reflect.disclosure, { exact: true })).toHaveCount(6);
  const visibleText = await page.locator('main').innerText();
  expect(visibleText).not.toMatch(/\bmodel\b/i);
  expect(visibleText.split(/\s+/).filter(Boolean).length).toBeLessThan(700);
  const screens = await page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
  expect(screens).toBeLessThan(page.viewportSize()!.width > 900 ? 10.5 : 14);
  await expectNoHorizontalOverflow(page);
});

for (const mode of ['system reduced motion', 'saved stillness', 'environment disabled'] as const) {
  test(`${mode} keeps the home and its paintings still`, async ({ page }) => {
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
    await page.locator('#amm-book').scrollIntoViewIfNeeded();
    expect(await page.locator('.amm-home-screens').evaluate(node => node.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(page.locator('.amm-feature video')).toHaveCount(0);
  });
}

test('published copy reaches the public page, including the opening; retired headline overrides do not', async ({ page }) => {
  await page.route('**/v1/site-content', route => route.fulfill({ json: { blocks: {
    'amm.heroaction': 'Published reading invitation',
    'amm.model.readdiagnosis': 'Published way into the diagnosis',
    'amm.headline.0': 'Retired headline override',
    'amm.model.herotitle': 'A published opening',
    'amm.model.heromessage': 'Retired message to the citizen.',
  } } }));
  await page.goto('/amm');
  await expect(page.locator('.amm-hero-actions .amm-button')).toContainText('Published reading invitation');
  await expect(page.locator('#amm-inversion').getByRole('link', { name: 'Published way into the diagnosis' })).toHaveAttribute('href', DIAGNOSIS);
  await expect(page.locator('.amm-hero h1')).toHaveText('A published opening');
  await expect(page.getByText('Retired message to the citizen.')).toHaveCount(0);
  await expect(page.getByText('Retired headline override')).toHaveCount(0);
});

test('a narrow phone keeps every screen readable, including at double text size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/amm');
  for (const id of SCREENS) {
    const heading = page.locator(`#${id} h2`).first();
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeInViewport();
    await expectNoHorizontalOverflow(page);
  }
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  for (const id of SCREENS) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expectNoHorizontalOverflow(page);
  }
});
