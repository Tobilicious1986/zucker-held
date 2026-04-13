export interface GamificationEntry {
  type: string;
  timestamp: number;
}

export interface GamificationLevel {
  name: string;
  emoji: string;
  minXp: number;
}

export const GAMIFICATION_LEVELS: GamificationLevel[] = [
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

export function isToday(timestamp: number): boolean {
  const now = new Date();
  const date = new Date(timestamp);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function calculateXp(entries: GamificationEntry[], streak: number): number {
  const todayEntries = entries.filter((entry) => isToday(entry.timestamp));
  return streak * 10 + todayEntries.length * 5 + Math.floor(entries.length / 10);
}

export function getCurrentLevel(xp: number): {
  level: GamificationLevel;
  nextLevel: GamificationLevel | null;
} {
  let current = GAMIFICATION_LEVELS[0];
  for (const level of GAMIFICATION_LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  const nextLevel = GAMIFICATION_LEVELS.find((level) => level.minXp > current.minXp) ?? null;
  return { level: current, nextLevel };
}

export function getProgressPercent(xp: number): number {
  const { level, nextLevel } = getCurrentLevel(xp);
  if (!nextLevel) return 100;
  return Math.min(
    100,
    Math.round(((xp - level.minXp) / (nextLevel.minXp - level.minXp)) * 100)
  );
}
