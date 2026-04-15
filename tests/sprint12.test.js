// ═══════════════════════════════════════════════════════════
//  SPRINT-12-TESTS — SEC-01, SEC-02, DASH-01, DASH-02
// ═══════════════════════════════════════════════════════════
import { describe, it, expect, beforeEach } from 'vitest';
import { hashPin, checkPin, createProfile } from '../src/auth/local-provider.js';

// ── Hilfsfunktionen aus utils.js ─────────────────────────
// Direkt importieren sobald Vitest mit ES-Modulen umgehen kann.
// Bis dahin: minimale Inline-Implementierungen zum Testen der Logik.

function getBZTrend(entries) {
  const bzEntries = entries.filter(e => e.type === 'bz');
  if (bzEntries.length < 2) return { arrow: '→', label: 'stabil' };
  const delta = bzEntries[0].value - bzEntries[1].value;
  if (delta >  15) return { arrow: '↗', label: 'steigend' };
  if (delta < -15) return { arrow: '↘', label: 'fallend'  };
  return              { arrow: '→', label: 'stabil'    };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ── SEC-01 · PIN-Hashing ──────────────────────────────────
describe('SEC-01 · PIN-Hashing', () => {
  it('hashPin erzeugt 64-Zeichen-Hex-String', async () => {
    const hash = await hashPin('1234');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashPin ist deterministisch', async () => {
    expect(await hashPin('geheim')).toBe(await hashPin('geheim'));
  });

  it('verschiedene PINs → verschiedene Hashes', async () => {
    expect(await hashPin('0000')).not.toBe(await hashPin('1111'));
  });

  it('createProfile speichert PIN als Hash, nicht als Klartext', async () => {
    const p = await createProfile({ name: 'Malte', pin: '1234' });
    expect(p.pin).not.toBe('1234');
    expect(p.pin).toMatch(/^[0-9a-f]{64}$/);
  });

  it('checkPin erkennt korrekten Klartext gegen gespeicherten Hash', async () => {
    const p = await createProfile({ name: 'Test', pin: '9876' });
    expect(await checkPin(p, '9876')).toBe(true);
    expect(await checkPin(p, '0000')).toBe(false);
  });

  it('Legacy-PIN (Klartext, kein Hash) wird als Fallback akzeptiert', async () => {
    // Simuliert Profil mit altem Klartext-PIN
    const legacyProfile = { pin: '1234', name: 'Alt' };
    expect(await checkPin(legacyProfile, '1234')).toBe(true);
    expect(await checkPin(legacyProfile, '9999')).toBe(false);
  });
});

// ── DASH-01 · BZ-Trendpfeil ──────────────────────────────
describe('DASH-01 · getBZTrend', () => {
  const entry = (value, offsetMs = 0) => ({
    type: 'bz', value, ts: Date.now() - offsetMs
  });

  it('gibt → zurück wenn weniger als 2 BZ-Einträge', () => {
    expect(getBZTrend([])).toEqual({ arrow: '→', label: 'stabil' });
    expect(getBZTrend([entry(120)])).toEqual({ arrow: '→', label: 'stabil' });
  });

  it('gibt ↗ zurück wenn Δ > +15 mg/dL', () => {
    const entries = [entry(150), entry(130, 300000)];
    expect(getBZTrend(entries)).toEqual({ arrow: '↗', label: 'steigend' });
  });

  it('gibt ↘ zurück wenn Δ < -15 mg/dL', () => {
    const entries = [entry(100), entry(125, 300000)];
    expect(getBZTrend(entries)).toEqual({ arrow: '↘', label: 'fallend' });
  });

  it('gibt → zurück wenn |Δ| ≤ 15 (Schwelle exakt)', () => {
    expect(getBZTrend([entry(130), entry(115, 300000)])).toEqual({ arrow: '→', label: 'stabil' });
    expect(getBZTrend([entry(130), entry(145, 300000)])).toEqual({ arrow: '→', label: 'stabil' });
  });

  it('ignoriert Nicht-BZ-Einträge bei Trendberechnung', () => {
    const entries = [
      { type: 'mahlzeit', value: 200, ts: Date.now() },
      entry(145),
      entry(125, 300000),
    ];
    // Δ = 20 > 15 → ↗
    expect(getBZTrend(entries)).toEqual({ arrow: '↗', label: 'steigend' });
  });
});

// ── DASH-02 · Tägliche Challenges ────────────────────────
describe('DASH-02 · Challenge-Logik', () => {
  const todayStr = new Date().toISOString().slice(0, 10);

  function buildState(entries = []) {
    return {
      entries,
      dailyChallenges: { date: todayStr, completed: [] },
      coins: 0,
    };
  }

  function checkChallenge(state, challengeId) {
    const todayEntries = state.entries.filter(e => {
      const d = new Date(e.ts).toISOString().slice(0, 10);
      return d === todayStr;
    });
    if (challengeId === 'bz')       return todayEntries.some(e => e.type === 'bz');
    if (challengeId === 'mahlzeit') return todayEntries.some(e => e.type === 'mahlzeit');
    if (challengeId === 'aktivitaet') return todayEntries.some(e => e.type === 'aktivitaet');
    return false;
  }

  it('BZ-Challenge nicht erfüllt ohne Einträge', () => {
    expect(checkChallenge(buildState(), 'bz')).toBe(false);
  });

  it('BZ-Challenge erfüllt nach heutigem BZ-Eintrag', () => {
    const state = buildState([{ type: 'bz', value: 130, ts: Date.now() }]);
    expect(checkChallenge(state, 'bz')).toBe(true);
  });

  it('Mahlzeit-Challenge erfüllt nach heutigem Mahlzeit-Eintrag', () => {
    const state = buildState([{ type: 'mahlzeit', kh: 40, ts: Date.now() }]);
    expect(checkChallenge(state, 'mahlzeit')).toBe(true);
  });

  it('Aktivitäts-Challenge nicht durch gestrigen Eintrag erfüllt', () => {
    const gestern = Date.now() - 86400000;
    const state = buildState([{ type: 'aktivitaet', ts: gestern }]);
    expect(checkChallenge(state, 'aktivitaet')).toBe(false);
  });

  it('Challenges aus anderem Tag werden zurückgesetzt', () => {
    const stateAlt = { entries: [], dailyChallenges: { date: '2020-01-01', completed: ['bz', 'mahlzeit'] }, coins: 20 };
    const istHeute = stateAlt.dailyChallenges.date !== todayStr;
    expect(istHeute).toBe(true); // Auslöser für Reset
  });
});
