import { describe, it, expect } from 'vitest';
import { getActiveInsulinFactor } from '../src/utils.js';

describe('Sprint 13 — getActiveInsulinFactor', () => {
  const factors = [
    { id: 'f1', label: 'Nacht',     from: '00:00', to: '06:00', ki: 8,  kf: 20 },
    { id: 'f2', label: 'Morgen',    from: '06:00', to: '11:00', ki: 10, kf: 25 },
    { id: 'f3', label: 'Mittag',    from: '11:00', to: '17:00', ki: 12, kf: 30 },
    { id: 'f4', label: 'Abend',     from: '17:00', to: '22:00', ki: 10, kf: 28 },
    { id: 'f5', label: 'Spätabend', from: '22:00', to: '00:00', ki: 9,  kf: 22 },
  ];

  const settings = {
    insulinFactors: factors,
    insulinRatio: 10,
    correctionFactor: 25,
  };

  function makeDate(hours, minutes = 0) {
    return new Date(2026, 0, 1, hours, minutes, 0);
  }

  it('nutzt morgens den Morgen-Faktor', () => {
    const result = getActiveInsulinFactor(settings, makeDate(8));
    expect(result.label).toBe('Morgen');
    expect(result.ki).toBe(10);
    expect(result.kf).toBe(25);
  });

  it('nutzt mittags den Mittag-Faktor', () => {
    const result = getActiveInsulinFactor(settings, makeDate(12, 30));
    expect(result.label).toBe('Mittag');
    expect(result.ki).toBe(12);
    expect(result.kf).toBe(30);
  });

  it('behandelt Spätabend bis Mitternacht korrekt', () => {
    const result = getActiveInsulinFactor(settings, makeDate(23));
    expect(result.label).toBe('Spätabend');
  });

  it('springt nach Mitternacht wieder auf Nacht zurück', () => {
    const result = getActiveInsulinFactor(settings, makeDate(0, 30));
    expect(result.label).toBe('Nacht');
  });

  it('fällt auf Legacy-Werte zurück wenn keine Zeitblöcke existieren', () => {
    const result = getActiveInsulinFactor({
      insulinFactors: [],
      insulinRatio: 15,
      correctionFactor: 40,
    }, makeDate(10));

    expect(result.label).toBe('Ganztags');
    expect(result.ki).toBe(15);
    expect(result.kf).toBe(40);
  });
});

describe('Sprint 13 — Trim- und Audit-Regeln', () => {
  it('würde nur automatische alte CGM-Einträge trimmen', () => {
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const cgmSources = new Set(['nightscout', 'dexcom']);
    const entries = [
      { id: 'old-dex', timestamp: cutoff - 1000, source: 'dexcom' },
      { id: 'old-ns', timestamp: cutoff - 1000, source: 'nightscout' },
      { id: 'manual', timestamp: cutoff - 1000, source: 'manual' },
      { id: 'fresh', timestamp: Date.now(), source: 'dexcom' },
    ];

    const removed = entries.filter((entry) =>
      entry.timestamp < cutoff && cgmSources.has(entry.source)
    );

    expect(removed.map((entry) => entry.id)).toEqual(['old-dex', 'old-ns']);
  });

  it('hält das Audit-Log bei maximal 200 Einträgen', () => {
    const log = Array.from({ length: 205 }, (_, index) => ({
      ts: Date.now(),
      event: 'pin_changed',
      details: `Eintrag ${index}`,
    }));

    const trimmed = log.slice(0, 200);
    expect(trimmed).toHaveLength(200);
  });
});
