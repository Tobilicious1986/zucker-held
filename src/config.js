// ═══════════════════════════════════════════════════════════
//  KONFIGURATION & KONSTANTEN — Zucker-Held v4
// ═══════════════════════════════════════════════════════════

export const APP_VERSION   = '4.3';
export const STORAGE_KEY   = 'zucker-held-v4';
export const STORAGE_KEY_V3 = 'zucker-held-v3';
export const STORAGE_KEY_V2 = 'zucker-held-v2';

// ── Avatare ───────────────────────────────────────────────
export const AVATARS = ['🦊','🐻','🐶','🦁','🐯','🦋','🐸','🦄','🐼','🦖','🐉','🦅'];

// ── Tages-Tipps (rotiert per Datum) ──────────────────────
export const TIPS = [
  '💪 Gut gemessen ist halb gewonnen!',
  '🥗 Ballaststoffe verlangsamen den BZ-Anstieg.',
  '🚶 Schon 10 Minuten Spazieren senkt den BZ.',
  '💧 Viel Wasser trinken hilft beim BZ-Ausgleich.',
  '📱 Regelmäßige Messungen = bessere Kontrolle.',
  '🍎 Obst ist lecker – auf die Menge achten!',
  '😴 Guter Schlaf stabilisiert den BZ über Nacht.',
  '🧘 Stress kann den BZ erhöhen – atme durch!',
  '🎯 Zielbereich halten macht den Kopf frei.',
  '🏃 Sport macht Insulin wirksamer.',
  '🍽️ Kleine Mahlzeiten, dafür öfter – sanftere Kurven.',
  '🌟 Jeder gute BZ-Wert zählt – du machst das super!',
  '🔬 Dein Tagebuch hilft dem Arzt zu helfen.',
  '💡 Hast du heute schon dein Gerät gecheckt?',
  '🎵 Musik beim Sport macht Spaß und senkt BZ!',
  '🥦 Gemüse ohne Ende – kaum Kohlenhydrate!',
  '🌅 Morgenmessungen zeigen den nächtlichen Verlauf.',
  '🍫 Ein bisschen Schokolade geht – mit Maß.',
  '👟 Dein Körper liebt Bewegung – heute schon aktiv?',
  '📊 Trends erkennen hilft, Muster zu verstehen.',
  '🧃 Fruchtsäfte heben den BZ schneller als Obst.',
  '🥜 Nüsse und Samen: toller Snack mit wenig KH.',
  '💊 Insulin richtig aufbewahren – kühl und dunkel.',
  '🎉 Stolz auf jeden Schritt – du bist ein Zucker-Held!',
  '🌿 Zimt soll den BZ unterstützen – Mythos oder Fakt?',
  '🏋️ Kraft- und Ausdauersport haben unterschiedliche BZ-Effekte.',
  '🧁 Beim Backen: Mehl teilweise durch Mandelmehl ersetzen.',
  '📅 Regelmäßige Arzttermine sind dein Sicherheitsnetz.',
];

// ── Aktivitäten ────────────────────────────────────────────
export const ACTIVITIES = [
  { id: 'fussball',   emoji: '⚽', name: 'Fußball'     },
  { id: 'schwimmen',  emoji: '🏊', name: 'Schwimmen'   },
  { id: 'radfahren',  emoji: '🚴', name: 'Radfahren'   },
  { id: 'laufen',     emoji: '🏃', name: 'Laufen'      },
  { id: 'tanzen',     emoji: '💃', name: 'Tanzen'      },
  { id: 'turnen',     emoji: '🤸', name: 'Turnen'      },
  { id: 'basketball', emoji: '🏀', name: 'Basketball'  },
  { id: 'tennis',     emoji: '🎾', name: 'Tennis'      },
  { id: 'wandern',    emoji: '🥾', name: 'Wandern'     },
  { id: 'yoga',       emoji: '🧘', name: 'Yoga'        },
  { id: 'sonstiges',  emoji: '🏅', name: 'Sonstiges'   },
];

// ── Tages-Challenges (DASH-02) ────────────────────────────
export const DAILY_CHALLENGES = [
  {
    id:     'bz',
    emoji:  '🩸',
    title:  'BZ messen',
    desc:   'Messe einmal deinen Blutzucker',
    coins:  10,
    // Geprüft: Hat der heutige Tag mindestens 1 BZ-Eintrag?
    check: (entries) => {
      const today = new Date().toDateString();
      return entries.some(e => e.type === 'bz' && new Date(e.timestamp).toDateString() === today);
    },
  },
  {
    id:     'meal',
    emoji:  '🍽️',
    title:  'Mahlzeit loggen',
    desc:   'Trage eine Mahlzeit ein',
    coins:  10,
    check: (entries) => {
      const today = new Date().toDateString();
      return entries.some(e => e.type === 'meal' && new Date(e.timestamp).toDateString() === today);
    },
  },
  {
    id:     'activity',
    emoji:  '🏃',
    title:  'Bewege dich',
    desc:   'Logge eine Aktivität',
    coins:  10,
    check: (entries) => {
      const today = new Date().toDateString();
      return entries.some(e => e.type === 'activity' && new Date(e.timestamp).toDateString() === today);
    },
  },
];

// Trendpfeil-Schwellenwert (BZ-Differenz in mg/dL)
export const BZ_TREND_THRESHOLD = 15;

// ── Errungenschaften ───────────────────────────────────────
export function getMaxStreak(entries) {
  const days = [...new Set(
    entries.filter(e => e.type === 'bz')
           .map(e => new Date(e.timestamp).toDateString())
  )].sort();
  let max = 0, cur = 0, prev = null;
  for (const d of days) {
    const dt = new Date(d);
    if (prev) {
      const diff = (dt - prev) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else { cur = 1; }
    if (cur > max) max = cur;
    prev = dt;
  }
  return max;
}

export const ACHIEVEMENTS = [
  { id: 'first_bz',    emoji: '🩸', name: 'Erster Schritt',   desc: 'Erste BZ-Messung',              check: s => s.entries.filter(e => e.type==='bz').length >= 1 },
  { id: 'bz_10',       emoji: '📊', name: '10 Messungen',     desc: '10x BZ gemessen',               check: s => s.entries.filter(e => e.type==='bz').length >= 10 },
  { id: 'bz_50',       emoji: '🏅', name: '50 Messungen',     desc: '50x BZ gemessen',               check: s => s.entries.filter(e => e.type==='bz').length >= 50 },
  { id: 'bz_100',      emoji: '🏆', name: '100 Messungen',    desc: '100x BZ gemessen',              check: s => s.entries.filter(e => e.type==='bz').length >= 100 },
  { id: 'target_ok',   emoji: '🎯', name: 'Im Ziel',          desc: 'BZ im Zielbereich gemessen',    check: s => s.entries.some(e => e.type==='bz' && e.inTarget) },
  { id: 'target_5',    emoji: '⭐', name: '5× im Ziel',       desc: '5 BZ-Werte im Zielbereich',    check: s => s.entries.filter(e => e.type==='bz' && e.inTarget).length >= 5 },
  { id: 'streak_3',    emoji: '🔥', name: '3-Tage-Streak',    desc: '3 Tage in Folge gemessen',      check: s => getMaxStreak(s.entries) >= 3 },
  { id: 'streak_7',    emoji: '💎', name: 'Woche am Stück',   desc: '7 Tage in Folge gemessen',      check: s => getMaxStreak(s.entries) >= 7 },
  { id: 'meal_5',      emoji: '🍽️', name: 'Essenstracker',    desc: '5 Mahlzeiten geloggt',          check: s => s.entries.filter(e => e.type==='meal').length >= 5 },
  { id: 'meal_20',     emoji: '👨‍🍳', name: 'Küchenheld',      desc: '20 Mahlzeiten geloggt',         check: s => s.entries.filter(e => e.type==='meal').length >= 20 },
  { id: 'custom_food', emoji: '🥘', name: 'Eigenes Rezept',   desc: 'Eigenes Lebensmittel erstellt', check: s => s.foodDB.some(f => f.source === 'custom') },
  { id: 'barcode',     emoji: '📷', name: 'Scanner-Profi',    desc: 'Lebensmittel per Barcode',      check: s => s.foodDB.some(f => f.barcode) },
  { id: 'activity',    emoji: '🏃', name: 'Sportler',         desc: 'Erste Aktivität geloggt',       check: s => s.entries.some(e => e.type==='activity') },
  { id: 'activity_10', emoji: '🥇', name: 'Sportstar',        desc: '10 Aktivitäten geloggt',        check: s => s.entries.filter(e => e.type==='activity').length >= 10 },
  { id: 'learn',       emoji: '📚', name: 'Lernstart',        desc: 'Lernbereich besucht',           check: s => s.learnVisits >= 1 },
  { id: 'learn_5',     emoji: '🎓', name: 'Wissens-Held',     desc: '5× im Lernbereich',             check: s => s.learnVisits >= 5 },
];
