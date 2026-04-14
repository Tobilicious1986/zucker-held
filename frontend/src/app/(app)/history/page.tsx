"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { getBzStatus, formatDateTime } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

interface Entry {
  id: string;
  type: string;
  timestamp: number;
  bzValue?: number;
  insulinUnits?: number | string;
  insulinType?: string;
  mealName?: string;
  mealKh?: number;
  activityName?: string;
  durationMin?: number;
  ketoneValue?: number | string;
  note?: string;
}

interface PagedResult {
  content: Entry[];
  totalPages: number;
  number: number;
}

const TYPE_FILTERS = [
  { value: "",         label: "Alle"       },
  { value: "bz",      label: "🩸 BZ"      },
  { value: "insulin", label: "💉 Insulin"  },
  { value: "meal",    label: "🍽️ Mahlzeit"},
  { value: "activity",label: "🏃 Sport"   },
  { value: "ketone",  label: "🧪 Ketone"  },
];

function entryTitle(e: Entry): string {
  const t = e.type?.toUpperCase();
  if (t === "BZ")       return `🩸 ${e.bzValue} mg/dL`;
  if (t === "INSULIN")  return `💉 ${e.insulinUnits} IE ${e.insulinType ?? ""}`;
  if (t === "MEAL")     return `🍽️ ${e.mealName ?? `${e.mealKh} g KH`}`;
  if (t === "ACTIVITY") return `🏃 ${e.activityName} (${e.durationMin} min)`;
  if (t === "KETONE")   return `🧪 Ketone ${e.ketoneValue} mmol/L`;
  return e.type;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportToCsv(entries: Entry[]) {
  const header = ["Datum", "Typ", "Wert", "Details", "Notiz"];
  const rows = entries.map((entry) => {
    const type = entry.type?.toUpperCase();
    const value =
      type === "BZ" ? `${entry.bzValue ?? ""} mg/dL` :
      type === "INSULIN" ? `${entry.insulinUnits ?? ""} IE` :
      type === "MEAL" ? `${entry.mealKh ?? ""} g KH` :
      type === "ACTIVITY" ? `${entry.durationMin ?? ""} min` :
      type === "KETONE" ? `${entry.ketoneValue ?? ""} mmol/L` :
      "";

    const details =
      type === "INSULIN" ? entry.insulinType ?? "" :
      type === "MEAL" ? entry.mealName ?? "" :
      type === "ACTIVITY" ? entry.activityName ?? "" :
      "";

    return [
      formatDateTime(entry.timestamp),
      type ?? entry.type,
      value,
      details,
      entry.note ?? "",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `zucker-held-export-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage]             = useState(0);
  const showToast = useUiStore((s) => s.showToast);

  const { data, isLoading } = useQuery<PagedResult>({
    queryKey: ["entries", "paged", typeFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (typeFilter) params.set("type", typeFilter);
      return apiClient.get(`/api/v1/entries?${params.toString()}`);
    },
  });

  const entries     = data?.content ?? [];
  const totalPages  = data?.totalPages ?? 1;

  const exportQuery = useQuery<Entry[]>({
    queryKey: ["entries", "export", typeFilter],
    queryFn: () => {
      const params = new URLSearchParams({ size: "500" });
      if (typeFilter) params.set("type", typeFilter);
      return apiClient.get(`/api/v1/entries?${params.toString()}`).then((r: any) => r.content ?? r);
    },
    enabled: false,
    staleTime: 30_000,
  });

  async function handleExport() {
    const result = await exportQuery.refetch();
    const exportEntries = result.data ?? [];
    if (exportEntries.length === 0) {
      showToast("Keine Einträge zum Exportieren gefunden.", "warning");
      return;
    }
    exportToCsv(exportEntries);
    showToast("CSV Export erstellt ✅", "success");
  }

  return (
    <div className="page-shell page-stack">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="Verlauf"
          subtitle="Filterbarer Überblick über Einträge, Trends und Export für Gespräche oder eigene Auswertung."
        />
        <button
          onClick={handleExport}
          disabled={exportQuery.isFetching}
          className="secondary-button shrink-0 disabled:opacity-50"
        >
          {exportQuery.isFetching ? "Export…" : "📥 CSV Export"}
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setTypeFilter(f.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
              typeFilter === f.value
                ? "bg-zh-green text-white"
                : "bg-white text-zh-muted shadow-sm"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Eintrags-Liste */}
      {isLoading ? (
        <div className="text-center text-4xl animate-pulse pt-10">⏳</div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const bzStatus = entry.bzValue != null ? getBzStatus(entry.bzValue) : null;
            return (
              <div
                key={entry.id}
                className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${bzStatus?.color ?? "text-zh-text"}`}>
                    {entryTitle(entry)}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-zh-muted mt-0.5 truncate">{entry.note}</p>
                  )}
                </div>
                <span className="text-xs text-zh-muted ml-3 flex-shrink-0">
                  {formatDateTime(entry.timestamp)}
                </span>
              </div>
            );
          })}
          {entries.length === 0 && (
            <p className="text-center text-zh-muted py-10">Keine Einträge gefunden.</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm disabled:opacity-40 active:scale-95"
          >
            ← Zurück
          </button>
          <span className="text-sm text-zh-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm disabled:opacity-40 active:scale-95"
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}
