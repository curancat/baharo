const CACHE_NAME = 'grimorio-vivo-shell-v15';
const APP_SHELL = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './favicon.svg', './app-icon.svg', './app-icon-192.png', './app-icon-512.png', './ambient-theme.wav'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('grimorio-vivo-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request.mode === 'navigate' ? './index.html' : request, copy));
    }
    return response;
  }).catch(async () => {
    const fallback = await caches.match(request);
    return fallback || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
  }));
});
