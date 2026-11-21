// Supabase pieces that run outside the database: the invite-user Edge Function's input
// validation (the same file Deno runs) and the multilingual Auth email templates.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { ROOT } = require('./helpers');

test.describe('supabase edge + email', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'runs once'));

  test('invite-user validates its input', async () => {
    const { validateInvite } = await import(pathToFileURL(path.join(ROOT, 'supabase/functions/invite-user/validate.js')).href);
    const sid = 'a0000000-0000-4000-8000-000000000001';
    const ok = validateInvite({ email: ' Kim.Family@Example.com ', full_name: ' The Kim Family ', role: 'parent', lang: 'ko', student_ids: [sid, sid.toUpperCase()] });
    expect(ok).toEqual({ ok: true, value: { email: 'kim.family@example.com', full_name: 'The Kim Family', role: 'parent', lang: 'ko', student_ids: [sid] } });
    expect(validateInvite({ email: 'teacher@example.com', full_name: 'T', role: 'teacher' }).value.lang).toBe('en');
    const bad = (body, msg) => { const r = validateInvite(body); expect(r.ok).toBe(false); expect(r.errors.join(' | ')).toContain(msg) };
    bad(null, 'JSON object');
    bad({ email: 'nope', full_name: 'X', role: 'teacher' }, 'email is invalid');
    bad({ email: 'a@b.co', full_name: '', role: 'teacher' }, 'full_name is required');
    bad({ email: 'a@b.co', full_name: 'X', role: 'superuser' }, 'role must be one of');
    bad({ email: 'a@b.co', full_name: 'X', role: 'teacher', lang: 'fr' }, 'lang must be one of');
    bad({ email: 'a@b.co', full_name: 'X', role: 'parent' }, 'at least one student');
    bad({ email: 'a@b.co', full_name: 'X', role: 'parent', student_ids: ['1; drop table'] }, 'student UUIDs');
    bad({ email: 'a@b.co', full_name: 'X', role: 'admin', student_ids: [sid] }, 'only parents');
  });

  // tiny emulator for the one Go-template construct the templates use:
  // {{ if eq .Data.lang "ko" }} … {{ else if eq .Data.lang "zh" }} … {{ else }} … {{ end }}
  function render(tpl, lang, url) {
    const m = tpl.match(/\{\{ if eq \.Data\.lang "(\w+)" \}\}([\s\S]*?)\{\{ else if eq \.Data\.lang "(\w+)" \}\}([\s\S]*?)\{\{ else if eq \.Data\.lang "(\w+)" \}\}([\s\S]*?)\{\{ else \}\}([\s\S]*?)\{\{ end \}\}/);
    if (!m) throw new Error('unexpected template structure');
    const branch = { [m[1]]: m[2], [m[3]]: m[4], [m[5]]: m[6] }[lang] ?? m[7];
    return tpl.replace(m[0], branch).replace(/\{\{ \.ConfirmationURL \}\}/g, url);
  }

  const EXPECT = {
    invite: { en: 'Accept invitation', ko: '초대 수락', zh: '接受邀请', es: 'Aceptar invitación' },
    magic_link: { en: 'Sign in', ko: '로그인', zh: '登录', es: 'Iniciar sesión' },
    recovery: { en: 'Choose a new password', ko: '새 비밀번호 정하기', zh: '设置新密码', es: 'Elegir nueva contraseña' }
  };
  for (const [name, labels] of Object.entries(EXPECT)) {
    test(`email template "${name}" renders in every language`, async ({ page }) => {
      const tpl = fs.readFileSync(path.join(ROOT, 'supabase/templates', name + '.html'), 'utf8');
      expect(fs.readFileSync(path.join(ROOT, 'supabase/config.toml'), 'utf8')).toContain(`content_path = "./supabase/templates/${name}.html"`);
      for (const [lang, cta] of Object.entries(labels).concat([['fr', labels.en]])) {   // unknown language -> English
        const url = `https://example.supabase.co/auth/v1/verify?token=t-${lang}`;
        const out = render(tpl, lang, url);
        expect(out).not.toContain('{{');
        await page.setContent(out);
        const button = page.locator('a', { hasText: cta });
        await expect(button).toHaveAttribute('href', url);
        await expect(page.locator('body')).toContainText(url);
      }
    });
  }
});
