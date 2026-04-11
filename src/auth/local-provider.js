// ═══════════════════════════════════════════════════════════
//  LOCAL AUTH PROVIDER — Zucker-Held v4
//  Verbessertes Profil-System mit Rollen & Migration
// ═══════════════════════════════════════════════════════════

const PROFILES_KEY_V4 = 'zucker-held-v4-profiles';
const PROFILES_KEY_V3 = 'zucker-held-profiles'; // Legacy
const SESSION_KEY     = 'zh-active-profile';
const SESSION_PERM    = 'zh-active-profile-perm';

// ── Profil-Typen & Rollen ─────────────────────────────────
export const PROFILE_TYPES = {
  kind:      { emoji: '👦', label: 'Kind',        desc: 'Vereinfachte Ansicht, Eltern können administrieren' },
  erwachsen: { emoji: '🧑', label: 'Erwachsener', desc: 'Vollständiges Self-Management' },
};

export const ROLES = {
  patient:  { emoji: '🙋', label: 'Ich selbst',    desc: 'Vollzugriff auf eigene Daten' },
  admin:    { emoji: '👪', label: 'Admin/Eltern',   desc: 'Einstellungen, PIN-geschützt' },
  caregiver:{ emoji: '🏫', label: 'Betreuer',       desc: 'Einträge erstellen, lesen — keine Einstellungen' },
  observer: { emoji: '👁️',  label: 'Einblick',       desc: 'Nur lesen (Arzt, Familie)' },
};

// ── Profil-Schema v4 ──────────────────────────────────────
// {
//   id, name, avatar, type ('kind'|'erwachsen'),
//   role ('patient'|'admin'|'caregiver'|'observer'),
//   pin (string|null), createdAt, storageKey
// }

function generateId() {
  return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ── Profile laden/speichern ────────────────────────────────
export function loadProfiles() {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY_V4) || '[]');
  } catch { return []; }
}

function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY_V4, JSON.stringify(profiles));
}

export function createProfile({ name, avatar = '🦊', type = 'erwachsen', role = 'patient', pin = null }) {
  const id = generateId();
  const profile = {
    id,
    name:       name.trim(),
    avatar,
    type,
    role,
    pin:        pin || null,
    createdAt:  Date.now(),
    storageKey: `zucker-held-v4-${id}`,
  };
  const profiles = loadProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

export function updateProfile(id, changes) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === id);
  if (idx === -1) return null;
  profiles[idx] = { ...profiles[idx], ...changes };
  saveProfiles(profiles);
  return profiles[idx];
}

export function archiveProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;
  // Daten sichern vor Archivierung
  const data = localStorage.getItem(profile.storageKey);
  if (data) localStorage.setItem(`_deleted_profile_${id}`, data);
  saveProfiles(profiles.filter(p => p.id !== id));
}

// ── Session ───────────────────────────────────────────────
export function getActiveProfileId() {
  return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_PERM) || null;
}

export function setActiveProfile(id, remember = true) {
  sessionStorage.setItem(SESSION_KEY, id);
  if (remember) localStorage.setItem(SESSION_PERM, id);
  else          localStorage.removeItem(SESSION_PERM);
}

export function clearActiveProfile() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_PERM);
}

export function getActiveProfile() {
  const id = getActiveProfileId();
  if (!id) return null;
  return loadProfiles().find(p => p.id === id) || null;
}

// ── PIN-Prüfung ────────────────────────────────────────────
export function checkPin(profile, pin) {
  if (!profile.pin) return false;
  return profile.pin === String(pin).trim();
}

// ── Rollen-Prüfung (BL-04) ────────────────────────────────
const ROLE_LEVEL = { observer: 0, caregiver: 1, patient: 2, admin: 3 };

export function hasMinRole(user, minRole) {
  return (ROLE_LEVEL[user?.role] ?? 0) >= (ROLE_LEVEL[minRole] ?? 99);
}

// ── Migration v3 → v4 Profile ─────────────────────────────
export function migrateLegacyProfiles() {
  // Bereits migriert?
  if (loadProfiles().length > 0) return;

  try {
    const v3profiles = JSON.parse(localStorage.getItem(PROFILES_KEY_V3) || 'null');
    if (!v3profiles || !Array.isArray(v3profiles) || v3profiles.length === 0) return;

    const migrated = v3profiles.map(p => ({
      id:         p.id,
      name:       p.name       || 'Unbekannt',
      avatar:     p.avatar     || '🦊',
      type:       p.type       || 'erwachsen',
      role:       p.pin ? 'admin' : 'patient',
      pin:        p.pin        || null,
      createdAt:  p.createdAt  || Date.now(),
      storageKey: `zucker-held-v4-${p.id}`,
      _v3key:     p.storageKey || null, // Merkmal für State-Migration
    }));

    saveProfiles(migrated);
    console.log('[Zucker-Held] Profile von v3 → v4 migriert:', migrated.length);
  } catch (e) {
    console.warn('[Zucker-Held] Profil-Migration fehlgeschlagen:', e);
  }
}

// ── Local Auth Provider ────────────────────────────────────
export class LocalAuthProvider {
  constructor() {
    this._user = null;
  }

  /** Login: setzt aktives Profil. Pin optional für admin-Zugang */
  async login({ profileId, pin = null, remember = true }) {
    const profiles = loadProfiles();
    const profile  = profiles.find(p => p.id === profileId);
    if (!profile) throw new Error('Profil nicht gefunden');

    // Falls Profil einen Admin-PIN hat, diesen prüfen wenn versucht wird admin zu werden
    // Normale Nutzung ohne PIN: als patient einloggen
    let effectiveRole = profile.role;
    if (profile.pin && pin === null) {
      effectiveRole = 'patient'; // Ohne PIN nur patient
    } else if (profile.pin && pin !== null) {
      if (!checkPin(profile, pin)) throw new Error('Falscher PIN');
      effectiveRole = profile.role; // Mit PIN voller Zugang
    }

    setActiveProfile(profileId, remember);
    this._user = this._buildUser(profile, effectiveRole);
    return this._user;
  }

  async logout() {
    clearActiveProfile();
    this._user = null;
  }

  async getUser() {
    if (this._user) return this._user;
    const profile = getActiveProfile();
    if (!profile) return null;
    this._user = this._buildUser(profile, profile.role);
    return this._user;
  }

  isAuthenticated() {
    return !!getActiveProfileId();
  }

  async refreshSession() { /* no-op for local */ }

  canWrite() {
    return this._user && this._user.role !== 'observer';
  }

  isAdmin() {
    return this._user && this._user.role === 'admin';
  }

  /** Temporäre Rollenhochstufung für aktuelle Session (BL-04) */
  elevateRole(role) {
    if (!this._user) return;
    this._user = { ...this._user, role };
  }

  _buildUser(profile, role) {
    return {
      id:          profile.id,
      name:        profile.name,
      avatar:      profile.avatar,
      role,
      profileType: profile.type,
      tenantId:    'local',
      storageKey:  profile.storageKey,
      _v3key:      profile._v3key || null,
    };
  }
}
