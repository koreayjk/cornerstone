// Shared helpers for the Playwright checks.
const fs = require('fs');
const path = require('path');

const LANGS = ['en', 'ko', 'zh', 'es'];
const PAGES = ['', 'about/', 'academics/', 'enrichment/', 'admissions/', 'student-life/'];
const AXE_SRC = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const ROOT = path.join(__dirname, '..');

// Open a page with a language preselected (the site reads localStorage 'cca.lang').
// Collects page errors and same-origin HTTP errors; external hosts (fonts, CDNs) are ignored.
async function open(page, url, lang) {
  const problems = [];
  await page.addInitScript(l => { try { localStorage.setItem('cca.lang', l) } catch (e) {} }, lang);
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('response', r => {
    if (r.status() >= 400 && r.url().startsWith('http://localhost')) problems.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url);
  await page.waitForFunction(l => typeof I18N !== 'undefined' && I18N.lang === l && !document.documentElement.classList.contains('i18n-pending'), lang);
  return problems;
}

// Scroll through the page so lazy images and reveal animations run.
async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 20)) }
    scrollTo(0, 0);
  });
}

// Layout problems: horizontal overflow (ignoring intentional scrollers) and leftover i18n keys.
async function layoutIssues(page, scope = 'body') {
  return page.evaluate(scope => {
    const root = document.querySelector(scope);
    const w = innerWidth;
    const overflow = document.documentElement.scrollWidth > w ? [`page scrollWidth ${document.documentElement.scrollWidth} > ${w}`] : [];
    const wide = [...root.querySelectorAll('*')].filter(e => {
      const r = e.getBoundingClientRect();
      return r.width && r.right > w + 1 && !e.closest('.track,.scene,.subnav,.dd,.tbl-wrap,.th-list') && getComputedStyle(e).position !== 'fixed';
    }).slice(0, 3).map(e => `wide: ${e.tagName.toLowerCase()}.${e.className}`);
    const keys = [...root.querySelectorAll('*')].filter(e => e.children.length === 0 && /^[a-z0-9-]+\.[a-zA-Z0-9_.-]+$/.test(e.textContent.trim()))
      .slice(0, 5).map(e => `untranslated key: ${e.textContent.trim()}`);
    return overflow.concat(wide, keys);
  }, scope);
}

async function axe(page, context) {
  await page.addScriptTag({ content: AXE_SRC });
  return page.evaluate(async ctx => {
    const r = await axe.run(ctx ? document.querySelector(ctx) : document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'], rules: { region: { enabled: !ctx } } });
    return r.violations.map(v => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(' ')}`);
  }, context || null);
}

module.exports = { LANGS, PAGES, ROOT, open, scrollThrough, layoutIssues, axe };
