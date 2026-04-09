const CACHE = 'zucker-held-v4.1';
const STATIC = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './data/foods.js',
  './src/config.js',
  './src/state.js',
  './src/utils.js',
  './src/api.js',
  './src/chart.js',
  './src/achievements.js',
  './src/auth/auth-config.js',
  './src/auth/auth.js',
  './src/auth/local-provider.js',
  './src/ui/router.js',
  './src/ui/modal.js',
  './src/ui/toast.js',
  './src/ui/theme.js',
  './src/ui/dashboard.js',
  './src/widgets/widget-registry.js',
  './src/widgets/bz-status.js',
  './src/widgets/stats.js',
  './src/widgets/quick-actions.js',
  './src/widgets/today-log.js',
  './src/widgets/tip.js',
  './src/widgets/chart-7day.js',
  './src/widgets/achievements.js',
  './src/modules/bz.js',
  './src/modules/insulin.js',
  './src/modules/meal.js',
  './src/modules/calc.js',
  './src/modules/activity.js',
  './src/modules/foods.js',
  './src/modules/history.js',
  './src/modules/learn.js',
  './src/modules/settings.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC.map(u => new Request(u, { cache: 'reload' }))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Open Food Facts API → Network only
  if (url.includes('world.openfoodfacts.org')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Navigations → index.html (SPA fallback)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  // Cache-first für alles andere
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
