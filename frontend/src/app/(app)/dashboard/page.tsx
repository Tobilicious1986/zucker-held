"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import GamificationWidget from "@/components/widgets/GamificationWidget";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAgeGroupClasses } from "@/lib/hooks/useAgeGroup";
import { useAuthStore } from "@/stores/auth.store";
import { getBzStatus, formatTime } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

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

interface InsightMetrics {
  tirPercent: number;
  gmi: number;
  cvPercent: number;
  avgBz: number;
  totalReadings: number;
}

interface PatternInsight {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  timeWindowLabel?: string | null;
  occurrences?: number;
}

interface PatternResponse {
  insights: PatternInsight[];
}

interface SettingsLite {
  guardianPingEnabled: boolean;
}

interface GuardianPingResponse {
  recipients: number;
  recipientNames: string[];
}

interface DataQualityIssue {
  id: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
}

interface DataQualityResponse {
  latestGlucoseAgeMinutes: number | null;
  latestCgmAgeMinutes: number | null;
  measurementGapCount: number;
  staleGlucose: boolean;
  staleCgm: boolean;
  hasRecentGlucose: boolean;
  hasCgmSignal: boolean;
  issues: DataQualityIssue[];
}

const QUICK_ACTIONS = [
  { href: "/bz",        emoji: "🩸", label: "BZ messen",    note: "Aktuellen Wert schnell erfassen" },
  { href: "/insulin",   emoji: "💉", label: "Insulin",      note: "Dosis sichern oder berechnen" },
  { href: "/meal",      emoji: "🍽️", label: "Mahlzeit",    note: "KH und Favoriten dokumentieren" },
  { href: "/calc",      emoji: "🧮", label: "KH-Rechner",   note: "Portionen und Lebensmittel rechnen" },
  { href: "/activity",  emoji: "🏃", label: "Aktivität",    note: "Sport mit BZ-Kontext vorbereiten" },
  { href: "/assistant", emoji: "🤖", label: "KI-Assistent", note: "Fragen und Schätzungen bekommen" },
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
  const ui = useAgeGroupClasses();
  const showToast = useUiStore((s) => s.showToast);

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

  const { data: allEntries = [] } = useQuery<Entry[]>({
    queryKey: ["entries", "gamification"],
    queryFn: () => apiClient.get("/api/v1/entries?size=500").then((r: any) => r.content ?? r),
    staleTime: 60_000,
  });

  const { data: metrics } = useQuery<InsightMetrics>({
    queryKey: ["insights", "metrics", 14],
    queryFn: () => apiClient.get("/api/v1/insights/metrics?days=14"),
    enabled: ui.showAdvancedStats,
    staleTime: 120_000,
  });

  const { data: patterns } = useQuery<PatternResponse>({
    queryKey: ["insights", "patterns", 14],
    queryFn: () => apiClient.get("/api/v1/insights/patterns?days=14"),
    enabled: ui.showAdvancedStats,
    staleTime: 120_000,
  });

  const { data: dataQuality } = useQuery<DataQualityResponse>({
    queryKey: ["insights", "data-quality", 14],
    queryFn: () => apiClient.get("/api/v1/insights/data-quality?days=14"),
    enabled: !!profile,
    staleTime: 120_000,
  });

  const { data: settings } = useQuery<SettingsLite>({
    queryKey: ["settings", "guardian-ping"],
    queryFn: () => apiClient.get("/api/v1/settings"),
    enabled: !!profile,
    staleTime: 60_000,
  });

  const guardianPingMutation = useMutation({
    mutationFn: (message: string) =>
      apiClient.post<GuardianPingResponse>(
        `/api/v1/profiles/${profile!.id}/guardian-ping`,
        { message }
      ),
    onSuccess: (data) => {
      const recipients = data?.recipients ?? 0;
      const names = data?.recipientNames?.filter(Boolean) ?? [];
      const detail = names.length > 0 ? ` an ${names.join(", ")}` : "";
      showToast(
        recipients > 0
          ? `Eltern-Ping gesendet ✅ (${recipients} Empfänger${detail})`
          : "Ping gesendet, aber es sind keine Betreuer verknüpft.",
        recipients > 0 ? "success" : "warning"
      );
    },
    onError: () => showToast("Ping konnte nicht gesendet werden.", "error"),
  });

  const lastBz   = recentEntries.find((e) => e.type?.toUpperCase() === "BZ");
  const bzStatus = lastBz?.bzValue != null ? getBzStatus(lastBz.bzValue) : null;
  const streak   = calcStreak(streakEntries);
  const hasGuardianPing = Boolean(settings?.guardianPingEnabled && profile?.id);

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          eyebrow={greeting()}
          title={`${profile?.avatar ?? "🩸"} ${profile?.name ?? "Zucker-Held"}`}
          subtitle={
            ui.ageGroup === "child_young"
              ? "Heute zählst du jeden kleinen Schritt. Wir halten alles gut sichtbar für dich bereit."
              : ui.ageGroup === "child_teen"
                ? "Dein Tagesüberblick mit klarem Fokus auf Werte, Muster und schnelle Aktionen."
                : "Dein ruhiger Überblick über aktuelle Werte, Datenqualität und nächste sinnvolle Schritte."
          }
          trailing={
            <Link href="/settings" className="icon-button" aria-label="Einstellungen öffnen">
              ⚙️
            </Link>
          }
        />

        {lastBz && bzStatus ? (
          <section className="surface-hero p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="page-eyebrow">Aktueller Glukosewert</p>
                <div className="flex items-end gap-2 mt-3">
                  <span className="text-6xl font-black tracking-[-0.06em]">
                    {lastBz.bzValue}
                  </span>
                  <span className="text-lg font-semibold text-white/75 mb-2">mg/dL</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="status-pill bg-white/14 text-white">
                    {bzStatus.emoji} {bzStatus.label}
                  </span>
                  <span className="status-pill bg-white/14 text-white">
                    Letzte Messung {formatTime(lastBz.timestamp)}
                  </span>
                </div>
              </div>
              <Link href="/bz" className="secondary-button">
                Neu messen
              </Link>
            </div>
          </section>
        ) : (
          <section className="surface-hero p-5 md:p-6">
            <p className="page-eyebrow">Noch kein Wert im Fokus</p>
            <h2 className="page-title mt-3">Bereit für die erste Messung heute?</h2>
            <p className="page-subtitle max-w-sm">
              Ein aktueller BZ-Wert macht alle weiteren Hinweise präziser und sicherer.
            </p>
            <div className="mt-5">
              <Link href="/bz" className="secondary-button">
                🩸 Jetzt messen
              </Link>
            </div>
          </section>
        )}

        {streak > 0 && (
          <section className="surface-card p-4 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-3xl">
              {streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "✨"}
            </span>
            <div>
              <p className="font-bold text-zh-text">
                {streak} {streak === 1 ? "Tag" : "Tage"} in Folge gemessen
              </p>
              <p className="text-xs text-zh-muted">
                {streak >= 30 ? "Unglaublich — 30 Tage Streak! 🏆" :
                 streak >= 14 ? "Zwei Wochen am Stück — super! 🥇" :
                 streak >= 7  ? "Eine Woche — weiter so! 🌟" :
                 streak >= 3  ? "Du bist auf einem guten Weg!" :
                 "Gut gemacht, mach weiter so!"}
              </p>
            </div>
          </section>
        )}

        {ui.showGamification && (
          <GamificationWidget entries={allEntries} streak={streak} />
        )}

        {dataQuality && (
          <section className="surface-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-eyebrow">Signalqualität</p>
                <h2 className="section-title text-xl mt-2">Wie belastbar sind die aktuellen Hinweise?</h2>
              </div>
              <span
                className={`status-pill ${
                  dataQuality.staleCgm || dataQuality.staleGlucose
                    ? "status-pill--warning"
                    : "status-pill--good"
                }`}
              >
                {dataQuality.staleCgm || dataQuality.staleGlucose ? "Auffällig" : "Stabil"}
              </span>
            </div>

            <div className="metric-grid metric-grid--2">
              <div className="metric-card">
                <p className="metric-label">Letzter Glukosewert</p>
                <p className="metric-value">
                  {dataQuality.latestGlucoseAgeMinutes != null
                    ? `vor ${dataQuality.latestGlucoseAgeMinutes} Min`
                    : "kein Wert"}
                </p>
              </div>
              <div className="metric-card">
                <p className="metric-label">Letztes CGM-Signal</p>
                <p className="metric-value">
                  {dataQuality.latestCgmAgeMinutes != null
                    ? `vor ${dataQuality.latestCgmAgeMinutes} Min`
                    : "kein Signal"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {dataQuality.issues.slice(0, 2).map((issue) => (
                <div
                  key={issue.id}
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    issue.severity === "high"
                      ? "danger-card text-red-700"
                      : issue.severity === "medium"
                        ? "warning-card text-orange-800"
                        : "surface-muted text-green-700"
                  }`}
                >
                  <p className="font-semibold">{issue.title}</p>
                  <p className="text-xs mt-1">{issue.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {ui.showAdvancedStats && metrics && (
          <section className="surface-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-eyebrow">Insights</p>
                <h2 className="section-title text-xl mt-2">Konsensus-Metriken und Muster</h2>
              </div>
              <span className="status-pill status-pill--neutral">{metrics.totalReadings} Messungen</span>
            </div>

            <div className="metric-grid metric-grid--3">
              <div className="metric-card text-center">
                <p className="metric-label">TIR</p>
                <p className="metric-value text-green-600">{Number(metrics.tirPercent ?? 0).toFixed(1)}%</p>
              </div>
              <div className="metric-card text-center">
                <p className="metric-label">GMI</p>
                <p className="metric-value text-blue-600">{Number(metrics.gmi ?? 0).toFixed(1)}</p>
              </div>
              <div className="metric-card text-center">
                <p className="metric-label">CV</p>
                <p className="metric-value text-orange-600">{Number(metrics.cvPercent ?? 0).toFixed(1)}%</p>
              </div>
            </div>

            {patterns?.insights?.length ? (
              <div className="space-y-2">
                {patterns.insights.slice(0, 2).map((pattern) => (
                  <div
                    key={pattern.id}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      pattern.severity === "high"
                        ? "danger-card text-red-700"
                        : pattern.severity === "medium"
                          ? "warning-card text-orange-800"
                          : "surface-muted text-zh-text"
                    }`}
                  >
                    <p className="font-semibold">{pattern.title}</p>
                    <p className="text-xs mt-1">{pattern.description}</p>
                    {pattern.timeWindowLabel ? (
                      <p className="text-[11px] mt-2 font-semibold opacity-80">
                        Zeitfenster: {pattern.timeWindowLabel}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        )}

        {hasGuardianPing && (
          <section className="surface-card p-5 space-y-4">
            <div>
              <p className="section-eyebrow">Direkte Hilfe</p>
              <h2 className="section-title text-xl mt-2">Eltern-Ping</h2>
              <p className="section-subtitle">
                Ein Tipp genügt, um Betreuer oder Eltern mit klarer Nachricht zu informieren.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => guardianPingMutation.mutate("Bitte kurz bei mir melden.")}
                disabled={guardianPingMutation.isPending}
                className="secondary-button w-full text-blue-700 disabled:opacity-50"
              >
                🙋 Bitte melden
              </button>
              <button
                onClick={() => guardianPingMutation.mutate("Mir geht es gerade nicht gut. Bitte komm zu mir.")}
                disabled={guardianPingMutation.isPending}
                className="danger-button w-full disabled:opacity-50"
              >
                🆘 Hilfe nötig
              </button>
            </div>
          </section>
        )}

        <section className="surface-card p-5 space-y-4">
          <div>
            <p className="section-eyebrow">Aktionen</p>
            <h2 className="section-title text-xl mt-2">Was möchtest du jetzt tun?</h2>
          </div>
          <div className="action-grid">
            {QUICK_ACTIONS.map((item) => (
              <Link key={item.href} href={item.href} className="action-tile">
                <span className="action-tile__icon">{item.emoji}</span>
                <span className="action-tile__title">{item.label}</span>
                <span className="action-tile__note">{item.note}</span>
              </Link>
            ))}
          </div>
        </section>

        {recentEntries.length > 0 && (
          <section className="surface-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-eyebrow">Verlauf</p>
                <h2 className="section-title text-xl mt-2">Letzte Einträge</h2>
              </div>
              <Link href="/history" className="secondary-button">
                Alle anzeigen
              </Link>
            </div>
            <div className="space-y-2">
              {recentEntries.slice(0, 4).map((entry) => {
                const status = entry.bzValue != null ? getBzStatus(entry.bzValue) : null;
                return (
                  <div key={entry.id} className="surface-muted rounded-[1.3rem] px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-xl shadow-sm">
                        {entryEmoji(entry.type)}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${status?.color ?? "text-zh-text"}`}>
                          {entryLabel(entry)}
                        </p>
                        <p className="text-xs text-zh-muted">{entry.type}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zh-muted whitespace-nowrap">{formatTime(entry.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
