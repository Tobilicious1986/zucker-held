import { getBZStatus, getBZAdvice, formatTime } from '../utils.js';
import { renderSparkline }                       from '../chart.js';

export function bzStatusWidget(container, state) {
  const bzEntries = state.entries.filter(e => e.type === 'bz').slice(-1);
  const last      = bzEntries[0] || null;

  if (!last) {
    container.innerHTML += `
      <div class="status-card status-none">
        <div class="status-card-label">Letzter Blutzucker</div>
        <div class="status-card-value" style="font-size:48px">—</div>
        <div class="status-card-meta">Noch keine Messung</div>
        <div class="status-card-advice">
          <button onclick="window.showPage('bz')" style="background:none;border:none;color:inherit;font-weight:700;cursor:pointer;font-size:15px">
            🩸 Jetzt messen →
          </button>
        </div>
      </div>`;
    return;
  }

  const { level, emoji, label } = getBZStatus(last.value, state.settings);
  const advice  = getBZAdvice(last.value, state.settings);
  const timeStr = formatTime(last.timestamp);

  container.innerHTML += `
    <div class="status-card status-${level}" onclick="window.showPage('bz')" style="cursor:pointer">
      <div class="status-card-label">Letzter Blutzucker ${emoji}</div>
      <div class="status-card-value">${last.value} <span class="status-card-unit">mg/dL</span></div>
      <div class="status-card-meta">${label} · ${last.measureTime || ''} · ${timeStr}</div>
      <div class="status-card-advice">${advice.action}</div>
    </div>
    <div class="sparkline-wrapper">
      <div class="sparkline-header">
        <span class="sparkline-title">Verlauf (letzte Messungen)</span>
        <button class="btn-ghost btn-small" onclick="window.showPage('history')" style="font-size:12px">Alle →</button>
      </div>
      <canvas id="bzSparklineCanvas" class="bz-sparkline"></canvas>
    </div>`;

  // Sparkline rendern
  requestAnimationFrame(() => {
    const canvas = document.getElementById('bzSparklineCanvas');
    if (canvas) {
      const bzData = state.entries.filter(e => e.type === 'bz').slice(-20);
      renderSparkline(canvas, bzData, state.settings);
    }
  });
}
