// ═══════════════════════════════════════════════════════════
//  ERRUNGENSCHAFTEN / ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════
import { ACHIEVEMENTS } from './config.js';
import { state, save }  from './state.js';

/**
 * Prüft alle Errungenschaften und gibt neu freigeschaltete zurück.
 * Zeigt eine Benachrichtigung für jede neue Errungenschaft.
 */
export function checkAndUnlockAchievements() {
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue;
    try {
      if (ach.check(state)) {
        state.unlockedAchievements.push(ach.id);
        newlyUnlocked.push(ach);
      }
    } catch { /* ignore check errors */ }
  }

  if (newlyUnlocked.length > 0) {
    save();
    // Verzögert anzeigen, damit Save-Animation nicht überlagert
    setTimeout(() => showAchievementUnlock(newlyUnlocked[0]), 2200);
  }

  return newlyUnlocked;
}

function showAchievementUnlock(ach) {
  let el = document.getElementById('achievementPopup');
  if (!el) {
    el = document.createElement('div');
    el.id = 'achievementPopup';
    el.className = 'achievement-popup';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div class="achievement-popup-inner">
      <div class="ach-pop-label">🏅 Neue Errungenschaft!</div>
      <div class="ach-pop-emoji">${ach.emoji}</div>
      <div class="ach-pop-name">${ach.name}</div>
      <div class="ach-pop-desc">${ach.desc}</div>
    </div>
  `;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 3500);
}

/**
 * Rendert die Errungenschaften-Sektion (für Settings).
 */
export function renderAchievements(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  const unlocked = new Set(state.unlockedAchievements);
  const total    = ACHIEVEMENTS.length;
  const done     = unlocked.size;

  el.innerHTML = `
    <div class="ach-progress">
      <div class="ach-progress-label">${done} / ${total} freigeschaltet</div>
      <div class="ach-progress-bar">
        <div class="ach-progress-fill" style="width:${Math.round(done/total*100)}%"></div>
      </div>
    </div>
    <div class="ach-grid">
      ${ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlocked.has(ach.id);
        return `<div class="ach-item ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="ach-emoji">${ach.emoji}</div>
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
          ${isUnlocked ? '<div class="ach-check">✅</div>' : ''}
        </div>`;
      }).join('')}
    </div>
  `;
}
