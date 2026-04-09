import { getTimeInRange, getAvgBZ, getCurrentStreak } from '../utils.js';

/** Geschätzter HbA1c aus Durchschnitts-BZ (ADAG-Formel, mg/dL) */
function estimateA1c(entries) {
  const avg90 = getAvgBZ(entries, 90);
  if (!avg90) return null;
  return ((avg90 + 46.7) / 28.7).toFixed(1);
}

export function statsWidget(container, state) {
  const tir    = getTimeInRange(state.entries, state.settings);
  const avg    = getAvgBZ(state.entries, 7);
  const streak = getCurrentStreak(state.entries);
  const a1c    = estimateA1c(state.entries);

  container.innerHTML += `
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">${tir !== null ? tir + '%' : '—'}</div>
        <div class="stat-label">Im Ziel</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">${avg ?? '—'}</div>
        <div class="stat-label">Ø 7 Tage</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">${streak} ${streak === 1 ? 'Tag' : 'Tage'}</div>
        <div class="stat-label">Streak 🔥</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">${a1c ? '~' + a1c + '%' : '—'}</div>
        <div class="stat-label">HbA1c est.</div>
      </div>
    </div>`;
}
