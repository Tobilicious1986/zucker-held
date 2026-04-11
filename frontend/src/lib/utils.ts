// ═══════════════════════════════════════════════════════════════
// BZ-Status Hilfsfunktionen (portiert aus src/utils.js)
// ═══════════════════════════════════════════════════════════════

export type BzLevel = "sehr-niedrig" | "niedrig" | "ziel" | "hoch" | "sehr-hoch";

export interface BzStatus {
  level: BzLevel;
  label: string;
  color: string;
  emoji: string;
  inTarget: boolean;
}

export function getBzStatus(value: number, min = 70, max = 180): BzStatus {
  if (value < 54)   return { level: "sehr-niedrig", label: "SEHR NIEDRIG",   color: "text-red-600",    emoji: "🆘", inTarget: false };
  if (value < min)  return { level: "niedrig",      label: "Niedrig",        color: "text-orange-500", emoji: "⬇️", inTarget: false };
  if (value <= max) return { level: "ziel",         label: "Im Zielbereich", color: "text-green-600",  emoji: "✅", inTarget: true  };
  if (value <= 250) return { level: "hoch",         label: "Erhöht",         color: "text-orange-500", emoji: "⬆️", inTarget: false };
  return               { level: "sehr-hoch",        label: "SEHR HOCH",      color: "text-red-600",    emoji: "⚠️", inTarget: false };
}

// ═══════════════════════════════════════════════════════════════
// Insulin-Dosierungs-Rechner (portiert aus src/utils.js)
// ═══════════════════════════════════════════════════════════════

// BL-S06: Korrektur nur wenn Abweichung > CORRECTION_WINDOW mg/dL (klinischer Standard)
const CORRECTION_WINDOW = 30;

export function calcInsulinDose(
  currentBz: number,
  targetBz: number,
  khGrams: number,
  insulinRatio: number,    // g KH pro 1 IE
  correctionFactor: number // mg/dL pro 1 IE
): number {
  const mealDose = khGrams / insulinRatio;
  // Korrektur nur wenn Differenz > 30 mg/dL — verhindert unnötige Korrekturen
  const diff = currentBz - targetBz;
  const correctionDose = Math.abs(diff) > CORRECTION_WINDOW
    ? diff / correctionFactor
    : 0;
  // Auf 0.5er Schritte runden, mindestens 0
  return Math.max(0, Math.round((mealDose + correctionDose) * 2) / 2);
}

// BL-S06: Gibt zurück ob Korrektur aktiv ist (für UI-Hinweis)
export function isCorrectionActive(currentBz: number, targetBz: number): boolean {
  return Math.abs(currentBz - targetBz) > CORRECTION_WINDOW;
}

// BL-S01: Validiert Insulin-Parameter gegen klinische Normwerte
export interface InsulinParamWarning {
  field: string;
  message: string;
}
export function validateInsulinParams(
  insulinRatio: number,
  correctionFactor: number,
  targetBz: number
): InsulinParamWarning[] {
  const warnings: InsulinParamWarning[] = [];
  if (insulinRatio < 5 || insulinRatio > 30)
    warnings.push({ field: "Insulin-Faktor", message: `${insulinRatio} g/IE liegt außerhalb des klinischen Bereichs (5–30). Bitte mit dem Diabetes-Team absprechen.` });
  if (correctionFactor < 15 || correctionFactor > 100)
    warnings.push({ field: "Korrekturfaktor", message: `${correctionFactor} mg/dL/IE liegt außerhalb des klinischen Bereichs (15–100).` });
  if (targetBz < 80 || targetBz > 160)
    warnings.push({ field: "Zielwert", message: `${targetBz} mg/dL ist ungewöhnlich. Typischer Bereich: 80–160 mg/dL.` });
  return warnings;
}

// ═══════════════════════════════════════════════════════════════
// Datum / Zeit Hilfsfunktionen
// ═══════════════════════════════════════════════════════════════

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function getMeasureTimeLabel(timestamp: number): string {
  const h = new Date(timestamp).getHours();
  if (h >= 5  && h < 10) return "Nüchtern";
  if (h >= 10 && h < 12) return "Vor Mittagessen";
  if (h >= 12 && h < 14) return "Nach Mittagessen";
  if (h >= 14 && h < 18) return "Nachmittag";
  if (h >= 18 && h < 21) return "Vor Abendessen";
  if (h >= 21 || h < 2)  return "Vor dem Schlafen";
  return "Nacht";
}
