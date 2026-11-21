// Admissions inquiry form (admissions/#inquire). Static site, no server: on submit it
// validates, then opens the visitor's email app with a pre-filled message to the office.
// Field labels in the email are English so the office can read every inquiry; the
// visitor's own text is sent as written. Nothing is stored.
(() => {
  const form = document.getElementById('inqForm');
  if (!form) return;
  const OFFICE = 'office@bvcca.com';
  const $f = id => document.getElementById(id);
  const tt = (k, v) => (typeof I18N !== 'undefined' ? t(k, v) : k);
  // option values stay English (they go into the email); labels follow the UI language
  function fillSelects() {
    const g = $f('inqGrade'), s = $f('inqStart'), gv = g.value, sv = s.value;
    g.innerHTML = `<option value="">${tt('inq.choose')}</option><option value="Pre-K">${tt('inq.gradePK')}</option><option value="Kindergarten">${tt('inq.gradeK')}</option>` +
      Array.from({ length: 12 }, (_, i) => `<option value="Grade ${i + 1}">${tt('inq.gradeN', { n: i + 1 })}</option>`).join('');
    s.innerHTML = [['As soon as possible', 'inq.start.now'], ['Next semester', 'inq.start.sem'], ['Next school year', 'inq.start.year'], ['Not sure yet', 'inq.start.unsure']]
      .map(([v, k]) => `<option value="${v}">${tt(k)}</option>`).join('');
    g.value = gv; s.value = sv || 'As soon as possible';
  }
  function setErr(id, msg) {
    const el = $f(id), e = $f(id + '-e');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (e) e.textContent = msg || '';
  }
  function validate() {
    const name = $f('inqName').value.trim(), email = $f('inqEmail').value.trim(), grade = $f('inqGrade').value;
    const errs = [];
    setErr('inqName', name ? '' : tt('inq.e.name')); if (!name) errs.push('inqName');
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setErr('inqEmail', okEmail ? '' : tt(email ? 'inq.e.emailBad' : 'inq.e.email')); if (!okEmail) errs.push('inqEmail');
    setErr('inqGrade', grade ? '' : tt('inq.e.grade')); if (!grade) errs.push('inqGrade');
    return errs;
  }
  function mailto() {
    const v = id => $f(id).value.trim(), yes = id => ($f(id).checked ? 'Yes' : 'No');
    const lines = [
      'Admissions inquiry (sent from the website)', '',
      `Parent/guardian: ${v('inqName')}`, `Email: ${v('inqEmail')}`, `Phone: ${v('inqPhone') || '—'}`,
      `Grade of interest: ${v('inqGrade')}`, `Start: ${v('inqStart')}`, `Preferred language: ${v('inqLang')}`,
      `Free 3-day trial: ${yes('inqTrial')}`, `Form I-20 (F-1): ${yes('inqIntl')}`, '', 'Message:', v('inqMsg') || '—'
    ];
    const subject = `Admissions inquiry — ${v('inqName')} (${v('inqGrade')})`;
    return `mailto:${OFFICE}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const errs = validate(), box = $f('inqErr');
    if (errs.length) {
      box.hidden = false; box.textContent = tt('inq.e.summary', { n: errs.length });
      $f(errs[0]).focus();
      return;
    }
    box.hidden = true;
    form.dataset.mailto = mailto(); // exposed for tests
    location.href = form.dataset.mailto;
    $f('inqDone').hidden = false;
  });
  // clear a field's error as soon as it is fixed
  ['inqName', 'inqEmail', 'inqGrade'].forEach(id => $f(id).addEventListener('change', () => { if ($f(id).getAttribute('aria-invalid') === 'true') validate() }));
  // filled once the dictionary is ready (I18N.onChange also fires on the first load), so labels never flash as raw keys
  if (typeof I18N === 'undefined') fillSelects();
  else I18N.onChange(() => { fillSelects(); if (!$f('inqErr').hidden) { const n = validate().length; $f('inqErr').textContent = tt('inq.e.summary', { n }) } });
})();
