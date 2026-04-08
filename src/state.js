// ═══════════════════════════════════════════════════════════
//  STATE-MANAGEMENT & PERSISTENZ — Zucker-Held v4
// ═══════════════════════════════════════════════════════════
import { STORAGE_KEY, STORAGE_KEY_V3, STORAGE_KEY_V2 } from './config.js';

// Aktiver User (wird von app.js gesetzt nach Auth)
let _activeUser = null;
export function setActiveUser(user) { _activeUser = user; }
export function getActiveUser()     { return _activeUser; }

/** Storage-Key für aktuellen User */
function getStorageKey() {
  return _activeUser?.storageKey || STORAGE_KEY;
}

// ── State-Objekt ──────────────────────────────────────────
export const state = {
  // ── Persistiert ──────────────────────────────────────────
  settings: {
    name:         'Malte',
    avatar:       '🦊',
    min:          70,
    max:          180,
    contacts:     [],
    widgetConfig: null,   // { order: [...], disabled: [...] }
  },
  entries:              [],   // { type, timestamp, value?, ... }
  foodDB:               [],   // benutzerdefinierte & online Lebensmittel
  recentFoodIds:        [],   // zuletzt verwendete Lebensmittel-IDs (max 8)
  unlockedAchievements: [],
  learnVisits:          0,

  // ── Runtime (nicht persistiert) ──────────────────────────
  insulinUnits:           0,
  selectedMeasureTime:    'nüchtern',
  selectedInsulinType:    'kurz',
  selectedMealTime:       'Frühstück',
  historyFilter:          'all',
  currentMeal:            { items: [], mealTime: 'Frühstück' },
  selectedFoodForAmount:  null,
  foodsDBFilter:          'all',
  _barcodeStream:         null,
  _barcodeTimer:          null,
  _foodSearchDebounce:    null,
  _lastOnlineResults:     [],
};

// ── Speichern ─────────────────────────────────────────────
export function save() {
  localStorage.setItem(getStorageKey(), JSON.stringify({
    settings:             state.settings,
    entries:              state.entries,
    foodDB:               state.foodDB,
    recentFoodIds:        state.recentFoodIds,
    unlockedAchievements: state.unlockedAchievements,
    learnVisits:          state.learnVisits,
  }));
}

// ── Laden (mit Migration v2/v3 → v4) ─────────────────────
export function load() {
  const key = getStorageKey();
  let raw = localStorage.getItem(key);

  // v3 Profil-Key (gleiche Profile-ID, anderer Prefix)
  if (!raw && _activeUser?._v3key) {
    raw = localStorage.getItem(_activeUser._v3key);
  }

  // v3 global key
  if (!raw) raw = localStorage.getItem(STORAGE_KEY_V3);

  // v2 legacy key
  if (!raw) raw = localStorage.getItem(STORAGE_KEY_V2);

  if (!raw) return; // Keine gespeicherten Daten

  try {
    const data = JSON.parse(raw);
    state.settings = {
      ...state.settings,
      ...(data.settings || {}),
    };
    if (!state.settings.contacts)     state.settings.contacts     = [];
    if (!state.settings.widgetConfig) state.settings.widgetConfig = null;

    state.entries              = data.entries              || [];
    state.foodDB               = data.foodDB               || [];
    state.recentFoodIds        = data.recentFoodIds        || [];
    state.unlockedAchievements = data.unlockedAchievements || [];
    state.learnVisits          = data.learnVisits          || 0;

    // Unter neuem Key speichern wenn migriert
    if (!localStorage.getItem(key)) {
      save();
      console.log('[Zucker-Held] Daten zu v4 migriert');
    }
  } catch (e) {
    console.error('[Zucker-Held] Fehler beim Laden:', e);
  }
}

// ── Daten löschen ─────────────────────────────────────────
export function clearAll() {
  state.entries              = [];
  state.foodDB               = [];
  state.recentFoodIds        = [];
  state.unlockedAchievements = [];
  state.learnVisits          = 0;
  save();
}
