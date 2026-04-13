"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getBzStatus, formatTime } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

const ACTIVITIES = [
  { name: "Fußball", emoji: "⚽", intensity: "hoch", bzDrop: 45, tip: "Vor dem Training lieber noch einmal messen." },
  { name: "Schwimmen", emoji: "🏊", intensity: "mittel", bzDrop: 30, tip: "Snack und Messgerät griffbereit halten." },
  { name: "Radfahren", emoji: "🚴", intensity: "mittel", bzDrop: 25, tip: "Bei längeren Strecken regelmäßig trinken." },
  { name: "Laufen", emoji: "🏃", intensity: "hoch", bzDrop: 40, tip: "Vorher auf genug Energie achten." },
  { name: "Spazieren", emoji: "🚶", intensity: "niedrig", bzDrop: 15, tip: "Ideal für einen ruhigen Ausgleich." },
  { name: "Turnen", emoji: "🤸", intensity: "hoch", bzDrop: 35, tip: "Pausen einplanen und Werte beobachten." },
  { name: "Tanzen", emoji: "💃", intensity: "mittel", bzDrop: 20, tip: "Bei längeren Sessions zwischendurch trinken." },
  { name: "Basketball", emoji: "🏀", intensity: "hoch", bzDrop: 45, tip: "Schnelle Richtungswechsel können den BZ stärker senken." },
  { name: "Kraft", emoji: "🏋️", intensity: "mittel", bzDrop: 20, tip: "Nach dem Training auf späte Veränderungen achten." },
  { name: "Sonstiges", emoji: "🏅", intensity: "mittel", bzDrop: 20, tip: "Vorher einmal kurz auf den Wert schauen." },
];

const BZ_RECOMMENDATIONS = {
  niedrig: { min: 90, max: 220, message: "Für lockere Aktivität ist ein entspannter Startwert sinnvoll." },
  mittel: { min: 110, max: 220, message: "Vor mittlerer Belastung lieber etwas Puffer einplanen." },
  hoch: { min: 130, max: 220, message: "Bei intensiver Belastung sollte der BZ nicht zu knapp sein." },
} as const;

interface Entry {
  id: string;
  type: string;
  timestamp: number;
  bzValue?: number;
}

export default function ActivityPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const showToast   = useUiStore((s) => s.showToast);

  const [selected, setSelected]     = useState<string | null>(null);
  const [duration, setDuration]     = useState("");
  const [intensity, setIntensity]   = useState("mittel");
  const [note, setNote]             = useState("");

  const { data: bzEntries = [] } = useQuery<Entry[]>({
    queryKey: ["entries", "activity-bz"],
    queryFn: () => apiClient.get("/api/v1/entries?size=10&type=bz").then((r: any) => r.content ?? r),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (data: object) => apiClient.post("/api/v1/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      showToast(`${selected} (${duration} min) gespeichert 🏃`, "success");
      router.push("/dashboard");
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  function handleSave() {
    const dur = parseInt(duration, 10);
    if (!selected || isNaN(dur) || dur <= 0) return;
    mutation.mutate({
      id: crypto.randomUUID(),
      type: "ACTIVITY",
      activityId: selected.toLowerCase().replaceAll(" ", "-"),
      activityName: selected,
      activityEmoji: selectedActivity?.emoji,
      durationMin: dur,
      activityIntensity: intensity,
      note: note || undefined,
      timestamp: Date.now(),
    });
  }

  const selectedActivity = ACTIVITIES.find((activity) => activity.name === selected) ?? null;
  const recommendation =
    BZ_RECOMMENDATIONS[intensity as keyof typeof BZ_RECOMMENDATIONS] ?? BZ_RECOMMENDATIONS.mittel;
  const lastBz = bzEntries.find((entry) => entry.type?.toUpperCase() === "BZ") ?? null;
  const lastBzValue = lastBz?.bzValue ?? null;
  const lastBzAgeMinutes = lastBz ? Math.round((Date.now() - lastBz.timestamp) / 60_000) : null;

  const warnings: string[] = [];
  if (selectedActivity && lastBzValue == null) {
    warnings.push("Vor der Aktivität bitte einen aktuellen BZ messen.");
  }
  if (selectedActivity && lastBzValue != null && lastBzValue < recommendation.min) {
    warnings.push(`Der Wert ist für ${selectedActivity.name} eher zu niedrig. Bitte zuerst absichern.`);
  }
  if (selectedActivity && lastBzValue != null && lastBzValue > 250) {
    warnings.push("Der letzte BZ ist über 250 mg/dL. Bitte vor dem Sport prüfen und ggf. Ketone beachten.");
  }
  if (selectedActivity && lastBzAgeMinutes != null && lastBzAgeMinutes > 120) {
    warnings.push("Die letzte Messung ist älter als 2 Stunden. Bitte vor dem Start neu messen.");
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">🏃 Aktivität</h1>
      </div>

      {/* Aktivitäts-Auswahl */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-zh-muted mb-3">Was hast du gemacht?</p>
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.name}
              onClick={() => { setSelected(a.name); setIntensity(a.intensity); }}
              className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                selected === a.name
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-zh-text"
              }`}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-xs mt-1 leading-tight text-center">{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedActivity && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zh-muted">Letzter BZ vor {selectedActivity.name}</p>
              {lastBzValue != null ? (
                <div className="mt-1">
                  <p className={`text-4xl font-bold ${getBzStatus(lastBzValue).color}`}>
                    {lastBzValue} mg/dL
                  </p>
                  <p className="text-xs text-zh-muted mt-1">
                    Gemessen um {formatTime(lastBz!.timestamp)}
                    {lastBzAgeMinutes != null ? ` · vor ${lastBzAgeMinutes} Min` : ""}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-orange-600 mt-1">Noch kein aktueller Wert vorhanden.</p>
              )}
            </div>
            <button
              onClick={() => router.push("/bz")}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold"
            >
              🩸 Jetzt messen
            </button>
          </div>

          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-sm font-semibold text-blue-700">
              Empfehlung: {recommendation.min} bis {recommendation.max} mg/dL
            </p>
            <p className="text-xs text-blue-700 mt-1">{recommendation.message}</p>
            <p className="text-xs text-blue-600 mt-2">
              Typischer Abfall bei {selectedActivity.name}: ca. {selectedActivity.bzDrop} mg/dL
            </p>
            <p className="text-xs text-zh-muted mt-1">{selectedActivity.tip}</p>
          </div>

          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-700"
                >
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dauer */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <label className="text-sm font-medium text-zh-muted">Dauer (Minuten)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="z.B. 30"
          min={1}
          className="w-full mt-2 text-center text-4xl font-bold text-zh-text outline-none bg-transparent"
        />
      </div>

      {/* Intensität */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-zh-muted mb-3">Intensität</p>
        <div className="flex gap-2">
          {["niedrig", "mittel", "hoch"].map((i) => (
            <button
              key={i}
              onClick={() => setIntensity(i)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                intensity === i ? "bg-purple-500 text-white" : "bg-gray-100 text-zh-text"
              }`}
            >
              {i === "niedrig" ? "🟢 Niedrig" : i === "mittel" ? "🟡 Mittel" : "🔴 Hoch"}
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
        disabled={!selected || !duration || mutation.isPending}
        className="w-full bg-purple-500 text-white py-4 rounded-2xl text-lg font-bold shadow-md disabled:opacity-50 active:scale-98 transition-transform"
      >
        {mutation.isPending ? "Speichern…" : "💾 Speichern"}
      </button>
    </div>
  );
}
