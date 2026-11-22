// Student Life photo gallery: category filter + full-screen viewer (<dialog>).
// Photos come from the school's previous website (img/gallery/NN.avif|webp, metadata stripped).
(() => {
  const gal = $('#gal'), lb = $('#lb');
  if (!gal || !lb) return;
  const items = [...gal.querySelectorAll('.gi')];
  const img = lb.querySelector('img'), num = lb.querySelector('.lb-n');
  const tr = k => (typeof I18N !== 'undefined' ? t(k) : '');
  let list = items, cur = 0, x0 = null;

  $$('.gfilter button').forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.f;
    $$('.gfilter button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    items.forEach(i => { i.hidden = f !== 'all' && i.dataset.cat !== f });
    list = items.filter(i => !i.hidden);
  }));

  function show(i) {
    cur = (i + list.length) % list.length;
    const it = list[cur], pic = it.querySelector('img');
    // reuse the format the browser already chose for the thumbnail (AVIF or WebP)
    img.src = pic.currentSrc || pic.src;
    img.alt = tr('sl.gal.' + it.dataset.cat);
    num.textContent = `${cur + 1} / ${list.length}`;
  }
  items.forEach(it => it.addEventListener('click', () => { show(list.indexOf(it)); lb.showModal() }));
  lb.querySelector('.lb-x').addEventListener('click', () => lb.close());
  lb.querySelector('.lb-p').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.lb-nx').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close() });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
  });
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });
})();
