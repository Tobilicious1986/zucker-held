"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

interface ClinicalEntry {
  timestamp: number;
  type: string;
  label: string;
  bzValue: number | null;
}

interface ClinicalSettingsView {
  bzMin: number;
  bzMax: number;
  targetBz: number;
  insulinRatio: number;
  correctionFactor: number;
}

interface ClinicalViewResponse {
  ownerName: string;
  generatedAt: string;
  tirPercent: number;
  gmi: number;
  cvPercent: number;
  lastBz: number | null;
  lastBzAt: number | null;
  entries14d: ClinicalEntry[];
  therapyPlan: ClinicalSettingsView | null;
  tokenExpiresAt: string;
}

const SERVER_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.BACKEND_URL ??
  "http://localhost:8080";

function getApiBase() {
  return typeof window === "undefined" ? SERVER_API_BASE : "";
}

/**
 * Sprint 15 — CLN-02: Strukturierter Fachpersonen-View.
 * Druckbares klinisches Layout für DOCTOR-Mode Share-Links.
 * Kein Navigationsmenü, kein Login-Prompt.
 */
export default function ClinicalViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError, error } = useQuery<ClinicalViewResponse>({
    queryKey: ["clinical-view", token],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/v1/share/${token}/clinical-view`);
      if (res.status === 410) throw new Error("GONE");
      if (!res.ok) throw new Error("NOT_FOUND");
      return res.json();
    },
    enabled: Boolean(token),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center text-4xl animate-pulse">⏳</div>
    );
  }

  if (isError) {
    const isGone = (error as Error)?.message === "GONE";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-5xl">{isGone ? "⏰" : "🔒"}</div>
        <p className="text-xl font-semibold text-center">
          {isGone ? "Dieser Link ist abgelaufen" : "Link nicht gefunden"}
        </p>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          {isGone
            ? "Bitte fordern Sie beim Patienten einen neuen Arztlink an."
            : "Der Link ist ungültig oder wurde widerrufen."}
        </p>
      </div>
    );
  }

  const tir = Number(data?.tirPercent ?? 0);
  const tirColor = tir >= 70 ? "#16a34a" : tir >= 50 ? "#ca8a04" : "#dc2626";

  return (
    <div className="min-h-screen bg-white">
      {/* Print: keine Buttons und Navigation */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 print:py-4 print:space-y-4">

        {/* Kopfzeile */}
        <header className="border-b border-gray-200 pb-4 print:pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Zucker-Held · Klinische Ansicht</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">{data?.ownerName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Erstellt: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString("de-DE") : "—"}
              </p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Gültig bis</p>
              <p className="font-medium text-gray-600">
                {data?.tokenExpiresAt ? new Date(data.tokenExpiresAt).toLocaleString("de-DE") : "—"}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 italic">
            Diese Ansicht ersetzt keine ärztliche Beurteilung. Daten werden mit Einwilligung des Patienten freigegeben.
          </p>
        </header>

        {/* Überblick */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Überblick · 14 Tage
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">TIR (70–180)</p>
              <p className="text-2xl font-bold mt-1" style={{ color: tirColor }}>
                {tir.toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">GMI</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {Number(data?.gmi ?? 0).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">CV</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {Number(data?.cvPercent ?? 0).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Letzter BZ</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {data?.lastBz != null ? `${data.lastBz} mg/dL` : "—"}
              </p>
              {data?.lastBzAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateTime(data.lastBzAt)}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Therapieplan */}
        {data?.therapyPlan && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Therapieplan
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {[
                { label: "BZ Min", value: `${data.therapyPlan.bzMin} mg/dL` },
                { label: "BZ Max", value: `${data.therapyPlan.bzMax} mg/dL` },
                { label: "Zielwert", value: `${data.therapyPlan.targetBz} mg/dL` },
                { label: "Insulin-Faktor", value: `${data.therapyPlan.insulinRatio} g/IE` },
                { label: "Korrekturfaktor", value: `${data.therapyPlan.correctionFactor} mg/dL/IE` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Eintrags-Timeline */}
        {(data?.entries14d?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Einträge · 14 Tage ({data!.entries14d.length})
            </h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 text-xs text-gray-500 font-medium">Zeitpunkt</th>
                    <th className="text-left p-2 text-xs text-gray-500 font-medium">Typ</th>
                    <th className="text-left p-2 text-xs text-gray-500 font-medium">Wert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data!.entries14d.map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-500 text-xs">{formatDateTime(entry.timestamp)}</td>
                      <td className="p-2 text-gray-700 capitalize">{entry.type}</td>
                      <td className="p-2 text-gray-800 font-medium">
                        {entry.bzValue != null ? (
                          <span className={
                            entry.bzValue < 70  ? "text-red-600" :
                            entry.bzValue > 180 ? "text-orange-600" : "text-green-700"
                          }>
                            {entry.label}
                          </span>
                        ) : entry.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Print-Button (nicht druckbar) */}
        <div className="print:hidden flex justify-end pt-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            🖨️ Drucken / Als PDF speichern
          </button>
        </div>
      </div>
    </div>
  );
}
