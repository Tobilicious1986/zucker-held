import { renderFullChart } from '../chart.js';

export function chart7dayWidget(container, state) {
  container.innerHTML += `
    <div class="sparkline-wrapper">
      <div class="sparkline-header">
        <span class="sparkline-title">7-Tage-Verlauf</span>
      </div>
      <canvas id="bzFullChart" class="bz-chart-full"></canvas>
    </div>`;

  requestAnimationFrame(() => {
    const canvas = document.getElementById('bzFullChart');
    if (canvas) {
      const bzData = state.entries.filter(e => e.type === 'bz');
      renderFullChart(canvas, bzData, state.settings);
    }
  });
}
