import { getBZStatus, formatTime } from '../utils.js';

export function todayLogWidget(container, state) {
  const today   = new Date().toDateString();
  const entries = state.entries
    .filter(e => new Date(e.timestamp).toDateString() === today)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const count = {
    bz:       state.entries.filter(e => e.type === 'bz'       && new Date(e.timestamp).toDateString() === today).length,
    insulin:  state.entries.filter(e => e.type === 'insulin'  && new Date(e.timestamp).toDateString() === today).length,
    meal:     state.entries.filter(e => e.type === 'meal'     && new Date(e.timestamp).toDateString() === today).length,
    activity: state.entries.filter(e => e.type === 'activity' && new Date(e.timestamp).toDateString() === today).length,
  };

  container.innerHTML += `
    <div class="today-log-card">
      <div class="today-log-header">
        <span>HEUTE</span>
        <a onclick="window.showPage('history')">Alle →</a>
      </div>
      ${entries.length === 0
        ? `<div class="today-log-empty">Noch keine Einträge heute.</div>`
        : `<div class="today-log-list">${entries.map(e => _renderEntry(e, state)).join('')}</div>`
      }
    </div>`;
}

function _renderEntry(e, state) {
  const time = formatTime(e.timestamp);
  if (e.type === 'bz') {
    const { level, emoji } = getBZStatus(e.value, state.settings);
    return `<div class="log-entry">
      <div class="log-entry-icon log-entry-icon-bz">🩸</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.value} mg/dL</div>
        <div class="log-entry-sub">${e.measureTime || ''} · ${time}</div>
      </div>
      <span class="log-entry-badge badge-${level}">${emoji}</span>
    </div>`;
  }
  if (e.type === 'insulin') {
    return `<div class="log-entry">
      <div class="log-entry-icon" style="background:#ECFEFF">💉</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.units} IE ${e.insulinType || ''}</div>
        <div class="log-entry-sub">${time}</div>
      </div>
      <span class="log-entry-badge badge-neutral">Insulin</span>
    </div>`;
  }
  if (e.type === 'meal') {
    return `<div class="log-entry">
      <div class="log-entry-icon log-entry-icon-meal">🍽️</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.name || 'Mahlzeit'}</div>
        <div class="log-entry-sub">${e.kh ? e.kh + ' g KH · ' : ''}${time}</div>
      </div>
      <span class="log-entry-badge badge-neutral">${e.mealTime || ''}</span>
    </div>`;
  }
  if (e.type === 'activity') {
    return `<div class="log-entry">
      <div class="log-entry-icon log-entry-icon-activity">${e.emoji || '🏃'}</div>
      <div class="log-entry-body">
        <div class="log-entry-title">${e.activity || 'Sport'}</div>
        <div class="log-entry-sub">${e.duration ? e.duration + ' min · ' : ''}${time}</div>
      </div>
      <span class="log-entry-badge badge-neutral">${e.intensity || ''}</span>
    </div>`;
  }
  return '';
}
