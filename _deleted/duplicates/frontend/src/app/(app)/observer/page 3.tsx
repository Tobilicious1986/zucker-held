"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// Ampel-Status für Betreuer (vereinfacht: nur Grün/Gelb/Rot)
function getAmpelStatus(bzValue: number | undefined) {
  if (bzValue == null) return { color: "gray", label: "Kein Wert", bg: "bg-gray-100", emoji: "⚪" };
  if (bzValue < 70)           return { color: "red",   label: "Zu niedrig — bitte handeln!",  bg: "bg-red-50",    emoji: "🔴" };
  if (bzValue <= 180)         return { color: "green", label: "Alles gut",                    bg: "bg-green-50",  emoji: "🟢" };
  if (bzValue <= 250)         return { color: "yellow",label: "Etwas erhöht — beobachten",    bg: "bg-yellow-50", emoji: "🟡" };
  return                             { color: "red",   label: "Stark erhöht — bitte handeln!",bg: "bg-red-50",    emoji: "🔴" };
}

// Geführter Notfall-Flow
const EMERGENCY_STEPS_HYPO = [
  "🍬 Sofort 3–4 Traubenzucker geben",
  "⏱️ 15 Minuten ruhig warten",
  "📱 Eltern/Betreuer anrufen",
  "🔁 Nach 15 Min nochmal messen",
  "🏥 Wenn keine Besserung → Arzt rufen!",
];

const EMERGENCY_STEPS_HYPER = [
  "💧 Viel Wasser trinken lassen",
  "📱 Eltern/Betreuer informieren",
  "⏱️ In 1 Stunde Ketone messen",
  "🏥 Bei Ketonen > 1.5 mmol → Arzt!",
];

function entryLabel(entry: Entry): string {
  if (entry.type?.toUpperCase() === "BZ")      return `${entry.bzValue} mg/dL`;
  if (entry.type?.toUpperCase() === "INSULIN") return `${entry.insulinUnits} IE ${entry.insulinType ?? ""}`;
  if (entry.type?.toUpperCase() === "MEAL")    return entry.mealName ?? `${entry.mealKh} g KH`;
  return entry.type;
}

function entryEmoji(type: string): string {
  const map: Record<string, string> = { bz: "🩸", insulin: "💉", meal: "🍽️", activity: "🏃", ketone: "🧪" };
  return map[type?.toLowerCase()] ?? "📝";
}

export default function ObserverPage() {
  const router         = useRouter();
  const activeProfile  = useAuthStore((s) => s.activeProfile);
  const viewingId      = useAuthStore((s) => s.viewingProfileId);
  const watchedList    = useAuthStore((s) => s.watchedProfiles);
  const setViewing     = useAuthStore((s) => s.setViewingProfile);

  const watchedInfo = watchedList.find((w) => w.ownerId === viewingId);
  const canEdit     = watchedInfo?.role === "caregiver" || watchedInfo?.role === "admin";

  const { data: entries = [] } = useQuery<Entry[]>({
    queryKey: ["entries", "observer", viewingId],
    queryFn: () => apiClient.get<any>("/api/v1/entries?size=10").then((r: any) => r.content ?? r),
    enabled: !!viewingId,
    refetchInterval: 60_000,
  });

  const lastBz   = entries.find((e) => e.type?.toUpperCase() === "BZ");
  const bzStatus = lastBz?.bzValue != null ? getBzStatus(lastBz.bzValue) : null;
  const ampel    = getAmpelStatus(lastBz?.bzValue);

  const emergencySteps = lastBz?.bzValue != null
    ? (lastBz.bzValue < 70 ? EMERGENCY_STEPS_HYPO : lastBz.bzValue > 250 ? EMERGENCY_STEPS_HYPER : null)
    : null;

  // Wenn kein Profil zum Beobachten ausgewählt → zurück zum Login
  if (!viewingId || !watchedInfo) {
    return (
      <div className="p-4 space-y-4 text-center pt-16">
        <p className="text-5xl">🔗</p>
        <p className="text-zh-muted">Kein Profil ausgewählt.</p>
        <button
          onClick={() => router.replace("/login")}
          className="bg-zh-green text-white px-6 py-3 rounded-2xl font-semibold"
        >
          Zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => { setViewing(null); router.replace("/login"); }}
          className="text-2xl text-zh-muted"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-zh-muted">Du beobachtest</p>
          <h1 className="text-xl font-bold text-zh-text">
            {watchedInfo.ownerAvatar} {watchedInfo.ownerName}
          </h1>
        </div>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-zh-muted">
          {watchedInfo.role === "admin" ? "Admin" : watchedInfo.role === "caregiver" ? "Betreuer" : "Beobachter"}
        </span>
      </div>

      {/* Ampel — großer Statusindikator für Betreuer (Oma-Modus) */}
      <div className={`${ampel.bg} rounded-2xl p-6 text-center shadow-sm`}>
        <div className="text-6xl mb-3">{ampel.emoji}</div>
        <p className="text-lg font-bold text-zh-text">{ampel.label}</p>
        {lastBz && bzStatus && (
          <div className="mt-3">
            <span className={`text-5xl font-bold ${bzStatus.color}`}>
              {lastBz.bzValue}
            </span>
            <span className="text-zh-muted text-lg ml-1">mg/dL</span>
            <p className="text-xs text-zh-muted mt-1">{formatTime(lastBz.timestamp)}</p>
          </div>
        )}
        {!lastBz && (
          <p className="text-zh-muted text-sm mt-2">Noch keine Messung vorhanden</p>
        )}
      </div>

      {/* Notfall-Schritte wenn kritischer BZ */}
      {emergencySteps && (
        <div className={`rounded-2xl p-4 shadow-sm border-2 ${
          lastBz!.bzValue! < 70
            ? "bg-red-50 border-red-300"
            : "bg-orange-50 border-orange-300"
        }`}>
          <p className="font-bold text-lg mb-3">
            {lastBz!.bzValue! < 70 ? "🆘 Was jetzt tun?" : "⚠️ Was jetzt tun?"}
          </p>
          <ol className="space-y-2">
            {emergencySteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="font-bold text-zh-muted min-w-[20px]">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Schnellaktionen für Betreuer (nur wenn CAREGIVER oder ADMIN) */}
      {canEdit && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-zh-muted mb-3">Schnellaktionen</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/bz"
              className="bg-red-50 rounded-xl p-3 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🩸</span>
              <span className="text-xs font-medium text-zh-text">BZ messen</span>
            </Link>
            <Link
              href="/insulin"
              className="bg-blue-50 rounded-xl p-3 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">💉</span>
              <span className="text-xs font-medium text-zh-text">Insulin</span>
            </Link>
            <Link
              href="/meal"
              className="bg-green-50 rounded-xl p-3 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🍽️</span>
              <span className="text-xs font-medium text-zh-text">Mahlzeit</span>
            </Link>
            <Link
              href="/ketone"
              className="bg-yellow-50 rounded-xl p-3 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🧪</span>
              <span className="text-xs font-medium text-zh-text">Ketone</span>
            </Link>
          </div>
        </div>
      )}

      {/* Letzte Einträge */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-zh-text mb-3">Letzte Einträge</h2>
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry) => {
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
        </div>
      )}

      {/* Notfallkontakte / Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">ℹ️ Wichtig</p>
        <p>Du siehst die Daten von {watchedInfo.ownerName} in Echtzeit.</p>
        {!canEdit && <p>Als Beobachter kannst du keine Einträge machen.</p>}
        {canEdit && <p>Als Betreuer kannst du Einträge für {watchedInfo.ownerName} machen.</p>}
      </div>

      {/* Zum eigenen Dashboard wechseln */}
      {activeProfile && (
        <button
          onClick={() => { setViewing(null); router.push("/dashboard"); }}
          className="w-full bg-gray-100 text-zh-text py-3 rounded-2xl text-sm font-medium"
        >
          Zum eigenen Dashboard ({activeProfile.name}) →
        </button>
      )}
    </div>
  );
}
