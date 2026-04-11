"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/stores/ui.store";

const ACTIVITIES = [
  { name: "Fußball",    emoji: "⚽", intensity: "hoch"    },
  { name: "Schwimmen",  emoji: "🏊", intensity: "mittel"  },
  { name: "Radfahren",  emoji: "🚴", intensity: "mittel"  },
  { name: "Laufen",     emoji: "🏃", intensity: "hoch"    },
  { name: "Spazieren",  emoji: "🚶", intensity: "niedrig" },
  { name: "Turnen",     emoji: "🤸", intensity: "hoch"    },
  { name: "Tanzen",     emoji: "💃", intensity: "mittel"  },
  { name: "Sonstiges",  emoji: "🏅", intensity: "mittel"  },
];

export default function ActivityPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const showToast   = useUiStore((s) => s.showToast);

  const [selected, setSelected]     = useState<string | null>(null);
  const [duration, setDuration]     = useState("");
  const [intensity, setIntensity]   = useState("mittel");
  const [note, setNote]             = useState("");

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
      activityName: selected,
      durationMin: dur,
      activityIntensity: intensity,
      note: note || undefined,
      timestamp: Date.now(),
    });
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
