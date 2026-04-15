// ═══════════════════════════════════════════════════════════
//  INSULIN — Modul
// ═══════════════════════════════════════════════════════════
import { state, save, getActiveUser } from '../state.js';
import { formatTime, getActiveInsulinFactor } from '../utils.js';
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

    <!-- Dosierungs-Rechner (BL-01) -->
    <div class="card card-padded" id="insulinCalcCard" style="overflow:visible">
      <div class="card-section-title" style="cursor:pointer" onclick="window._toggleInsulinCalc()">
        💡 Dosierungs-Rechner
        <span id="insulinCalcToggleIcon" style="float:right;font-size:0.9em">▼</span>
      </div>
      <div id="insulinCalcBody" style="display:none;margin-top:12px">
        <div id="insulinActiveBlock" style="display:none;margin-bottom:10px"></div>
        <!-- Zeige Hinweis wenn nicht konfiguriert -->
        <div id="insulinCalcNotConfigured" style="display:none">
          <div class="info-banner info-banner-orange">
            ⚙️ Bitte zuerst <strong>KH-Verhältnis</strong> und <strong>Korrekturfaktor</strong>
            in den <a href="#" onclick="window.showPage('settings');return false">Einstellungen</a> konfigurieren.
          </div>
        </div>
        <div id="insulinCalcForm">
          <div class="form-group">
            <label class="form-label">Kohlenhydrate der Mahlzeit (g)</label>
            <input class="form-input" type="number" id="calcKH" min="0" max="500"
                   placeholder="z.B. 45" inputmode="decimal" />
          </div>
          <div class="form-group">
            <label class="form-label">Aktueller Blutzucker (mg/dL)</label>
            <input class="form-input" type="number" id="calcBZ" min="20" max="600"
                   placeholder="z.B. 130" inputmode="decimal" />
          </div>
          <button class="btn btn-secondary" id="insulinCalcBtn" onclick="window._calcInsulinDose()">
            Berechnen
          </button>
          <div id="insulinCalcResult" style="display:none;margin-top:16px;text-align:center">
            <div class="insulin-calc-result-label">Empfehlung</div>
            <div class="insulin-calc-result-value" id="insulinCalcValue">— IE</div>
            <div class="insulin-calc-result-detail" id="insulinCalcDetail"></div>
            <button class="btn btn-primary" style="margin-top:12px;width:100%"
                    id="insulinCalcApplyBtn" onclick="window._applyInsulinDose()">
              Diese Dosis übernehmen
            </button>
          </div>
          <div class="info-banner info-banner-orange" style="margin-top:12px;font-size:0.78em">
            ⚕️ <strong>Nur zur Orientierung</strong> — kein Ersatz für ärztliche Anweisung.
            Endgültige Dosierung immer mit Arzt/Therapeut absprechen.
          </div>
        </div>
      </div>
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
  _initCalc();
}

// ── Dosierungs-Rechner (BL-01) ────────────────────────────
function _initCalc() {
  const activeFactor = getActiveInsulinFactor(state.settings);
  const ratio        = activeFactor.ki;
  const cf           = activeFactor.kf;

  // Konfiguration prüfen
  const notConfigured = document.getElementById('insulinCalcNotConfigured');
  const form          = document.getElementById('insulinCalcForm');
  const blockEl       = document.getElementById('insulinActiveBlock');
  const isConfigured  = ratio > 0 && cf > 0;
  if (notConfigured) notConfigured.style.display = isConfigured ? 'none' : '';
  if (form)          form.style.display          = isConfigured ? ''     : 'none';

  if (blockEl) {
    if (!isConfigured) {
      blockEl.style.display = 'none';
    } else {
      const timeEmojis = {
        Nacht: '🌙',
        Morgen: '🌅',
        Mittag: '☀️',
        Abend: '🌆',
        Spätabend: '🌃',
        Ganztags: '⏱️',
      };
      const emoji = timeEmojis[activeFactor.label] || '🕐';
      blockEl.style.display = '';
      blockEl.innerHTML = `<div class="info-banner info-banner-blue" style="font-size:0.83em;padding:8px 12px">
        ${emoji} <strong>${activeFactor.label}-Faktor</strong> aktiv:
        1 IE / ${activeFactor.ki}g KH · Korrektur: 1 IE / ${activeFactor.kf} mg/dL
      </div>`;
    }
  }

  // BZ vorausfüllen wenn letzter Messung < 30 Min alt
  const lastBZ = state.entries.find(e => e.type === 'bz');
  if (lastBZ && Date.now() - lastBZ.timestamp < 30 * 60 * 1000) {
    const bzInput = document.getElementById('calcBZ');
    if (bzInput && !bzInput.value) bzInput.value = lastBZ.value;
  }
}

window._toggleInsulinCalc = function() {
  const body = document.getElementById('insulinCalcBody');
  const icon = document.getElementById('insulinCalcToggleIcon');
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  if (icon) icon.textContent = open ? '▼' : '▲';
  if (!open) _initCalc(); // Bei Öffnen Werte aktualisieren
};

window._calcInsulinDose = function() {
  const khVal = parseFloat(document.getElementById('calcKH')?.value);
  const bzVal = parseFloat(document.getElementById('calcBZ')?.value);

  const activeFactor = getActiveInsulinFactor(state.settings);
  const ratio        = activeFactor.ki;
  const cf           = activeFactor.kf;
  const targetBZ     = state.settings.targetBZ || 120;

  const resultEl  = document.getElementById('insulinCalcResult');
  const valueEl   = document.getElementById('insulinCalcValue');
  const detailEl  = document.getElementById('insulinCalcDetail');
  const applyBtn  = document.getElementById('insulinCalcApplyBtn');

  if (!resultEl || !valueEl) return;

  // Berechnung
  const mahlzeitIE = isNaN(khVal) ? 0 : khVal / ratio;
  const korrIE     = isNaN(bzVal) ? 0 : (bzVal - targetBZ) / cf;
  const gesamt     = Math.round((mahlzeitIE + korrIE) * 2) / 2;
  const empfehlung = Math.max(0, gesamt);

  resultEl.style.display  = '';
  valueEl.textContent     = `${empfehlung % 1 === 0 ? empfehlung : empfehlung.toFixed(1)} IE`;
  valueEl.className       = 'insulin-calc-result-value' +
    (empfehlung === 0 ? ' insulin-calc-zero' : '');

  // Detailzeile
  const parts = [];
  if (!isNaN(khVal) && khVal > 0) parts.push(`${(khVal/ratio).toFixed(1)} IE für ${khVal}g KH`);
  if (!isNaN(bzVal))               parts.push(`${korrIE >= 0 ? '+' : ''}${korrIE.toFixed(1)} IE Korrektur (BZ ${bzVal} → ${targetBZ})`);
  if (detailEl) detailEl.textContent = parts.join(' + ');

  // Apply-Button nur wenn > 0
  if (applyBtn) applyBtn.style.display = empfehlung > 0 ? '' : 'none';

  // Empfehlung für Übernahme merken
  window._lastCalcDose = empfehlung;
};

window._applyInsulinDose = function() {
  const dose = window._lastCalcDose;
  if (!dose || dose <= 0) return;
  state.insulinUnits = dose;
  _updateDisplay();
  // Visuelles Feedback
  const d = document.getElementById('insulinDisplay');
  if (d) { d.classList.add('pulse'); setTimeout(() => d.classList.remove('pulse'), 500); }
  window.showToast(`💉 ${dose} IE übernommen`, 'success');
};

export function refresh() { _renderRecent(); }

function _updateDisplay() {
  const d = document.getElementById('insulinDisplay');
  if (d) d.textContent = state.insulinUnits % 1 === 0
    ? state.insulinUnits
    : state.insulinUnits.toFixed(1);
}

function _saveInsulin() {
  if (getActiveUser()?.role === 'observer') {
    window.showError('Als Einblick-Nutzer können keine Einträge erstellt werden.');
    return;
  }
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
