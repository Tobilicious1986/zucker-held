const CACHE = 'zucker-held-v4.4';
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
  './src/notifications.js',
];

// JS-Module die Network-first bekommen (verhindert stale-404-Problem)
const NETWORK_FIRST = /\.(js)(\?.*)?$/;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(STATIC.map(u => new Request(u, { cache: 'reload' })))
    ).catch(err => {
      // Install trotzdem abschließen wenn einzelne Dateien fehlen
      console.warn('[SW] Einige Dateien konnten nicht gecacht werden:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('[SW] Alter Cache gelöscht:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

// ── Benachrichtigung angeklickt (BL-07) ───────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  // Zielseite basierend auf Notification-Tag
  const tag  = e.notification.tag || '';
  const page = tag.includes('low') || tag.includes('high') || tag.includes('bz')
    ? './?page=bz'
    : './';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Bereits offenes Fenster fokussieren und zur BZ-Seite navigieren
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({ type: 'OPEN_PAGE', page: 'bz' });
          return;
        }
      }
      // Neues Fenster öffnen mit BZ-Seite
      return self.clients.openWindow(page);
    })
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Externe APIs → Network only
  if (url.includes('world.openfoodfacts.org') ||
      url.includes('api.anthropic.com')) {
    return; // Browser verarbeitet direkt
  }

  // Navigations → index.html (SPA fallback)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(r => r || fetch(e.request))
    );
    return;
  }

  // JS-Module → Network-first (verhindert stale/empty cache Probleme)
  if (NETWORK_FIRST.test(url)) {
    e.respondWith(
      fetch(e.request).then(res => {
        // Nur erfolgreiche Antworten cachen
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() =>
        // Offline-Fallback: aus Cache laden
        caches.match(e.request)
      )
    );
    return;
  }

  // Nightscout externe URL → Network only
  if (url.includes('nightscout') && !url.includes(self.location.origin)) {
    return;
  }

  // CSS, Bilder, Sonstiges → Cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
