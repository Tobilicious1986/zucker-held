// ═══════════════════════════════════════════════════════════
//  HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════

// ── BZ-Status ─────────────────────────────────────────────
export function getBZStatus(val, settings = {}) {
  const min = settings.min || 70;
  const max = settings.max || 180;
  if (val < 55)   return { emoji: '🚨 SOFORT handeln!', cls: 'range-critical',  level: 'critical'  };
  if (val < min)  return { emoji: '😟 Zu niedrig',      cls: 'range-low',       level: 'low'       };
  if (val <= max) return { emoji: '🎉 Super Wert!',     cls: 'range-ok',        level: 'ok'        };
  if (val <= 300) return { emoji: '😅 Etwas hoch',      cls: 'range-high',      level: 'high'      };
  return              { emoji: '⚠️ Sehr hoch',       cls: 'range-veryhigh',  level: 'veryhigh'  };
}

export function getBZAdvice(val, settings = {}) {
  const min = settings.min || 70;
  if (val < 55) return {
    action: '🚨 SOFORT 2 Traubenzucker nehmen!',
    detail: 'Nach 15 Min. nochmal messen. Erwachsenen rufen!',
    urgent: true,
  };
  if (val < min) return {
    action: '🍬 Jetzt 1 Traubenzucker nehmen',
    detail: 'Dexcom zeigt Unterzucker — blutig nachmessen! Nach 15 Min. nochmal prüfen.',
    urgent: false,
  };
  if (val <= 300) return { action: null, detail: null, urgent: false };
  return {
    action: '💧 Viel Wasser trinken',
    detail: 'Über 300 mg/dL — beobachten. Erst nach 1 Stunde wirklich kritisch. Dann Omnipod prüfen.',
    urgent: false,
  };
}

// ── Statistik-Berechnungen ────────────────────────────────

/** Gibt die Zeit-im-Zielbereich (0–100 %) zurück */
export function getTimeInRange(entries, settings = {}) {
  const min = settings.min || 70;
  const max = settings.max || 180;
  const bz  = entries.filter(e => e.type === 'bz');
  if (bz.length === 0) return null;
  const inRange = bz.filter(e => e.value >= min && e.value <= max).length;
  return Math.round((inRange / bz.length) * 100);
}

/** Durchschnittlicher BZ der letzten N Tage */
export function getAvgBZ(entries, days = 7) {
  const cutoff = Date.now() - days * 86400000;
  const bz = entries.filter(e => e.type === 'bz' && e.timestamp >= cutoff);
  if (bz.length === 0) return null;
  return Math.round(bz.reduce((s, e) => s + e.value, 0) / bz.length);
}

/** BZ-Trendpfeil aus letzten 2 BZ-Einträgen (DASH-01)
 *  Gibt { arrow, label } zurück — Schwelle: ±10 mg/dL */
export function getBZTrend(entries) {
  const bzEntries = entries.filter(e => e.type === 'bz');
  if (bzEntries.length < 2) return { arrow: '→', label: 'stabil' };
  const delta = bzEntries[0].value - bzEntries[1].value;
  if (delta >  15) return { arrow: '↗', label: 'steigend' };
  if (delta < -15) return { arrow: '↘', label: 'fallend'  };
  return              { arrow: '→', label: 'stabil'    };
}

/** Aktueller Mess-Streak in Tagen */
export function getCurrentStreak(entries) {
  const bzEntries = entries.filter(e => e.type === 'bz');
  if (bzEntries.length === 0) return 0;

  const days = new Set(bzEntries.map(e => toDateStr(new Date(e.timestamp))));
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));

  // Streak muss heute oder gestern gestartet sein
  if (!days.has(today) && !days.has(yesterday)) return 0;

  let streak = 0;
  let check  = days.has(today) ? today : yesterday;

  while (days.has(check)) {
    streak++;
    const d = new Date(check);
    d.setDate(d.getDate() - 1);
    check = toDateStr(d);
  }
  return streak;
}

// ── KH-Berechnung ─────────────────────────────────────────
export function calcKH(khPer100g, amountG) {
  return Math.round((khPer100g / 100) * amountG);
}

// ── Datum/Zeit-Helfer ─────────────────────────────────────
export function toDateStr(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

export function formatTime(ts) {
  const d    = new Date(ts);
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  if (toDateStr(d) === toDateStr(new Date())) return 'Heute ' + time;
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (toDateStr(d) === yesterday) return 'Gestern ' + time;
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) + ' ' + time;
}

export function formatDateLabel(dateStr) {
  const today     = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today)     return '📅 Heute';
  if (dateStr === yesterday) return '📅 Gestern';
  const d = new Date(dateStr);
  return '📅 ' + d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── HTML-Sicherheit ───────────────────────────────────────
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function escAttr(str) {
  return String(str).replace(/'/g, "\\'");
}

// ── UI-Hilfsfunktionen ────────────────────────────────────
export function emptyState(icon, text) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><p>${text}</p></div>`;
}
