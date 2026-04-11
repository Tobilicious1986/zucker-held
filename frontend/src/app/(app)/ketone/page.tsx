"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/stores/ui.store";

interface Settings {
  ketoneThreshold: number;
}

// BL-H08: DKA-Risikoklassifikation
function getKetoneStatus(value: number, threshold: number) {
  if (value < 0.6)         return { label: "Normal",       color: "text-green-600",  emoji: "✅", dka: false  };
  if (value < threshold)   return { label: "Leicht erhöht", color: "text-yellow-600", emoji: "⚠️", dka: false };
  if (value < 1.5)         return { label: "Erhöht",        color: "text-orange-600", emoji: "🔶", dka: true   };
  return                          { label: "Stark erhöht",  color: "text-red-600",    emoji: "🆘", dka: true   };
}

export default function KetonePage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const showToast   = useUiStore((s) => s.showToast);

  const [value, setValue] = useState("");
  const [unit, setUnit]   = useState<"mmol" | "mg">("mmol");

  const { data: settings } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/api/v1/settings"),
  });

  const threshold  = settings?.ketoneThreshold ?? 0.6;
  const valueNum   = parseFloat(value);
  // Umrechnung: 1 mmol/L = 18 mg/dL (für Anzeige)
  const valueMmol  = !isNaN(valueNum) ? (unit === "mg" ? valueNum / 18 : valueNum) : null;
  const status     = valueMmol != null ? getKetoneStatus(valueMmol, threshold) : null;

  const mutation = useMutation({
    mutationFn: (data: object) => apiClient.post("/api/v1/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      if (status?.dka) {
        showToast("🆘 Erhöhte Ketone — bitte Arzt kontaktieren!", "error");
      } else {
        showToast(`Ketone ${value} ${unit === "mmol" ? "mmol/L" : "mg/dL"} gespeichert 🧪`, "success");
      }
      router.push("/dashboard");
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  function handleSave() {
    if (valueMmol == null) return;
    mutation.mutate({
      id: crypto.randomUUID(),
      type: "KETONE",
      ketoneValue: valueMmol,
      ketoneUnit: "mmol/L",
      timestamp: Date.now(),
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">🧪 Ketone messen</h1>
      </div>

      {/* Info-Banner: Warum Ketone? */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 space-y-1">
        <p className="font-semibold">ℹ️ Wann Ketone messen?</p>
        <p>Bei BZ &gt; 300 mg/dL, wenn du dich krank fühlst, oder wenn Mama/Papa es sagen.</p>
        <p>Ketone zeigen, ob dein Körper Fett abbaut — das kann gefährlich sein.</p>
      </div>

      {/* Eingabe */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-3">
        {/* Einheit-Umschalter */}
        <div className="flex gap-2 justify-center mb-2">
          {(["mmol", "mg"] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                unit === u ? "bg-zh-green text-white" : "bg-gray-100 text-zh-text"
              }`}
            >
              {u === "mmol" ? "mmol/L" : "mg/dL"}
            </button>
          ))}
        </div>

        <p className="text-zh-muted text-sm">Ketone-Wert ({unit === "mmol" ? "mmol/L" : "mg/dL"})</p>
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={unit === "mmol" ? "z.B. 0.5" : "z.B. 9"}
          className="w-full text-center text-5xl font-bold text-zh-text border-0 outline-none bg-transparent"
          autoFocus
        />

        {status && (
          <div className={`text-lg font-semibold ${status.color}`}>
            {status.emoji} {status.label}
          </div>
        )}

        {/* BL-H08: Anzeige in beiden Einheiten */}
        {valueMmol != null && (
          <p className="text-xs text-zh-muted">
            ≈ {valueMmol.toFixed(1)} mmol/L · {(valueMmol * 18).toFixed(0)} mg/dL
          </p>
        )}
      </div>

      {/* BL-H08: DKA-Warnung wenn erhöht */}
      {status?.dka && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 space-y-2">
          <p className="font-bold text-red-700 text-lg">🆘 Erhöhte Ketone!</p>
          <p className="text-red-700 text-sm font-semibold">Bitte sofort:</p>
          <ol className="text-red-700 text-sm space-y-1 list-decimal list-inside">
            <li>📞 Mama oder Papa anrufen</li>
            <li>💧 Viel Wasser oder zuckerfreie Getränke trinken</li>
            <li>🏥 Ggf. Arzt oder Klinik kontaktieren (Schwellwert: {threshold} mmol/L)</li>
            <li>💉 Korrektur-Insulin wie vom Arzt besprochen</li>
          </ol>
          {valueMmol != null && valueMmol >= 3.0 && (
            <div className="bg-red-100 rounded-xl p-3 mt-2">
              <p className="text-red-800 font-bold text-sm">⚠️ Wert ≥ 3.0 mmol/L — sofort zum Arzt!</p>
            </div>
          )}
        </div>
      )}

      {/* Normal-Bestätigung */}
      {status && !status.dka && valueMmol != null && valueMmol >= 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-700">
          <p className="font-semibold">✅ Alles gut!</p>
          <p>Deine Ketone sind im normalen Bereich. Weiter so!</p>
        </div>
      )}

      {/* Schwellwert-Info */}
      <p className="text-center text-xs text-zh-muted">
        Alarm-Schwellwert: {threshold} mmol/L (in Einstellungen änderbar)
      </p>

      {/* Speichern */}
      <button
        onClick={handleSave}
        disabled={valueMmol == null || mutation.isPending}
        className={`w-full py-4 rounded-2xl text-lg font-bold shadow-md disabled:opacity-50 transition-transform active:scale-98 text-white ${
          status?.dka ? "bg-red-500" : "bg-zh-green"
        }`}
      >
        {mutation.isPending ? "Speichern…" : "💾 Speichern"}
      </button>
    </div>
  );
}
