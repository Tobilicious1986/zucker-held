import { TIPS } from '../config.js';

export function tipWidget(container) {
  const dayIdx = Math.floor(Date.now() / 86400000) % TIPS.length;
  container.innerHTML += `<div class="tip-card">💡 ${TIPS[dayIdx]}</div>`;
}
