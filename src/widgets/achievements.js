import { ACHIEVEMENTS } from '../config.js';

export function achWidget(container, state) {
  const total    = ACHIEVEMENTS.length;
  const unlocked = state.unlockedAchievements.length;
  const pct      = Math.round((unlocked / total) * 100);

  const recent = ACHIEVEMENTS
    .filter(a => state.unlockedAchievements.includes(a.id))
    .slice(-3);

  container.innerHTML += `
    <div class="card card-padded">
      <div class="card-section-title">Errungenschaften</div>
      <div class="ach-progress-bar">
        <div class="ach-progress-info">
          <span class="ach-progress-label">${unlocked} von ${total} freigeschaltet</span>
          <span class="ach-progress-count">${pct}%</span>
        </div>
        <div class="ach-progress-track">
          <div class="ach-progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      ${recent.length > 0
        ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            ${recent.map(a => `<span title="${a.desc}" style="font-size:24px">${a.emoji}</span>`).join('')}
          </div>`
        : `<p class="text-muted text-sm">Sammle deine ersten Errungenschaften!</p>`}
      <button class="btn-ghost btn-small mt-3" onclick="window.showPage('settings')">Alle anzeigen →</button>
    </div>`;
}
