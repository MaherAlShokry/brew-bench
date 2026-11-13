// Offline support. The app opens straight from its saved copy, so it starts at once even on a weak signal, and the
// saved copy is refreshed in the background. When a newer version has been saved, open pages are told, so they can
// offer to reload. events.json (upcoming finals) is the one file that tries the network first, since it is live news.
const CACHE = 'brew-bench-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-maskable-512.png',
  './vendor/fonts.css', './vendor/jspdf.umd.min.js', './vendor/world-map.json',
  './vendor/fonts/inter-latin-opsz-normal.woff2', './vendor/fonts/inter-latin-ext-opsz-normal.woff2'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));

const ours = url => url.startsWith(self.location.origin) || /cdnjs|fonts\.(googleapis|gstatic)/.test(url);
// The app's page shares one saved copy, whatever its address (./, index.html, ?query). Other pages (privacy, delete
// account) are saved under their own address.
const keyOf = req => {
  const u = new URL(req.url);
  return u.origin === self.location.origin && /\/(index\.html)?$/.test(u.pathname) ? './index.html' : req;
};
const tell = msg => self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.forEach(c => c.postMessage(msg)));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Leave live streams (the shared log) and other sites' requests to the browser; only cache our files and fonts.
  if ((req.headers.get('accept') || '').includes('text/event-stream')) return;
  const url = req.url;
  if (!ours(url)) return;
  const key = keyOf(req), page = key === './index.html';
  if (/\/events\.json(\?|$)/.test(url)) {
    e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) } return res })
      .catch(() => caches.match(req).then(r => r || Response.error())));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(key).then(saved => {
    const before = page && saved ? saved.clone().text() : null;
    const fresh = fetch(page ? new Request(url, { cache: 'no-cache' }) : req).then(async res => {
      if (res.ok && (res.type === 'basic' || res.type === 'cors' || res.type === 'opaque')) {
        if (page && saved) {
          // Tell open pages when the app itself changed, so they can offer a reload.
          const [a, b] = await Promise.all([before, res.clone().text()]);
          await c.put(key, res.clone());
          if (a !== b) tell({ type: 'bb-updated' });
        } else await c.put(key, res.clone());
      }
      return res;
    });
    if (saved) { e.waitUntil(fresh.catch(() => {})); return saved }
    // Nothing saved yet: the network, and for a page load with no network, the app shell.
    return fresh.catch(() => page ? c.match('./index.html').then(r => r || Response.error()) : Response.error());
  })));
});
