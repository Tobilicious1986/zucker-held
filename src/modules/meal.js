// ═══════════════════════════════════════════════════════════
//  SCHNELL-MAHLZEIT — Modul
// ═══════════════════════════════════════════════════════════
import { state, save, getActiveUser } from '../state.js';
import { formatTime }   from '../utils.js';
import { checkAndUnlockAchievements } from '../achievements.js';

const MEAL_TIMES = ['Frühstück','Mittagessen','Abendessen','Snack'];

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Mahlzeit</h2>
      <span class="page-icon">🍽️</span>
    </div>

    <div class="card card-padded">
      <div class="form-group">
        <label class="form-label">Mahlzeit-Name</label>
        <input class="form-input" type="text" id="mealName"
               placeholder="z.B. Nudeln mit Tomatensoße" maxlength="60" />
      </div>

      <div class="form-group">
        <label class="form-label">Kohlenhydrate (g)</label>
        <input class="input-big" type="number" id="mealKH"
               placeholder="45" min="0" max="500" inputmode="decimal" />
      </div>

      <div class="form-group">
        <label class="form-label">Mahlzeit</label>
        <div class="toggle-group" id="mealTimeGroup">
          ${MEAL_TIMES.map((t,i) =>
            `<button class="toggle-btn${i===0?' active':''}" data-time="${t}">${t}</button>`
          ).join('')}
        </div>
      </div>

      <div style="display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:4px">
        <button class="btn btn-ghost btn-small" onclick="window.showPage('calc')">
          🧮 Zum KH-Rechner →
        </button>
      </div>

      <button class="btn btn-primary" id="mealSaveBtn">💾 Speichern</button>
    </div>

    <div class="card card-padded">
      <div class="card-section-title">Letzte Mahlzeiten</div>
      <div id="recentMealList"></div>
    </div>`;
}

export function init() {
  document.getElementById('mealTimeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#mealTimeGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedMealTime = btn.dataset.time;
  });

  document.getElementById('mealSaveBtn')?.addEventListener('click', _saveMeal);
  _renderRecent();
}

export function refresh() { _renderRecent(); }

function _saveMeal() {
  if (getActiveUser()?.role === 'observer') {
    window.showError('Als Einblick-Nutzer können keine Einträge erstellt werden.');
    return;
  }
  const name = document.getElementById('mealName')?.value?.trim();
  const kh   = parseFloat(document.getElementById('mealKH')?.value);
  if (!name) { window.showError('Bitte Name eingeben.'); return; }
  if (isNaN(kh) || kh < 0) { window.showError('Bitte KH-Menge eingeben.'); return; }

  state.entries.unshift({
    type:      'meal',
    timestamp: Date.now(),
    name,
    kh,
    mealTime:  state.selectedMealTime || 'Mittagessen',
  });
  try {
    save();
  } catch (e) {
    if (e.name === 'ObserverWriteError') {
      window.showError('Beobachter können keine Einträge speichern.');
      state.entries.shift();
      return;
    }
    throw e;
  }
  window.showSuccess('🍽️', `${name} — ${kh} g KH`);
  checkAndUnlockAchievements();
  document.getElementById('mealName').value = '';
  document.getElementById('mealKH').value   = '';
  _renderRecent();
}

function _renderRecent() {
  const list = document.getElementById('recentMealList');
  if (!list) return;
  const recent = state.entries.filter(e => e.type === 'meal').slice(0, 6);
  if (!recent.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🍽️</div><div class="empty-state-text">Noch keine Mahlzeiten</div></div>`;
    return;
  }
  list.innerHTML = recent.map(e => `
    <div class="log-entry">
      <div class="log-entry-icon log-entry-icon-meal">🍽️</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.name}</div>
        <div class="log-entry-sub">${e.kh} g KH · ${e.mealTime || ''} · ${formatTime(e.timestamp)}</div>
      </div>
      <span class="log-entry-badge badge-neutral">${e.kh}g</span>
    </div>`).join('');
}
