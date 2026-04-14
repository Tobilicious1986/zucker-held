export interface FoodApiItem {
  id: string;
  name: string;
  khPer100g: number;
  emoji?: string | null;
  source: "builtin" | "custom" | "online";
  barcode?: string | null;
  category?: string | null;
  aliases?: string[];
  portionPresets?: number[];
  externalSource?: string | null;
}

export interface SelectedFoodItem {
  id: string;
  food: FoodApiItem;
  grams: number;
}

export interface MealPrefill {
  name: string;
  kh: number;
  note: string;
}

export function normalizeBarcodeInput(value: string): string {
  return value.replaceAll(/[^0-9]/g, "").trim();
}

export function calculateKhForPortion(khPer100g: number, grams: number): number {
  const safeKh = Number.isFinite(khPer100g) ? khPer100g : 0;
  const safeGrams = Number.isFinite(grams) ? Math.max(0, grams) : 0;
  return Math.round(((safeKh * safeGrams) / 100) * 10) / 10;
}

export function getPortionPresets(food: FoodApiItem): number[] {
  const presets = Array.isArray(food.portionPresets)
    ? food.portionPresets.filter((value) => Number.isFinite(value) && value > 0)
    : [];

  if (presets.length > 0) {
    return presets;
  }

  const category = food.category ?? "";
  if (category === "brot_getreide") return [30, 60, 90];
  if (category === "fruehstueck_muesli") return [30, 45, 60];
  if (category === "nudeln_reis_getreide") return [75, 125, 200];
  if (category === "kartoffeln_beilagen") return [100, 150, 200];
  if (category === "getraenke") return [150, 200, 250];

  return [30, 60, 100];
}

export function getFoodSourceLabel(food: FoodApiItem): string {
  if (food.source === "custom") return "Eigenes";
  if (food.source === "online") return food.externalSource === "open_food_facts" ? "Open Food Facts" : "Online";
  return "DACH-Katalog";
}

export function sumSelectedKh(items: SelectedFoodItem[]): number {
  return Math.round(
    items.reduce((sum, item) => sum + calculateKhForPortion(item.food.khPer100g, item.grams), 0) * 10
  ) / 10;
}

export function buildMealPrefill(items: SelectedFoodItem[]): MealPrefill {
  const totalKh = Math.max(0, Math.round(sumSelectedKh(items)));
  if (items.length === 0) {
    return { name: "Mahlzeit", kh: 0, note: "" };
  }

  if (items.length === 1) {
    const only = items[0];
    return {
      name: only.food.name,
      kh: totalKh,
      note: `${only.food.name} · ${only.grams} g · ${calculateKhForPortion(only.food.khPer100g, only.grams)} g KH`,
    };
  }

  const note = items
    .map(
      (item) =>
        `${item.food.emoji ?? "🍽️"} ${item.food.name} · ${item.grams} g · ${calculateKhForPortion(item.food.khPer100g, item.grams)} g KH`
    )
    .join("\n");

  return {
    name: "KH-Rechner Mahlzeit",
    kh: totalKh,
    note,
  };
}
