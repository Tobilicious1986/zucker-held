"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

interface SummaryResponse {
  ownerId: string;
  ownerName: string;
  weekFrom: string;
  weekTo: string;
  tirPercent: number;
  hypoCount: number;
  hyperCount: number;
  avgBz: number;
  entryCount: number;
}

/**
 * Sprint 15 — NET-03: SUMMARY_ONLY-Flow.
 * Zeigt nur aggregierte Wochenkennzahlen — keine Einzelmessungen, kein Live-Zugriff.
 */
export default function SummaryPage() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const router      = useRouter();
  const profile     = useAuthStore((s) => s.activeProfile);

  const { data, isLoading, isError } = useQuery<SummaryResponse>({
    queryKey: ["summary", ownerId],
    queryFn:  () => apiClient.get(`/api/v1/profiles/${ownerId}/summary`),
    enabled:  !!profile,
    retry:    false,
  });

  if (!profile) {
    router.replace("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-4xl animate-pulse">⏳</div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 gap-4">
        <div className="text-5xl">🔒</div>
        <p className="text-center text-zh-text font-semibold">Kein Zugriff</p>
        <p className="text-sm text-zh-muted text-center">
          Du hast keinen SUMMARY_ONLY-Zugang für dieses Profil oder die Freigabe ist abgelaufen.
        </p>
        <button onClick={() => router.replace("/login")} className="primary-button">
          Zurück zum Login
        </button>
      </div>
    );
  }

  const tir  = data?.tirPercent  ?? 0;
  const tirColor =
    Number(tir) >= 70 ? "text-green-600" : Number(tir) >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="min-h-screen page-shell">
      <div className="page-stack max-w-xl mx-auto">

        {/* Header */}
        <section className="surface-hero p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-eyebrow">Wochenzusammenfassung · kein Live-Zugriff</p>
              <h1 className="page-title mt-3">{data?.ownerName ?? "—"}</h1>
              <p className="page-subtitle">
                {data?.weekFrom} bis {data?.weekTo}
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/15 px-4 py-3 text-4xl shadow-lg">📊</div>
          </div>

          <div className="mt-4 rounded-[1.25rem] bg-white/10 px-4 py-2 text-sm text-white/80">
            Diese Ansicht zeigt nur Durchschnittswerte der letzten 7 Tage —
            keine Echtzeitdaten und keine Einzelmessungen.
          </div>
        </section>

        {/* TIR */}
        <section className="surface-card p-5 space-y-4">
          <div>
            <p className="section-eyebrow">Zeit im Zielbereich</p>
            <h2 className={`text-5xl font-bold mt-2 ${tirColor}`}>
              {Number(tir).toFixed(0)}%
            </h2>
            <p className="section-subtitle mt-1">
              TIR (70–180 mg/dL) · {data?.entryCount ?? 0} Messungen in diesem Zeitraum
            </p>
          </div>

          {/* TIR-Balken */}
          <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                Number(tir) >= 70 ? "bg-green-500" : Number(tir) >= 50 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${Math.min(Number(tir), 100)}%` }}
            />
          </div>
        </section>

        {/* Metriken */}
        <section className="surface-card p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="metric-card">
              <p className="metric-label text-2xl font-bold text-zh-text">
                {Number(data?.avgBz ?? 0).toFixed(0)}
              </p>
              <p className="metric-note">Ø mg/dL</p>
            </div>
            <div className="metric-card">
              <p className="metric-label text-2xl font-bold text-red-600">
                {data?.hypoCount ?? 0}
              </p>
              <p className="metric-note">Hypo-Episoden</p>
            </div>
            <div className="metric-card">
              <p className="metric-label text-2xl font-bold text-orange-500">
                {data?.hyperCount ?? 0}
              </p>
              <p className="metric-note">Hyper-Episoden</p>
            </div>
          </div>
        </section>

        {/* Hinweis */}
        <div className="rounded-[1.25rem] bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
          <p className="font-semibold">Was bedeuten diese Zahlen?</p>
          <p className="mt-1 leading-relaxed">
            TIR zeigt, wie oft der Blutzucker in der Zielzone (70–180 mg/dL) war.
            Hypo = unter 70 mg/dL, Hyper = über 180 mg/dL.
            Diese Ansicht wird täglich aktualisiert.
          </p>
        </div>

        <button
          onClick={() => router.replace("/login")}
          className="ghost-button w-full"
        >
          ← Zurück zur Profilauswahl
        </button>
      </div>
    </div>
  );
}
