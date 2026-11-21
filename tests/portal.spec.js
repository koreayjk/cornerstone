// Family Portal demo: every role and view, both children, every language; key flows.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { LANGS, open, layoutIssues, axe } = require('./helpers');

const VIEWS = { parent: ['home', 'ann', 'msg', 'acad', 'doc', 'cal'], teacher: ['home', 'ann', 'msg', 'acad', 'cal'], admin: ['home', 'doc', 'ann', 'msg', 'cal'] };

for (const lang of LANGS) {
  test(`portal [${lang}]: every role, view and child renders cleanly`, async ({ page }, info) => {
    const problems = await open(page, 'portal/', lang);
    for (const role of Object.keys(VIEWS)) {
      await page.evaluate(r => enter(r), role);
      for (const v of VIEWS[role]) {
        for (const child of role === 'parent' && !['ann', 'cal'].includes(v) ? [0, 1] : [0]) {
          await page.evaluate(([v, c]) => { if (S.role === 'parent') pickChild(c); go(v) }, [v, child]);
          const issues = await layoutIssues(page, '#portal');
          problems.push(...issues.map(x => `${role}/${v}/child${child}: ${x}`));
          if (info.project.name === 'desktop' && lang === 'en') problems.push(...(await axe(page, '#portal')).map(x => `${role}/${v}: ${x}`));
        }
      }
    }
    expect(problems).toEqual([]);
  });
}

test('mobile tab bar shows every item for each role', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'mobile only');
  await open(page, 'portal/', 'en');
  for (const [role, n] of [['parent', 6], ['teacher', 5], ['admin', 5]]) {
    await page.evaluate(r => enter(r), role);
    await expect(page.locator('#mtab button')).toHaveCount(n);
  }
});

test('office rejects a request and the family sees the reason', async ({ page }) => {
  await open(page, 'portal/', 'en');
  await page.evaluate(() => { enter('admin'); go('doc') });
  const row = page.locator('.req', { hasText: '#103' });
  await row.getByRole('button', { name: 'Reject' }).click();
  await page.fill('#rj103', 'Please choose pickup or digital delivery.');
  await row.locator('.sbtn.danger').click();
  await page.evaluate(() => { enter('parent'); pickChild(1); go('doc') });
  await expect(page.locator('.reason')).toHaveText('Reason: Please choose pickup or digital delivery.');
  await expect(page.locator('.req .tag.urgent')).toHaveText('Rejected');
});

test('each child only sees their own messages; staff only their own threads', async ({ page }) => {
  await open(page, 'portal/', 'en');
  const names = () => page.locator('.th b').allTextContents();
  await page.evaluate(() => { enter('parent'); pickChild(0); go('msg') });
  expect(await names()).toEqual(['Mrs. Sarah Taylor', 'Front Office', 'Mr. Collins']);
  await page.evaluate(() => { pickChild(1); go('msg') });
  expect(await names()).toEqual(['Mrs. Allen', 'Front Office']);
  await page.evaluate(() => { enter('teacher'); go('msg') });
  expect(await page.evaluate(() => myThreads().map(x => x.owner))).toEqual(['taylor']);
  await page.evaluate(() => { enter('admin'); go('msg') });
  expect(await page.evaluate(() => myThreads().map(x => x.owner))).toEqual(['office', 'office']);
});

test('calendar exports a valid .ics file', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once');
  await open(page, 'portal/', 'ko');
  await page.evaluate(() => { enter('parent'); go('cal') });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.boxh .sbtn.pri')]);
  const file = await dl.path();
  const txt = fs.readFileSync(file, 'utf8');
  const lines = txt.split('\r\n');
  expect(dl.suggestedFilename()).toBe('cornerstone-calendar.ics');
  expect(/[^\r]\n/.test(txt), 'CRLF line endings only').toBe(false);
  expect(Math.max(...lines.map(l => Buffer.byteLength(l))), 'lines folded at 75 octets').toBeLessThanOrEqual(75);
  expect(lines[0]).toBe('BEGIN:VCALENDAR');
  expect((txt.match(/BEGIN:VEVENT/g) || []).length).toBe(7);
  expect(txt).toContain('BEGIN:VTIMEZONE');
  expect(txt).toContain('SUMMARY:성탄 프로그램');
  expect(txt).toContain('DTSTART;VALUE=DATE:20270316');
  expect(txt).toContain('DTEND;VALUE=DATE:20270321'); // spring break Mar 16–20, end is exclusive
  const g = await page.locator('.evx a').first().getAttribute('href');
  expect(g).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
});
