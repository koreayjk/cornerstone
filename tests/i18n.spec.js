// Dictionary checks (no browser): every language has the same keys and the same HTML
// tags as English, and every key the code asks for exists.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { LANGS, ROOT } = require('./helpers');

const load = (dir, l) => JSON.parse(fs.readFileSync(path.join(ROOT, dir, l + '.json'), 'utf8'));
const tags = v => (typeof v === 'string' ? v : JSON.stringify(v)).match(/<\/?\w+/g)?.sort().join() || '';
const placeholders = v => (typeof v === 'string' ? v : Object.values(v).join(' ')).match(/\{\w+\}/g)?.sort().filter((x, i, a) => a.indexOf(x) === i).join() || '';

test.describe('dictionaries', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'runs once'));

  for (const dir of ['js/i18n', 'js/portal/i18n']) {
    test(`${dir}: same keys, tags and placeholders in every language`, () => {
      const en = load(dir, 'en');
      for (const l of LANGS.filter(x => x !== 'en')) {
        const d = load(dir, l);
        expect(Object.keys(d).filter(k => !(k in en)), `${l}: extra keys`).toEqual([]);
        expect(Object.keys(en).filter(k => !(k in d)), `${l}: missing keys`).toEqual([]);
        const badTags = Object.keys(en).filter(k => tags(en[k]) !== tags(d[k]));
        expect(badTags, `${l}: HTML tags differ from English`).toEqual([]);
        const badVars = Object.keys(en).filter(k => placeholders(en[k]) !== placeholders(d[k]));
        expect(badVars, `${l}: {placeholders} differ from English`).toEqual([]);
      }
    });
  }

  test('every static data-i18n key used by the site exists', () => {
    const en = load('js/i18n', 'en');
    const files = ['index.html', '404.html', 'js/layout.js', 'js/search.js', 'js/site.js']
      .concat(['about', 'academics', 'enrichment', 'admissions', 'student-life'].map(p => p + '/index.html'));
    const used = new Set();
    for (const f of files) {
      const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
      for (const m of s.matchAll(/data-i18n(?:-html|-aria|-ph|-g)?="([^"$]+)"/g)) used.add(m[1]);
      for (const m of s.matchAll(/\bt\('([a-z][\w.-]*)'/g)) used.add(m[1]);
    }
    expect([...used].filter(k => !(k in en))).toEqual([]);
  });

  test('every static key used by the portal exists', () => {
    const en = load('js/portal/i18n', 'en');
    const s = ['portal/index.html', 'js/portal/demo.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
    const used = new Set();
    for (const m of s.matchAll(/data-i18n(?:-html|-aria|-ph)?="([^"]+)"/g)) used.add(m[1]);
    // only complete literal keys (t('a.b')), not prefixes built at runtime (t('status.' + x))
    for (const m of s.matchAll(/\bt\('([a-z][\w.]*[a-zA-Z])'\s*[,)]/g)) used.add(m[1]);
    expect([...used].filter(k => !(k in en))).toEqual([]);
  });
});
