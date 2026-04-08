// ═══════════════════════════════════════════════════════════
//  NUTZERPROFIL-VERWALTUNG
//  Unterstützt: Kind-Profile (mit Admin/Betreuer) + Erwachsene
// ═══════════════════════════════════════════════════════════

const PROFILES_KEY = 'zucker-held-profiles';

// ── Profiltypen ───────────────────────────────────────────
export const PROFILE_TYPES = {
  kind:      { label: 'Kind',          emoji: '👦', desc: 'Vereinfachte Ansicht für Kinder — Eltern/Betreuer können administrieren' },
  erwachsen: { label: 'Erwachsener',   emoji: '🧑', desc: 'Vollständige Self-Management-Ansicht mit optionalem Einblick für Dritte' },
};

// ── Rollen ────────────────────────────────────────────────
export const ROLES = {
  selbst:   { label: 'Ich selbst',   emoji: '🙋', desc: 'Vollzugriff auf eigene Daten' },
  eltern:   { label: 'Eltern/Admin', emoji: '👪', desc: 'Vollzugriff + Einstellungen verwalten' },
  betreuer: { label: 'Betreuer',     emoji: '🏫', desc: 'Kann Einträge sehen und SOS öffnen' },
  einblick: { label: 'Einblick',     emoji: '👁️',  desc: 'Nur lesend — für Ärzte, Familie' },
};

// ── Profil-Schema ─────────────────────────────────────────
// {
//   id:          string (uuid)
//   name:        string
//   avatar:      string (emoji)
//   type:        'kind' | 'erwachsen'
//   pin:         string | null  (4-stellig, für Admin-Zugang bei Kind-Profilen)
//   createdAt:   number (timestamp)
//   storageKey:  string  ('zucker-held-v3-{id}')
// }

// ── Profil-Index laden/speichern ──────────────────────────
export function loadProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveProfileIndex(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

// ── Profil erstellen ──────────────────────────────────────
export function createProfile({ name, avatar = '🦊', type = 'kind', pin = null }) {
  const id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  const profile = {
    id,
    name:       name.trim(),
    avatar,
    type,
    pin,
    createdAt:  Date.now(),
    storageKey: 'zucker-held-v3-' + id,
  };

  const profiles = loadProfiles();
  profiles.push(profile);
  saveProfileIndex(profiles);
  return profile;
}

// ── Profil aktualisieren ──────────────────────────────────
export function updateProfile(id, changes) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return;
  profiles[idx] = { ...profiles[idx], ...changes };
  saveProfileIndex(profiles);
}

// ── Profil löschen (verschiebt Daten in _deleted_profiles) ─
export function archiveProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;

  // Daten sichern
  const data = localStorage.getItem(profile.storageKey);
  if (data) {
    localStorage.setItem('_deleted_profile_' + id, data);
    localStorage.removeItem(profile.storageKey);
  }

  // Aus Index entfernen
  saveProfileIndex(profiles.filter(p => p.id !== id));
}

// ── Aktuell ausgewähltes Profil ───────────────────────────
const SESSION_KEY = 'zucker-held-active-profile';

export function getActiveProfileId() {
  return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || null;
}

export function setActiveProfile(id, remember = false) {
  sessionStorage.setItem(SESSION_KEY, id);
  if (remember) localStorage.setItem(SESSION_KEY, id);
}

export function getActiveProfile() {
  const id = getActiveProfileId();
  if (!id) return null;
  return loadProfiles().find(p => p.id === id) || null;
}

// ── PIN-Prüfung ───────────────────────────────────────────
export function checkPin(profile, pin) {
  if (!profile.pin) return true; // Kein PIN gesetzt
  return String(profile.pin) === String(pin);
}

// ── Migrations-Helper: Legacy-Daten in erstes Profil ──────
export function migrateLegacyData() {
  const profiles = loadProfiles();
  if (profiles.length > 0) return; // Schon Profile vorhanden

  const legacyV3 = localStorage.getItem('zucker-held-v3');
  const legacyV2 = localStorage.getItem('zucker-held-v2');
  const raw      = legacyV3 || legacyV2;
  if (!raw) return; // Keine alten Daten

  try {
    const data = JSON.parse(raw);
    const name = data.settings?.name || 'Malte';

    const profile = createProfile({
      name,
      avatar: data.settings?.avatar || '🦊',
      type:   'kind',
      pin:    null,
    });

    // Alte Daten in neues Profil-Key kopieren
    localStorage.setItem(profile.storageKey, raw);
    console.log('[Zucker-Held] Legacy-Daten in Profil migriert:', name);
  } catch (e) {
    console.warn('[Zucker-Held] Profil-Migration fehlgeschlagen:', e);
  }
}
