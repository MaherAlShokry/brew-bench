// Offline support: cache the app shell, then serve cached copies when offline.
const CACHE = 'brew-bench-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-maskable-512.png',
  './vendor/fonts.css', './vendor/jspdf.umd.min.js',
  './vendor/fonts/bricolage-grotesque-latin-opsz-normal.woff2', './vendor/fonts/bricolage-grotesque-latin-ext-opsz-normal.woff2',
  './vendor/fonts/literata-latin-opsz-normal.woff2', './vendor/fonts/literata-latin-ext-opsz-normal.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone();
    if (res.ok && (e.request.url.startsWith(self.location.origin) || /cdnjs|fonts\.(googleapis|gstatic)/.test(e.request.url)))
      caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match(e.request).then(r =>
    // Only page loads fall back to the app shell; a script or font must never receive HTML.
    r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
