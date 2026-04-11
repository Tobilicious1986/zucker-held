"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/stores/ui.store";
import { getBzStatus } from "@/lib/utils";

const MEASURE_TIMES = ["Nüchtern", "Vor Essen", "Nach Essen", "Vor Schlafen", "Nacht", "Jetzt"];

export default function BzPage() {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const showToast    = useUiStore((s) => s.showToast);

  const [bzValue, setBzValue]     = useState("");
  const [note, setNote]           = useState("");
  const [measureTime, setMeasureTime] = useState("Jetzt");

  const bzNum    = parseInt(bzValue, 10);
  const bzStatus = !isNaN(bzNum) && bzNum > 0 ? getBzStatus(bzNum) : null;

  const mutation = useMutation({
    mutationFn: (data: object) => apiClient.post("/api/v1/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      showToast(`BZ ${bzNum} mg/dL gespeichert ${bzStatus?.emoji ?? ""}`, "success");
      if (bzNum > 300) {
        showToast("⚠️ Hoher BZ: Bitte in 1 Stunde Ketone messen!", "warning");
      }
      router.push("/dashboard");
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  function handleSave() {
    if (!bzStatus) return;
    mutation.mutate({
      id: crypto.randomUUID(),
      type: "BZ",
      bzValue: bzNum,
      note: note || undefined,
      bzMeasureTime: measureTime,
      timestamp: Date.now(),
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">🩸 BZ messen</h1>
      </div>

      {/* BZ-Eingabe */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-zh-muted text-sm mb-3">Blutzuckerwert (mg/dL)</p>
        <input
          type="number"
          value={bzValue}
          onChange={(e) => setBzValue(e.target.value)}
          placeholder="z.B. 120"
          min={20}
          max={600}
          className="w-full text-center text-5xl font-bold text-zh-text border-0 outline-none bg-transparent"
          autoFocus
        />
        {bzStatus && (
          <div className={`mt-3 text-lg font-semibold ${bzStatus.color}`}>
            {bzStatus.emoji} {bzStatus.label}
          </div>
        )}
        {!isNaN(bzNum) && bzNum > 300 && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
            ⚠️ <strong>Hoher Blutzucker!</strong> In einer Stunde Ketone messen.
          </div>
        )}
        {!isNaN(bzNum) && bzNum < 54 && bzNum > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            🆘 <strong>Sehr niedrig!</strong> Sofort Traubenzucker nehmen!
          </div>
        )}
      </div>

      {/* Messzeit */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-zh-muted mb-3">Messzeit</p>
        <div className="flex flex-wrap gap-2">
          {MEASURE_TIMES.map((t) => (
            <button
              key={t}
              onClick={() => setMeasureTime(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                measureTime === t
                  ? "bg-zh-green text-white"
                  : "bg-gray-100 text-zh-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Notiz */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notiz (optional)"
          className="w-full text-sm text-zh-text outline-none bg-transparent"
        />
      </div>

      {/* Speichern */}
      <button
        onClick={handleSave}
        disabled={!bzStatus || mutation.isPending}
        className="w-full bg-zh-green text-white py-4 rounded-2xl text-lg font-bold shadow-md disabled:opacity-50 active:scale-98 transition-transform"
      >
        {mutation.isPending ? "Speichern…" : "💾 Speichern"}
      </button>
    </div>
  );
}
