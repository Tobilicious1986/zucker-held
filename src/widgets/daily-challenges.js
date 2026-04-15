// ═══════════════════════════════════════════════════════════
//  TAGES-CHALLENGES WIDGET — Zucker-Held v4 (DASH-02)
// ═══════════════════════════════════════════════════════════
import { DAILY_CHALLENGES }  from '../config.js';
import { state, save }       from '../state.js';

/** Gibt den heutigen Challenge-State zurück, reinitialisiert bei neuem Tag */
function _getTodayChallenges() {
  const today = new Date().toDateString();
  if (!state.dailyChallenges || state.dailyChallenges.date !== today) {
    state.dailyChallenges = { date: today, completed: [] };
    // Kein save() hier — wird beim nächsten echten Speichern persistiert
  }
  return state.dailyChallenges;
}

/** Prüft aktuelle Entries gegen Challenge-Regeln und schreibt abgeschlossene */
function _refreshChallengeState() {
  const dc = _getTodayChallenges();
  let coinsEarned = 0;

  for (const challenge of DAILY_CHALLENGES) {
    const wasCompleted = dc.completed.includes(challenge.id);
    const isNowDone    = challenge.check(state.entries);

    if (isNowDone && !wasCompleted) {
      dc.completed.push(challenge.id);
      state.coins = (state.coins || 0) + challenge.coins;
      coinsEarned += challenge.coins;
    }
  }

  if (coinsEarned > 0) {
    save();
    // Konfetti-Feedback
    _showCoinToast(coinsEarned);
  }
  return dc;
}

function _showCoinToast(coins) {
  if (window.showToast) {
    window.showToast(`🪙 +${coins} Coins verdient!`, 'success');
  }
}

export function dailyChallengesWidget(container, stateRef) {
  const dc        = _refreshChallengeState();
  const total     = DAILY_CHALLENGES.length;
  const done      = dc.completed.length;
  const pct       = Math.round((done / total) * 100);
  const allDone   = done >= total;
  const coins     = state.coins || 0;

  container.innerHTML += `
    <div class="challenge-card${allDone ? ' challenge-card-complete' : ''}">
      <div class="challenge-header">
        <div class="challenge-title">
          <span class="challenge-icon">🎯</span>
          <span>Tages-Challenges</span>
        </div>
        <div class="challenge-coins">
          <span class="coin-icon">🪙</span>
          <span class="coin-count">${coins}</span>
        </div>
      </div>

      <div class="challenge-progress-bar">
        <div class="challenge-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="challenge-progress-label">${done} / ${total} erledigt</div>

      <div class="challenge-list">
        ${DAILY_CHALLENGES.map(c => {
          const isComplete = dc.completed.includes(c.id);
          return `
            <div class="challenge-item${isComplete ? ' challenge-item-done' : ''}">
              <span class="challenge-item-emoji">${c.emoji}</span>
              <div class="challenge-item-body">
                <div class="challenge-item-title">${c.title}</div>
                <div class="challenge-item-desc">${c.desc}</div>
              </div>
              <span class="challenge-item-status">
                ${isComplete ? '✅' : `<span class="challenge-coins-badge">+${c.coins}🪙</span>`}
              </span>
            </div>`;
        }).join('')}
      </div>

      ${allDone ? `
        <div class="challenge-complete-banner">
          🎉 Alle Challenges geschafft! Toll gemacht!
        </div>` : ''}
    </div>`;
}
