// ═══════════════════════════════════════════════════════════
//  BROWSER-BENACHRICHTIGUNGEN — Zucker-Held v4 (BL-07)
//  Lokale Alerts via Web Notification API (kein Backend)
// ═══════════════════════════════════════════════════════════

const NOTIFICATION_ICON = './icons/icon-192.png';

// Anti-Spam: je Alert-Typ max 1x pro Stunde in sessionStorage
const COOLDOWN_MS = 60 * 60 * 1000; // 1 Stunde
const COOLDOWN_KEY = 'zh-notif-last-';

function _getCooldown(tag) {
  const ts = parseInt(sessionStorage.getItem(COOLDOWN_KEY + tag) || '0');
  return Date.now() - ts;
}
function _setCooldown(tag) {
  sessionStorage.setItem(COOLDOWN_KEY + tag, String(Date.now()));
}

// ── Permission ────────────────────────────────────────────

/**
 * Fragt Browser-Benachrichtigungs-Permission an.
 * Gibt 'granted' | 'denied' | 'default' zurück.
 */
export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

/** Gibt aktuellen Permission-Status zurück */
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ── Notification anzeigen ─────────────────────────────────

/**
 * Zeigt eine Browser-Benachrichtigung.
 * Falls keine Permission: Fallback auf showToast (falls verfügbar).
 */
export function showNotification(title, body, tag = 'zh-alert') {
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon:     NOTIFICATION_ICON,
        badge:    NOTIFICATION_ICON,
        tag,
        renotify: true,
      });
      _setCooldown(tag);
    } catch (e) {
      console.warn('[Zucker-Held] Notification fehlgeschlagen:', e);
      _showFallbackToast(title, body);
    }
  } else {
    _showFallbackToast(title, body);
  }
}

function _showFallbackToast(title, body) {
  if (window.showToast) {
    window.showToast(`${title}: ${body}`, 'warning');
  }
}

// ── BZ-Alert ──────────────────────────────────────────────

/**
 * Prüft ob ein BZ-Alert nötig ist.
 * Kritisch: BZ < 55 oder BZ > 350 mg/dL
 * High: BZ > settings.max (nur wenn sehr lange anhaltend)
 */
export function checkBZAlert(entries, settings) {
  const last = entries.find(e => e.type === 'bz');
  if (!last) return;

  const bz   = last.value;
  const age  = Date.now() - last.timestamp;

  // Nur für Messungen < 30 Min
  if (age > 30 * 60 * 1000) return;

  // Kritisch niedrig
  if (bz < 55) {
    if (_getCooldown('bz-critical-low') > COOLDOWN_MS) {
      showNotification(
        '🚨 Unterzucker!',
        `BZ ${bz} mg/dL — sofort handeln! Traubenzucker nehmen.`,
        'bz-critical-low'
      );
    }
    return;
  }

  // Kritisch hoch
  if (bz > 350) {
    if (_getCooldown('bz-critical-high') > COOLDOWN_MS) {
      showNotification(
        '⚠️ Sehr hoher Blutzucker',
        `BZ ${bz} mg/dL — Insulin und Ketone prüfen. Bei Übelkeit Arzt kontaktieren.`,
        'bz-critical-high'
      );
    }
    return;
  }

  // Über Zielbereich (max) — nur wenn > 2h anhaltend
  const max = settings?.max || 180;
  if (bz > max) {
    const sinceHigh = _getHighStreak(entries, max);
    if (sinceHigh > 2 * 60 * 60 * 1000) { // 2 Stunden
      if (_getCooldown('bz-high-streak') > COOLDOWN_MS) {
        showNotification(
          '📈 BZ seit 2h erhöht',
          `BZ ${bz} mg/dL (Ziel ≤ ${max}) — Korrektur nötig?`,
          'bz-high-streak'
        );
      }
    }
  }
}

/** Gibt zurück wie lange BZ durchgehend über max ist */
function _getHighStreak(entries, max) {
  const bzEntries = entries.filter(e => e.type === 'bz');
  if (!bzEntries.length) return 0;

  let sinceTs = bzEntries[0].timestamp;
  for (const e of bzEntries) {
    if (e.value <= max) break; // Erstes Entry unter max → Streak Ende
    sinceTs = e.timestamp;    // Ältestes Entry über max
  }
  return Date.now() - sinceTs;
}

// ── Mess-Lücken-Alert ──────────────────────────────────────

/**
 * Alert wenn > 8h keine BZ-Messung eingetragen wurde.
 * Nur für manuelle Messungen (nicht CGM-Autosync)
 */
export function checkMeasurementGap(entries) {
  const lastManual = entries.find(e =>
    e.type === 'bz' && e.source !== 'nightscout' && e.source !== 'dexcom'
  );

  if (!lastManual) return;

  const gap = Date.now() - lastManual.timestamp;
  const EIGHT_HOURS = 8 * 60 * 60 * 1000;

  if (gap > EIGHT_HOURS && _getCooldown('bz-gap') > COOLDOWN_MS) {
    const hours = Math.round(gap / (60 * 60 * 1000));
    showNotification(
      '⏰ Lange keine Messung',
      `Seit ${hours} Stunden kein BZ gemessen. Alles ok?`,
      'bz-gap'
    );
  }
}

// ── Haupt-Check ───────────────────────────────────────────

/**
 * Führt alle Checks durch.
 * Wird nach BZ-Erfassung und nach Nightscout-Sync aufgerufen.
 */
export function checkAndNotify(entries, settings) {
  if (!settings?.notificationsEnabled) return;
  if (!('Notification' in window))      return;
  if (Notification.permission !== 'granted') return;

  checkBZAlert(entries, settings);
  checkMeasurementGap(entries);
}
