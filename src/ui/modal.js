// ═══════════════════════════════════════════════════════════
//  MODAL SYSTEM — Zucker-Held v4
// ═══════════════════════════════════════════════════════════

let _focusTrap  = null;
let _openModals = [];

export function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'false');
  _openModals.push(id);

  // Focus zum ersten fokussierbaren Element
  requestAnimationFrame(() => {
    const first = el.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
    first?.focus();
  });
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('hidden');
  el.setAttribute('aria-hidden', 'true');
  _openModals = _openModals.filter(m => m !== id);
}

export function closeAllModals() {
  [..._openModals].forEach(id => closeModal(id));
}

export function isModalOpen(id) {
  return !document.getElementById(id)?.classList.contains('hidden');
}

/** Füllt Modal-Inhalt und öffnet es */
export function renderModal(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  // Modal-Sheet befüllen oder direkt den Container
  const sheet = el.querySelector('.modal-sheet') || el;
  sheet.innerHTML = html;
  openModal(id);
}

/** Backdrop-Click schließt Modal */
export function setupBackdropClose(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', (e) => {
    if (e.target === el) closeModal(id);
  });
}
