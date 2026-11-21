// Family Portal demo: every role and view, both children, every language; key flows.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { LANGS, open, layoutIssues, axe } = require('./helpers');

const VIEWS = { parent: ['home', 'ann', 'msg', 'acad', 'doc', 'cal'], teacher: ['home', 'ann', 'msg', 'acad', 'att', 'cal'], admin: ['home', 'doc', 'people', 'ann', 'msg', 'cal'] };

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
  for (const [role, n] of [['parent', 6], ['teacher', 6], ['admin', 6]]) {
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

test('teacher edits a grade and the family sees the new average', async ({ page }) => {
  await open(page, 'portal/', 'en');
  await page.evaluate(() => { enter('parent'); pickChild(0); go('acad') });
  const englishRow = page.locator('tr', { hasText: 'English II (Honors)' });
  await expect(englishRow.locator('.grade')).toHaveText('A');           // (98 + 95) / 2 = 97
  await page.evaluate(() => { enter('teacher'); go('acad') });
  const cell = page.getByLabel('Grace Kim — Unit 3 Test');
  await cell.fill('71');
  await expect(page.locator('#gbavg-grace')).toHaveText('85% · B');      // live while typing
  await expect(page.locator('#gbDirty')).toBeVisible();
  await page.getByRole('button', { name: 'Save grades' }).click();
  await page.evaluate(() => { enter('parent'); pickChild(0); go('acad') });
  await expect(englishRow.locator('.grade')).toHaveText('B');
  await expect(englishRow).toContainText('85%');
  await expect(englishRow.locator('.tag')).toHaveText('Updated');
});

test('gradebook rejects scores outside 0–100 and can add an assignment', async ({ page }) => {
  await open(page, 'portal/', 'en');
  await page.evaluate(() => { enter('teacher'); go('acad') });
  const cell = page.getByLabel('Daniel Park — Essay: Hebrews 11');
  await cell.fill('140');
  await expect(cell).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'Save grades' }).click();
  expect(await page.evaluate(() => S.gradebook.students.find(s => s.key === 'daniel').scores.a1)).toBe(91); // not saved
  await cell.fill('93');
  await page.fill('#gbNew', 'Quiz 4');
  await page.getByRole('button', { name: 'Add assignment' }).click();
  await expect(page.locator('table.gb th', { hasText: 'Quiz 4' })).toBeVisible();
  await page.getByLabel('Daniel Park — Quiz 4').fill('100');
  await page.getByRole('button', { name: 'Save grades' }).click();
  expect(await page.evaluate(() => S.gradebook.assignments.map(a => a.name))).toEqual(['Essay: Hebrews 11', 'Unit 3 Test', 'Quiz 4']);
  await expect(page.locator('#gbavg-daniel')).toHaveText('94% · A');   // (93 + 88 + 100) / 3
});

test('teacher takes attendance and the family sees it', async ({ page }) => {
  await open(page, 'portal/', 'en');
  await page.evaluate(() => { enter('teacher'); go('att') });
  await page.locator('fieldset', { hasText: 'Grace Kim' }).getByText('Absent').click();
  await expect(page.locator('#attSum')).toHaveText('4 present · 1 absent · 0 tardy · 0 excused');
  await page.getByRole('button', { name: 'Save attendance' }).click();
  await page.evaluate(() => { enter('parent'); pickChild(0); go('acad') });
  await expect(page.locator('.kpi', { hasText: 'Absent · Tardy' }).locator('b')).toHaveText('2 · 0');  // was 1 · 0
  await expect(page.locator('.kpi small.today')).toHaveText('Today: Absent');
  await page.evaluate(() => pickChild(1));                                  // Joshua is not in this class
  await expect(page.locator('.kpi small.today')).toHaveCount(0);
});

test('office invites a parent, previews the email in their language, and the parent activates', async ({ page }) => {
  await open(page, 'portal/', 'en');
  await expect(page.locator('.login-card')).toContainText('Invitation only');
  await page.evaluate(() => { enter('admin'); go('people') });
  // validation: a parent needs a linked student
  await page.fill('#invName', 'The Lee Family');
  await page.fill('#invEmail', 'lee.family@example.com');
  await page.selectOption('#invLang', 'es');
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.locator('#invErr')).toHaveText('Link at least one student.');
  await page.locator('#invKids label', { hasText: 'Hannah Lee' }).click();
  await page.getByRole('button', { name: 'Send invitation' }).click();
  const row = page.locator('.acct', { hasText: 'The Lee Family' });
  await expect(row.locator('.tag')).toHaveText('Invited');
  // the preview follows the recipient's language (Spanish), not the UI language (English)
  await expect(page.locator('.mail-h')).toContainText('Está invitado(a) al Portal Familiar de Cornerstone');
  await expect(page.locator('.mail-b')).toContainText('Hola, The Lee Family:');
  // a duplicate email is refused
  await page.fill('#invName', 'Someone');
  await page.fill('#invEmail', 'LEE.family@example.com');
  await page.locator('#invKids label', { hasText: 'Hannah Lee' }).click();
  await page.getByRole('button', { name: 'Send invitation' }).click();
  await expect(page.locator('#invErr')).toHaveText('This email already has an account.');
  // accept: password rules, then active
  await row.getByRole('button', { name: 'Accept (demo)' }).click();
  await expect(page.locator('#accModal')).toBeVisible();
  await page.fill('#accPw', 'short');
  await page.getByRole('button', { name: 'Activate account' }).click();
  await expect(page.locator('#accErr')).toHaveText('Use at least 8 characters.');
  await page.fill('#accPw', 'correct horse');
  await page.fill('#accPw2', 'correct house');
  await page.getByRole('button', { name: 'Activate account' }).click();
  await expect(page.locator('#accErr')).toHaveText('The passwords don’t match.');
  await page.fill('#accPw2', 'correct horse');
  await page.getByRole('button', { name: 'Activate account' }).click();
  await expect(page.locator('#accModal')).toBeHidden();
  await expect(row.locator('.tag')).toHaveText('Active');
});

test('email templates render in each language', async ({ page }) => {
  await open(page, 'portal/', 'en');
  await page.evaluate(() => { enter('admin'); go('people') });
  const expectSubject = async (tpl, lang, text) => {
    await page.selectOption('#mailTpl', tpl);
    await page.selectOption('#mailLang', lang);
    await expect(page.locator('.mail-h')).toContainText(text);
  };
  await expectSubject('doc', 'ko', '서류가 준비되었습니다: 재학 증명서');
  await expectSubject('ann', 'zh', '新通知：圣诞节目暨读经与颂歌');
  await expectSubject('msg', 'es', 'Nuevo mensaje de Mrs. Sarah Taylor');
  await expectSubject('invite', 'en', 'You’re invited to the Cornerstone Family Portal');
});

test('issued document downloads as a real PDF', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once');
  await open(page, 'portal/', 'en');
  await page.evaluate(() => { enter('parent'); pickChild(0); go('doc') });
  await page.getByRole('button', { name: 'Download' }).click();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
  expect(dl.suggestedFilename()).toBe('CCA-101-enrollment.pdf');
  const buf = fs.readFileSync(await dl.path());
  expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(4000);                     // fonts + crest image embedded
  // parse it back with pdf-lib (already loaded in the page): one US Letter page, titled
  const info2 = await page.evaluate(async b64 => {
    const d = await PDFLib.PDFDocument.load(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
    const p = d.getPage(0).getSize();
    return { pages: d.getPageCount(), title: d.getTitle(), w: Math.round(p.width), h: Math.round(p.height) };
  }, buf.toString('base64'));
  expect(info2).toEqual({ pages: 1, title: 'Enrollment Verification Letter — CCA-101', w: 612, h: 792 });
});

test('portal is installable and opens offline', async ({ page, context, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'runs once');
  const res = await page.request.get('portal/manifest.webmanifest');
  const m = await res.json();
  expect(m.display).toBe('standalone');
  for (const icon of m.icons) expect((await page.request.get(new URL(icon.src, baseURL + 'portal/').href)).ok(), icon.src).toBe(true);
  expect(m.icons.some(i => i.purpose === 'maskable')).toBe(true);
  await open(page, 'portal/', 'en');
  await page.evaluate(async () => { await navigator.serviceWorker.ready });
  await page.reload();                                           // now controlled by the service worker
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.login-card h2')).toHaveText('Welcome home.');
  await page.evaluate(() => enter('parent'));
  await expect(page.locator('#ptitle')).toHaveText('Home');
  await context.setOffline(false);
});
