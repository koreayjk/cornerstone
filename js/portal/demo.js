// Family Portal demo: in-memory fake data (resets on reload). All names are fictional.
// Roles: parent (one account, two children), teacher, admin (front office).
// Enumerations (categories, audiences, document types, statuses...) are stored
// as codes and translated at render time. Free text written by people stays as
// written; announcements and events may carry optional translations in `i18n`.
const localISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const S = {
role: null, view: 'home', thread: 1, child: 0, rejecting: null,
children: [
{ key: 'grace', name: 'Grace Kim', grade: 10, division: 'upper', intl: true, id: 'CCA-2026-0142', dob: 'March 14, 2011', entered: 'August 2024',
  grades: [
  { c: 'English II (Honors)', t: 'Mrs. Taylor', g: 'A', p: 96 }, { c: 'Algebra II', t: 'Mr. Collins', g: 'A-', p: 92 }, { c: 'Biology', t: 'Dr. Reyes', g: 'A', p: 95 },
  { c: 'World History', t: 'Mr. Bennett', g: 'B+', p: 89 }, { c: 'Bible: Life of Christ', t: 'Pastor Hale', g: 'A', p: 98 }, { c: 'Spanish II', t: 'Sra. Morales', g: 'A-', p: 91 }],
  attendance: { present: 62, absent: 1, tardy: 0, excused: 1, excusedOn: '2026-10-09' } },
{ key: 'joshua', name: 'Joshua Kim', grade: 4, division: 'lower', id: 'CCA-2026-0217', dob: 'September 2, 2017', entered: 'August 2023',
  grades: [
  { c: 'Reading & Language Arts', t: 'Mrs. Allen', g: 'A', p: 95 }, { c: 'Mathematics', t: 'Mrs. Allen', g: 'A-', p: 91 }, { c: 'Science', t: 'Mrs. Allen', g: 'A', p: 94 },
  { c: 'Social Studies', t: 'Mrs. Allen', g: 'B+', p: 88 }, { c: 'Bible', t: 'Mrs. Allen', g: 'A', p: 97 }, { c: 'Spanish', t: 'Sra. Morales', g: 'A', p: 93 }],
  attendance: { present: 61, absent: 2, tardy: 1, excused: 2, excusedOn: '2026-11-03' } }
],
announcements: [
{ id: 1, cat: 'event', aud: 'all', date: '2026-11-18', read: false,
  title: 'Christmas Program & Lessons and Carols',
  body: 'Join us Thursday, December 4 at 6:30 PM in the Sanctuary. Students should arrive by 6:00 PM in Sunday dress. Please RSVP by Nov 28.',
  i18n: {
    ko: { title: '성탄 프로그램 및 구주 탄생 낭독과 캐럴', body: '12월 4일(목) 오후 6시 30분, 본당에서 함께해 주세요. 학생들은 주일 복장으로 오후 6시까지 도착해야 합니다. 11월 28일까지 참석 여부를 알려 주세요.' },
    zh: { title: '圣诞节目暨读经与颂歌', body: '诚邀您于 12 月 4 日（周四）晚 6:30 在礼堂参加。学生须身着主日服装于晚 6:00 前到达。请于 11 月 28 日前回复是否出席。' },
    es: { title: 'Programa de Navidad y Lecciones y Villancicos', body: 'Acompáñenos el jueves 4 de diciembre a las 6:30 p. m. en el Santuario. Los estudiantes deben llegar a las 6:00 p. m. con ropa de domingo. Confirme su asistencia antes del 28 de noviembre.' }
  } },
{ id: 2, cat: 'urgent', aud: 'all', date: '2026-11-15', read: false,
  title: 'Thanksgiving Break — No School Nov 24–28',
  body: 'Campus will be closed for Thanksgiving Break. Classes resume Monday, December 1. Residential students: dormitory schedule has been sent separately.',
  i18n: {
    ko: { title: '추수감사절 방학 — 11월 24–28일 휴교', body: '추수감사절 방학 기간에는 캠퍼스가 문을 닫습니다. 수업은 12월 1일(월)에 다시 시작합니다. 기숙 학생: 기숙사 일정은 별도로 안내했습니다.' },
    zh: { title: '感恩节假期 — 11 月 24–28 日停课', body: '感恩节假期期间校园关闭。12 月 1 日（周一）复课。住宿学生：宿舍安排已另行发送。' },
    es: { title: 'Receso de Acción de Gracias — No hay clases del 24 al 28 de nov.', body: 'El campus estará cerrado durante el receso de Acción de Gracias. Las clases se reanudan el lunes 1 de diciembre. Estudiantes residentes: el horario del dormitorio se envió por separado.' }
  } },
{ id: 3, cat: 'academics', aud: 'upper', date: '2026-11-10', read: true,
  title: 'Upper School Semester Exam Schedule',
  body: 'Semester exams run December 15–18. A detailed schedule and study guides are posted in each course.',
  i18n: {
    ko: { title: '고등부 학기말 시험 일정', body: '학기말 시험은 12월 15–18일에 진행됩니다. 자세한 일정과 학습 가이드는 각 과목에 게시되어 있습니다.' },
    zh: { title: '高中部期末考试安排', body: '期末考试于 12 月 15–18 日举行。详细安排和复习指南已发布在各门课程中。' },
    es: { title: 'Calendario de exámenes semestrales de la Escuela Superior', body: 'Los exámenes semestrales serán del 15 al 18 de diciembre. El horario detallado y las guías de estudio están publicados en cada materia.' }
  } }
],
// date = first day; until = last day (inclusive) for multi-day events; time = local start time
events: [
{ id: 'xmas-program', date: '2026-12-04', time: '18:30', title: 'Christmas Program', s: '6:30 PM · Sanctuary', upcoming: true,
  i18n: { ko: { title: '성탄 프로그램', s: '오후 6:30 · 본당' }, zh: { title: '圣诞节目', s: '晚 6:30 · 礼堂' }, es: { title: 'Programa de Navidad', s: '6:30 p. m. · Santuario' } } },
{ id: 'exams', date: '2026-12-15', until: '2026-12-18', title: 'Semester exams', s: 'Upper School · Dec 15–18', upcoming: true,
  i18n: { ko: { title: '학기말 시험', s: '고등부 · 12월 15–18일' }, zh: { title: '期末考试', s: '高中部 · 12 月 15–18 日' }, es: { title: 'Exámenes semestrales', s: 'Escuela Superior · 15–18 de dic.' } } },
{ id: 'xmas-break', date: '2026-12-19', title: 'Christmas break begins', s: 'Noon dismissal', upcoming: true,
  i18n: { ko: { title: '성탄 방학 시작', s: '정오 하교' }, zh: { title: '圣诞假期开始', s: '中午放学' }, es: { title: 'Comienzan las vacaciones de Navidad', s: 'Salida al mediodía' } } },
{ id: 'spring-sem', date: '2027-01-05', title: 'Spring semester begins', s: 'All grades',
  i18n: { ko: { title: '봄 학기 시작', s: '전 학년' }, zh: { title: '春季学期开始', s: '全体年级' }, es: { title: 'Comienza el semestre de primavera', s: 'Todos los grados' } } },
{ id: 'ptc', date: '2027-02-06', title: 'Parent–Teacher Conferences', s: 'Book a time slot', upcoming: true,
  i18n: { ko: { title: '학부모–교사 상담', s: '상담 시간을 예약하세요' }, zh: { title: '家长会', s: '请预约时段' }, es: { title: 'Conferencias de padres y maestros', s: 'Reserve un horario' } } },
{ id: 'spring-break', date: '2027-03-16', until: '2027-03-20', title: 'Spring break', s: 'No school Mar 16–20',
  i18n: { ko: { title: '봄 방학', s: '3월 16–20일 휴교' }, zh: { title: '春假', s: '3 月 16–20 日停课' }, es: { title: 'Vacaciones de primavera', s: 'No hay clases del 16 al 20 de marzo' } } },
{ id: 'commencement', date: '2027-05-22', title: 'Commencement', s: 'Class of 2027',
  i18n: { ko: { title: '졸업식', s: '2027년 졸업반' }, zh: { title: '毕业典礼', s: '2027 届' }, es: { title: 'Graduación', s: 'Generación 2027' } } }
],
docTypes: ['enrollment', 'attendance', 'transcript', 'reportCard', 'goodStanding', 'immunization', 'i20'],
// status: 0 submitted · 1 in review · 2 ready · 3 rejected (reason is staff free text, shown as written)
requests: [
{ id: 100, student: 'grace', type: 'i20', purpose: 'Visa renewal', lang: 'en', copies: 1, delivery: 'digital', date: '2026-11-05', status: 3, reason: 'Please upload a copy of the current passport photo page, then submit again.' },
{ id: 101, student: 'grace', type: 'enrollment', purpose: 'Visa / consulate', lang: 'en', copies: 1, delivery: 'digital', date: '2026-11-12', status: 2 },
{ id: 102, student: 'grace', type: 'transcript', purpose: 'Summer program application', lang: 'en', copies: 2, delivery: 'digital', date: '2026-11-17', status: 1 },
{ id: 103, student: 'joshua', type: 'attendance', purpose: null, lang: 'en_ko', copies: 1, delivery: 'pickup', date: '2026-11-19', status: 0 }
],
// owner = which staff account sees the thread (taylor = teacher demo, office = admin demo)
threads: [
{ id: 1, owner: 'taylor', student: 'grace', name: 'Mrs. Sarah Taylor', subj: 'English II', subjKey: 'msg.homeroom', ini: 'ST', unreadP: true, unreadT: false, msgs: [
  { from: 'staff', text: 'Hello Mr. and Mrs. Kim — Grace’s essay on Hebrews 11 was outstanding. I’d love to enter it in the regional writing competition. May I?', at: '2026-11-18T15:12' }] },
{ id: 2, owner: 'office', student: 'grace', nameKey: 'msg.office', subjKey: 'msg.admin', ini: 'FO', unreadP: false, unreadT: false, msgs: [
  { from: 'staff', text: 'Your Enrollment Verification Letter is ready to download in Documents.', at: '2026-11-14T10:02' },
  { from: 'parent', text: 'Thank you so much!', at: '2026-11-14T10:40' }] },
{ id: 3, owner: 'collins', student: 'grace', name: 'Mr. Collins', subj: 'Algebra II', ini: 'MC', unreadP: false, unreadT: false, msgs: [
  { from: 'parent', text: 'Could Grace get extra practice for the Unit 4 test?', at: '2026-11-06T19:15' },
  { from: 'staff', text: 'Absolutely — I’ve posted a practice set and I’m available Tuesdays after school.', at: '2026-11-07T08:01' }] },
{ id: 4, owner: 'allen', student: 'joshua', name: 'Mrs. Allen', subj: 'Grade 4', subjKey: 'msg.homeroom', ini: 'MA', unreadP: true, unreadT: false, msgs: [
  { from: 'staff', text: 'Joshua read the Scripture passage aloud in chapel this morning — clear and confident. You would have been proud!', at: '2026-11-19T11:20' }] },
{ id: 5, owner: 'office', student: 'joshua', nameKey: 'msg.office', subjKey: 'msg.admin', ini: 'FO', unreadP: false, unreadT: true, msgs: [
  { from: 'parent', text: 'Hello — could the attendance certificate for Joshua include a Korean translation? We will pick it up at the office.', at: '2026-11-19T08:45' }] }
]
};
const ROLES = ['parent', 'teacher', 'admin'];
const STAFF_OWNER = { teacher: 'taylor', admin: 'office' };
const STEPS = ['submitted', 'review', 'ready'];
const TR_LANGS = ['ko', 'zh', 'es'];
const AUDS = ['all', 'lower', 'middle', 'upper', 'intl'];
const CATS = ['academics', 'event', 'urgent', 'community'];
const ICON = {
home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
ann: '<path d="M4 10v4h3l6 4V6L7 10H4zM17 9a4 4 0 0 1 0 6"/>',
msg: '<path d="M4 5h16v11H8l-4 4z"/>',
acad: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"/>',
doc: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
cal: '<path d="M4 6h16v15H4zM4 10h16M8 3v5M16 3v5"/>',
inbox: '<path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5"/>'
};
const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${ICON[k]}</svg>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const tagCls = c => c === 'urgent' ? 'urgent' : c === 'event' ? 'gold' : c === 'academics' ? '' : 'green';
const fmt = I18N.fmt;
const kid = () => S.children[S.child];
const kidBy = key => S.children.find(c => c.key === key);
const gradeTxt = c => t('grade.n', { n: c.grade });
const opts = (list, prefix) => list.map(k => `<option value="${k}">${esc(t(prefix + k))}</option>`).join('');
const sameDay = (a, b) => a.slice(0, 10) === b.slice(0, 10);
const msgTime = iso => `${sameDay(iso, localISO()) ? t('msg.today') : fmt.day(iso)} · ${fmt.time(iso)}`;
const isStaff = () => S.role !== 'parent';
// what each role can see
const myThreads = () => S.role === 'parent' ? S.threads.filter(x => x.student === kid().key) : S.threads.filter(x => x.owner === STAFF_OWNER[S.role]);
const unread = x => S.role === 'parent' ? x.unreadP : x.unreadT;
// a parent sees school-wide notices plus those for their children's divisions (and International if a child is international)
const parentAnns = () => S.announcements.filter(a => a.aud === 'all' || S.children.some(c => c.division === a.aud || (a.aud === 'intl' && c.intl)));
const myRequests = () => S.requests.filter(r => r.student === kid().key);

// nav: [view, label key, icon, count]
function navItems() {
if (S.role === 'parent') {
const ua = parentAnns().filter(a => !a.read).length, um = S.threads.filter(x => x.unreadP).length, rd = S.requests.filter(r => r.status === 2 && !r.dl).length;
return [['home', 'home', 'home'], ['ann', 'announcements', 'ann', ua], ['msg', 'messages', 'msg', um], ['acad', 'academics', 'acad'], ['doc', 'documents', 'doc', rd], ['cal', 'calendar', 'cal']];
}
const um = myThreads().filter(x => x.unreadT).length;
if (S.role === 'teacher') return [['home', 'dashboard', 'home'], ['ann', 'postNotice', 'ann'], ['msg', 'messages', 'msg', um], ['acad', 'gradebook', 'acad'], ['cal', 'calendar', 'cal']];
const pend = S.requests.filter(r => r.status < 2).length;
return [['home', 'dashboard', 'home'], ['doc', 'requests', 'inbox', pend], ['ann', 'postNotice', 'ann'], ['msg', 'messages', 'msg', um], ['cal', 'calendar', 'cal']];
}
function renderNav() {
const items = navItems();
const btn = (k, l, i, c, short) => `<button class="${S.view === k ? 'on' : ''}"${S.view === k ? ' aria-current="page"' : ''} onclick="go('${k}')">${ic(i)}<span>${esc(t((short ? 'tab.' : 'nav.') + l))}</span>${c ? `<span class="ct" aria-label="(${c})">${c}</span>` : ''}</button>`;
document.getElementById('pnav').innerHTML = items.map(([k, l, i, c]) => btn(k, l, i, c)).join('');
document.getElementById('mtab').innerHTML = items.map(([k, l, i, c]) => btn(k, l, i, c, true)).join('');
}
const ME = { parent: ['KF', 'var(--gold)', '#111'], teacher: ['ST', 'var(--navy3)', '#fff'], admin: ['FO', '#3a3a40', '#fff'] };
function renderMe() {
const [ini, bg, fg] = ME[S.role], av = document.getElementById('meAv');
av.textContent = ini; av.style.background = bg; av.style.color = fg;
document.getElementById('meName').textContent = t('me.' + S.role + 'Name');
document.getElementById('meRole').textContent = t('me.' + S.role + 'Role');
}
function go(v) { S.view = v; S.rejecting = null; render(); document.getElementById('pmain').scrollTop = 0 }
function closeLogin() { document.getElementById('login').classList.remove('open') }
function enter(r) {
S.role = r; S.view = 'home'; S.rejecting = null;
S.thread = myThreads()[0] ? myThreads()[0].id : 1;
closeLogin(); document.getElementById('portal').classList.add('open'); document.body.style.overflow = 'hidden';
render(); toast(t('toast.signed' + r[0].toUpperCase() + r.slice(1)))
}
// parent → teacher → admin → parent
function switchRole() { enter(ROLES[(ROLES.indexOf(S.role) + 1) % ROLES.length]) }
function pickChild(i) { S.child = i; const th = myThreads()[0]; if (th) S.thread = th.id; render() }
function exitPortal() { location.href = '../' }
function render() {
if (!S.role) return;
renderMe(); renderNav();
const titles = {
  parent: { home: 'home', ann: 'announcements', msg: 'messages', acad: 'academics', doc: 'documents', cal: 'calendar' },
  teacher: { home: 'dashboard', ann: 'postNotice', msg: 'messages', acad: 'gradebook', cal: 'calendar' },
  admin: { home: 'dashboard', ann: 'postNotice', msg: 'messages', doc: 'requests', cal: 'calendar' } }[S.role];
if (!titles[S.view]) S.view = 'home';
document.getElementById('ptitle').textContent = t('title.' + titles[S.view]);
const V = { parent: P, teacher: T, admin: A }[S.role];
document.getElementById('pbody').innerHTML = V[S.view]();
}
// child switcher (parent only): shown above every child-specific view
function kidBar() {
return `<div class="kids" role="group" aria-label="${esc(t('child.choose'))}"><span>${esc(t('child.viewing'))}</span>${S.children.map((c, i) => `<button class="${i === S.child ? 'on' : ''}" aria-pressed="${i === S.child}" onclick="pickChild(${i})">${esc(c.name.split(' ')[0])} · ${esc(gradeTxt(c))}</button>`).join('')}</div>`;
}

// ---------- calendar export: .ics (Apple / Outlook) and Google Calendar ----------
const ymd = iso => iso.slice(0, 10).replace(/-/g, '');
const nextDay = iso => { const d = new Date(iso.slice(0, 10) + 'T12:00'); d.setDate(d.getDate() + 1); return localISO(d).slice(0, 10) };
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function icsFold(line) { // RFC 5545: lines of at most 75 octets, continuation lines start with a space
  const enc = new TextEncoder(); const out = []; let cur = '';
  for (const ch of line) { if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch } else cur += ch }
  out.push(cur); return out.join('\r\n ');
}
function ics(evs) {
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cornerstone Christian Academy//Family Portal Demo//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Cornerstone Christian Academy', 'X-WR-TIMEZONE:America/Chicago',
  // timed events use TZID=America/Chicago, which RFC 5545 requires to be defined (US Central, current DST rules)
  'BEGIN:VTIMEZONE', 'TZID:America/Chicago',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0600', 'TZOFFSETTO:-0500', 'TZNAME:CDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0600', 'TZNAME:CST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
  'END:VTIMEZONE'];
evs.forEach(e => {
  L.push('BEGIN:VEVENT', `UID:${e.id}-${ymd(e.date)}@cornerstone-demo`, `DTSTAMP:${stamp}`);
  if (e.time) L.push(`DTSTART;TZID=America/Chicago:${ymd(e.date)}T${e.time.replace(':', '')}00`);
  else L.push(`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(nextDay(e.until || e.date))}`);
  L.push(`SUMMARY:${icsEsc(I18N.tr(e, 'title'))}`, `DESCRIPTION:${icsEsc(I18N.tr(e, 's'))}`, `LOCATION:${icsEsc('Cornerstone Christian Academy, 3200 Cavitt Avenue, Bryan, TX 77801')}`, 'END:VEVENT');
});
L.push('END:VCALENDAR');
return L.map(icsFold).join('\r\n') + '\r\n';
}
function downloadIcs(id) {
const evs = id ? S.events.filter(e => e.id === id) : S.events;
const url = URL.createObjectURL(new Blob([ics(evs)], { type: 'text/calendar;charset=utf-8' }));
const a = document.createElement('a'); a.href = url; a.download = (id || 'cornerstone-calendar') + '.ics';
document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
toast(t('toast.icsDone'));
}
function gcalUrl(e) {
const dates = e.time ? `${ymd(e.date)}T${e.time.replace(':', '')}00/${ymd(e.date)}T${e.time.replace(':', '')}00` : `${ymd(e.date)}/${ymd(nextDay(e.until || e.date))}`;
const q = new URLSearchParams({ action: 'TEMPLATE', text: I18N.tr(e, 'title'), dates, details: I18N.tr(e, 's'), location: 'Cornerstone Christian Academy, 3200 Cavitt Avenue, Bryan, TX 77801', ctz: 'America/Chicago' });
return 'https://calendar.google.com/calendar/render?' + q;
}
const evRow = (e, add) => {
const title = I18N.tr(e, 'title');
return `<p><span class="dd">${fmt.dayNum(e.date)}<small>${esc(fmt.mon(e.date))}</small></span><span${add ? ' style="flex:1;min-width:0"' : ''}><b style="font-weight:600">${esc(title)}</b><br><small style="color:var(--muted)">${esc(I18N.tr(e, 's'))}</small></span>${add ? `<span class="evx"><a class="sbtn" href="${esc(gcalUrl(e))}" target="_blank" rel="noopener" aria-label="${esc(t('cal.addGoogle', { title }))}">${esc(t('cal.google'))}</a><button class="sbtn" onclick="downloadIcs('${e.id}')" aria-label="${esc(t('cal.addIcs', { title }))}">.ics</button></span>` : ''}</p>`;
};
const calView = () => `<div class="box"><div class="boxh"><div><h2>${esc(t('cal.title'))}</h2><div class="sub">${esc(t('cal.sub'))} · ${esc(t('cal.exportSub'))}</div></div><button class="sbtn pri" onclick="downloadIcs()">${esc(t('cal.icsAll'))}</button></div><div class="cal">${S.events.map(e => evRow(e, true)).join('')}</div></div>`;

// ---------- shared pieces ----------
function annRow(a, full) { return `<div class="ann"><div class="t"><span class="tag ${tagCls(a.cat)}">${esc(t('cat.' + a.cat))}</span>${esc(fmt.day(a.date))} · ${esc(t('aud.' + a.aud))}${!a.read && !full ? ` · <b class="new">${esc(t('ann.new'))}</b>` : ''}</div><h3>${esc(I18N.tr(a, 'title'))}</h3>${full ? `<p>${esc(I18N.tr(a, 'body'))}</p>` : ''}</div>` }
const track = r => `<div class="rq-track${r.status === 3 ? ' rej' : ''}">${STEPS.map((s, i) => `<i class="${r.status !== 3 && i <= r.status ? 'on' : ''}"></i>`).join('')}</div>`;
const statusTxt = r => t(r.status === 3 ? 'status.rejected' : 'status.' + STEPS[r.status]);
function postForm() {
const name = l => I18N.LANGS[l].name;
return `<div class="grid2"><div class="box"><h2>${esc(t('post.title'))}</h2><div class="sub">${esc(t('post.sub'))}</div>
<label for="anT">${esc(t('post.fTitle'))}</label><input id="anT" placeholder="${esc(t('post.fTitlePh'))}">
<div class="row2"><div><label for="anA">${esc(t('post.audience'))}</label><select id="anA">${opts(AUDS, 'aud.')}</select></div>
<div><label for="anC">${esc(t('post.category'))}</label><select id="anC">${opts(CATS, 'cat.')}</select></div></div>
<label for="anB">${esc(t('post.message'))}</label><textarea id="anB" placeholder="${esc(t('post.messagePh'))}"></textarea>
<details class="trs"><summary>${esc(t('post.translations'))}</summary><div class="hint">${esc(t('post.translationsSub'))}</div>
${TR_LANGS.map(l => `<label for="anT_${l}">${esc(t('post.trTitle', { lang: name(l) }))}</label><input id="anT_${l}" lang="${l}">
<label for="anB_${l}">${esc(t('post.trMessage', { lang: name(l) }))}</label><textarea id="anB_${l}" lang="${l}" style="min-height:80px"></textarea>`).join('')}</details>
<button class="sbtn pri" style="margin-top:18px;padding:13px 22px" onclick="postAnn()">${esc(t('post.publish'))}</button></div>
<div class="box"><h2>${esc(t('post.published'))}</h2><div class="sub">${esc(t('post.publishedSub'))}</div>${S.announcements.map(a => annRow(a, true)).join('')}</div></div>`;
}

// ---------- parent ----------
const P = {
home() {
const c = kid(), ua = parentAnns().filter(a => !a.read).length;
const avg = Math.round(c.grades.reduce((a, g) => a + g.p, 0) / c.grades.length);
const att = c.attendance; const pct = (att.present / (att.present + att.absent) * 100).toFixed(0);
return `${kidBar()}
<div class="welcome"><div class="img" style="background-image:url(../img/${c.division === 'lower' ? '6' : '3'}.jpg)"></div>
<div class="eyebrow">${esc(t('greet.afternoon'))}</div><h2>${esc(t('home.welcomeParent'))}</h2>
<p>${esc(t('home.studentLine', { name: c.name, grade: gradeTxt(c), id: c.id }))}</p>
<div class="qa"><button onclick="go('doc')">${esc(t('qa.requestCert'))}</button><button onclick="go('msg')">${esc(t('qa.messageTeacher'))}</button><button onclick="go('acad')">${esc(t('qa.viewGrades'))}</button></div></div>
<div class="grid3" style="margin-bottom:24px">
<div class="box kpi"><span>${esc(t('kpi.average'))}</span><b>${avg}%</b><small>${esc(t('kpi.acrossCourses', { n: c.grades.length }))}</small></div>
<div class="box kpi"><span>${esc(t('kpi.attendance'))}</span><b>${pct}%</b><small>${esc(t('kpi.absences', { n: att.absent }))}</small></div>
<div class="box kpi"><span>${esc(t('kpi.unread'))}</span><b>${ua}</b><small><a href="#" onclick="go('ann');return false">${esc(t('kpi.readNow'))}</a></small></div>
</div>
<div class="grid2">
<div class="box"><h2>${esc(t('home.latestAnn'))}</h2><div class="sub">${esc(t('home.latestAnnSub'))}</div>${parentAnns().slice(0, 3).map(a => annRow(a)).join('')}</div>
<div class="box"><h2>${esc(t('home.upcoming'))}</h2><div class="sub">${esc(t('home.upcomingSub'))}</div><div class="cal">${S.events.filter(e => e.upcoming).map(e => evRow(e)).join('')}</div></div>
</div>`;
},
ann() { return `<div class="box"><h2 class="sr">${esc(t('title.announcements'))}</h2>${parentAnns().map(a => { a.read = true; return annRow(a, true) }).join('') || `<div class="empty">${esc(t('ann.empty'))}</div>`}</div>` },
msg() { return kidBar() + msgView() },
acad() {
const c = kid(), att = c.attendance;
return `${kidBar()}<div class="grid2"><div class="box"><h2>${esc(t('acad.semester'))}</h2><div class="sub">${esc(t('acad.sub', { name: c.name, grade: gradeTxt(c) }))}</div>
<div class="tbl-wrap"><table><tr><th>${esc(t('th.course'))}</th><th>${esc(t('th.teacher'))}</th><th>${esc(t('th.progress'))}</th><th>${esc(t('th.grade'))}</th></tr>
${c.grades.map(g => `<tr><td><b style="font-weight:600">${g.c}</b></td><td style="color:var(--muted)">${g.t}</td><td><div class="bar2"><i style="width:${g.p}%"></i></div><small style="color:var(--muted)">${g.p}%</small></td><td class="grade">${g.g}</td></tr>`).join('')}
</table></div></div>
<div><div class="box kpi" style="margin-bottom:18px"><span>${esc(t('kpi.present'))}</span><b>${att.present}</b><small>${esc(t('kpi.daysSemester'))}</small></div>
<div class="box kpi" style="margin-bottom:18px"><span>${esc(t('kpi.absentTardy'))}</span><b>${att.absent} · ${att.tardy}</b><small>${esc(t('kpi.excused', { n: att.excused, date: fmt.day(att.excusedOn) }))}</small></div>
<div class="box"><h2>${esc(t('acad.needReport'))}</h2><div class="sub">${esc(t('acad.needReportSub'))}</div><button class="sbtn gold" onclick="go('doc')">${esc(t('acad.requestDoc'))}</button></div></div></div>`;
},
doc() {
const c = kid();
return `${kidBar()}<div class="grid2">
<div class="box"><h2>${esc(t('doc.requestTitle'))}</h2><div class="sub">${esc(t('doc.requestFor', { name: c.name }))} · ${esc(t('doc.requestSub'))}</div>
<label for="rqType">${esc(t('doc.type'))}</label><select id="rqType">${opts(S.docTypes, 'docType.')}</select>
<div class="row2"><div><label for="rqPurpose">${esc(t('doc.purpose'))}</label><input id="rqPurpose" placeholder="${esc(t('doc.purposePh'))}"></div>
<div><label for="rqCopies">${esc(t('doc.copies'))}</label><select id="rqCopies"><option>1</option><option>2</option><option>3</option></select></div></div>
<div class="row2"><div><label for="rqLang">${esc(t('doc.language'))}</label><select id="rqLang">${opts(['en', 'en_ko', 'en_zh', 'en_es'], 'docLang.')}</select></div>
<div><label for="rqDel">${esc(t('doc.delivery'))}</label><select id="rqDel">${opts(['digital', 'pickup', 'mail'], 'delivery.')}</select></div></div>
<div class="hint">${esc(t('doc.englishNote'))}</div>
<label for="rqNote">${esc(t('doc.notes'))}</label><textarea id="rqNote" placeholder="${esc(t('doc.notesPh'))}"></textarea>
<button class="sbtn pri" style="margin-top:18px;padding:13px 22px" onclick="submitReq()">${esc(t('doc.submit'))}</button>
</div>
<div class="box"><h2>${esc(t('doc.mine'))}</h2><div class="sub">${esc(t('doc.mineSub'))}</div>
${myRequests().slice().reverse().map(r => `<div class="req"><div><h3>${esc(t('docType.' + r.type))}</h3><small>#${r.id} · ${esc(fmt.day(r.date))} · ${esc(r.purpose === null ? t('doc.general') : r.purpose)} · ${esc(t('doc.copiesN', { n: r.copies }))}</small>
${track(r)}<small>${esc(statusTxt(r))}</small>${r.status === 3 ? `<p class="reason">${esc(t('doc.reason', { reason: r.reason }))}</p>` : ''}</div>
<div>${r.status === 2 ? `<button class="sbtn gold" onclick="openDoc(${r.id})">${esc(t('doc.download'))}</button>` : `<span class="tag${r.status === 3 ? ' urgent' : ''}">${esc(statusTxt(r))}</span>`}</div></div>`).join('') || `<div class="empty">${esc(t('doc.emptyMine'))}</div>`}
</div></div>`;
},
cal: calView
};
function submitReq() {
const v = id => document.getElementById(id).value;
const id = Math.max(...S.requests.map(r => r.id)) + 1;
S.requests.push({ id, student: kid().key, type: v('rqType'), purpose: v('rqPurpose').trim() || null, lang: v('rqLang'), copies: +v('rqCopies'), delivery: v('rqDel'), note: v('rqNote').trim(), date: localISO().slice(0, 10), status: 0 });
toast(t('toast.reqSubmitted')); render();
}

// ---------- teacher ----------
const GRADEBOOK = [['Grace Kim', 98, 95, 96], ['Daniel Park', 91, 88, 90], ['Emma Johnson', 94, 90, 92], ['Noah Williams', 86, 84, 85], ['Hannah Lee', 97, 93, 95]];
const T = {
home() {
const um = myThreads().filter(x => x.unreadT).length;
return `<div class="welcome"><div class="img" style="background-image:url(../img/2.jpg)"></div>
<div class="eyebrow">${esc(t('t.eyebrow'))}</div><h2>${esc(t('t.welcome'))}</h2><p>${esc(t('t.welcomeSub'))}</p>
<div class="qa"><button onclick="go('ann')">${esc(t('qa.postNotice'))}</button><button onclick="go('msg')">${esc(t('qa.openMessages'))}</button><button onclick="go('acad')">${esc(t('qa.gradebook'))}</button></div></div>
<div class="grid3" style="margin-bottom:24px">
<div class="box kpi"><span>${esc(t('kpi.students'))}</span><b>${GRADEBOOK.length}</b><small>${esc(t('t.period', { course: 'English II (Honors)', n: 2 }))}</small></div>
<div class="box kpi"><span>${esc(t('kpi.unreadMsgs'))}</span><b>${um}</b><small>${esc(t('kpi.unreadMsgsSub'))}</small></div>
<div class="box kpi"><span>${esc(t('kpi.noticesPosted'))}</span><b>${S.announcements.length}</b><small>${esc(t('kpi.thisMonth'))}</small></div>
</div>
<div class="box"><h2>${esc(t('post.published'))}</h2><div class="sub">${esc(t('post.publishedSub'))}</div>${S.announcements.slice(0, 3).map(a => annRow(a, true)).join('')}</div>`;
},
ann: postForm,
msg() { return msgView() },
acad() { return `<div class="box"><h2>${esc(t('t.period', { course: 'English II (Honors)', n: 2 }))}</h2><div class="sub">${esc(t('t.gradebookSub'))}</div><div class="tbl-wrap"><table><tr><th>${esc(t('th.student'))}</th><th>Essay: Hebrews 11</th><th>Unit 3 Test</th><th>${esc(t('th.average'))}</th></tr>
${GRADEBOOK.map(s => `<tr><td><b style="font-weight:600">${s[0]}</b></td><td>${s[1]}</td><td>${s[2]}</td><td class="grade">${s[3]}%</td></tr>`).join('')}</table></div></div>` },
cal: calView
};

// ---------- admin (front office) ----------
const A = {
home() {
const pend = S.requests.filter(r => r.status < 2).length, issued = S.requests.filter(r => r.status === 2).length;
return `<div class="welcome"><div class="img" style="background-image:url(../img/0.jpg)"></div>
<div class="eyebrow">${esc(t('a.eyebrow'))}</div><h2>${esc(t('a.welcome'))}</h2><p>${esc(t('t.welcomeSub'))}</p>
<div class="qa"><button onclick="go('doc')">${esc(t('qa.reviewRequests'))}</button><button onclick="go('ann')">${esc(t('qa.postNotice'))}</button><button onclick="go('msg')">${esc(t('qa.openMessages'))}</button></div></div>
<div class="grid3" style="margin-bottom:24px">
<div class="box kpi"><span>${esc(t('kpi.pending'))}</span><b>${pend}</b><small>${esc(t('kpi.pendingSub'))}</small></div>
<div class="box kpi"><span>${esc(t('kpi.issued'))}</span><b>${issued}</b><small>${esc(t('kpi.issuedSub'))}</small></div>
<div class="box kpi"><span>${esc(t('kpi.noticesPosted'))}</span><b>${S.announcements.length}</b><small>${esc(t('kpi.thisMonth'))}</small></div>
</div>
<div class="box"><h2>${esc(t('t.queue'))}</h2><div class="sub">${esc(t('t.queueSub'))}</div>${reqQueue()}</div>`;
},
doc() { return `<div class="box"><h2>${esc(t('t.allRequests'))}</h2><div class="sub">${esc(t('t.allRequestsSub'))}</div>${reqQueue(true)}</div>` },
ann: postForm,
msg() { return msgView() },
cal: calView
};
function reqQueue(all) {
const list = S.requests.filter(r => all || r.status < 2).slice().reverse();
if (!list.length) return `<div class="empty">${esc(t('t.caughtUp'))}</div>`;
return list.map(r => {
  const c = kidBy(r.student);
  const actions = S.rejecting === r.id
    ? `<div class="rejf"><label for="rj${r.id}" class="sr">${esc(t('a.rejectPh'))}</label><input id="rj${r.id}" placeholder="${esc(t('a.rejectPh'))}"><button class="sbtn" onclick="S.rejecting=null;render()">${esc(t('a.cancel'))}</button><button class="sbtn danger" onclick="reject(${r.id})">${esc(t('a.rejectConfirm'))}</button></div>`
    : r.status === 0 ? `<button class="sbtn" onclick="adv(${r.id})">${esc(t('t.startReview'))}</button><button class="sbtn" onclick="startReject(${r.id})">${esc(t('a.reject'))}</button>`
    : r.status === 1 ? `<button class="sbtn gold" onclick="adv(${r.id})">${esc(t('t.approve'))}</button><button class="sbtn" onclick="startReject(${r.id})">${esc(t('a.reject'))}</button>`
    : r.status === 2 ? `<button class="sbtn" onclick="openDoc(${r.id})">${esc(t('t.preview'))}</button><span class="tag green" style="align-self:center">${esc(t('t.issued'))}</span>`
    : `<span class="tag urgent" style="align-self:center">${esc(t('status.rejected'))}</span>`;
  return `<div class="req"><div><h3>${esc(t('docType.' + r.type))}</h3><small>#${r.id} · ${esc(t('me.parentName'))} · ${esc(c.name)} (${esc(gradeTxt(c))}) · ${esc(r.purpose === null ? t('doc.general') : r.purpose)} · ${esc(t('docLang.' + r.lang))} · ${esc(t('delivery.' + r.delivery))}</small>
${track(r)}<small>${esc(statusTxt(r))}</small>${r.status === 3 ? `<p class="reason">${esc(t('doc.reason', { reason: r.reason }))}</p>` : ''}</div>
<div class="reqa">${actions}</div></div>`;
}).join('');
}
function adv(id) { const r = S.requests.find(x => x.id === id); r.status = Math.min(2, r.status + 1); toast(t(r.status === 2 ? 'toast.issued' : 'toast.inReview')); render() }
function startReject(id) { S.rejecting = id; render(); const i = document.getElementById('rj' + id); if (i) i.focus() }
function reject(id) {
const why = document.getElementById('rj' + id).value.trim();
if (!why) { toast(t('toast.needReason')); return }
const r = S.requests.find(x => x.id === id); r.status = 3; r.reason = why; S.rejecting = null;
toast(t('toast.rejected')); render();
}
function postAnn() {
const v = id => document.getElementById(id).value.trim();
const title = v('anT'), body = v('anB');
if (!title || !body) { toast(t('toast.needTitle')); return }
const i18n = {};
TR_LANGS.forEach(l => { const tt = v('anT_' + l), bb = v('anB_' + l); if (tt || bb) i18n[l] = { title: tt || title, body: bb || body } });
S.announcements.unshift({ id: Date.now(), title, body, i18n, date: localISO().slice(0, 10), cat: v('anC'), aud: v('anA'), read: false });
toast(t('toast.published')); render();
}

// ---------- messages (parent sees the current child's threads; staff see their own) ----------
function msgView() {
const list = myThreads();
if (!list.length) return `<div class="box"><div class="empty">${esc(t('msg.none'))}</div></div>`;
let th = list.find(x => x.id === S.thread); if (!th) { th = list[0]; S.thread = th.id }
if (S.role === 'parent') th.unreadP = false; else th.unreadT = false;
setTimeout(() => { renderNav(); const cb = document.getElementById('cb'); if (cb) cb.scrollTop = cb.scrollHeight }, 0);
const parent = S.role === 'parent', me = parent ? 'parent' : 'staff';
const tname = x => x.nameKey ? t(x.nameKey) : x.name;
const tsub = x => [x.subj, x.subjKey && t(x.subjKey)].filter(Boolean).join(' · ');
const name = x => parent ? tname(x) : t('me.parentName');
const sub = x => parent ? tsub(x) : t('msg.re', { student: kidBy(x.student).name, name: tname(x) });
const avBg = parent ? 'var(--navy3);color:#fff' : 'var(--gold)';
return `<div class="msgs"><div class="th-list">${list.map(x => `<button class="th ${x.id === th.id ? 'on' : ''}"${x.id === th.id ? ' aria-current="true"' : ''} onclick="S.thread=${x.id};render()"><div class="av" style="background:${avBg}">${parent ? x.ini : 'KF'}</div><div style="min-width:0"><b>${esc(name(x))}</b><small>${esc(x.msgs[x.msgs.length - 1].text)}</small></div>${unread(x) ? '<span class="dot" aria-hidden="true"></span>' : ''}</button>`).join('')}</div>
<div class="conv"><div class="conv-h"><div class="av" style="background:${avBg}">${parent ? th.ini : 'KF'}</div><div><b>${esc(name(th))}</b><br><small style="color:var(--muted)">${esc(sub(th))}</small></div></div>
<div class="conv-b" id="cb">${th.msgs.map(m => `<div class="bub ${m.from === me ? 'me' : ''}">${esc(m.text)}<small>${esc(msgTime(m.at))}</small></div>`).join('')}</div>
<div class="conv-f"><input id="mIn" placeholder="${esc(t('msg.ph'))}" aria-label="${esc(t('msg.ph'))}" onkeydown="if(event.key==='Enter'&&!event.isComposing)send()"><button class="sbtn pri" onclick="send()">${esc(t('msg.send'))}</button></div></div></div>`;
}
function send() {
const v = document.getElementById('mIn').value.trim(); if (!v) return;
const th = S.threads.find(x => x.id === S.thread);
th.msgs.push({ from: S.role === 'parent' ? 'parent' : 'staff', text: v, at: localISO() });
if (S.role === 'parent') th.unreadT = true; else th.unreadP = true;
render(); toast(t(S.role === 'parent' ? 'toast.sentParent' : 'toast.sentTeacher'));
}

// Issued documents are official English records; only the modal buttons follow the UI language.
function openDoc(id) {
const r = S.requests.find(x => x.id === id); if (S.role === 'parent') r.dl = true; const s = kidBy(r.student);
const type = I18N.en('docType.' + r.type), grade = `Grade ${s.grade}`;
const bodies = {
enrollment: `<p>This letter certifies that <b>${s.name}</b> (Date of Birth: ${s.dob}; Student ID: ${s.id}) is currently enrolled as a full-time student in <b>${grade}</b> at Brazos Valley Cornerstone Christian Academy for the 2026–2027 academic year.</p><p>${s.name} has been enrolled continuously since ${s.entered} and is in good academic and disciplinary standing.</p>`,
attendance: `<p>This is to certify that <b>${s.name}</b> (Student ID: ${s.id}) has attended Brazos Valley Cornerstone Christian Academy in ${grade} during the Fall Semester 2026, with an attendance rate of 98%.</p>`,
goodStanding: `<p>This letter confirms that <b>${s.name}</b>, a ${grade} student (Student ID: ${s.id}), is a student in good standing academically, spiritually and behaviorally at Brazos Valley Cornerstone Christian Academy.</p>`
};
const body = bodies[r.type] || `<p>This document certifies the requested record — <b>${type}</b> — for <b>${s.name}</b> (Student ID: ${s.id}), ${grade}, issued by the Office of the Registrar of Brazos Valley Cornerstone Christian Academy.</p>`;
document.getElementById('doc').innerHTML = `
<div class="doc-actions"><button onclick="closeModal()">${esc(t('docm.close'))}</button><button class="pri" onclick="window.print()">${esc(t('docm.print'))}</button></div>
<div lang="en">
<div class="lh"><svg viewBox="0 0 44 52"><use href="#crest"/></svg>
<div><b>Brazos Valley Cornerstone Christian Academy</b><small>3200 Cavitt Avenue · Bryan, Texas 77801 · (979) 694-8200</small></div></div>
<p style="text-align:right">November 20, 2026<br><small style="color:#888">Ref. CCA-${r.id}</small></p>
<h2>${type.toUpperCase()}</h2>
<p>To Whom It May Concern:</p>${body}
<p>Should you require further information, please contact the school office at (979) 694-8200.</p>
<div class="sig"><div><p style="margin:0">Sincerely,</p><div style="font-family:var(--serif);font-style:italic;font-size:30px;margin:18px 0 4px;color:var(--navy)">Head of School</div><p style="margin:0;border-top:1px solid #ccc;padding-top:6px;font-size:12px">Head of School · Brazos Valley Cornerstone Christian Academy</p></div>
<div class="seal">Official<br>Cornerstone<br>Seal<br>· 2002 ·</div></div>
<p style="margin-top:40px;font-size:11px;color:#777;text-align:center">Demo document — layout preview only. Not an official record.</p></div>`;
openModal();
}
function openModal() { const m = document.getElementById('docModal'); m._back = document.activeElement; m.classList.add('open'); m.querySelector('.doc-actions button').focus() }
function closeModal() { const m = document.getElementById('docModal'); m.classList.remove('open'); if (m._back && m._back.focus) m._back.focus() }
addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('docModal').classList.contains('open')) closeModal() });

I18N.onChange(() => render());
I18N.init();
