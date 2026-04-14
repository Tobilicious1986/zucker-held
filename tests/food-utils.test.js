import { describe, expect, it } from "vitest";
import {
  buildMealPrefill,
  calculateKhForPortion,
  getPortionPresets,
  normalizeBarcodeInput,
  sumSelectedKh,
} from "../frontend/src/lib/food-utils.ts";

describe("food utils", () => {
  it("normalisiert Barcode-Eingaben auf reine Ziffern", () => {
    expect(normalizeBarcodeInput("40 123-456 78901")).toBe("4012345678901");
  });

  it("berechnet KH fuer eine Portion", () => {
    expect(calculateKhForPortion(48, 60)).toBe(28.8);
  });

  it("liefert Default-Portionen fuer Brot aus der Kategorie", () => {
    expect(
      getPortionPresets({
        id: "brot",
        name: "Vollkornbrot",
        khPer100g: 41,
        source: "builtin",
        category: "brot_getreide",
      })
    ).toEqual([30, 60, 90]);
  });

  it("summiert mehrere Positionen und baut einen Meal-Handoff", () => {
    const items = [
      {
        id: "1",
        grams: 60,
        food: { id: "brot", name: "Brot", khPer100g: 50, source: "builtin", emoji: "🍞" },
      },
      {
        id: "2",
        grams: 150,
        food: { id: "saft", name: "Apfelsaft", khPer100g: 12, source: "online", emoji: "🥤" },
      },
    ];

    expect(sumSelectedKh(items)).toBe(48);

    const handoff = buildMealPrefill(items);
    expect(handoff.name).toBe("KH-Rechner Mahlzeit");
    expect(handoff.kh).toBe(48);
    expect(handoff.note).toContain("Brot");
    expect(handoff.note).toContain("Apfelsaft");
  });
});
