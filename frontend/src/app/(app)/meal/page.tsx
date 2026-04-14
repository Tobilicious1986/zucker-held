"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUiStore } from "@/stores/ui.store";

const MEAL_TIMES = ["Frühstück", "Mittagessen", "Abendessen", "Snack"];
const FAVORITES_KEY = "zh-meal-favorites";
const FAVORITE_EMOJIS = ["🍞", "🥣", "🍝", "🍕", "🍎", "🍪", "🥪", "🍌"];

interface Favorite {
  name: string;
  kh: number;
  emoji: string;
}

const BUILTIN_FAVORITES: Favorite[] = [
  { name: "Schulbrot", kh: 30, emoji: "🥪" },
  { name: "Müsli", kh: 45, emoji: "🥣" },
  { name: "Spaghetti", kh: 60, emoji: "🍝" },
  { name: "Pizza", kh: 30, emoji: "🍕" },
  { name: "Apfel", kh: 15, emoji: "🍎" },
  { name: "Traubenzucker", kh: 4, emoji: "🍬" },
  { name: "Schulkantine", kh: 50, emoji: "🏫" },
  { name: "Abendessen", kh: 45, emoji: "🍽️" },
];

function loadFavorites(): Favorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: Favorite[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export default function MealPage() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const showToast   = useUiStore((s) => s.showToast);
  const prefillAppliedRef = useRef(false);

  const [name, setName]         = useState("");
  const [kh, setKh]             = useState("");
  const [mealTime, setMealTime] = useState("Mittagessen");
  const [note, setNote]         = useState("");
  const [favoriteEmoji, setFavoriteEmoji] = useState("🍞");
  const [showFavoriteEditor, setShowFavoriteEditor] = useState(false);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

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

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    if (prefillAppliedRef.current) return;

    const prefillName = searchParams.get("prefillName");
    const prefillKh = searchParams.get("prefillKh");
    const prefillNote = searchParams.get("prefillNote");

    if (!prefillName && !prefillKh && !prefillNote) {
      prefillAppliedRef.current = true;
      return;
    }

    if (prefillName) setName(prefillName);
    if (prefillKh) setKh(prefillKh);
    if (prefillNote) setNote(prefillNote);
    prefillAppliedRef.current = true;
    showToast("KH-Rechner in die Mahlzeit übernommen ✅", "success");
  }, [searchParams, showToast]);

  function applyFavorite(favorite: Favorite) {
    setName(favorite.name);
    setKh(String(favorite.kh));
  }

  function handleSaveFavorite() {
    const khNum = parseInt(kh, 10);
    if (!name.trim() || isNaN(khNum) || khNum < 0) {
      showToast("Bitte Name und KH für den Favoriten ausfüllen.", "warning");
      return;
    }

    const nextFavorites = [
      ...favorites,
      { name: name.trim(), kh: khNum, emoji: favoriteEmoji },
    ];
    setFavorites(nextFavorites);
    saveFavorites(nextFavorites);
    setShowFavoriteEditor(false);
    showToast("Favorit gespeichert ⭐", "success");
  }

  function handleRemoveFavorite(favorite: Favorite) {
    const nextFavorites = favorites.filter(
      (entry) => !(entry.name === favorite.name && entry.kh === favorite.kh && entry.emoji === favorite.emoji)
    );
    setFavorites(nextFavorites);
    saveFavorites(nextFavorites);
  }

  return (
    <div className="page-shell page-stack">
      <PageHeader
        title="Mahlzeit"
        subtitle="Schneller mit Favoriten, klarer KH-Eingabe und einfacher Tagesstruktur."
        showBack
      />

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

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zh-muted">Favoriten</p>
          <button
            onClick={() => setShowFavoriteEditor((current) => !current)}
            className="text-sm font-semibold text-zh-green"
          >
            + Eigenen
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {BUILTIN_FAVORITES.map((favorite) => (
            <button
              key={favorite.name}
              onClick={() => applyFavorite(favorite)}
              className="rounded-2xl bg-green-50 border border-green-100 px-2 py-3 text-center"
            >
              <div className="text-2xl">{favorite.emoji}</div>
              <div className="text-xs font-semibold text-zh-text mt-1">{favorite.name}</div>
              <div className="text-[11px] text-zh-muted">{favorite.kh} g KH</div>
            </button>
          ))}
        </div>

        {showFavoriteEditor && (
          <div className="rounded-2xl bg-yellow-50 border border-yellow-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-zh-text">Eigenen Favoriten speichern</p>
            <div className="flex flex-wrap gap-2">
              {FAVORITE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setFavoriteEmoji(emoji)}
                  className={`rounded-xl px-3 py-2 text-xl ${
                    favoriteEmoji === emoji ? "bg-green-500 text-white" : "bg-white"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 text-sm text-zh-muted">
              Vorschau: {favoriteEmoji} {name || "Neuer Favorit"} · {kh || "0"} g KH
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFavoriteEditor(false)}
                className="flex-1 py-2 rounded-xl bg-white text-zh-muted"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveFavorite}
                className="flex-1 py-2 rounded-xl bg-green-500 text-white font-semibold"
              >
                Favorit speichern
              </button>
            </div>
          </div>
        )}

        {favorites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-zh-muted">Meine Favoriten</p>
            {favorites.map((favorite) => (
              <div
                key={`${favorite.name}-${favorite.kh}-${favorite.emoji}`}
                className="flex items-center justify-between bg-gray-50 rounded-2xl px-3 py-2"
              >
                <button
                  onClick={() => applyFavorite(favorite)}
                  className="text-left flex items-center gap-3"
                >
                  <span className="text-xl">{favorite.emoji}</span>
                  <span className="text-sm font-medium text-zh-text">
                    {favorite.name} · {favorite.kh} g KH
                  </span>
                </button>
                <button
                  onClick={() => handleRemoveFavorite(favorite)}
                  className="text-xs text-red-500"
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
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
          🧮 Lebensmittel suchen, Barcode prüfen und Portionen rechnen →
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
