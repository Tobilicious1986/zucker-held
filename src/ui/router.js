// ═══════════════════════════════════════════════════════════
//  ROUTER — Zucker-Held v4
//  Lazy-Load Modul-System + Page-Lifecycle
// ═══════════════════════════════════════════════════════════

// Laden-Zustand pro Modul: 'idle' | 'loading' | 'ready'
const _moduleCache = new Map();
const _backStack   = [];
let   _currentPage = 'home';

// ── Seiten-Registrierung ──────────────────────────────────
// null = kein Modul (dashboard.js übernimmt home)
const PAGE_REGISTRY = {
  'home':     { load: null,                                               navId: 'nav-home'    },
  'bz':       { load: () => import('../modules/bz.js'),                  navId: 'nav-bz'      },
  'insulin':  { load: () => import('../modules/insulin.js'),             navId: null          },
  'meal':     { load: () => import('../modules/meal.js'),                navId: null          },
  'calc':     { load: () => import('../modules/calc.js'),                navId: 'nav-calc'    },
  'activity': { load: () => import('../modules/activity.js'),            navId: null          },
  'foods':    { load: () => import('../modules/foods.js'),               navId: null          },
  'history':  { load: () => import('../modules/history.js'),             navId: 'nav-history' },
  'learn':    { load: () => import('../modules/learn.js'),               navId: 'nav-learn'   },
  'settings': { load: () => import('../modules/settings.js'),            navId: null          },
};

// ── Callback für Home-Refresh ─────────────────────────────
let _homeRefreshFn = null;
export function setHomeRefreshFn(fn) { _homeRefreshFn = fn; }

// ── Page anzeigen ─────────────────────────────────────────
export async function showPage(pageId, params = {}, pushBack = true) {
  if (!PAGE_REGISTRY[pageId]) {
    console.warn('[Router] Unbekannte Seite:', pageId);
    return;
  }

  // Zurück-Stack
  if (pushBack && _currentPage !== pageId) {
    _backStack.push(_currentPage);
  }

  // Aktuelle Seite verstecken
  const prev = document.getElementById(`page-${_currentPage}`);
  if (prev) prev.classList.remove('active');

  _currentPage = pageId;

  // Ziel-Container holen
  const container = document.getElementById(`page-${pageId}`);
  if (!container) return;

  // Nav-State aktualisieren
  _updateNav(pageId);

  // Modul laden (lazy) und rendern
  const reg = PAGE_REGISTRY[pageId];

  if (pageId === 'home') {
    container.classList.add('active');
    if (_homeRefreshFn) _homeRefreshFn();
    return;
  }

  if (reg.load) {
    let mod = _moduleCache.get(pageId);
    if (!mod) {
      try {
        mod = await reg.load();
        _moduleCache.set(pageId, mod);
      } catch (e) {
        console.error('[Router] Modul-Ladefehler:', pageId, e);
        container.classList.add('active');
        return;
      }
    }

    // Render wenn noch nicht geschehen
    if (!container.dataset.rendered) {
      mod.render(container);
      mod.init?.();
      container.dataset.rendered = '1';
    } else {
      mod.refresh?.();
    }
  }

  container.classList.add('active');
  container.scrollTop = 0;
}

// ── Zurück navigieren ─────────────────────────────────────
export function goBack() {
  const prev = _backStack.pop() || 'home';
  showPage(prev, {}, false);
}

// ── Seite neu laden (Cache leeren) ────────────────────────
export function reloadPage(pageId) {
  const container = document.getElementById(`page-${pageId}`);
  if (container) delete container.dataset.rendered;
  if (_currentPage === pageId) showPage(pageId, {}, false);
}

// ── Nav-Buttons ───────────────────────────────────────────
function _updateNav(pageId) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const reg = PAGE_REGISTRY[pageId];
  if (reg?.navId) {
    document.getElementById(reg.navId)?.classList.add('active');
  }
}

export function getCurrentPage() { return _currentPage; }
