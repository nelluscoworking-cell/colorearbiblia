const CACHE = 'biblia-colorir-icone-v2-abertura-rapida';
const PREFIX = 'biblia-colorir-';
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./assets/capa.webp", "./icons/icon-32.png", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-any-192-v2.png", "./icons/icon-maskable-192-v2.png", "./icons/icon-any-512-v2.png", "./icons/icon-maskable-512-v2.png"];
const DRAWINGS = ["./assets/historia-01.png", "./assets/historia-02.png", "./assets/historia-03.png", "./assets/historia-04.png", "./assets/historia-05.png", "./assets/historia-06.png", "./assets/historia-07.png", "./assets/historia-08.png", "./assets/historia-09.png", "./assets/historia-10.png", "./assets/historia-11.png", "./assets/historia-12.png", "./assets/historia-13.png", "./assets/historia-14.png", "./assets/historia-15.png", "./assets/historia-16.png", "./assets/historia-17.png", "./assets/historia-18.png", "./assets/historia-19.png", "./assets/historia-20.png"];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const current = await caches.open(CACHE);
    const oldKeys = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE);
    for (const key of oldKeys) {
      const previous = await caches.open(key);
      for (const request of await previous.keys()) {
        if (!new URL(request.url).pathname.includes('/assets/historia-')) continue;
        if (!await current.match(request)) await current.put(request, await previous.match(request));
      }
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    const refresh = fetch(request).then(async response => {
      if (response.ok) {
        const copy = response.clone();
        const cache = await caches.open(CACHE);
        await cache.put(request, copy);
      }
      return response;
    });
    event.waitUntil(refresh.catch(() => undefined));
    event.respondWith(caches.open(CACHE).then(async cache => {
      const saved = await cache.match(request) || await cache.match('./index.html');
      if (saved) return saved;
      return refresh;
    }));
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
