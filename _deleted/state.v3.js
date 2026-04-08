// ═══════════════════════════════════════════════════════════
//  STATE-MANAGEMENT & PERSISTENZ
// ═══════════════════════════════════════════════════════════
import { STORAGE_KEY, STORAGE_KEY_V2 } from './config.js';
import { getActiveProfile } from './profiles.js';

/** Gibt den korrekten Storage-Key zurück (profilspezifisch oder global) */
function getStorageKey() {
  const profile = getActiveProfile();
  return profile ? profile.storageKey : STORAGE_KEY;
}

export const state = {
  // ── Persistierte Daten ──────────────────────────────────
  settings: {
    name:     'Malte',
    avatar:   '🦊',
    min:      70,
    max:      180,
    contacts: [],
  },
  entries:             [],   // { type, timestamp, value?, ... }
  foodDB:              [],   // benutzerdefinierte & online Lebensmittel
  recentFoodIds:       [],   // zuletzt verwendete Lebensmittel-IDs (max 8)
  unlockedAchievements: [],  // IDs freigeschalteter Errungenschaften
  learnVisits:         0,    // Anzahl Besuche im Lernbereich

  // ── Laufzeit-State (nicht persistiert) ──────────────────
  insulinUnits:            0,
  selectedMeasureTime:     'nüchtern',
  selectedInsulinType:     'kurz',
  selectedMealTime:        'Frühstück',
  historyFilter:           'all',
  currentMeal:             { items: [], mealTime: 'Frühstück' },
  selectedFoodForAmount:   null,
  foodsDBFilter:           'all',
  _barcodeStream:          null,
  _barcodeTimer:           null,
  _foodSearchDebounce:     null,
  _lastOnlineResults:      [],  // Puffer für Online-Suchergebnisse
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

// ── Laden (mit v2→v3 Migration) ───────────────────────────
export function load() {
  // Profilspezifischen Key verwenden
  let raw = localStorage.getItem(getStorageKey());

  // Falls kein Profil-Key, globalen Key versuchen
  if (!raw) raw = localStorage.getItem(STORAGE_KEY);

  // Migration von v2 → v3
  if (!raw) {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      try {
        const old = JSON.parse(rawV2);
        state.settings      = { ...state.settings, ...(old.settings || {}) };
        state.entries       = old.entries      || [];
        state.foodDB        = old.foodDB       || [];
        state.recentFoodIds = old.recentFoodIds || [];
        if (!state.settings.contacts) state.settings.contacts = [];
        save(); // Unter neuem Key speichern
        console.log('[Zucker-Held] Daten von v2 migriert');
      } catch (e) {
        console.warn('[Zucker-Held] Migration fehlgeschlagen:', e);
      }
      return;
    }
    return; // Kein gespeicherter State
  }

  try {
    const data = JSON.parse(raw);
    state.settings             = { ...state.settings, ...(data.settings || {}) };
    if (!state.settings.contacts) state.settings.contacts = [];
    state.entries              = data.entries             || [];
    state.foodDB               = data.foodDB              || [];
    state.recentFoodIds        = data.recentFoodIds       || [];
    state.unlockedAchievements = data.unlockedAchievements || [];
    state.learnVisits          = data.learnVisits         || 0;
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
