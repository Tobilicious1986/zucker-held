import { describe, expect, it } from 'vitest';
import { routeForAccessScope } from '../frontend/src/lib/access-routing';

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
});
