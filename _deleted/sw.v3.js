// ═══════════════════════════════════════════════════════════
//  SERVICE WORKER — Zucker-Held PWA
//  Ermöglicht vollständige Offline-Nutzung
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'zucker-held-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './data/foods.js',
  './src/config.js',
  './src/state.js',
  './src/utils.js',
  './src/api.js',
  './src/chart.js',
  './src/achievements.js',
];

// ── Install: Alle statischen Assets cachen ────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate: Alte Caches aufräumen ──────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: Cache-first für statische Assets, Network-first für API ─
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // OpenFoodFacts API: Network-first (kein Cache)
  if (url.hostname.includes('openfoodfacts.org')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(
        JSON.stringify({ products: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      ))
    );
    return;
  }

  // Statische Assets: Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback auf index.html für Navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
