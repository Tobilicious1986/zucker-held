// ═══════════════════════════════════════════════════════════
//  BZ-MESSUNG — Modul
// ═══════════════════════════════════════════════════════════
import { state, save, getActiveUser } from '../state.js';
import { getBZStatus, getBZAdvice, formatTime } from '../utils.js';
import { checkAndUnlockAchievements }           from '../achievements.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">BZ messen</h2>
      <span class="page-icon">🩸</span>
    </div>

    <div class="card card-padded">
      <div class="form-group">
        <label class="form-label">Blutzucker (mg/dL)</label>
        <input class="input-big" type="number" id="bzValue"
               placeholder="120" min="20" max="600" inputmode="decimal" />
        <div id="bzPreview" class="bz-preview"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Zeitpunkt</label>
        <div class="toggle-group" id="bzTimeGroup">
          ${['nüchtern','vor Mahlzeit','nach Mahlzeit','vor Sport','nach Sport','vor Schlaf','nachts'].map((t,i) =>
            `<button class="toggle-btn${i===0?' active':''}" data-time="${t}">${t}</button>`
          ).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notiz (optional)</label>
        <input class="form-input" type="text" id="bzNote" placeholder="z.B. nach dem Sport" maxlength="80" />
      </div>

      <button class="btn btn-primary" id="bzSaveBtn">💾 Speichern</button>
    </div>

    <div class="card card-padded">
      <div class="card-section-title">Letzte Messungen</div>
      <div id="recentBZList"></div>
    </div>`;
}

export function init() {
  const input    = document.getElementById('bzValue');
  const preview  = document.getElementById('bzPreview');
  const timeGrp  = document.getElementById('bzTimeGroup');
  const saveBtn  = document.getElementById('bzSaveBtn');
  if (!input) return;

  // Live-Vorschau
  input.addEventListener('input', () => {
    const v = parseInt(input.value);
    if (!v || v < 20) { preview.className = 'bz-preview'; return; }
    const { level, label, emoji } = getBZStatus(v, state.settings);
    const advice = getBZAdvice(v, state.settings);
    preview.className = `bz-preview visible ${level}`;
    preview.textContent = `${emoji} ${label} — ${advice.action}`;
  });

  // Zeit-Toggle
  timeGrp?.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    timeGrp.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedMeasureTime = btn.dataset.time;
  });

  // Speichern
  saveBtn?.addEventListener('click', saveBZ);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') saveBZ(); });

  // Enter fokussiert Input
  input.focus();

  _renderRecentBZ();
}

export function refresh() { _renderRecentBZ(); }

function saveBZ() {
  if (getActiveUser()?.role === 'observer') {
    window.showError('Als Einblick-Nutzer können keine Einträge erstellt werden.');
    return;
  }
  const input = document.getElementById('bzValue');
  const note  = document.getElementById('bzNote');
  const v     = parseInt(input?.value);
  if (!v || v < 20 || v > 600) {
    window.showError('Bitte einen gültigen BZ-Wert eingeben (20–600 mg/dL).');
    return;
  }

  const { level } = getBZStatus(v, state.settings);
  const inTarget  = v >= state.settings.min && v <= state.settings.max;

  state.entries.unshift({
    type:        'bz',
    timestamp:   Date.now(),
    value:       v,
    measureTime: state.selectedMeasureTime || 'nüchtern',
    note:        note?.value?.trim() || '',
    level,
    inTarget,
  });
  try {
    save();
  } catch (e) {
    if (e.name === 'ObserverWriteError') {
      window.showError('Beobachter können keine Einträge speichern.');
      state.entries.shift(); // Rückgängig machen
      return;
    }
    throw e;
  }

  const { emoji, label } = getBZStatus(v, state.settings);
  window.showSuccess(emoji, `${v} mg/dL — ${label}`);
  checkAndUnlockAchievements();

  // BL-07: Nach BZ-Eintrag auf kritische Werte prüfen
  import('../notifications.js').then(({ checkAndNotify }) => {
    checkAndNotify(state.entries, state.settings);
  });

  if (input)  input.value  = '';
  if (note)   note.value   = '';
  document.getElementById('bzPreview')?.classList.remove('visible');
  _renderRecentBZ();
}

function _renderRecentBZ() {
  const list = document.getElementById('recentBZList');
  if (!list) return;
  const recent = state.entries.filter(e => e.type === 'bz').slice(0, 8);
  if (!recent.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🩸</div><div class="empty-state-text">Noch keine Messungen</div></div>`;
    return;
  }
  list.innerHTML = recent.map(e => {
    const { level, emoji } = getBZStatus(e.value, state.settings);
    return `<div class="log-entry">
      <div class="log-entry-icon log-entry-icon-bz">${emoji}</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.value} mg/dL</div>
        <div class="log-entry-sub">${e.measureTime || ''} · ${formatTime(e.timestamp)}${e.note ? ' · ' + e.note : ''}</div>
      </div>
      <span class="log-entry-badge badge-${level}">${e.value}</span>
    </div>`;
  }).join('');
}
