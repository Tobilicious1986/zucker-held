// ═══════════════════════════════════════════════════════════
//  MULTI-USER TESTS — local-provider.js
//  Aktualisiert Sprint 12: createProfile + checkPin sind async
// ═══════════════════════════════════════════════════════════
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadProfiles,
  createProfile,
  updateProfile,
  archiveProfile,
  checkPin,
  hashPin,
  getActiveProfileId,
  setActiveProfile,
  clearActiveProfile,
  migrateLegacyProfiles,
} from '../src/auth/local-provider.js';

// ── localStorage Mock ─────────────────────────────────────
beforeEach(() => {
  // Echtes jsdom-localStorage leeren vor jedem Test
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// ── createProfile ─────────────────────────────────────────
describe('createProfile', () => {
  it('legt Profil mit korrekter Struktur an', async () => {
    const p = await createProfile({ name: 'Malte' });
    expect(p.name).toBe('Malte');
    expect(p.avatar).toBe('🦊');
    expect(p.type).toBe('erwachsen');
    expect(p.role).toBe('patient');
    expect(p.pin).toBeNull();
    expect(p.id).toMatch(/^p_/);
    expect(p.storageKey).toBe(`zucker-held-v4-${p.id}`);
  });

  it('trimmt Leerzeichen im Namen', async () => {
    const p = await createProfile({ name: '  Malte  ' });
    expect(p.name).toBe('Malte');
  });

  it('speichert Profil im localStorage', async () => {
    await createProfile({ name: 'Test' });
    const profiles = loadProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Test');
  });

  it('speichert PIN als SHA-256-Hash (64-Zeichen-Hex)', async () => {
    const p = await createProfile({ name: 'Kind', type: 'kind', pin: '1234' });
    expect(p.pin).toMatch(/^[0-9a-f]{64}$/);
    expect(p.pin).not.toBe('1234');
  });

  it('speichert mehrere Profile unabhängig', async () => {
    await createProfile({ name: 'Malte' });
    await createProfile({ name: 'Mama' });
    expect(loadProfiles()).toHaveLength(2);
  });
});

// ── loadProfiles ──────────────────────────────────────────
describe('loadProfiles', () => {
  it('gibt leeres Array zurück wenn keine Profile', () => {
    expect(loadProfiles()).toEqual([]);
  });

  it('gibt alle angelegten Profile zurück', async () => {
    await createProfile({ name: 'A' });
    await createProfile({ name: 'B' });
    const profiles = loadProfiles();
    expect(profiles.map(p => p.name)).toEqual(['A', 'B']);
  });

  it('gibt leeres Array bei korruptem localStorage zurück', () => {
    localStorage.setItem('zucker-held-v4-profiles', 'KEIN_JSON');
    expect(loadProfiles()).toEqual([]);
  });
});

// ── updateProfile ─────────────────────────────────────────
describe('updateProfile', () => {
  it('aktualisiert Name und Avatar', async () => {
    const p = await createProfile({ name: 'Alt', avatar: '🦊' });
    const updated = updateProfile(p.id, { name: 'Neu', avatar: '🐻' });
    expect(updated.name).toBe('Neu');
    expect(updated.avatar).toBe('🐻');
  });

  it('bleibt unverändert bei nicht betroffenen Feldern', async () => {
    const p = await createProfile({ name: 'Malte', type: 'kind', pin: '1234' });
    updateProfile(p.id, { name: 'Malte 2' });
    const profiles = loadProfiles();
    const updated = profiles.find(x => x.id === p.id);
    expect(updated.type).toBe('kind');
    // PIN ist jetzt Hash — nicht null und nicht Klartext
    expect(updated.pin).toMatch(/^[0-9a-f]{64}$/);
  });

  it('entfernt PIN wenn auf null gesetzt', async () => {
    const p = await createProfile({ name: 'Test', pin: '1234' });
    updateProfile(p.id, { pin: null });
    const profiles = loadProfiles();
    expect(profiles.find(x => x.id === p.id).pin).toBeNull();
  });

  it('gibt null zurück bei unbekannter ID', () => {
    expect(updateProfile('unbekannt', { name: 'X' })).toBeNull();
  });

  it('persistiert Änderungen in localStorage', async () => {
    const p = await createProfile({ name: 'Vorher' });
    updateProfile(p.id, { name: 'Nachher' });
    // Neu laden aus localStorage
    const profiles = loadProfiles();
    expect(profiles.find(x => x.id === p.id).name).toBe('Nachher');
  });
});

// ── archiveProfile ────────────────────────────────────────
describe('archiveProfile', () => {
  it('entfernt Profil aus der Liste', async () => {
    const p = await createProfile({ name: 'Zu löschen' });
    archiveProfile(p.id);
    expect(loadProfiles()).toHaveLength(0);
  });

  it('sichert Profil-Daten unter _deleted_profile_*', async () => {
    const p = await createProfile({ name: 'Test' });
    // Daten für Profil simulieren
    localStorage.setItem(p.storageKey, JSON.stringify({ entries: [] }));
    archiveProfile(p.id);
    const backup = localStorage.getItem(`_deleted_profile_${p.id}`);
    expect(backup).toBeTruthy();
    expect(JSON.parse(backup)).toEqual({ entries: [] });
  });

  it('lässt andere Profile unberührt', async () => {
    await createProfile({ name: 'Bleibt' });
    const p2 = await createProfile({ name: 'Weg' });
    archiveProfile(p2.id);
    const remaining = loadProfiles();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Bleibt');
  });
});

// ── checkPin (async seit SEC-01 PIN-Hashing) ─────────────
describe('checkPin', () => {
  it('gibt true bei korrektem PIN zurück', async () => {
    const p = await createProfile({ name: 'Test', pin: '1234' });
    expect(await checkPin(p, '1234')).toBe(true);
  });

  it('gibt false bei falschem PIN zurück', async () => {
    const p = await createProfile({ name: 'Test', pin: '1234' });
    expect(await checkPin(p, '9999')).toBe(false);
  });

  it('gibt false wenn kein PIN gesetzt ist', async () => {
    const p = await createProfile({ name: 'Test' });
    expect(await checkPin(p, '1234')).toBe(false);
  });

  it('behandelt PIN als String', async () => {
    const p = await createProfile({ name: 'Test', pin: '0042' });
    expect(await checkPin(p, '0042')).toBe(true);
    expect(await checkPin(p, '42')).toBe(false);
  });
});

// ── hashPin ───────────────────────────────────────────────
describe('hashPin', () => {
  it('erzeugt deterministischen 64-Zeichen-Hex-SHA-256', async () => {
    const h1 = await hashPin('1234');
    const h2 = await hashPin('1234');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('verschiedene PINs erzeugen verschiedene Hashes', async () => {
    expect(await hashPin('1234')).not.toBe(await hashPin('5678'));
  });
});

// ── Session ───────────────────────────────────────────────
describe('setActiveProfile / getActiveProfileId', () => {
  it('speichert und liest aktive Profil-ID', async () => {
    const p = await createProfile({ name: 'Test' });
    setActiveProfile(p.id);
    expect(getActiveProfileId()).toBe(p.id);
  });

  it('gibt null zurück wenn kein Profil aktiv', () => {
    expect(getActiveProfileId()).toBeNull();
  });

  it('clearActiveProfile entfernt Session', async () => {
    const p = await createProfile({ name: 'Test' });
    setActiveProfile(p.id);
    clearActiveProfile();
    expect(getActiveProfileId()).toBeNull();
  });

  it('remember=false speichert nur in sessionStorage', async () => {
    const p = await createProfile({ name: 'Test' });
    setActiveProfile(p.id, false);
    expect(sessionStorage.getItem('zh-active-profile')).toBe(p.id);
    expect(localStorage.getItem('zh-active-profile-perm')).toBeNull();
  });
});

// ── migrateLegacyProfiles ─────────────────────────────────
describe('migrateLegacyProfiles', () => {
  it('migriert v3-Profile in v4-Format', () => {
    const v3 = [
      { id: 'old_1', name: 'Malte', avatar: '🦊', type: 'kind', pin: '1234',
        createdAt: 1000, storageKey: 'zucker-held-old_1' }
    ];
    localStorage.setItem('zucker-held-profiles', JSON.stringify(v3));

    migrateLegacyProfiles();

    const profiles = loadProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Malte');
    expect(profiles[0].role).toBe('admin'); // mit PIN → admin
    expect(profiles[0].storageKey).toBe('zucker-held-v4-old_1');
    expect(profiles[0]._v3key).toBe('zucker-held-old_1');
  });

  it('migriert nicht wenn bereits v4-Profile vorhanden', async () => {
    await createProfile({ name: 'Bereits v4' });
    localStorage.setItem('zucker-held-profiles', JSON.stringify(
      [{ id: 'x', name: 'Alt', avatar: '🦊', type: 'kind' }]
    ));

    migrateLegacyProfiles();

    // Muss unverändert bleiben
    expect(loadProfiles().map(p => p.name)).toEqual(['Bereits v4']);
  });

  it('tut nichts wenn keine v3-Profile vorhanden', () => {
    migrateLegacyProfiles();
    expect(loadProfiles()).toEqual([]);
  });
});
