// Site search: finds the right section in every language and is usable by keyboard.
const { test, expect } = require('@playwright/test');
const { open, axe } = require('./helpers');

const CASES = [
  ['en', 'dual credit', '/academics/#dual'],
  ['en', 'I-20', '#international'],
  ['ko', '채플', '/#story'],
  ['ko', '이중 학점', '/academics/#dual'],
  ['zh', '双学分', '/academics/#dual'],
  ['es', 'credito dual', '/academics/#dual'] // accent-insensitive: matches "Crédito"
];

for (const [lang, q, expected] of CASES) {
  test(`search [${lang}] "${q}"`, async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop opens search from the nav');
    await open(page, 'about/', lang);
    await page.keyboard.press('/');
    await expect(page.locator('#search')).toBeVisible();
    await page.fill('#search input', q);
    await expect(page.locator('.sr-list li').first()).toBeVisible();
    expect(await page.locator('.sr-list a').first().getAttribute('href')).toContain(expected);
  });
}

test('search: Hangul is not decomposed (채플 must not match 챔피언)', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once');
  await open(page, '', 'ko');
  await page.click('.nr .sbtn-ic');
  await page.fill('#search input', '채플');
  await expect(page.locator('.sr-list li').first()).toBeVisible();
  const headings = await page.locator('.sr-list b').allTextContents();
  expect(headings.join(' ')).not.toContain('챔피언');
});

test('search: accessible dialog, Esc closes', async ({ page }, info) => {
  await open(page, '', 'en');
  if (info.project.name === 'mobile') { await page.click('.burger'); await page.click('.msearch') }
  else await page.click('.nr .sbtn-ic');
  await expect(page.locator('#search')).toBeVisible();
  await page.fill('#search input', 'admission');
  await expect(page.locator('.sr-status')).toHaveText(/\d+ results?/);
  if (info.project.name === 'desktop') expect(await axe(page, '#search')).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#search')).toBeHidden();
});
