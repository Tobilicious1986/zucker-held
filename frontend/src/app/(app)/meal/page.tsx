"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/stores/ui.store";

const MEAL_TIMES = ["Frühstück", "Mittagessen", "Abendessen", "Snack"];

export default function MealPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const showToast   = useUiStore((s) => s.showToast);

  const [name, setName]         = useState("");
  const [kh, setKh]             = useState("");
  const [mealTime, setMealTime] = useState("Mittagessen");
  const [note, setNote]         = useState("");

  const mutation = useMutation({
    mutationFn: (data: object) => apiClient.post("/api/v1/entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      showToast(`${name || "Mahlzeit"} mit ${kh} g KH gespeichert 🍽️`, "success");
      router.push("/dashboard");
    },
    onError: () => showToast("Fehler beim Speichern", "error"),
  });

  function handleSave() {
    const khNum = parseInt(kh, 10);
    if (isNaN(khNum) || khNum < 0) return;
    mutation.mutate({
      id: crypto.randomUUID(),
      type: "MEAL",
      mealName: name || "Mahlzeit",
      mealKh: khNum,
      mealTime,
      note: note || undefined,
      timestamp: Date.now(),
    });
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => router.back()} className="text-2xl text-zh-muted">←</button>
        <h1 className="text-2xl font-bold">🍽️ Mahlzeit</h1>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div>
          <label className="text-xs text-zh-muted">Mahlzeit-Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Spaghetti Bolognese"
            className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 outline-none text-zh-text"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-zh-muted">Kohlenhydrate (g)</label>
          <input
            type="number"
            value={kh}
            onChange={(e) => setKh(e.target.value)}
            placeholder="0"
            className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2 outline-none text-2xl font-bold text-zh-text"
          />
        </div>
      </div>

      {/* Mahlzeit-Zeit */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-medium text-zh-muted mb-3">Mahlzeit</p>
        <div className="grid grid-cols-2 gap-2">
          {MEAL_TIMES.map((t) => (
            <button
              key={t}
              onClick={() => setMealTime(t)}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                mealTime === t ? "bg-green-500 text-white" : "bg-gray-100 text-zh-text"
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

      {/* KH-Rechner Link */}
      <Link
        href="/calc"
        className="block bg-yellow-50 rounded-2xl p-4 text-center border border-yellow-100"
      >
        <span className="text-sm font-medium text-yellow-700">
          🧮 Genaue KH-Berechnung mit Lebensmittel-DB →
        </span>
      </Link>

      {/* Speichern */}
      <button
        onClick={handleSave}
        disabled={!kh || mutation.isPending}
        className="w-full bg-green-500 text-white py-4 rounded-2xl text-lg font-bold shadow-md disabled:opacity-50 active:scale-98 transition-transform"
      >
        {mutation.isPending ? "Speichern…" : "💾 Speichern"}
      </button>
    </div>
  );
}
