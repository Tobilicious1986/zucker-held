"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUiStore } from "@/stores/ui.store";
import {
  buildMealPrefill,
  calculateKhForPortion,
  type FoodApiItem,
  getFoodSourceLabel,
  getPortionPresets,
  normalizeBarcodeInput,
  sumSelectedKh,
  type SelectedFoodItem,
} from "@/lib/food-utils";

const SEARCH_MODES = [
  { id: "local", label: "Lokal", note: "DACH-Katalog + eigene Foods" },
  { id: "online", label: "Online", note: "Explizite Open-Food-Facts-Suche" },
  { id: "barcode", label: "Barcode", note: "EAN eingeben oder Kamera nutzen" },
] as const;

type SearchMode = (typeof SEARCH_MODES)[number]["id"];

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
}

interface BarcodeDetectorConstructorLike {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

function categoryLabel(category?: string | null): string {
  switch (category) {
    case "brot_getreide":
      return "Brot & Getreide";
    case "fruehstueck_muesli":
      return "Frühstück";
    case "nudeln_reis_getreide":
      return "Reis & Nudeln";
    case "kartoffeln_beilagen":
      return "Kartoffeln";
    case "milchprodukte":
      return "Milch";
    case "obst":
      return "Obst";
    case "gemuese":
      return "Gemüse";
    case "getraenke":
      return "Getränke";
    case "hauptgerichte_fastfood":
      return "Hauptgericht";
    case "schule_snacks_alltag":
      return "Alltag & Schule";
    case "suesses_snacks":
      return "Süßes";
    default:
      return "Lebensmittel";
  }
}

function sourcePillClass(food: FoodApiItem): string {
  if (food.source === "custom") return "bg-blue-50 text-blue-700";
  if (food.source === "online") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

export default function CalcPage() {
  const router = useRouter();
  const showToast = useUiStore((state) => state.showToast);

  const [mode, setMode] = useState<SearchMode>("local");
  const [localQuery, setLocalQuery] = useState("");
  const [onlineQuery, setOnlineQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedFoodItem[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState("Halte den Barcode ruhig ins Bild.");
  const [barcodeResult, setBarcodeResult] = useState<FoodApiItem | null>(null);

  const deferredLocalQuery = useDeferredValue(localQuery.trim());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);

  const localQueryString = deferredLocalQuery
    ? `/api/v1/foods?q=${encodeURIComponent(deferredLocalQuery)}`
    : "/api/v1/foods";

  const { data: localResults = [], isLoading: localLoading } = useQuery<FoodApiItem[]>({
    queryKey: ["foods", "local", deferredLocalQuery],
    queryFn: () => apiClient.get(localQueryString),
    staleTime: 5 * 60_000,
  });

  const onlineSearchMutation = useMutation({
    mutationFn: (query: string) =>
      apiClient.get<FoodApiItem[]>(`/api/v1/foods/search-online?q=${encodeURIComponent(query)}`),
    onError: () => showToast("Online-Suche ist gerade nicht erreichbar.", "warning"),
  });

  const barcodeSearchMutation = useMutation({
    mutationFn: (code: string) =>
      apiClient.get<FoodApiItem>(`/api/v1/foods/barcode/${encodeURIComponent(code)}`),
    onSuccess: (food) => {
      setBarcodeResult(food);
      showToast(`${food.name} gefunden ✅`, "success");
    },
    onError: (error) => {
      setBarcodeResult(null);
      if (error instanceof ApiError && error.status === 404) {
        showToast("Kein passendes Produkt zu diesem Barcode gefunden.", "warning");
        return;
      }
      showToast("Barcode-Suche konnte nicht abgeschlossen werden.", "error");
    },
  });

  const visibleLocalResults = useMemo(
    () => localResults.slice(0, deferredLocalQuery ? 24 : 16),
    [localResults, deferredLocalQuery]
  );
  const totalKh = useMemo(() => sumSelectedKh(selectedItems), [selectedItems]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  function addFood(food: FoodApiItem, grams?: number) {
    const defaultGrams = grams ?? getPortionPresets(food)[0] ?? 100;
    setSelectedItems((current) => {
      const existing = current.find((item) => item.food.id === food.id);
      if (existing) {
        return current.map((item) =>
          item.food.id === food.id
            ? { ...item, grams: Math.max(1, item.grams + defaultGrams) }
            : item
        );
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          food,
          grams: defaultGrams,
        },
      ];
    });
    showToast(`${food.name} hinzugefügt`, "success");
  }

  function updateSelectedGrams(itemId: string, grams: number) {
    setSelectedItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, grams: Number.isFinite(grams) ? Math.max(1, grams) : item.grams }
          : item
      )
    );
  }

  function removeSelectedItem(itemId: string) {
    setSelectedItems((current) => current.filter((item) => item.id !== itemId));
  }

  function applyPreset(itemId: string, grams: number) {
    updateSelectedGrams(itemId, grams);
  }

  function transferToMeal() {
    const prefill = buildMealPrefill(selectedItems);
    const params = new URLSearchParams({
      prefillName: prefill.name,
      prefillKh: String(prefill.kh),
      prefillNote: prefill.note,
    });
    router.push(`/meal?${params.toString()}`);
  }

  function runOnlineSearch() {
    const query = onlineQuery.trim();
    if (query.length < 2) {
      showToast("Bitte mindestens 2 Zeichen für die Online-Suche eingeben.", "warning");
      return;
    }
    onlineSearchMutation.mutate(query);
  }

  function runBarcodeSearch(codeOverride?: string) {
    const normalizedCode = normalizeBarcodeInput(codeOverride ?? barcodeInput);
    if (normalizedCode.length < 8) {
      showToast("Bitte einen gültigen EAN-/Barcode eingeben.", "warning");
      return;
    }
    setBarcodeInput(normalizedCode);
    barcodeSearchMutation.mutate(normalizedCode);
  }

  function stopScanner() {
    if (scanFrameRef.current != null) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScannerOpen(false);
  }

  async function startScanner() {
    const BarcodeDetectorApi = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructorLike }).BarcodeDetector;
    if (!BarcodeDetectorApi || !navigator.mediaDevices?.getUserMedia) {
      showToast("Kamera-Scan wird hier nicht unterstützt. Bitte EAN manuell eingeben.", "info");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setScannerOpen(true);
      setScannerStatus("Kamera läuft. Halte den Barcode ruhig ins Bild.");

      requestAnimationFrame(async () => {
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        const detector = new BarcodeDetectorApi({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
        });

        const tick = async () => {
          if (!videoRef.current) return;
          try {
            const detected = await detector.detect(videoRef.current);
            const code = detected.find((entry) => entry.rawValue)?.rawValue;
            if (code) {
              const normalized = normalizeBarcodeInput(code);
              stopScanner();
              runBarcodeSearch(normalized);
              return;
            }
          } catch {
            // Fallback bleibt die manuelle Eingabe; der Scan soll die Seite nicht crashen.
          }

          scanFrameRef.current = requestAnimationFrame(() => {
            void tick();
          });
        };

        void tick();
      });
    } catch {
      stopScanner();
      showToast("Die Kamera konnte nicht geöffnet werden.", "warning");
    }
  }

  return (
    <div className="page-shell">
      <div className="page-stack">
        <PageHeader
          title="KH-Rechner"
          subtitle="Suche lokal im DACH-Katalog, nutze Open Food Facts bewusst nur bei Bedarf und rechne Portionen direkt in die Mahlzeit über."
          showBack
          trailing={
            <div className="rounded-full bg-white/75 px-3 py-2 text-xs font-bold text-zh-text shadow-sm">
              {selectedItems.length} Positionen
            </div>
          }
        />

        <section className="surface-card p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-eyebrow">Food-Flow</p>
              <h2 className="section-title text-xl mt-2">Suche, Barcode und Portionen</h2>
            </div>
            <div className="status-pill status-pill--good">KH-first</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SEARCH_MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                className={`rounded-2xl px-3 py-3 text-left transition ${
                  mode === option.id
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-[var(--zh-surface-muted)] text-[var(--zh-text)]"
                }`}
              >
                <div className="text-sm font-bold">{option.label}</div>
                <div className={`mt-1 text-[11px] ${mode === option.id ? "text-white/80" : "text-[var(--zh-muted)]"}`}>
                  {option.note}
                </div>
              </button>
            ))}
          </div>
        </section>

        {mode === "local" && (
          <section className="surface-card p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--zh-muted)]">
                Lokale Suche
              </label>
              <input
                value={localQuery}
                onChange={(event) => setLocalQuery(event.target.value)}
                placeholder="z. B. Schulbrot, Semmel, Apfelsaft"
                className="w-full rounded-2xl border border-[var(--zh-border)] bg-white/80 px-4 py-3 text-base outline-none"
              />
              <p className="text-sm text-[var(--zh-muted)]">
                Lokal wird direkt im kuratierten DACH-Katalog plus deinen eigenen Lebensmitteln gesucht.
              </p>
            </div>

            {localLoading ? (
              <div className="rounded-2xl bg-[var(--zh-surface-muted)] px-4 py-6 text-sm text-[var(--zh-muted)]">
                Lokale Lebensmittel werden geladen…
              </div>
            ) : (
              <div className="space-y-3">
                {visibleLocalResults.map((food) => {
                  const presets = getPortionPresets(food);
                  return (
                    <article
                      key={food.id}
                      className="rounded-[22px] border border-[var(--zh-border)] bg-white/85 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{food.emoji ?? "🍽️"}</span>
                            <div>
                              <h3 className="font-bold text-[var(--zh-text)]">{food.name}</h3>
                              <p className="text-xs text-[var(--zh-muted)]">{categoryLabel(food.category)}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourcePillClass(food)}`}>
                              {getFoodSourceLabel(food)}
                            </span>
                            <span className="rounded-full bg-[var(--zh-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--zh-text)]">
                              {food.khPer100g} g KH / 100 g
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => addFood(food)}
                          className="rounded-full bg-[var(--zh-green)] px-4 py-2 text-sm font-bold text-white"
                        >
                          + {presets[0]} g
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {presets.map((preset) => (
                          <button
                            key={`${food.id}-${preset}`}
                            type="button"
                            onClick={() => addFood(food, preset)}
                            className="rounded-full border border-[var(--zh-border)] px-3 py-1.5 text-sm text-[var(--zh-text)]"
                          >
                            {preset} g
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}

                {visibleLocalResults.length === 0 && (
                  <div className="rounded-2xl bg-[var(--zh-surface-muted)] px-4 py-6 text-sm text-[var(--zh-muted)]">
                    Im lokalen Katalog wurde nichts Passendes gefunden.
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {mode === "online" && (
          <section className="surface-card p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--zh-muted)]">
                Open Food Facts
              </label>
              <div className="flex gap-2">
                <input
                  value={onlineQuery}
                  onChange={(event) => setOnlineQuery(event.target.value)}
                  placeholder="Produktname oder Marke"
                  className="flex-1 rounded-2xl border border-[var(--zh-border)] bg-white/80 px-4 py-3 text-base outline-none"
                />
                <button
                  type="button"
                  onClick={runOnlineSearch}
                  disabled={onlineSearchMutation.isPending}
                  className="rounded-2xl bg-[var(--zh-blue)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {onlineSearchMutation.isPending ? "Suche…" : "Online suchen"}
                </button>
              </div>
              <p className="text-sm text-[var(--zh-muted)]">
                Die Online-Suche wird bewusst nur auf Klick ausgelöst, damit sie sparsam und stabil bleibt.
              </p>
            </div>

            <div className="space-y-3">
              {(onlineSearchMutation.data ?? []).map((food) => {
                const presets = getPortionPresets(food);
                return (
                  <article
                    key={food.id}
                    className="rounded-[22px] border border-[var(--zh-border)] bg-white/85 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{food.emoji ?? "📦"}</span>
                          <div>
                            <h3 className="font-bold text-[var(--zh-text)]">{food.name}</h3>
                            <p className="text-xs text-[var(--zh-muted)]">{food.barcode ?? "ohne Barcode"}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourcePillClass(food)}`}>
                            {getFoodSourceLabel(food)}
                          </span>
                          <span className="rounded-full bg-[var(--zh-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--zh-text)]">
                            {food.khPer100g} g KH / 100 g
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addFood(food)}
                        className="rounded-full bg-[var(--zh-green)] px-4 py-2 text-sm font-bold text-white"
                      >
                        + {presets[0]} g
                      </button>
                    </div>
                  </article>
                );
              })}

              {onlineSearchMutation.isSuccess && (onlineSearchMutation.data?.length ?? 0) === 0 && (
                <div className="rounded-2xl bg-[var(--zh-surface-muted)] px-4 py-6 text-sm text-[var(--zh-muted)]">
                  Keine Online-Treffer gefunden oder gerade keine Verbindung verfügbar.
                </div>
              )}
            </div>
          </section>
        )}

        {mode === "barcode" && (
          <section className="surface-card p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--zh-muted)]">
                Barcode / EAN
              </label>
              <div className="flex gap-2">
                <input
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(normalizeBarcodeInput(event.target.value))}
                  placeholder="z. B. 40111490"
                  inputMode="numeric"
                  className="flex-1 rounded-2xl border border-[var(--zh-border)] bg-white/80 px-4 py-3 text-base outline-none"
                />
                <button
                  type="button"
                  onClick={() => runBarcodeSearch()}
                  disabled={barcodeSearchMutation.isPending}
                  className="rounded-2xl bg-[var(--zh-blue)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {barcodeSearchMutation.isPending ? "Suche…" : "Barcode prüfen"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startScanner}
                  className="rounded-full border border-[var(--zh-border)] px-3 py-2 text-sm font-semibold text-[var(--zh-text)]"
                >
                  📷 Kamera-Scan starten
                </button>
                <p className="text-sm text-[var(--zh-muted)]">
                  Der Kamera-Scan nutzt `BarcodeDetector`, wenn dein Browser das unterstützt.
                </p>
              </div>
            </div>

            {barcodeResult ? (
              <article className="rounded-[22px] border border-[var(--zh-border)] bg-white/85 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{barcodeResult.emoji ?? "📦"}</span>
                      <div>
                        <h3 className="font-bold text-[var(--zh-text)]">{barcodeResult.name}</h3>
                        <p className="text-xs text-[var(--zh-muted)]">{barcodeResult.barcode}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourcePillClass(barcodeResult)}`}>
                        {getFoodSourceLabel(barcodeResult)}
                      </span>
                      <span className="rounded-full bg-[var(--zh-surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--zh-text)]">
                        {barcodeResult.khPer100g} g KH / 100 g
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addFood(barcodeResult)}
                    className="rounded-full bg-[var(--zh-green)] px-4 py-2 text-sm font-bold text-white"
                  >
                    + {getPortionPresets(barcodeResult)[0]} g
                  </button>
                </div>
              </article>
            ) : (
              <div className="rounded-2xl bg-[var(--zh-surface-muted)] px-4 py-6 text-sm text-[var(--zh-muted)]">
                Noch kein Barcode-Ergebnis ausgewählt.
              </div>
            )}
          </section>
        )}

        <section className="surface-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-eyebrow">Portionen</p>
              <h2 className="section-title text-xl mt-2">Deine KH-Summe</h2>
            </div>
            <div className="rounded-2xl bg-[var(--zh-green-soft)] px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--zh-green-strong)]">
                Gesamt
              </div>
              <div className="text-3xl font-black tracking-[-0.05em] text-[var(--zh-green-strong)]">
                {totalKh}
              </div>
              <div className="text-xs text-[var(--zh-green-strong)]">g KH</div>
            </div>
          </div>

          {selectedItems.length === 0 ? (
            <div className="rounded-2xl bg-[var(--zh-surface-muted)] px-4 py-6 text-sm text-[var(--zh-muted)]">
              Wähle zuerst Lebensmittel aus. Danach kannst du jede Portion fein anpassen.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item) => {
                const presets = getPortionPresets(item.food);
                const portionKh = calculateKhForPortion(item.food.khPer100g, item.grams);

                return (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-[var(--zh-border)] bg-white/85 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.food.emoji ?? "🍽️"}</span>
                          <div>
                            <h3 className="font-bold text-[var(--zh-text)]">{item.food.name}</h3>
                            <p className="text-xs text-[var(--zh-muted)]">
                              {item.food.khPer100g} g KH / 100 g · {getFoodSourceLabel(item.food)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedItem(item.id)}
                        className="rounded-full border border-[var(--zh-border)] px-3 py-2 text-xs font-bold text-[var(--zh-red)]"
                      >
                        Entfernen
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 items-end">
                      <label className="space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--zh-muted)]">
                          Gramm
                        </span>
                        <input
                          type="number"
                          min={1}
                          value={item.grams}
                          onChange={(event) => updateSelectedGrams(item.id, parseInt(event.target.value || "0", 10))}
                          className="w-full rounded-2xl border border-[var(--zh-border)] bg-white/80 px-4 py-3 text-base outline-none"
                        />
                      </label>

                      <div className="rounded-2xl bg-[var(--zh-surface-muted)] px-4 py-3 text-right">
                        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--zh-muted)]">
                          Portion
                        </div>
                        <div className="text-2xl font-black tracking-[-0.05em] text-[var(--zh-text)]">
                          {portionKh}
                        </div>
                        <div className="text-xs text-[var(--zh-muted)]">g KH</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {presets.map((preset) => (
                        <button
                          key={`${item.id}-${preset}`}
                          type="button"
                          onClick={() => applyPreset(item.id, preset)}
                          className={`rounded-full px-3 py-1.5 text-sm ${
                            item.grams === preset
                              ? "bg-[var(--zh-green)] text-white"
                              : "border border-[var(--zh-border)] text-[var(--zh-text)]"
                          }`}
                        >
                          {preset} g
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={transferToMeal}
            disabled={selectedItems.length === 0}
            className="w-full rounded-[24px] bg-[var(--zh-green)] px-4 py-4 text-lg font-black text-white shadow-md disabled:opacity-50"
          >
            🍽️ In Mahlzeit übernehmen
          </button>
        </section>
      </div>

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[28px] bg-[var(--zh-surface-strong)] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-eyebrow">Barcode-Scan</p>
                <h2 className="section-title text-xl mt-2">Kamera aktiv</h2>
              </div>
              <button
                type="button"
                onClick={stopScanner}
                className="rounded-full border border-[var(--zh-border)] px-3 py-2 text-sm font-bold text-[var(--zh-text)]"
              >
                Schließen
              </button>
            </div>
            <p className="mt-3 text-sm text-[var(--zh-muted)]">{scannerStatus}</p>
            <div className="mt-4 overflow-hidden rounded-[24px] bg-black">
              <video ref={videoRef} className="aspect-[3/4] w-full object-cover" playsInline muted />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
