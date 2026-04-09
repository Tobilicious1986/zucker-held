// ═══════════════════════════════════════════════════════════
//  VERLAUF / TAGEBUCH — Modul
// ═══════════════════════════════════════════════════════════
import { state }       from '../state.js';
import { getBZStatus, formatTime, toDateStr, formatDateLabel } from '../utils.js';

const FILTERS = [
  { id: 'all',      label: 'Alle' },
  { id: 'bz',       label: '🩸 BZ' },
  { id: 'insulin',  label: '💉 Insulin' },
  { id: 'meal',     label: '🍽️ Mahlzeit' },
  { id: 'activity', label: '🏃 Sport' },
];

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Verlauf</h2>
      <span class="page-icon">📅</span>
    </div>

    <div class="filter-row" id="historyFilters">
      ${FILTERS.map(f =>
        `<button class="filter-btn${f.id === 'all' ? ' active' : ''}" data-filter="${f.id}">${f.label}</button>`
      ).join('')}
    </div>

    <div id="historyList" class="history-list"></div>`;
}

export function init() {
  state.historyFilter = 'all';

  document.getElementById('historyFilters')?.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.historyFilter = btn.dataset.filter;
    _renderHistory();
  });

  _renderHistory();
}

export function refresh() { _renderHistory(); }

function _renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  const filter  = state.historyFilter || 'all';
  const entries = state.entries
    .filter(e => filter === 'all' || e.type === filter)
    .slice(0, 100);

  if (!entries.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">Keine Einträge gefunden</div></div>`;
    return;
  }

  // Nach Tag gruppieren
  const groups = {};
  entries.forEach(e => {
    const day = toDateStr(new Date(e.timestamp));
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  });

  list.innerHTML = Object.entries(groups).map(([day, items]) => `
    <div class="history-day-group">
      <div class="history-day-label">${formatDateLabel(day)}</div>
      ${items.map(e => _renderEntry(e)).join('')}
    </div>`).join('');
}

function _renderEntry(e) {
  if (e.type === 'bz') {
    const { level, emoji } = getBZStatus(e.value, state.settings);
    return `<div class="history-entry">
      <div class="log-entry-icon log-entry-icon-bz">${emoji}</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.value} mg/dL${e.note ? ' — ' + e.note : ''}</div>
        <div class="log-entry-sub">${e.measureTime || ''} · ${formatTime(e.timestamp)}</div>
      </div>
      <span class="log-entry-badge badge-${level}">${e.value}</span>
    </div>`;
  }
  if (e.type === 'insulin') {
    return `<div class="history-entry">
      <div class="log-entry-icon" style="background:#ECFEFF;font-size:18px">💉</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.units} IE ${e.insulinType || ''}</div>
        <div class="log-entry-sub">${formatTime(e.timestamp)}${e.note ? ' · ' + e.note : ''}</div>
      </div>
      <span class="log-entry-badge badge-neutral">Insulin</span>
    </div>`;
  }
  if (e.type === 'meal') {
    return `<div class="history-entry">
      <div class="log-entry-icon log-entry-icon-meal">🍽️</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.name || 'Mahlzeit'}</div>
        <div class="log-entry-sub">${e.kh ?? '?'} g KH · ${e.mealTime || ''} · ${formatTime(e.timestamp)}</div>
      </div>
      <span class="log-entry-badge badge-neutral">${e.kh ?? '?'}g</span>
    </div>`;
  }
  if (e.type === 'activity') {
    return `<div class="history-entry">
      <div class="log-entry-icon log-entry-icon-activity">${e.emoji || '🏃'}</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.activity || 'Sport'} ${e.duration ? '— ' + e.duration + ' min' : ''}</div>
        <div class="log-entry-sub">${e.intensity || ''} · ${formatTime(e.timestamp)}</div>
      </div>
    </div>`;
  }
  return '';
}
