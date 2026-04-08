// ═══════════════════════════════════════════════════════════
//  THEME MANAGER — Zucker-Held v4
// ═══════════════════════════════════════════════════════════

/** Wendet Theme basierend auf Profil-Typ an */
export function applyTheme(user) {
  const body  = document.body;
  const theme = (user?.profileType === 'kind') ? 'kind' : 'default';

  body.setAttribute('data-theme', theme);
  _updateMetaThemeColor(theme);
}

function _updateMetaThemeColor(theme) {
  const color = theme === 'kind' ? '#7C3AED' : '#4F46E5';
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

/** Gibt aktuelle Markenfarbe (für Canvas-Zeichnungen) zurück */
export function getBrandColor() {
  const theme = document.body.getAttribute('data-theme');
  return theme === 'kind' ? '#7C3AED' : '#4F46E5';
}
