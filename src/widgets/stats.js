import { getTimeInRange, getAvgBZ, getCurrentStreak } from '../utils.js';

export function statsWidget(container, state) {
  const tir    = getTimeInRange(state.entries, state.settings);
  const avg    = getAvgBZ(state.entries, 7);
  const streak = getCurrentStreak(state.entries);

  container.innerHTML += `
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">${tir}%</div>
        <div class="stat-label">Im Ziel</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">${avg > 0 ? avg : '—'}</div>
        <div class="stat-label">Ø 7 Tage</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">${streak} ${streak === 1 ? 'Tag' : 'Tage'}</div>
        <div class="stat-label">Streak 🔥</div>
      </div>
    </div>`;
}
