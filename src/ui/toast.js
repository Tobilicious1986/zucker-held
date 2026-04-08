// ═══════════════════════════════════════════════════════════
//  TOAST & SUCCESS ANIMATIONS — Zucker-Held v4
// ═══════════════════════════════════════════════════════════

let _toastTimer = null;

export function showToast(msg, type = 'info', duration = 3000) {
  const el = document.getElementById('toast');
  if (!el) return;
  if (_toastTimer) clearTimeout(_toastTimer);

  el.textContent = msg;
  el.className   = `toast toast-${type} show`;

  _toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, duration);
}

export function showSuccess(icon, text) {
  const el      = document.getElementById('successAnim');
  const iconEl  = document.getElementById('successIcon');
  const textEl  = document.getElementById('successText');
  if (!el || !iconEl || !textEl) return;

  iconEl.textContent = icon;
  textEl.textContent = text;
  el.classList.remove('hidden');
  el.classList.add('show');

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 1800);
}

export function showError(msg) {
  showToast(msg, 'error', 4000);
}
