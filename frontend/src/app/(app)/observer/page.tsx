"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsentNotice } from "@/components/ui/ConsentNotice";
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
  const hasExtendedRole = watchedInfo?.role === "caregiver" || watchedInfo?.role === "admin";
  const relationshipLabel = watchedInfo
    ? watchedInfo.relationshipKind === "PROFESSIONAL"
      ? "Fachperson"
      : watchedInfo.relationshipKind === "FAMILY"
        ? "Familie"
        : watchedInfo.relationshipKind === "SCHOOL"
          ? "Schule & Alltag"
          : "Gast-Lernen"
    : null;

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
      <div className="page-shell page-stack text-center pt-16">
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
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          title={`${watchedInfo.ownerAvatar} ${watchedInfo.ownerName}`}
          subtitle="Begleitansicht mit klarer Ampel, Notfallpfad und passenden Rechten."
          showBack
          onBack={() => { setViewing(null); router.replace("/login"); }}
          trailing={
            <span className="status-pill status-pill--neutral">
              {relationshipLabel} · {watchedInfo.role === "admin" ? "Admin" : watchedInfo.role === "caregiver" ? "Betreuer" : "Lesend"}
            </span>
          }
        />

        <section className={`${ampel.bg} rounded-[2rem] p-6 text-center shadow-sm border border-white/30`}>
          <p className="page-eyebrow">Beobachtungsmodus</p>
          <div className="text-6xl mt-3 mb-3">{ampel.emoji}</div>
          <p className="text-xl font-bold text-zh-text">{ampel.label}</p>
          {lastBz && bzStatus ? (
            <div className="mt-4">
              <span className={`text-6xl font-black tracking-[-0.06em] ${bzStatus.color}`}>
                {lastBz.bzValue}
              </span>
              <span className="text-zh-muted text-lg ml-1">mg/dL</span>
              <p className="text-xs text-zh-muted mt-2">{formatTime(lastBz.timestamp)}</p>
            </div>
          ) : (
            <p className="text-zh-muted text-sm mt-3">Noch keine Messung vorhanden</p>
          )}
        </section>

        <ConsentNotice
          title={hasExtendedRole ? "Betreuungsfreigabe im Lesemodus" : "Reine Lesefreigabe"}
          text={hasExtendedRole
            ? "Du siehst ein freigegebenes Profil mit erweiterter Betreuungsrolle. Diese Beobachtungsansicht bleibt aus Sicherheitsgründen aktuell lesend; aktive Einträge werden erst in einem explizit freigegebenen Schreib-Flow unterstützt."
            : "Du siehst nur freigegebene Werte, ohne Schreibzugriff. Zurück zum eigenen Dashboard wechseln oder eine andere Freigabe wählen."}
          tone={hasExtendedRole ? "info" : "warning"}
          badge="Consent"
        />

        <div className="surface-muted rounded-[1.5rem] px-4 py-4 text-sm text-zh-muted">
          <p className="font-semibold text-zh-text">Nur ansehen · {relationshipLabel} · {watchedInfo.purpose}</p>
          <p className="mt-1">
            Diese Ansicht bleibt auf live freigegebene, lesende Daten begrenzt. Selbst Betreuungsrollen treffen hier keine Therapie- oder Schreibentscheidungen; Schule, Alltag und Gast-Lernen erhalten keinen Zugang zu diesem Screen.
          </p>
        </div>

        {emergencySteps && (
          <section className={`${lastBz!.bzValue! < 70 ? "danger-card" : "warning-card"} p-4`}>
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
          </section>
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
        {!hasExtendedRole && <p>Als Beobachter kannst du keine Einträge machen.</p>}
        {hasExtendedRole && <p>Auch mit Betreuungsrolle bleibt diese Beobachtungsansicht aktuell lesend, bis ein separater Schreibfluss freigegeben ist.</p>}
        </div>

      {/* Zum eigenen Dashboard wechseln */}
        {activeProfile && (
          <button
            onClick={() => { setViewing(null); router.push("/dashboard"); }}
            className="secondary-button w-full"
          >
            Zum eigenen Dashboard ({activeProfile.name})
          </button>
        )}
      </div>
    </div>
  );
}
