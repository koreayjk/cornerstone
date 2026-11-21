// Site search (public pages only), loaded on first use by Layout.openSearch().
// On first open it fetches every page in Layout.MENU (+ home), translates a copy of each
// <main> section into the current language with I18N.apply, and searches that text.
// The index is rebuilt when the language changes. Matching is case- and accent-insensitive
// (so "gracia" finds "gracía"); CJK works as plain substring matching.
const Search = (() => {
  const root = Layout.root;
  const PAGES = [{ path: '', key: 'search.home', label: 'Home' }].concat(Layout.MENU.map(m => ({ path: m.id + '/', key: 'm.' + m.id, label: m.label })));
  const tr = (k, fb) => (typeof I18N !== 'undefined' ? t(k) : fb);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  // per-code-point folding keeps a 1:1 index map between folded and original text
  // (accents are stripped only when that leaves one character, e.g. é -> e; Hangul syllables,
  // which decompose into several jamo, are kept whole)
  const fold = s => [...s].map(c => { const d = c.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); const k = (d.length === 1 ? d : c).toLowerCase(); return k.length === 1 ? k : c });
  let index = null, indexLang = null, building = null, el = null, back = null, timer = 0;

  async function build() {
    const lang = typeof I18N !== 'undefined' ? I18N.lang : 'en';
    const parser = new DOMParser();
    const docs = await Promise.all(PAGES.map(async p => {
      const r = await fetch(root + p.path);
      return [p, parser.parseFromString(await r.text(), 'text/html')];
    }));
    const out = [];
    for (const [p, doc] of docs) {
      const main = doc.querySelector('main');
      if (!main) continue;
      let lastId = '';
      for (const sec of main.querySelectorAll(':scope > section')) {
        if (sec.id) lastId = sec.id;
        const c = sec.cloneNode(true);
        c.querySelectorAll('script,style,svg,button,[aria-hidden="true"]').forEach(n => n.remove());
        if (lang !== 'en') I18N.apply(c);
        // keep block boundaries as spaces so words from adjacent elements don't merge
        c.querySelectorAll('br,p,div,h1,h2,h3,h4,li,span,small,b').forEach(n => n.after(' '));
        const text = c.textContent.replace(/\s+/g, ' ').trim();
        if (!text) continue;
        const h = c.querySelector('h1,h2,h3');
        out.push({ page: tr(p.key, p.label), url: root + p.path + (lastId && lastId !== 'top' ? '#' + lastId : ''), heading: h ? h.textContent.replace(/\s+/g, ' ').trim() : tr(p.key, p.label), text, ftext: fold(text), fhead: fold(h ? h.textContent : '').join('') });
      }
    }
    index = out; indexLang = lang;
  }
  function ensure() {
    const lang = typeof I18N !== 'undefined' ? I18N.lang : 'en';
    if (index && indexLang === lang) return Promise.resolve();
    if (!building) building = build().finally(() => { building = null });
    return building;
  }
  function find(q) {
    const terms = fold(q.trim()).join('').split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    const res = [];
    for (const e of index) {
      const ft = e.ftext.join('');
      if (!terms.every(x => ft.includes(x) || e.fhead.includes(x))) continue;
      const score = terms.reduce((s, x) => s + (e.fhead.includes(x) ? 10 : 0) + ft.split(x).length - 1, 0);
      res.push({ e, score, terms });
    }
    return res.sort((a, b) => b.score - a.score).slice(0, 12);
  }
  function snippet(e, terms) {
    const ft = e.ftext.join('');
    let at = -1;
    for (const x of terms) { const i = ft.indexOf(x); if (i >= 0 && (at < 0 || i < at)) at = i }
    const chars = [...e.text];
    const start = Math.max(0, at - 50), end = Math.min(chars.length, (at < 0 ? 0 : at) + 140);
    // mark matches using the folded copy, which has the same code-point positions
    const marks = new Array(chars.length).fill(false);
    for (const x of terms) { let i = ft.indexOf(x); while (i >= 0) { for (let k = 0; k < [...x].length; k++) marks[i + k] = true; i = ft.indexOf(x, i + 1) } }
    let html = '', open = false;
    for (let i = start; i < end; i++) {
      if (marks[i] && !open) { html += '<mark>'; open = true }
      if (!marks[i] && open) { html += '</mark>'; open = false }
      html += esc(chars[i]);
    }
    if (open) html += '</mark>';
    return (start > 0 ? '… ' : '') + html + (end < chars.length ? ' …' : '');
  }
  function render(q) {
    const list = el.querySelector('.sr-list'), status = el.querySelector('.sr-status');
    if (!q.trim()) { list.innerHTML = ''; status.textContent = tr('search.hint', ''); return }
    const r = find(q);
    status.textContent = r.length ? t('search.count', { n: r.length }) : t('search.none', { q });
    list.innerHTML = r.map(({ e, terms }) => `<li><a href="${esc(e.url)}"><small>${esc(e.page)}</small><b>${esc(e.heading)}</b><span>${snippet(e, terms)}</span></a></li>`).join('');
  }
  function build_ui() {
    el = document.createElement('div');
    el.className = 'search'; el.id = 'search';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="sr-panel">
<div class="sr-bar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
<input type="search" autocomplete="off" spellcheck="false"><button class="sr-x" type="button">✕</button></div>
<p class="sr-status" role="status" aria-live="polite"></p><ul class="sr-list"></ul></div>`;
    document.body.appendChild(el);
    const input = el.querySelector('input');
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => ensure().then(() => render(input.value)), 80) });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { const a = el.querySelector('.sr-list a'); if (a) a.click() } });
    el.querySelector('.sr-x').addEventListener('click', close);
    el.addEventListener('click', e => { if (e.target === el) close(); if (e.target.closest('.sr-list a')) close(true) });
  }
  function labels() {
    el.setAttribute('aria-label', tr('search.open', 'Search'));
    const input = el.querySelector('input');
    input.placeholder = tr('search.ph', 'Search'); input.setAttribute('aria-label', tr('search.ph', 'Search'));
    el.querySelector('.sr-x').setAttribute('aria-label', tr('search.close', 'Close search'));
  }
  function open() {
    if (!el) build_ui();
    labels();
    back = document.activeElement;
    el.classList.add('open'); document.body.style.overflow = 'hidden';
    const input = el.querySelector('input');
    input.focus(); input.select();
    el.querySelector('.sr-status').textContent = tr('search.loading', '');
    ensure().then(() => render(input.value)).catch(() => { el.querySelector('.sr-status').textContent = tr('search.error', '') });
  }
  function close(navigating) {
    if (!el || !el.classList.contains('open')) return;
    el.classList.remove('open'); document.body.style.overflow = '';
    if (!navigating && back && back.focus) back.focus();
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') close() });
  if (typeof I18N !== 'undefined') I18N.onChange(() => { if (el && el.classList.contains('open')) { labels(); ensure().then(() => render(el.querySelector('input').value)) } });
  return { open, close, find: q => ensure().then(() => find(q)) };
})();
