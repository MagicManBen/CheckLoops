/* Debug Service Worker: captures all fetch requests within scope and persists a unique list. */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try { await self.clients.claim(); } catch(_) {}
    await ensureListCache();
  })());
});

const CACHE_NAME = 'debug-overlay-v1';
const LIST_URL = '/__debug__/files.json';

async function ensureListCache() {
  const cache = await caches.open(CACHE_NAME);
  const res = await cache.match(LIST_URL);
  if (!res) {
    const body = JSON.stringify({ updated: Date.now(), files: [] });
    await cache.put(LIST_URL, new Response(body, { headers: { 'Content-Type': 'application/json' } }));
  }
}

async function readList() {
  const cache = await caches.open(CACHE_NAME);
  const res = await cache.match(LIST_URL);
  if (!res) return { updated: Date.now(), files: [] };
  try { return await res.json(); } catch { return { updated: Date.now(), files: [] }; }
}

async function writeList(list) {
  const cache = await caches.open(CACHE_NAME);
  const body = JSON.stringify(list);
  await cache.put(LIST_URL, new Response(body, { headers: { 'Content-Type': 'application/json' } }));
}

function normalizeUrl(url) {
  try {
    const u = new URL(url, self.registration.scope);
    // Only keep path + search for same-origin; keep absolute for cross-origin
    if (u.origin === new URL(self.registration.scope).origin) {
      return u.pathname + (u.search || '');
    }
    return u.href;
  } catch {
    return String(url);
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = req.url;

  // Always serve the list endpoint from cache
  if (new URL(url).pathname === LIST_URL) {
    event.respondWith((async () => {
      await ensureListCache();
      const cache = await caches.open(CACHE_NAME);
      const res = await cache.match(LIST_URL);
      return res || new Response(JSON.stringify({ updated: Date.now(), files: [] }), { headers: { 'Content-Type': 'application/json' } });
    })());
    return;
  }

  // Fire and forget update of the list
  event.waitUntil((async () => {
    try {
      await ensureListCache();
      const list = await readList();
      const norm = normalizeUrl(url);
      if (!list.files.includes(norm)) {
        list.files.push(norm);
        list.updated = Date.now();
        await writeList(list);
      }
      // Notify all controlled clients
      const clients = await self.clients.matchAll();
      clients.forEach(c => {
        try { c.postMessage({ type: 'debug-overlay:list:update', list }); } catch(_) {}
      });
    } catch(_) {}
  })());
});
