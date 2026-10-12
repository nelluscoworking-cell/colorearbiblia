const CACHE = 'biblia-colorir-d80383cedab8';
const PREFIX = 'biblia-colorir-';
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./assets/capa.png", "./icons/icon-32.png", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"];
const DRAWINGS = ["./assets/historia-01.png", "./assets/historia-02.png", "./assets/historia-03.png", "./assets/historia-04.png", "./assets/historia-05.png", "./assets/historia-06.png", "./assets/historia-07.png", "./assets/historia-08.png", "./assets/historia-09.png", "./assets/historia-10.png", "./assets/historia-11.png", "./assets/historia-12.png", "./assets/historia-13.png", "./assets/historia-14.png", "./assets/historia-15.png", "./assets/historia-16.png", "./assets/historia-17.png", "./assets/historia-18.png", "./assets/historia-19.png", "./assets/historia-20.png"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy))); }
      return response;
    }).catch(() => caches.match(request).then(hit => hit || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) event.waitUntil(cache.put(request, response.clone()));
    return response;
  }));
});
let cachingDrawings;
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_DRAWINGS') return;
  // Salva os desenhos em segundo plano, após a capa estar visível.
  if (!cachingDrawings) cachingDrawings = caches.open(CACHE).then(async cache => {
    for (const url of DRAWINGS) {
      if (await cache.match(url)) continue;
      try { await cache.add(url); } catch (error) { /* Tenta novamente na próxima visita. */ }
    }
  }).finally(() => { cachingDrawings = null; });
  event.waitUntil(cachingDrawings);
});
