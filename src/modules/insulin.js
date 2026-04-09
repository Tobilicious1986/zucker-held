// ═══════════════════════════════════════════════════════════
//  INSULIN — Modul
// ═══════════════════════════════════════════════════════════
import { state, save }  from '../state.js';
import { formatTime }   from '../utils.js';
import { checkAndUnlockAchievements } from '../achievements.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Insulin</h2>
      <span class="page-icon">💉</span>
    </div>

    <div class="card card-padded">
      <div class="form-group">
        <label class="form-label">Einheiten (IE)</label>
        <div class="stepper">
          <button class="stepper-btn" id="insulinMinus">−</button>
          <div class="stepper-value" id="insulinDisplay">0</div>
          <button class="stepper-btn" id="insulinPlus">+</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px">
          ${[1,2,4,6,8,10,12].map(n =>
            `<button class="toggle-btn" data-units="${n}" style="min-width:48px">${n}</button>`
          ).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Typ</label>
        <div class="toggle-group" id="insulinTypeGroup">
          ${[
            { key:'kurz',  label:'⚡ Kurz',   desc:'Mahlzeit' },
            { key:'lang',  label:'🌙 Lang',   desc:'Basis' },
            { key:'basal', label:'⏱️ Basal',  desc:'Pumpe' },
          ].map((t,i) =>
            `<button class="toggle-btn${i===0?' active':''}" data-type="${t.key}" title="${t.desc}">${t.label}</button>`
          ).join('')}
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Notiz (optional)</label>
        <input class="form-input" type="text" id="insulinNote"
               placeholder="z.B. Korrektur, Mahlzeit..." maxlength="80" />
      </div>

      <button class="btn btn-primary" id="insulinSaveBtn">💾 Speichern</button>
    </div>

    <div class="info-banner info-banner-blue">
      💡 <strong>Omnipod 5:</strong> Bolus wird automatisch vom Omnipod berechnet —
      hier nur zur Dokumentation eintragen.
    </div>

    <div class="card card-padded">
      <div class="card-section-title">Letzte Einheiten</div>
      <div id="recentInsulinList"></div>
    </div>`;
}

export function init() {
  state.insulinUnits = state.insulinUnits || 0;
  _updateDisplay();

  document.getElementById('insulinMinus')?.addEventListener('click', () => {
    if (state.insulinUnits > 0) { state.insulinUnits -= 0.5; _updateDisplay(); }
  });
  document.getElementById('insulinPlus')?.addEventListener('click', () => {
    state.insulinUnits += 0.5; _updateDisplay();
  });

  // Schnellauswahl
  document.querySelectorAll('[data-units]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.insulinUnits = parseFloat(btn.dataset.units);
      _updateDisplay();
    });
  });

  // Typ-Toggle
  document.getElementById('insulinTypeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#insulinTypeGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedInsulinType = btn.dataset.type;
  });

  document.getElementById('insulinSaveBtn')?.addEventListener('click', _saveInsulin);
  _renderRecent();
}

export function refresh() { _renderRecent(); }

function _updateDisplay() {
  const d = document.getElementById('insulinDisplay');
  if (d) d.textContent = state.insulinUnits % 1 === 0
    ? state.insulinUnits
    : state.insulinUnits.toFixed(1);
}

function _saveInsulin() {
  if (state.insulinUnits <= 0) {
    window.showError('Bitte Einheiten eingeben.');
    return;
  }
  const note = document.getElementById('insulinNote')?.value?.trim() || '';
  state.entries.unshift({
    type:        'insulin',
    timestamp:   Date.now(),
    units:       state.insulinUnits,
    insulinType: state.selectedInsulinType || 'kurz',
    note,
  });
  save();
  window.showSuccess('💉', `${state.insulinUnits} IE eingetragen`);
  checkAndUnlockAchievements();
  state.insulinUnits = 0;
  _updateDisplay();
  document.getElementById('insulinNote').value = '';
  _renderRecent();
}

function _renderRecent() {
  const list = document.getElementById('recentInsulinList');
  if (!list) return;
  const recent = state.entries.filter(e => e.type === 'insulin').slice(0, 6);
  if (!recent.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💉</div><div class="empty-state-text">Noch kein Insulin eingetragen</div></div>`;
    return;
  }
  list.innerHTML = recent.map(e => `
    <div class="log-entry">
      <div class="log-entry-icon" style="background:#ECFEFF;font-size:20px">💉</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.units} IE — ${e.insulinType || ''}</div>
        <div class="log-entry-sub">${formatTime(e.timestamp)}${e.note ? ' · ' + e.note : ''}</div>
      </div>
      <span class="log-entry-badge badge-neutral">${e.insulinType || ''}</span>
    </div>`).join('');
}
