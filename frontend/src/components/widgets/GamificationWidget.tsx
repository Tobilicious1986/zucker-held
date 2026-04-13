"use client";

interface Entry {
  type: string;
  timestamp: number;
}

interface GamificationWidgetProps {
  entries: Entry[];
  streak: number;
}

interface Level {
  name: string;
  emoji: string;
  minXp: number;
}

const LEVELS: Level[] = [
  { name: "Zucker-Lehrling", emoji: "🌱", minXp: 0 },
  { name: "Werte-Wächter", emoji: "🛡️", minXp: 60 },
  { name: "KH-Kapitän", emoji: "🍞", minXp: 140 },
  { name: "Bolus-Bändiger", emoji: "💉", minXp: 240 },
  { name: "Zielbereich-Ritter", emoji: "⚔️", minXp: 360 },
  { name: "Streak-Stürmer", emoji: "🔥", minXp: 500 },
  { name: "Sensor-Superheld", emoji: "🦸", minXp: 660 },
  { name: "Zucker-Champion", emoji: "🏆", minXp: 840 },
  { name: "Unsterblicher Held", emoji: "🌟", minXp: 999 },
];

function isToday(timestamp: number): boolean {
  const now = new Date();
  const date = new Date(timestamp);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function getCurrentLevel(xp: number): { level: Level; nextLevel: Level | null } {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  const nextLevel = LEVELS.find((level) => level.minXp > current.minXp) ?? null;
  return { level: current, nextLevel };
}

export default function GamificationWidget({ entries, streak }: GamificationWidgetProps) {
  const todayEntries = entries.filter((entry) => isToday(entry.timestamp));
  const xp = streak * 10 + todayEntries.length * 5 + Math.floor(entries.length / 10);
  const { level, nextLevel } = getCurrentLevel(xp);

  const progressPercent = nextLevel
    ? Math.min(
        100,
        Math.round(((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100)
      )
    : 100;

  const quests = [
    {
      id: "bz",
      label: "BZ messen",
      done: todayEntries.some((entry) => entry.type?.toUpperCase() === "BZ"),
    },
    {
      id: "meal",
      label: "Mahlzeit loggen",
      done: todayEntries.some((entry) => entry.type?.toUpperCase() === "MEAL"),
    },
    {
      id: "streak",
      label: "3-Tage-Streak",
      done: streak >= 3,
    },
  ];

  return (
    <div className="bg-linear-to-br from-yellow-50 via-orange-50 to-green-50 rounded-3xl p-4 shadow-sm border border-yellow-100 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-orange-600 font-semibold">
            Tages-Challenge
          </p>
          <h2 className="text-lg font-bold text-zh-text mt-1">
            {level.emoji} {level.name}
          </h2>
          <p className="text-sm text-zh-muted mt-1">
            {xp} XP gesammelt
            {nextLevel ? ` · Nächstes Ziel: ${nextLevel.name}` : " · Max-Level erreicht!"}
          </p>
        </div>
        <div className="bg-white/80 rounded-2xl px-3 py-2 text-center min-w-20">
          <p className="text-xs text-zh-muted">Streak</p>
          <p className="text-xl font-bold text-orange-500">{streak}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-white/70 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-yellow-400 via-orange-400 to-green-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-zh-muted">
          {nextLevel
            ? `${Math.max(0, nextLevel.minXp - xp)} XP bis ${nextLevel.name}`
            : "Du hast alle Level freigeschaltet."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className={`rounded-2xl px-3 py-2 flex items-center justify-between ${
              quest.done ? "bg-green-100 text-green-700" : "bg-white/80 text-zh-text"
            }`}
          >
            <span className="text-sm font-medium">{quest.label}</span>
            <span className="text-lg">{quest.done ? "✅" : "🎯"}</span>
          </div>
        ))}
      </div>

      {streak >= 7 && (
        <div className="rounded-2xl bg-white/80 border border-orange-200 px-4 py-3">
          <p className="font-semibold text-orange-700">🔥 Wochenbonus freigeschaltet!</p>
          <p className="text-sm text-zh-muted">
            7 Tage in Folge gemessen. Das ist echte Held:innen-Energie.
          </p>
        </div>
      )}
    </div>
  );
}
