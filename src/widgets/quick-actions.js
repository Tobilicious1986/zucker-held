export function quickActionsWidget(container) {
  container.innerHTML += `
    <div class="quick-actions">
      <button class="action-btn action-btn-bz" onclick="window.showPage('bz')">
        <span class="action-icon">🩸</span>BZ messen
      </button>
      <button class="action-btn action-btn-insulin" onclick="window.showPage('insulin')">
        <span class="action-icon">💉</span>Insulin
      </button>
      <button class="action-btn action-btn-meal" onclick="window.showPage('meal')">
        <span class="action-icon">🍽️</span>Mahlzeit
      </button>
      <button class="action-btn action-btn-calc" onclick="window.showPage('calc')">
        <span class="action-icon">🧮</span>KH-Rechner
      </button>
      <button class="action-btn action-btn-activity" onclick="window.showPage('activity')">
        <span class="action-icon">🏃</span>Sport
      </button>
      <button class="action-btn action-btn-learn" onclick="window.showPage('learn')">
        <span class="action-icon">📚</span>Lernen
      </button>
    </div>`;
}
