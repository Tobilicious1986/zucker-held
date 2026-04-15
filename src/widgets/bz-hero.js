// ═══════════════════════════════════════════════════════════
//  BZ-HERO WIDGET — Aktueller BZ groß + Trendpfeil (DASH-01)
// ═══════════════════════════════════════════════════════════
import { getBZStatus, getBZAdvice, getBZTrend, formatTime } from '../utils.js';

export function bzHeroWidget(container, state) {
  const bzEntries = state.entries.filter(e => e.type === 'bz');
  const last      = bzEntries[0] || null;

  if (!last) {
    container.innerHTML += `
      <div class="bz-hero-card bz-hero-none" onclick="window.showPage('bz')">
        <div class="bz-hero-label">Blutzucker</div>
        <div class="bz-hero-value">—</div>
        <div class="bz-hero-meta">Noch keine Messung · Jetzt messen →</div>
      </div>`;
    return;
  }

  const { level, emoji: label } = getBZStatus(last.value, state.settings);
  const advice             = getBZAdvice(last.value, state.settings);
  const { arrow, label: trendLabel } = getBZTrend(bzEntries);
  const timeStr            = formatTime(last.ts);
  const minutesAgo         = Math.round((Date.now() - last.ts) / 60000);
  const ageStr             = minutesAgo < 60
    ? `vor ${minutesAgo} Min.`
    : `vor ${Math.floor(minutesAgo / 60)} Std.`;

  const isStale = minutesAgo > 90;

  container.innerHTML += `
    <div class="bz-hero-card bz-hero-${level}${isStale ? ' bz-hero-stale' : ''}"
         onclick="window.showPage('bz')">
      <div class="bz-hero-header">
        <span class="bz-hero-label">Blutzucker</span>
        <span class="bz-hero-age${isStale ? ' bz-hero-age-stale' : ''}">${ageStr}</span>
      </div>
      <div class="bz-hero-main">
        <span class="bz-hero-value">${last.value}</span>
        <span class="bz-hero-unit">mg/dL</span>
        <span class="bz-hero-trend" title="${trendLabel}">${arrow}</span>
      </div>
      <div class="bz-hero-status">${label}${advice.action ? ' · ' + advice.action : ''}</div>
      ${isStale ? `<div class="bz-hero-stale-banner">⚠️ Messung veraltet — neu messen?</div>` : ''}
    </div>`;
}
