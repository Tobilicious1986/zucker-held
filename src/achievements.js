// ═══════════════════════════════════════════════════════════
//  ERRUNGENSCHAFTEN — Zucker-Held v4
// ═══════════════════════════════════════════════════════════
import { ACHIEVEMENTS } from './config.js';
import { state, save }  from './state.js';

// ── Prüfen & Freischalten ─────────────────────────────────
export function checkAndUnlockAchievements() {
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue;
    try {
      if (ach.check(state)) {
        state.unlockedAchievements.push(ach.id);
        newlyUnlocked.push(ach);
      }
    } catch { /* skip */ }
  }

  if (newlyUnlocked.length > 0) {
    save();
    // Mit Verzögerung zeigen (nach dem Speichern-Feedback)
    setTimeout(() => {
      newlyUnlocked.forEach((ach, i) =>
        setTimeout(() => showAchievementUnlock(ach), i * 600)
      );
    }, 500);
  }
}

// ── Unlock-Popup ──────────────────────────────────────────
export function showAchievementUnlock(ach) {
  const popup = document.getElementById('achievementPopup');
  if (!popup) return;

  popup.innerHTML = `
    <div class="ach-popup-inner">
      <div class="ach-popup-icon">${ach.emoji}</div>
      <div class="ach-popup-content">
        <div class="ach-popup-title">Errungenschaft freigeschaltet!</div>
        <div class="ach-popup-name">${ach.name}</div>
        <div class="ach-popup-desc">${ach.desc}</div>
      </div>
    </div>`;
  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
    setTimeout(() => { popup.innerHTML = ''; }, 300);
  }, 3500);
}

// ── Errungenschaften rendern ──────────────────────────────
export function renderAchievements(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const total    = ACHIEVEMENTS.length;
  const unlocked = state.unlockedAchievements.length;
  const pct      = Math.round((unlocked / total) * 100);

  container.innerHTML = `
    <div class="ach-progress-bar">
      <div class="ach-progress-info">
        <span class="ach-progress-label">Errungenschaften</span>
        <span class="ach-progress-count">${unlocked} / ${total}</span>
      </div>
      <div class="ach-progress-track">
        <div class="ach-progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
    <div class="ach-grid">
      ${ACHIEVEMENTS.map(ach => {
        const done = state.unlockedAchievements.includes(ach.id);
        return `<div class="ach-item ${done ? 'unlocked' : 'locked'}" title="${ach.desc}">
          <span class="ach-emoji">${ach.emoji}</span>
          <span class="ach-name">${ach.name}</span>
        </div>`;
      }).join('')}
    </div>`;
}
