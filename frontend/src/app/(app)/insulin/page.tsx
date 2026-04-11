"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/stores/ui.store";
import { calcInsulinDose } from "@/lib/utils";

interface Settings {
  bzMin: number;
  bzMax: number;
  insulinRatio: number;
  correctionFactor: number;
  targetBz: number;
}

const INSULIN_TYPES = ["Rapid", "Basal", "Mischung", "Korrektur"];

export default function InsulinPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const showToast   = useUiStore((s) => s.showToast);

  const [units, setUnits]           = useState("");
  const [insulinType, setInsulinType] = useState("Rapid");
  const [note, setNote]             = useState("");
  const [showCalc, setShowCalc]     = useState(false);
  const [calcBz, setCalcBz]         = useState("");
  const [calcKh, setCalcKh]         = useState("");

  const { data: settings } = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/api/v1/settings"),
  });

  const bz = parseInt(calcBz, 10);
  const kh = parseInt(calcKh, 10);
  const calculatedDose =
    showCalc && settings && !isNaN(bz) && !isNaN(kh)
      ? calcInsulinDose(bz, settings.targetBz, kh, settings.insulinRatio, settings.correctionFactor)
      : null;

  const mutation = useMutation({
    mutationFn: (data: object) => apiClient.post("/api/v1/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      showToast(`${units} IE ${insulinType} gespeichert 💉`, "success");
      router.push("/dashboard");
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  function handleSave() {
    const u = parseFloat(units);
    if (isNaN(u) || u <= 0) return;
    mutation.mutate({
      id: crypto.randomUUID(),
      type: "INSULIN",
      insulinUnits: u,
      insulinType,
      note: note || undefined,
      timestamp: Date.now(),
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">💉 Insulin</h1>
      </div>

      {/* Einheiten-Eingabe */}
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <p className="text-zh-muted text-sm mb-3">Insulineinheiten (IE)</p>
        <input
          type="number"
          step="0.5"
          min="0"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          placeholder="0.0"
          className="w-full text-center text-5xl font-bold text-zh-text border-0 outline-none bg-transparent"
          autoFocus
        />
      </div>

      {/* Insulintyp */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-zh-muted mb-3">Insulintyp</p>
        <div className="flex flex-wrap gap-2">
          {INSULIN_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setInsulinType(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                insulinType === t ? "bg-blue-500 text-white" : "bg-gray-100 text-zh-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Dosierungs-Rechner */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <button
          onClick={() => setShowCalc(!showCalc)}
          className="flex items-center justify-between w-full"
        >
          <span className="font-semibold text-zh-text">🧮 Dosierungs-Rechner</span>
          <span className="text-zh-muted text-sm">{showCalc ? "▲" : "▼"}</span>
        </button>

        {showCalc && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-zh-muted">Aktueller BZ (mg/dL)</label>
              <input
                type="number"
                value={calcBz}
                onChange={(e) => setCalcBz(e.target.value)}
                placeholder={`Ziel: ${settings?.targetBz ?? 120}`}
                className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 text-zh-text outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zh-muted">Kohlenhydrate (g)</label>
              <input
                type="number"
                value={calcKh}
                onChange={(e) => setCalcKh(e.target.value)}
                placeholder="0"
                className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 text-zh-text outline-none"
              />
            </div>
            {settings && (
              <p className="text-xs text-zh-muted">
                Faktor: {settings.insulinRatio} g/IE · Korrektur: {settings.correctionFactor} mg/dL/IE
              </p>
            )}
            {calculatedDose !== null && (
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-600 mb-1">Empfohlene Dosis</p>
                <p className="text-3xl font-bold text-blue-700">{calculatedDose} IE</p>
                <button
                  onClick={() => setUnits(calculatedDose.toString())}
                  className="mt-2 text-xs text-blue-600 underline"
                >
                  Übernehmen
                </button>
              </div>
            )}
          </div>
        )}
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
        disabled={!units || parseFloat(units) <= 0 || mutation.isPending}
        className="w-full bg-blue-500 text-white py-4 rounded-2xl text-lg font-bold shadow-md disabled:opacity-50 active:scale-98 transition-transform"
      >
        {mutation.isPending ? "Speichern…" : "💾 Speichern"}
      </button>
    </div>
  );
}
