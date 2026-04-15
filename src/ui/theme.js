// ═══════════════════════════════════════════════════════════
//  THEME MANAGER — Zucker-Held v4
// ═══════════════════════════════════════════════════════════

/** Bestimmt Altersgruppe basierend auf Profiltyp (UX-04)
 *  kind_young: Kind (vereinfachte UI, große Buttons)
 *  kind_teen: wird für zukünftige Differenzierung vorbereitet
 *  adult: Erwachsener */
function _getAgeGroup(user) {
  if (user?.profileType === 'kind') return 'kind_young';
  return 'adult';
}

/** Wendet Theme basierend auf Profil-Typ und Altersgruppe an */
export function applyTheme(user) {
  const body     = document.body;
  const ageGroup = _getAgeGroup(user);
  const theme    = ageGroup === 'kind_young' ? 'kind' : 'default';

  body.setAttribute('data-theme', theme);
  body.setAttribute('data-age-group', ageGroup);
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

/** Gibt aktuelle Altersgruppe zurück */
export function getAgeGroup() {
  return document.body.getAttribute('data-age-group') || 'adult';
}
