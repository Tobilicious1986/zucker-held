"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { formatDateTime, getBzStatus } from "@/lib/utils";
import { ConsentNotice } from "@/components/ui/ConsentNotice";

interface PublicEntry {
  timestamp: number;
  type: string;
  label: string;
}

interface PublicShareResponse {
  mode: "DOCTOR" | "MINI";
  ownerName: string;
  ownerAvatar: string;
  lastBz: number | null;
  lastBzTime: number | null;
  tir7d: number;
  gmi7d: number;
  cv7d: number;
  emergencyMessage: string;
  insights: string[];
  entries: PublicEntry[];
}

const SERVER_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8080";

function getApiBase() {
  return typeof window === "undefined" ? SERVER_API_BASE : "";
}

export default function PublicSharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const { data, isLoading, isError } = useQuery<PublicShareResponse>({
    queryKey: ["public-share", token],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/v1/public/share/${token}`);
      if (!res.ok) {
        throw new Error("Link ungültig oder abgelaufen.");
      }
      return res.json();
    },
    enabled: Boolean(token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-4xl animate-pulse">
        ⏳
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen page-shell flex items-center justify-center">
        <div className="surface-card max-w-md p-6 text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <h1 className="section-title text-xl">Share-Link nicht verfügbar</h1>
          <p className="section-subtitle">
            Der Link ist abgelaufen, widerrufen oder ungültig.
          </p>
        </div>
      </div>
    );
  }

  const bzStatus = data.lastBz != null ? getBzStatus(data.lastBz) : null;
  const isDoctorMode = data.mode === "DOCTOR";
  const recentEntries = isDoctorMode ? data.entries : data.entries.slice(0, 3);

  return (
    <div className="min-h-screen page-shell">
      <div className={`${isDoctorMode ? "doctor-report-shell" : "max-w-3xl mx-auto"} page-stack`}>
        <section className="surface-hero p-6">
          <p className="page-eyebrow">Zucker-Held Share</p>
          <div className="flex items-start justify-between gap-4 mt-2">
            <div>
              <h1 className="page-title">{data.ownerAvatar} {data.ownerName}</h1>
              <p className="page-subtitle">
                {isDoctorMode
                  ? "Druckfreundlicher Kurzbericht für medizinische Gespräche."
                  : "Reine Leseansicht für Betreuung, Schule oder Trainer."}
              </p>
            </div>
            <span className="status-pill bg-white/14 text-white">
              {isDoctorMode ? "🩺 Arztansicht" : "👀 Mini-Share"}
            </span>
          </div>
          {isDoctorMode && (
            <div className="share-print-actions mt-5">
              <button onClick={() => window.print()} className="secondary-button">
                Bericht drucken
              </button>
            </div>
          )}
        </section>

        <ConsentNotice
          title={isDoctorMode ? "Zweckgebundene Arztfreigabe" : "Reine Leseansicht"}
          text={isDoctorMode
            ? "Der Bericht ist für medizinische Gespräche gedacht und zeigt nur die freigegebenen Inhalte. Schreibzugriffe sind ausgeschlossen."
            : "Diese Ansicht ist nur zum Lesen da. Sie kann jederzeit widerrufen oder ablaufen, ohne dass dafür ein Login nötig ist."}
          tone={isDoctorMode ? "success" : "info"}
          badge="Freigabe"
        />

        <section className="report-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-eyebrow">Aktueller Status</p>
              {data.lastBz != null && bzStatus ? (
                <>
                  <p className={`mt-3 text-6xl font-black tracking-[-0.06em] ${bzStatus.color}`}>
                    {data.lastBz}
                  </p>
                  <p className="text-sm text-zh-muted mt-1">mg/dL · {bzStatus.label}</p>
                  <p className="text-sm text-zh-muted mt-2">
                    {data.lastBzTime ? formatDateTime(data.lastBzTime) : "Zeitpunkt unbekannt"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-zh-muted mt-3">Kein BZ-Wert verfügbar.</p>
              )}
            </div>
            <div className={`status-pill ${
              !bzStatus ? "status-pill--neutral" :
              bzStatus.inTarget ? "status-pill--good" :
              bzStatus.level === "hoch" || bzStatus.level === "niedrig" ? "status-pill--warning" :
              "status-pill--danger"
            }`}>
              {bzStatus?.emoji ?? "ℹ️"} {bzStatus?.label ?? "Kein Wert"}
            </div>
          </div>
        </section>

        {isDoctorMode ? (
          <section className="doctor-report-grid">
            <div className="report-card">
              <p className="section-eyebrow">7-Tage-Metriken</p>
              <div className="metric-grid metric-grid--3 mt-4">
                <div className="metric-card text-center">
                  <p className="metric-label">TIR</p>
                  <p className="metric-value text-green-600">{Number(data.tir7d ?? 0).toFixed(1)}%</p>
                </div>
                <div className="metric-card text-center">
                  <p className="metric-label">GMI</p>
                  <p className="metric-value text-blue-600">{Number(data.gmi7d ?? 0).toFixed(1)}</p>
                </div>
                <div className="metric-card text-center">
                  <p className="metric-label">CV</p>
                  <p className="metric-value text-orange-600">{Number(data.cv7d ?? 0).toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="report-card">
              <p className="section-eyebrow">Notfallhinweis</p>
              <div className="danger-card mt-4 px-4 py-4 text-sm text-red-700">
                ⚠️ {data.emergencyMessage}
              </div>
            </div>
          </section>
        ) : (
          <section className="report-card space-y-3">
            <p className="section-eyebrow">Mini-Ansicht</p>
            <h2 className="section-title text-xl mt-2">Nur lesen, nicht handeln</h2>
            <p className="section-subtitle">
              Diese Ansicht zeigt nur den Status, letzte Werte und einen einfachen Notfallhinweis.
              Therapieentscheidungen gehören weiterhin zu Eltern oder dem Behandlungsteam.
            </p>
            <div className="danger-card px-4 py-4 text-sm text-red-700">
              ⚠️ {data.emergencyMessage}
            </div>
          </section>
        )}

        {data.insights?.length > 0 && isDoctorMode && (
          <section className="report-card">
            <p className="section-eyebrow">Erkannte Hinweise</p>
            <div className="report-list mt-4">
              {data.insights.map((insight) => (
                <div key={insight} className="report-list__item text-sm text-zh-text">
                  {insight}
                </div>
              ))}
            </div>
          </section>
        )}

        {recentEntries?.length > 0 && (
          <section className="report-card">
            <p className="section-eyebrow">Letzte Einträge</p>
            <div className="report-list mt-4">
              {recentEntries.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="report-list__item">
                  <p className="text-sm font-semibold text-zh-text">{entry.label}</p>
                  <p className="text-xs text-zh-muted mt-1">{formatDateTime(entry.timestamp)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isDoctorMode && (
          <section className="surface-muted rounded-[1.5rem] px-4 py-4 text-sm text-zh-muted">
            Share-Links sind immer zeitlich begrenzt und geben keine Schreibrechte.
          </section>
        )}
      </div>
    </div>
  );
}
