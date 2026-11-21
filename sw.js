// Served at the old GitHub Pages address after the move to Firebase Hosting. It replaces the old offline copy:
// clears its caches, removes itself and reloads open tabs, which then land on the "moved" page.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then(cs => cs.forEach(c => c.navigate(c.url)))));
