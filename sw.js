const CACHE='liftloop-shell-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate') return;

  event.respondWith((async () => {
    try {
      // Network first, explicitly bypassing the HTTP cache.
      const fresh = await fetch(new Request(event.request, { cache: 'reload' }));
      const cache = await caches.open(CACHE);
      cache.put(event.request, fresh.clone());
      return fresh;
    } catch (e) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return new Response(
        '<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;background:#0e1015;color:white;padding:24px">LiftLoop is offline. Reconnect and reopen the app.</body>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
  })());
});
