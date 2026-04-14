"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { formatDateTime, getBzStatus } from "@/lib/utils";

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function PublicSharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const { data, isLoading, isError } = useQuery<PublicShareResponse>({
    queryKey: ["public-share", token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/v1/public/share/${token}`);
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
      <div className="min-h-screen bg-zh-bg flex items-center justify-center text-4xl animate-pulse">
        ⏳
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zh-bg p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 shadow-sm max-w-md text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <h1 className="text-xl font-bold text-zh-text">Share-Link nicht verfügbar</h1>
          <p className="text-sm text-zh-muted">
            Der Link ist abgelaufen, widerrufen oder ungültig.
          </p>
        </div>
      </div>
    );
  }

  const bzStatus = data.lastBz != null ? getBzStatus(data.lastBz) : null;

  return (
    <div className="min-h-screen bg-zh-bg p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-zh-muted">Zucker-Held Share</p>
          <h1 className="text-2xl font-bold text-zh-text mt-1">
            {data.ownerAvatar} {data.ownerName}
          </h1>
          <p className="text-sm text-zh-muted mt-1">
            {data.mode === "DOCTOR" ? "Arzt-Ansicht" : "Mini-Ansicht"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-zh-text mb-3">Aktueller Status</h2>
          {data.lastBz != null && bzStatus ? (
            <div>
              <p className={`text-5xl font-bold ${bzStatus.color}`}>{data.lastBz} mg/dL</p>
              <p className="text-sm text-zh-muted mt-1">
                {data.lastBzTime ? formatDateTime(data.lastBzTime) : "Zeitpunkt unbekannt"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-zh-muted">Kein BZ-Wert verfügbar.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-zh-text mb-3">7-Tage-Metriken</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <p className="text-xs text-zh-muted">TIR</p>
              <p className="font-bold text-green-600">{Number(data.tir7d ?? 0).toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-center">
              <p className="text-xs text-zh-muted">GMI</p>
              <p className="font-bold text-blue-600">{Number(data.gmi7d ?? 0).toFixed(1)}</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3 text-center">
              <p className="text-xs text-zh-muted">CV</p>
              <p className="font-bold text-orange-600">{Number(data.cv7d ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {data.insights?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-zh-text mb-3">Erkannte Hinweise</h2>
            <div className="space-y-2">
              {data.insights.map((insight) => (
                <div key={insight} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-zh-text">
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.entries?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-zh-text mb-3">Letzte Einträge</h2>
            <div className="space-y-2">
              {data.entries.map((entry, index) => (
                <div key={`${entry.timestamp}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2">
                  <p className="text-sm font-medium text-zh-text">{entry.label}</p>
                  <p className="text-xs text-zh-muted mt-0.5">{formatDateTime(entry.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {data.emergencyMessage}
        </div>
      </div>
    </div>
  );
}
