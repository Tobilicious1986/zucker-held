// ═══════════════════════════════════════════════════════════
//  SPORT / AKTIVITÄT — Modul
// ═══════════════════════════════════════════════════════════
import { state, save }   from '../state.js';
import { ACTIVITIES }    from '../config.js';
import { formatTime }    from '../utils.js';
import { checkAndUnlockAchievements } from '../achievements.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Sport</h2>
      <span class="page-icon">🏃</span>
    </div>

    <div class="card card-padded">
      <div class="form-group">
        <label class="form-label">Aktivität</label>
        <div class="activity-grid" id="activityGrid">
          ${ACTIVITIES.map((a,i) =>
            `<button class="activity-btn${i===0?' active':''}" data-id="${a.id}" data-emoji="${a.emoji}">
              <span class="activity-emoji">${a.emoji}</span>
              <span class="activity-name">${a.name}</span>
            </button>`
          ).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Intensität</label>
        <div class="intensity-options" id="intensityGroup">
          <button class="intensity-btn active" data-intensity="leicht">🟢 Leicht</button>
          <button class="intensity-btn" data-intensity="mittel">🟡 Mittel</button>
          <button class="intensity-btn" data-intensity="intensiv">🔴 Intensiv</button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Dauer (Minuten)</label>
        <input class="form-input" type="number" id="activityDuration"
               placeholder="30" min="1" max="480" inputmode="numeric" />
      </div>

      <div class="form-group">
        <label class="form-label">Notiz (optional)</label>
        <input class="form-input" type="text" id="activityNote" maxlength="80"
               placeholder="z.B. BZ vorher 8 mmol/L" />
      </div>

      <button class="btn btn-primary" id="activitySaveBtn">💾 Speichern</button>
    </div>

    <div class="info-banner info-banner-orange">
      ⚠️ <strong>Wichtig bei Sport:</strong> Intensiver Sport kann BZ bis zu 12h danach senken.
      Vor dem Sport BZ messen! Unter 100 mg/dL: erst 15g KH essen.
    </div>

    <div class="card card-padded">
      <div class="card-section-title">Letzte Aktivitäten</div>
      <div id="recentActivityList"></div>
    </div>`;
}

export function init() {
  let selectedActivity = ACTIVITIES[0];
  let selectedIntensity = 'leicht';

  document.getElementById('activityGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.activity-btn');
    if (!btn) return;
    document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedActivity = ACTIVITIES.find(a => a.id === btn.dataset.id) || ACTIVITIES[0];
  });

  document.getElementById('intensityGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('.intensity-btn');
    if (!btn) return;
    document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedIntensity = btn.dataset.intensity;
  });

  document.getElementById('activitySaveBtn')?.addEventListener('click', () => {
    const duration = parseInt(document.getElementById('activityDuration')?.value);
    const note     = document.getElementById('activityNote')?.value?.trim() || '';
    if (!duration || duration < 1) { window.showError('Bitte Dauer eingeben.'); return; }

    state.entries.unshift({
      type:      'activity',
      timestamp: Date.now(),
      activityId: selectedActivity.id,
      activity:  selectedActivity.name,
      emoji:     selectedActivity.emoji,
      intensity: selectedIntensity,
      duration,
      note,
    });
    save();
    window.showSuccess(selectedActivity.emoji, `${selectedActivity.name} — ${duration} min`);
    checkAndUnlockAchievements();
    document.getElementById('activityDuration').value = '';
    document.getElementById('activityNote').value = '';
    _renderRecent();
  });

  _renderRecent();
}

export function refresh() { _renderRecent(); }

function _renderRecent() {
  const list = document.getElementById('recentActivityList');
  if (!list) return;
  const recent = state.entries.filter(e => e.type === 'activity').slice(0, 5);
  if (!recent.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏃</div><div class="empty-state-text">Noch keine Aktivitäten</div></div>`;
    return;
  }
  list.innerHTML = recent.map(e => `
    <div class="log-entry">
      <div class="log-entry-icon log-entry-icon-activity">${e.emoji || '🏃'}</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.activity} — ${e.duration} min</div>
        <div class="log-entry-sub">${e.intensity || ''} · ${formatTime(e.timestamp)}${e.note ? ' · ' + e.note : ''}</div>
      </div>
    </div>`).join('');
}
