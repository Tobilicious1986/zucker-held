"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getBzStatus, formatDateTime } from "@/lib/utils";

interface Entry {
  id: string;
  type: string;
  timestamp: number;
  bzValue?: number;
  insulinUnits?: number;
  insulinType?: string;
  mealName?: string;
  mealKh?: number;
  activityName?: string;
  durationMin?: number;
  ketoneValue?: number;
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

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage]             = useState(0);

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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold pt-2">📊 Verlauf</h1>

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
