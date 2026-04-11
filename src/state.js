// ═══════════════════════════════════════════════════════════
//  STATE-MANAGEMENT & PERSISTENZ — Zucker-Held v4
// ═══════════════════════════════════════════════════════════
import { STORAGE_KEY, STORAGE_KEY_V3, STORAGE_KEY_V2 } from './config.js';

// ── Speicher-Fehler-Flag (BL-03) ─────────────────────────
let _saveError = false;
export function hasSaveError()       { return _saveError; }
export function clearSaveError()     { _saveError = false; }

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
    name:              'Malte',
    avatar:            '🦊',
    min:               70,
    max:               180,
    contacts:          [],
    widgetConfig:      null,   // { order: [...], disabled: [...] }
    claudeApiKey:      '',     // Anthropic API-Key für KH-Schätzung
    nightscoutUrl:     '',     // Nightscout-URL (z.B. https://ns.meinserver.de)
    nightscoutToken:   '',     // Nightscout Access Token
    // ── Insulin-Rechner (BL-01) ──────────────────────────
    insulinRatio:      10,     // 1 IE pro X g KH
    correctionFactor:  30,     // 1 IE senkt BZ um X mg/dL
    targetBZ:          120,    // Ziel-BZ für Korrekturberechnung
    // ── Benachrichtigungen (BL-07) ────────────────────────
    notificationsEnabled: false,
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

// ── Einträge trimmen (BL-03: Speicher-Notfall) ───────────
function _trimOldEntries(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  // Nur automatische CGM-Einträge entfernen (nightscout + dexcom), keine manuellen
  const before = state.entries.length;
  const CGM_SOURCES = new Set(['nightscout', 'dexcom']);
  state.entries = state.entries.filter(e =>
    e.timestamp >= cutoff || !CGM_SOURCES.has(e.source)
  );
  const removed = before - state.entries.length;
  if (removed > 0) {
    console.warn(`[Zucker-Held] ${removed} alte CGM-Einträge archiviert (> ${days} Tage)`);
  }
}

/** Serialisiertes State-Objekt */
function _statePayload() {
  return JSON.stringify({
    settings:             state.settings,
    entries:              state.entries,
    foodDB:               state.foodDB,
    recentFoodIds:        state.recentFoodIds,
    unlockedAchievements: state.unlockedAchievements,
    learnVisits:          state.learnVisits,
  });
}

// ── Speichern (BL-03: mit Fehlerbehandlung) ───────────────
export function save() {
  try {
    localStorage.setItem(getStorageKey(), _statePayload());
    _saveError = false;
  } catch (e) {
    const isQuota = e.name === 'QuotaExceededError' ||
                   e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                   e.code === 22;
    if (isQuota) {
      // Erste Maßnahme: alte CGM-Einträge (> 90 Tage) trimmen
      _trimOldEntries(90);
      try {
        localStorage.setItem(getStorageKey(), _statePayload());
        _saveError = false;
        console.warn('[Zucker-Held] Speicher war voll — alte CGM-Daten archiviert');
      } catch {
        // Zweite Maßnahme: CGM-Einträge > 30 Tage trimmen
        _trimOldEntries(30);
        try {
          localStorage.setItem(getStorageKey(), _statePayload());
          _saveError = false;
          console.warn('[Zucker-Held] Speicher war voll — CGM-Daten > 30 Tage archiviert');
        } catch {
          _saveError = true;
          console.error('[Zucker-Held] Speicher voll — Daten konnten nicht gespeichert werden!', e);
        }
      }
    } else {
      _saveError = true;
      console.error('[Zucker-Held] Unbekannter Speicherfehler:', e);
    }
  }
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
    if (!state.settings.contacts)        state.settings.contacts        = [];
    if (!state.settings.widgetConfig)   state.settings.widgetConfig    = null;
    if (!state.settings.claudeApiKey)   state.settings.claudeApiKey    = '';
    if (state.settings.nightscoutUrl   === undefined) state.settings.nightscoutUrl   = '';
    if (state.settings.nightscoutToken === undefined) state.settings.nightscoutToken = '';

    state.entries              = data.entries              || [];
    state.foodDB               = data.foodDB               || [];
    state.recentFoodIds        = data.recentFoodIds        || [];
    state.unlockedAchievements = data.unlockedAchievements || [];
    state.learnVisits          = data.learnVisits          || 0;

    // ── Migrations-Defaults für neue Felder (BL-01, BL-07) ──
    if (!state.settings.insulinRatio)        state.settings.insulinRatio        = 10;
    if (!state.settings.correctionFactor)    state.settings.correctionFactor    = 30;
    if (!state.settings.targetBZ)            state.settings.targetBZ            = 120;
    if (state.settings.notificationsEnabled === undefined)
                                             state.settings.notificationsEnabled = false;

    // Unter neuem Key speichern wenn migriert
    if (!localStorage.getItem(key)) {
      save();
      console.log('[Zucker-Held] Daten zu v4 migriert');
    }
  } catch (e) {
    console.error('[Zucker-Held] Fehler beim Laden (JSON beschädigt?):', e);
    // State bleibt bei Defaults — kein teilweises Überschreiben
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
