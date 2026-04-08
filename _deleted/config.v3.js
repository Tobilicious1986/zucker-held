// ═══════════════════════════════════════════════════════════
//  APP-KONFIGURATION & KONSTANTEN
// ═══════════════════════════════════════════════════════════

export const APP_VERSION  = '3.0';
export const STORAGE_KEY  = 'zucker-held-v3';
export const STORAGE_KEY_V2 = 'zucker-held-v2'; // für Migration

// ── Avatare ──────────────────────────────────────────────
export const AVATARS = ['🦊', '🐻', '🐶', '🦁', '🐯', '🦋', '🐸', '🦄', '🐼', '🦖', '🐉', '🦅'];

// ── Tages-Tipps (rotieren täglich) ───────────────────────
export const TIPS = [
  '💪 Gut gemessen ist halb gewonnen! Dein Dexcom G7 macht das für dich — einfach mal draufschauen!',
  '🏃 Bewegung kann deinen Blutzucker senken — sag dem Omnipod Bescheid, wenn du Sport machst!',
  '🥗 Gemüse hat wenig Kohlenhydrate und viele Vitamine — super für deinen Zucker!',
  '💧 Viel Wasser trinken hilft deinem Körper, besonders wenn der Zucker hoch ist!',
  '😴 Guter Schlaf ist wichtig für stabilen Blutzucker. Dein Omnipod 5 passt nachts auf dich auf!',
  '🎯 Dein Körper ist einzigartig — du lernst jeden Tag mehr darüber!',
  '🦸 Diabetes haben bedeutet, dass du jeden Tag ein kleiner Held bist!',
  '🧮 Wenn du isst, schau wie viele KH drin sind und sag es deinem Omnipod. Der Rest ist Teamwork!',
  '🧠 Du weißt mehr über Diabetes als die meisten Erwachsenen — das macht dich zum Experten!',
  '⭐ Dein Dexcom G7 schaut immer nach dir — auch wenn du schläfst!',
  '🎮 Stell dir vor dein Omnipod 5 ist dein Sidekick — gemeinsam seid ihr unschlagbar!',
  '🌈 Jeder Tag mit einem guten Wert ist ein kleiner Sieg. Du schaffst das!',
  '🔋 Dein Körper braucht die richtige Menge KH wie ein Handy Strom braucht!',
  '🏆 Wusstest du? Mit Typ-1-Diabetes können Menschen Olympia-Athleten werden!',
];

// ── Sport-Aktivitäten ─────────────────────────────────────
export const ACTIVITIES = [
  { id: 'fussball',    emoji: '⚽', name: 'Fußball'       },
  { id: 'schwimmen',   emoji: '🏊', name: 'Schwimmen'     },
  { id: 'radfahren',   emoji: '🚴', name: 'Radfahren'     },
  { id: 'laufen',      emoji: '🏃', name: 'Laufen'        },
  { id: 'turnen',      emoji: '🤸', name: 'Turnen'        },
  { id: 'tanzen',      emoji: '💃', name: 'Tanzen'        },
  { id: 'basketball',  emoji: '🏀', name: 'Basketball'    },
  { id: 'tennis',      emoji: '🎾', name: 'Tennis'        },
  { id: 'klettern',    emoji: '🧗', name: 'Klettern'      },
  { id: 'spazieren',   emoji: '🚶', name: 'Spazieren'     },
  { id: 'anderes',     emoji: '🏅', name: 'Anderer Sport' },
];

// ── Errungenschaften / Achievements ──────────────────────
export const ACHIEVEMENTS = [
  {
    id:    'first_bz',
    emoji: '🏆',
    name:  'Erster Held!',
    desc:  'Erste Blutzuckermessung eingetragen',
    check: (s) => s.entries.filter(e => e.type === 'bz').length >= 1,
  },
  {
    id:    'bz_10',
    emoji: '⭐',
    name:  'Fleißiger Messer',
    desc:  '10 Blutzuckermessungen eingetragen',
    check: (s) => s.entries.filter(e => e.type === 'bz').length >= 10,
  },
  {
    id:    'bz_50',
    emoji: '💫',
    name:  'Mess-Profi',
    desc:  '50 Messungen — du bist ein Experte!',
    check: (s) => s.entries.filter(e => e.type === 'bz').length >= 50,
  },
  {
    id:    'bz_100',
    emoji: '🎖️',
    name:  'Blutzucker-Champion',
    desc:  '100 Messungen — absolute Legende!',
    check: (s) => s.entries.filter(e => e.type === 'bz').length >= 100,
  },
  {
    id:    'target_ok',
    emoji: '🎯',
    name:  'Zielbereich-Treffer',
    desc:  'Wert im Zielbereich gemessen',
    check: (s) => {
      const { min = 70, max = 180 } = s.settings;
      return s.entries.some(e => e.type === 'bz' && e.value >= min && e.value <= max);
    },
  },
  {
    id:    'target_5',
    emoji: '🎯',
    name:  'Zielbereich-Meister',
    desc:  '5x hintereinander im Zielbereich',
    check: (s) => {
      const { min = 70, max = 180 } = s.settings;
      const bz = s.entries.filter(e => e.type === 'bz');
      let streak = 0;
      for (const e of bz) {
        if (e.value >= min && e.value <= max) streak++;
        else streak = 0;
        if (streak >= 5) return true;
      }
      return false;
    },
  },
  {
    id:    'streak_3',
    emoji: '🔥',
    name:  '3-Tage-Streak!',
    desc:  '3 Tage in Folge gemessen',
    check: (s) => getMaxStreak(s.entries) >= 3,
  },
  {
    id:    'streak_7',
    emoji: '🌟',
    name:  'Wochenheld!',
    desc:  '7 Tage am Stück gemessen — mega!',
    check: (s) => getMaxStreak(s.entries) >= 7,
  },
  {
    id:    'meal_5',
    emoji: '🍽️',
    name:  'Mahlzeiten-Held',
    desc:  '5 Mahlzeiten erfasst',
    check: (s) => s.entries.filter(e => e.type === 'meal').length >= 5,
  },
  {
    id:    'meal_20',
    emoji: '👨‍🍳',
    name:  'Ernährungs-Experte',
    desc:  '20 Mahlzeiten erfasst',
    check: (s) => s.entries.filter(e => e.type === 'meal').length >= 20,
  },
  {
    id:    'custom_food',
    emoji: '🆕',
    name:  'Erfinder',
    desc:  'Eigenes Lebensmittel hinzugefügt',
    check: (s) => s.foodDB.some(f => f.source === 'custom'),
  },
  {
    id:    'barcode',
    emoji: '📸',
    name:  'Barcode-Scanner',
    desc:  'Produkt per Barcode gescannt',
    check: (s) => s.foodDB.some(f => f.barcode),
  },
  {
    id:    'activity',
    emoji: '🏃',
    name:  'Sport-Ass',
    desc:  'Erste Sport-Aktivität eingetragen',
    check: (s) => s.entries.some(e => e.type === 'activity'),
  },
  {
    id:    'activity_10',
    emoji: '🥇',
    name:  'Sport-Champion',
    desc:  '10 Sport-Aktivitäten eingetragen',
    check: (s) => s.entries.filter(e => e.type === 'activity').length >= 10,
  },
  {
    id:    'learn',
    emoji: '📚',
    name:  'Wissens-Star',
    desc:  'Lernbereich besucht',
    check: (s) => (s.learnVisits || 0) >= 1,
  },
  {
    id:    'learn_5',
    emoji: '🎓',
    name:  'Diabetes-Experte',
    desc:  'Lernbereich 5x besucht',
    check: (s) => (s.learnVisits || 0) >= 5,
  },
];

// Helper für Streak-Berechnung
function getMaxStreak(entries) {
  const bzEntries = entries.filter(e => e.type === 'bz');
  if (bzEntries.length === 0) return 0;

  const days = new Set(
    bzEntries.map(e => {
      const d = new Date(e.timestamp);
      return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    })
  );

  const sorted = [...days].sort();
  let max = 1;
  let cur = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 1;
    }
  }
  return max;
}
