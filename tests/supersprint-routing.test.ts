import { describe, expect, it } from 'vitest';
import { routeForAccessScope } from '../frontend/src/lib/access-routing';
import { accessSummaryLabel, relationshipLabel } from '../frontend/src/lib/alltag-access';

describe('Supersprint S14-S16 — scope routing', () => {
  it('routet LIVE_MEDICAL in den Observer-Flow', () => {
    expect(routeForAccessScope('LIVE_MEDICAL', 'owner-1')).toBe('/observer');
  });

  it('routet SUMMARY_ONLY in den Wochenbericht', () => {
    expect(routeForAccessScope('SUMMARY_ONLY', 'owner-1')).toBe('/summary/owner-1');
  });

  it('routet LEARNING_ONLY in den Lernzugang', () => {
    expect(routeForAccessScope('LEARNING_ONLY', 'owner-1')).toBe('/learning/owner-1');
  });

  it('labelt Schule und Trainer als Notfallhilfe ohne Messwerte', () => {
    expect(accessSummaryLabel({
      relationshipKind: 'SCHOOL',
      accessScope: 'LEARNING_ONLY',
      purpose: 'Sport/Schule: Notfallhilfe und Tagesuebergabe',
      role: 'OBSERVER',
    })).toBe('Schule/Trainer · Notfallhilfe · keine Messwerte');
  });

  it('labelt Grosseltern und Partner anhand des Zwecks getrennt', () => {
    expect(relationshipLabel('FAMILY', 'Großeltern/Betreuung: Notfallhilfe im Alltag'))
      .toBe('Großeltern / Betreuung');
    expect(relationshipLabel('FAMILY', 'Partner/Geschwister: Wochenüberblick und Alltagshilfe'))
      .toBe('Partner / Geschwister');
  });
});
