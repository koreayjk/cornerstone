// Every internal link on the public site and the portal resolves, including #anchors.
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./helpers');

test('internal links and anchors resolve', async ({ page, request, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once');
  const links = new Set();
  for (const pg of PAGES.concat(['portal/', '404.html'])) {
    await page.goto(pg);
    await page.waitForLoadState('domcontentloaded');
    for (const h of await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.href))) {
      if (h.startsWith(new URL(baseURL).origin)) links.add(h);
    }
  }
  const broken = [];
  for (const h of links) {
    const u = new URL(h);
    if (/\.(mp4|ics)$/.test(u.pathname)) continue;
    const res = await request.get(u.origin + u.pathname);
    if (!res.ok()) { broken.push(`${res.status()} ${h}`); continue }
    if (u.hash.length > 1) {
      await page.goto(u.origin + u.pathname);
      if (!(await page.evaluate(id => !!document.getElementById(id), decodeURIComponent(u.hash.slice(1))))) broken.push(`missing anchor ${h}`);
    }
  }
  expect(links.size).toBeGreaterThan(20);
  expect(broken).toEqual([]);
});

test('a missing page shows the 404 page', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once');
  // python's http.server doesn't serve 404.html for missing paths, so load it directly
  // from a nested path the way GitHub Pages would; its <base> must still resolve assets.
  await page.goto('404.html');
  await expect(page.locator('h1')).toHaveText(/isn’t here/);
  await expect(page.locator('.nav .brand')).toBeVisible();
});
