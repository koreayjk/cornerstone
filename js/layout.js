// Shared layout for the public site: skip link, proposal banner, nav (with dropdowns),
// mobile menu, page sub-nav and footer. One menu config feeds every page.
// Usage in a page:
//   <body data-page="about">            ('' or omitted = home)
//   <div id="layout-top"></div><script src="js/layout.js"></script><script>Layout.top()</script>
//   ... <main> ...
//   <div id="layout-bottom"></div><script>Layout.bottom()</script>
// Labels use i18n keys (js/i18n/<lang>.json); English text is the fallback in the markup.
const Layout = (() => {
  const root = new URL('../', document.currentScript.src).href; // site root (works under /cornerstone/)
  const page = document.body.dataset.page || '';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  // Old site menu, mirrored. ready:false = no source content yet (hidden until the school provides it).
  const MENU = [
    { id: 'about', label: 'About', items: [
      { id: 'school', label: 'Cornerstone Christian Academy' },
      { id: 'history', label: 'Our History' },
      { id: 'accreditation', label: 'Accreditation' },
      { id: 'pack', label: 'PACK' },
      { id: 'faculty', label: 'Faculty and Staff', ready: false },
      { id: 'board', label: 'Board of Directors', ready: false },
      { id: 'employment', label: 'Employment Opportunities', ready: false }] },
    { id: 'academics', label: 'Academics', items: [
      { id: 'program', label: 'Academic Program' },
      { id: 'divisions', label: 'School Divisions' },
      { id: 'kindergarten', label: 'Kindergarten', ready: false },
      { id: 'options', label: 'Program Options' },
      { id: 'grades1-5', label: 'Grades 1-5 Curriculum', ready: false },
      { id: 'upper', label: 'Curriculum – Upper Grades', ready: false },
      { id: 'dual', label: 'Dual Credit with Blinn College' }] },
    { id: 'enrichment', label: 'Enrichment', items: [
      { id: 'athletics', label: 'Cougar Athletics' },
      { id: 'afternoons', label: 'Art, Music & Computers' },
      { id: 'art', label: 'Art', ready: false },
      { id: 'computer', label: 'Computer Lab', ready: false },
      { id: 'language', label: 'Foreign Language' }] },
    { id: 'admissions', label: 'Admissions', items: [
      { id: 'apply', label: 'Application for Admission' },
      { id: 'prepare', label: 'What to Prepare' },
      { id: 'tuition', label: 'Tuition', ready: false },
      { id: 'handbook', label: 'Parent and Student Handbook', ready: false },
      { id: 'supplies', label: '2026-27 School Supply Lists', ready: false },
      { id: 'uniforms', label: 'Uniforms and Dress Code', ready: false },
      { id: 'international', label: 'International Students' },
      { id: 'inquire', label: 'Inquiry Form' },
      { id: 'visit', label: 'Visit Us' }] },
    { id: 'student-life', label: 'Student Life', items: [
      { id: 'chapel', label: 'Chapel' },
      { id: 'character', label: 'Cougar of the Week & The Bee Kind People' },
      { id: 'trips', label: 'Field Trips / Field Studies', ready: false },
      { id: 'service', label: 'Service Projects' },
      { id: 'fundraisers', label: 'Fundraisers', ready: false }] }
  ];
  const ready = m => m.items.filter(i => i.ready !== false);
  const href = (m, i) => root + m.id + '/' + (i ? '#' + i.id : '');
  const lbl = (key, text) => `<span data-i18n="${key}">${esc(text)}</span>`;
  const globe = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z"/></svg>';
  const mag = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  // search code is loaded on first use; "/" opens it when not typing in a field
  let searchLoading = null;
  function openSearch() {
    if (typeof Search !== 'undefined') return Search.open();
    if (!searchLoading) searchLoading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = root + 'js/search.js'; s.onload = res; s.onerror = rej; document.body.appendChild(s) });
    searchLoading.then(() => Search.open());
  }
  addEventListener('keydown', e => {
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); openSearch() }
  });
  const crest = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="crest" viewBox="0 0 44 52"><path d="M3 4 H41 V22 C41 36 32 45 22 50 C12 45 3 36 3 22 Z" fill="#111113" stroke="#E3C46E" stroke-width="1.8"/><g fill="#E3C46E"><rect x="20.2" y="9" width="3.6" height="33"/><rect x="11" y="17.2" width="22" height="3.6"/><circle cx="22" cy="8.6" r="2.6"/><circle cx="19.6" cy="11" r="1.7"/><circle cx="24.4" cy="11" r="1.7"/><circle cx="10.6" cy="19" r="2.6"/><circle cx="13" cy="16.6" r="1.7"/><circle cx="13" cy="21.4" r="1.7"/><circle cx="33.4" cy="19" r="2.6"/><circle cx="31" cy="16.6" r="1.7"/><circle cx="31" cy="21.4" r="1.7"/><circle cx="22" cy="42.4" r="2.6"/><circle cx="19.6" cy="40" r="1.7"/><circle cx="24.4" cy="40" r="1.7"/></g></symbol></defs></svg>`;

  function top() {
    const menu = MENU.map(m => `<div class="mi${m.id === page ? ' on' : ''}"><a class="mt" href="${href(m)}"${m.id === page ? ' aria-current="page"' : ''}>${lbl('m.' + m.id, m.label)}</a>
<div class="dd"><div class="dd-in">${ready(m).map(i => `<a href="${href(m, i)}">${lbl('m.' + m.id + '.' + i.id, i.label)}</a>`).join('')}</div></div></div>`).join('');
    const mob = MENU.map(m => `<div class="mg"><a class="mgt" href="${href(m)}">${lbl('m.' + m.id, m.label)}</a>${ready(m).map(i => `<a href="${href(m, i)}">${lbl('m.' + m.id + '.' + i.id, i.label)}</a>`).join('')}</div>`).join('');
    document.getElementById('layout-top').outerHTML = `<a class="skip" href="#main" data-i18n="a11y.skip">Skip to content</a>${crest}
<aside class="prop" aria-label="Notice" data-i18n-aria="a11y.notice" data-i18n="prop">Design proposal for Cornerstone Christian Academy — not the official school website. Portal uses demo data.</aside>
<header class="nav" id="nav"><div class="wrap">
<a class="brand" href="${root}"><svg><use href="#crest"/></svg>Cornerstone</a>
<nav class="menu" aria-label="Main">${menu}</nav>
<div class="nr"><button class="sbtn-ic" type="button" onclick="Layout.openSearch()" aria-label="Search" data-i18n-aria="search.open">${mag}</button><label class="lang-pick dark">${globe}<select class="lang" aria-label="Language" data-i18n-aria="lang.label" onchange="I18N.set(this.value)"><option value="en">English</option><option value="ko">한국어</option><option value="zh">中文</option><option value="es">Español</option></select></label><a class="lnk" href="${root}portal/" data-i18n="nav.portal">Family Portal</a><a class="pill gold" href="${root}admissions/" data-i18n="nav.visit">Visit</a>
<button class="burger" onclick="openMenu()" aria-label="Menu" data-i18n-aria="a11y.menu" aria-expanded="false" aria-controls="mnav"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><path d="M4 9h16M4 15h16"/></svg></button></div>
</div></header>
<div class="mnav" id="mnav" role="dialog" aria-modal="true" aria-label="Menu" data-i18n-aria="a11y.menu" onclick="if(event.target.tagName==='A'||event.target.closest('a')||event.target===this)closeMenu()">
<button class="mclose" onclick="closeMenu()" aria-label="Close menu" data-i18n-aria="a11y.closeMenu">✕</button>
<button class="msearch" type="button" onclick="closeMenu();Layout.openSearch()">${mag}<span data-i18n="search.open">Search</span></button>
${mob}<div class="mg"><a class="mgt" href="${root}portal/" style="color:var(--gold2)" data-i18n="nav.portal">Family Portal</a></div>
</div>`;
    // sub-nav for section pages: one chip per visible section, highlighted while in view
    const m = MENU.find(x => x.id === page);
    if (m) {
      // #subnav sits further down the page, so fill it once the document is parsed
      // (DOMContentLoaded fires before I18N.init's async apply, so labels still get translated)
      addEventListener('DOMContentLoaded', () => {
        const sn = document.getElementById('subnav');
        if (!sn) return;
        sn.innerHTML = `<div class="wrap">${ready(m).map(i => `<a href="#${i.id}">${lbl('m.' + m.id + '.' + i.id, i.label)}</a>`).join('')}</div>`;
        // a non-English language is only active once its dictionary is loaded, so re-apply is safe
        if (typeof I18N !== 'undefined' && I18N.lang !== 'en') I18N.apply(sn);
        const links = [...sn.querySelectorAll('a')];
        const io = new IntersectionObserver(es => es.forEach(e => {
          if (!e.isIntersecting) return;
          links.forEach(a => { const on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('on', on); if (on) { a.setAttribute('aria-current', 'true'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }) } else a.removeAttribute('aria-current') });
        }), { rootMargin: '-45% 0px -50% 0px' });
        ready(m).forEach(i => { const s = document.getElementById(i.id); if (s) io.observe(s) });
      });
    }
  }

  function bottom() {
    const explore = MENU.map(m => `<li><a href="${href(m)}" data-i18n="m.${m.id}">${esc(m.label)}</a></li>`).join('');
    document.getElementById('layout-bottom').outerHTML = `<footer><div class="wrap">
<div class="fg">
<div><a class="brand" href="${root}" style="color:#1d1d1f"><svg><use href="#crest"/></svg>Cornerstone Christian Academy</a><p style="margin-top:12px;line-height:1.6">Brazos Valley Cornerstone Christian Academy<br><span data-i18n="foot.tagline">Christ-centered · Biblically based · K–12</span></p></div>
<div><h2 data-i18n="foot.visit">Visit</h2><ul><li><a href="https://www.google.com/maps/dir/?api=1&amp;destination=3200+Cavitt+Avenue%2C+Bryan%2C+TX+77801" target="_blank" rel="noopener">3200 Cavitt Avenue<br>Bryan, Texas 77801</a></li><li><a href="tel:9796948200">(979) 694-8200</a></li><li><a href="mailto:office@bvcca.com">office@bvcca.com</a></li></ul></div>
<div><h2 data-i18n="foot.explore">Explore</h2><ul>${explore}</ul></div>
<div><h2 data-i18n="foot.families">Families</h2><ul><li><a href="${root}portal/" data-i18n="nav.portal">Family Portal</a></li><li><a href="${root}portal/" data-i18n="foot.docs">Request documents</a></li><li><a href="${root}about/#pack">PACK</a></li><li><a href="#" onclick="toast(t('foot.giveToast'));return false" data-i18n="foot.give">Give</a></li></ul></div>
</div>
<div class="fb"><span data-i18n="foot.copy">© 2026 Brazos Valley Cornerstone Christian Academy. All rights reserved.</span><span><span data-i18n="foot.acc">Accredited by Cognia · SEVP Certified · Go Cougars</span><span class="legal-links"><a href="${root}privacy/" data-i18n="foot.privacy">Privacy</a><a href="${root}terms/" data-i18n="foot.terms">Terms</a></span></span></div>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  }
  return { top, bottom, MENU, root, openSearch };
})();
