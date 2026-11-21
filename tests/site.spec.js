// Public site: every page in every language, on desktop and mobile.
const { test, expect } = require('@playwright/test');
const { LANGS, PAGES, open, scrollThrough, layoutIssues, axe } = require('./helpers');

for (const pg of PAGES.concat(['404.html'])) {
  for (const lang of LANGS) {
    test(`${pg || 'home'} [${lang}] loads cleanly`, async ({ page }, info) => {
      const problems = await open(page, pg, lang);
      await scrollThrough(page);
      problems.push(...await layoutIssues(page));
      expect(await page.evaluate(() => document.documentElement.lang)).toBe(lang === 'zh' ? 'zh-Hans' : lang);
      if (pg && pg !== '404.html') {
        const chips = await page.locator('#subnav a').count();
        expect(chips, 'sub-nav has section links').toBeGreaterThan(0);
      }
      // the accessibility audit is the slowest step: run it on desktop for en and ko
      if (info.project.name === 'desktop' && (lang === 'en' || lang === 'ko')) problems.push(...await axe(page));
      expect(problems).toEqual([]);
    });
  }
}

test('home: the statement lights its gold words in every language', async ({ page }) => {
  const expected = { en: 3, ko: 3, zh: 3, es: 3 };
  for (const lang of LANGS) {
    await open(page, '', lang);
    const gold = await page.locator('.lit .w.g').count();
    expect(gold, lang).toBe(expected[lang]);
  }
});

test('photos load as AVIF or WebP, never the JPEG originals', async ({ page }) => {
  const images = [];
  page.on('response', r => { if (/\/img\/[^/]+\.(jpg|webp|avif)$/.test(r.url())) images.push(r.url().split('/').pop()) });
  await open(page, 'academics/', 'en');
  await scrollThrough(page);
  await page.waitForTimeout(500);
  expect(images.length).toBeGreaterThan(1);
  expect(images.filter(f => f.endsWith('.jpg') && f !== 'og.jpg')).toEqual([]);
});

test('menu: desktop dropdowns or the mobile menu reach every section page', async ({ page }, info) => {
  await open(page, '', 'en');
  if (info.project.name === 'desktop') {
    await page.hover('.mi:nth-child(4) .mt');
    await expect(page.locator('.mi:nth-child(4) .dd')).toBeVisible();
    await expect(page.locator('.mi:nth-child(4) .dd a').first()).toHaveAttribute('href', /admissions\/#apply$/);
  } else {
    await page.click('.burger');
    await expect(page.locator('#mnav')).toBeVisible();
    await expect(page.locator('.burger')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mnav .mgt')).toHaveCount(6);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mnav')).toBeHidden();
  }
});

test('language choice is shared between the site and the portal', async ({ page }) => {
  // plain navigation: open() would preset the language again on every page load
  await page.goto('');
  await page.waitForFunction(() => typeof I18N !== 'undefined' && I18N.lang === 'en');
  await page.selectOption('.nav select.lang', 'es');
  await page.waitForFunction(() => I18N.lang === 'es');
  await page.goto('portal/');
  await page.waitForFunction(() => typeof I18N !== 'undefined' && I18N.lang === 'es');
  await expect(page.locator('.login-card h2')).toHaveText('Bienvenidos a casa.');
});

test('admissions inquiry: validates, then builds an email to the office', async ({ page }) => {
  await open(page, 'admissions/', 'ko');
  await page.locator('#inquire').scrollIntoViewIfNeeded();
  await page.click('#inqForm button[type=submit]');
  await expect(page.locator('#inqErr')).toHaveText('아래 3개 항목을 확인해 주세요.');
  await expect(page.locator('#inqName')).toBeFocused();
  await expect(page.locator('#inqName')).toHaveAttribute('aria-invalid', 'true');
  await page.fill('#inqName', '김민준');
  await page.fill('#inqEmail', 'family@example.com');
  await page.selectOption('#inqGrade', 'Grade 3');
  await page.check('#inqTrial');
  await page.fill('#inqMsg', '방문 상담을 원합니다.');
  await page.click('#inqForm button[type=submit]');
  await expect(page.locator('#inqDone')).toBeVisible();
  const href = await page.locator('#inqForm').getAttribute('data-mailto');
  const u = new URL(href);
  expect(u.protocol + u.pathname).toBe('mailto:office@bvcca.com');
  expect(u.searchParams.get('subject')).toBe('Admissions inquiry — 김민준 (Grade 3)');
  const body = u.searchParams.get('body');
  expect(body).toContain('Grade of interest: Grade 3');   // labels stay English for the office
  expect(body).toContain('Free 3-day trial: Yes');
  expect(body).toContain('방문 상담을 원합니다.');          // the family's own words, as written
});

test('visit section links to map directions', async ({ page }) => {
  await open(page, 'admissions/', 'en');
  await expect(page.locator('#visit a[href^="https://www.google.com/maps/dir/"]')).toHaveCount(1);
  await expect(page.locator('#visit a[href^="https://maps.apple.com/"]')).toHaveCount(1);
});
