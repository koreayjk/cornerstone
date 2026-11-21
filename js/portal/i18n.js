// Portal i18n: JSON dictionaries in js/portal/i18n/<lang>.json.
// t(key, vars) looks up a string, fills {placeholders}, and picks a plural
// form when the entry is an object ({one, other, ...}) and vars.n is set.
// Missing keys fall back to English, then to the key itself.
const I18N = (() => {
  const LANGS = {
    en: { name: 'English', locale: 'en-US' },
    ko: { name: '한국어', locale: 'ko-KR' },
    zh: { name: '中文', locale: 'zh-CN' },
    es: { name: 'Español', locale: 'es-US' }
  };
  const KEY = 'cca.portal.lang';
  const base = document.currentScript.src.replace(/i18n\.js(\?.*)?$/, 'i18n/');
  const dicts = {};
  let lang = 'en';
  const listeners = [];

  function detect() {
    try { const s = localStorage.getItem(KEY); if (s && LANGS[s]) return s; } catch (e) {}
    for (const l of navigator.languages || [navigator.language || 'en']) {
      const k = String(l).slice(0, 2).toLowerCase();
      if (LANGS[k]) return k;
    }
    return 'en';
  }
  async function load(l) {
    if (dicts[l]) return dicts[l];
    const r = await fetch(base + l + '.json');
    if (!r.ok) throw new Error('i18n: cannot load ' + l);
    return (dicts[l] = await r.json());
  }
  function t(key, vars) {
    let v = (dicts[lang] && dicts[lang][key]) ?? (dicts.en && dicts.en[key]) ?? key;
    if (v && typeof v === 'object') {
      const n = vars && vars.n != null ? vars.n : 0;
      v = v[new Intl.PluralRules(LANGS[lang].locale).select(n)] ?? v.other;
    }
    return vars ? String(v).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : v;
  }
  // Fill static markup: data-i18n (text), data-i18n-ph (placeholder), data-i18n-aria (aria-label).
  function apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    root.querySelectorAll('select.lang').forEach(s => { s.value = lang; });
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
    document.title = t('meta.title');
  }
  async function set(l) {
    if (!LANGS[l]) l = 'en';
    await Promise.all([load('en'), load(l)]);
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    apply();
    listeners.forEach(fn => fn(l));
  }
  async function init() {
    try { await set(detect()); }
    catch (e) { console.warn(e); try { await set('en'); } catch (e2) { console.warn(e2); } }
    document.documentElement.classList.remove('i18n-pending');
  }
  // Formatting helpers. Dates are ISO strings ('2026-11-18' or '2026-11-18T15:12').
  const loc = () => LANGS[lang].locale;
  const toDate = iso => (iso instanceof Date ? iso : new Date(iso.length === 10 ? iso + 'T00:00' : iso));
  const fmt = {
    day: iso => new Intl.DateTimeFormat(loc(), { month: 'short', day: 'numeric' }).format(toDate(iso)),
    dayNum: iso => String(toDate(iso).getDate()).padStart(2, '0'),
    mon: iso => new Intl.DateTimeFormat(loc(), { month: 'short' }).format(toDate(iso)).replace('.', '').toUpperCase(),
    time: iso => new Intl.DateTimeFormat(loc(), { hour: 'numeric', minute: '2-digit' }).format(toDate(iso)),
    long: iso => new Intl.DateTimeFormat(loc(), { year: 'numeric', month: 'long', day: 'numeric' }).format(toDate(iso))
  };
  // Pick a translated field from a record with optional {i18n:{ko:{title,body}}}.
  const tr = (rec, field) => (rec.i18n && rec.i18n[lang] && rec.i18n[lang][field]) || rec[field];

  return {
    LANGS, t, apply, set, init, fmt, tr,
    en: key => (dicts.en && dicts.en[key]) || key,
    get lang() { return lang; },
    onChange: fn => listeners.push(fn)
  };
})();
const t = I18N.t;
