// Family Portal service worker: makes the portal installable and keeps it usable offline.
// Strategy: network first for everything same-origin (so a new deploy shows up on the next
// load), falling back to the cache when offline. The app shell is cached at install.
// Cross-origin requests (CJK fonts, pdf-lib, and later Supabase) are not touched.
// Bump VERSION when the list below changes.
const VERSION = 'cca-portal-v1';
const SHELL = [
  './', './manifest.webmanifest',
  '../css/base.css', '../css/portal.css',
  '../js/common.js', '../js/i18n.js', '../js/portal/demo.js', '../js/portal/pdf.js',
  '../js/portal/i18n/en.json', '../js/portal/i18n/ko.json', '../js/portal/i18n/zh.json', '../js/portal/i18n/es.json',
  '../fonts/inter-tight-latin-var.woff2', '../fonts/inter-latin-var.woff2',
  '../img/favicon.svg', '../img/icon-192.png', '../img/apple-touch-icon.png',
  '../img/0-800.webp', '../img/2-800.webp', '../img/3-800.webp', '../img/6-800.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('cca-portal-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)) }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error())))
  );
});
