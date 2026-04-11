"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { getBzStatus, formatTime } from "@/lib/utils";

interface Entry {
  id: string;
  type: string;
  timestamp: number;
  bzValue?: number;
  insulinUnits?: number;
  insulinType?: string;
  mealName?: string;
  mealKh?: number;
}

const QUICK_ACTIONS = [
  { href: "/bz",        emoji: "🩸", label: "BZ messen",    color: "bg-red-50"    },
  { href: "/insulin",   emoji: "💉", label: "Insulin",      color: "bg-blue-50"   },
  { href: "/meal",      emoji: "🍽️", label: "Mahlzeit",    color: "bg-green-50"  },
  { href: "/calc",      emoji: "🧮", label: "KH-Rechner",   color: "bg-yellow-50" },
  { href: "/activity",  emoji: "🏃", label: "Aktivität",    color: "bg-purple-50" },
  { href: "/assistant", emoji: "🤖", label: "KI-Assistent", color: "bg-indigo-50" },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 10) return "Guten Morgen";
  if (h < 14) return "Guten Mittag";
  if (h < 18) return "Guten Nachmittag";
  return "Guten Abend";
}

function entryLabel(entry: Entry): string {
  if (entry.type?.toUpperCase() === "BZ")       return `${entry.bzValue} mg/dL`;
  if (entry.type?.toUpperCase() === "INSULIN")  return `${entry.insulinUnits} IE ${entry.insulinType ?? ""}`;
  if (entry.type?.toUpperCase() === "MEAL")     return entry.mealName ?? `${entry.mealKh} g KH`;
  return entry.type;
}

function entryEmoji(type: string): string {
  const map: Record<string, string> = { bz: "🩸", insulin: "💉", meal: "🍽️", activity: "🏃", ketone: "🧪" };
  return map[type?.toLowerCase()] ?? "📝";
}

// BL-H06: Berechne BZ-Mess-Streak (wie viele Tage in Folge BZ gemessen?)
function calcStreak(entries: Entry[]): number {
  const bzEntries = entries.filter((e) => e.type?.toUpperCase() === "BZ");
  if (bzEntries.length === 0) return 0;

  // Unique Tage (YYYY-MM-DD) aus Timestamps
  const days = new Set(
    bzEntries.map((e) => new Date(e.timestamp).toISOString().slice(0, 10))
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
    } else if (i > 0) {
      break; // Lücke → Streak endet
    }
  }
  return streak;
}

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.activeProfile);

  const { data: recentEntries = [] } = useQuery<Entry[]>({
    queryKey: ["entries", "recent"],
    queryFn: () => apiClient.get("/api/v1/entries?size=5").then((r: any) => r.content ?? r),
    refetchInterval: 60_000,
  });

  // BL-H06: Mehr Einträge für Streak-Berechnung laden
  const { data: streakEntries = [] } = useQuery<Entry[]>({
    queryKey: ["entries", "streak"],
    queryFn: () => apiClient.get("/api/v1/entries?size=200&type=bz").then((r: any) => r.content ?? r),
    staleTime: 5 * 60_000,
  });

  const lastBz   = recentEntries.find((e) => e.type?.toUpperCase() === "BZ");
  const bzStatus = lastBz?.bzValue != null ? getBzStatus(lastBz.bzValue) : null;
  const streak   = calcStreak(streakEntries);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-zh-muted text-sm">{greeting()},</p>
          <h1 className="text-2xl font-bold text-zh-text">
            {profile?.avatar} {profile?.name}
          </h1>
        </div>
        <Link href="/settings" className="text-2xl p-1">⚙️</Link>
      </div>

      {/* Letzter BZ */}
      {lastBz && bzStatus ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-zh-muted text-sm">Letzter BZ-Wert</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-5xl font-bold ${bzStatus.color}`}>
                  {lastBz.bzValue}
                </span>
                <span className="text-zh-muted text-lg">mg/dL</span>
              </div>
              <p className={`text-sm font-medium mt-1 ${bzStatus.color}`}>
                {bzStatus.emoji} {bzStatus.label}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <p className="text-zh-muted text-xs">{formatTime(lastBz.timestamp)}</p>
              <Link
                href="/bz"
                className="bg-zh-green text-white px-4 py-2 rounded-xl text-sm font-semibold"
              >
                Neu messen
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <p className="text-zh-muted text-sm mb-3">Noch kein BZ-Wert heute</p>
          <Link
            href="/bz"
            className="inline-block bg-zh-green text-white px-6 py-2 rounded-xl font-semibold"
          >
            🩸 Jetzt messen
          </Link>
        </div>
      )}

      {/* BL-H06: Streak-Widget */}
      {streak > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <span className="text-3xl">{streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "✨"}</span>
          <div>
            <p className="font-bold text-zh-text">
              {streak} {streak === 1 ? "Tag" : "Tage"} in Folge gemessen!
            </p>
            <p className="text-xs text-zh-muted">
              {streak >= 30 ? "Unglaublich — 30 Tage Streak! 🏆" :
               streak >= 14 ? "Zwei Wochen am Stück — super! 🥇" :
               streak >= 7  ? "Eine Woche — weiter so! 🌟" :
               streak >= 3  ? "Du bist auf einem guten Weg!" :
               "Gut gemacht, mach weiter so!"}
            </p>
          </div>
        </div>
      )}

      {/* Schnellaktionen */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${item.color} rounded-2xl p-4 flex flex-col gap-1 active:scale-95 transition-transform`}
          >
            <span className="text-3xl">{item.emoji}</span>
            <span className="font-semibold text-zh-text text-sm">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Letzte Einträge */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-zh-text mb-3">Letzte Einträge</h2>
          <div className="space-y-2">
            {recentEntries.slice(0, 4).map((entry) => {
              const status = entry.bzValue != null ? getBzStatus(entry.bzValue) : null;
              return (
                <div key={entry.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span>{entryEmoji(entry.type)}</span>
                    <span className={`text-sm ${status?.color ?? "text-zh-text"}`}>
                      {entryLabel(entry)}
                    </span>
                  </div>
                  <span className="text-xs text-zh-muted">{formatTime(entry.timestamp)}</span>
                </div>
              );
            })}
          </div>
          <Link
            href="/history"
            className="block text-center text-zh-green text-sm font-medium mt-3"
          >
            Alle anzeigen →
          </Link>
        </div>
      )}
    </div>
  );
}
