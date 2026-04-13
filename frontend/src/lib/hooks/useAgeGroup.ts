import { useAuthStore } from "@/stores/auth.store";

export type AgeGroup = "child_young" | "child_teen" | "adult";

/**
 * Gibt die Altersgruppe des aktiven Profils zurück.
 * Wird für adaptive UI-Entscheidungen verwendet:
 * - child_young: Kind ~8 Jahre — bunte, große UI, Gamification, Emojis
 * - child_teen: Jugendlicher ~16 Jahre — moderne UI, keine Kinder-Emojis
 * - adult: Erwachsener — professionelles Layout, alle Features
 */
export function useAgeGroup(): AgeGroup {
  const profile = useAuthStore((s) => s.activeProfile);
  return profile?.ageGroup ?? "adult";
}

/**
 * CSS-Klassen passend zur Altersgruppe.
 * Gibt ein Objekt mit Tailwind-Klassen zurück.
 */
export function useAgeGroupClasses() {
  const ageGroup = useAgeGroup();
  return {
    /** Hauptzahl-Anzeige (z.B. BZ-Wert) */
    bigNumber: ageGroup === "child_young" ? "text-7xl" : "text-5xl",
    /** Touchflächen (Buttons, Karten) */
    touchTarget: ageGroup === "child_young" ? "min-h-[4rem]" : "min-h-[2.5rem]",
    /** Hintergrundfarbe für Statusanzeigen */
    statusBg: ageGroup === "child_young" ? "rounded-3xl" : "rounded-2xl",
    /** Emoji-Sichtbarkeit */
    showChildEmojis: ageGroup === "child_young",
    /** Gamification-Elemente sichtbar */
    showGamification: ageGroup !== "adult",
    /** Erweiterte Statistiken (TIR, GMI) sichtbar */
    showAdvancedStats: ageGroup === "adult" || ageGroup === "child_teen",
    /** Fachbegriffe verwenden */
    useMedicalTerms: ageGroup !== "child_young",
    ageGroup,
  };
}
