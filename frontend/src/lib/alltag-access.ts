export type AccessScope = "LIVE_MEDICAL" | "SUMMARY_ONLY" | "LEARNING_ONLY";
export type RelationshipKind = "FAMILY" | "PROFESSIONAL" | "SCHOOL" | "LEARNING_GUEST";
export type ProfessionalRole = "DOCTOR" | "DIABETES_COUNSELOR" | "NURSING" | "CLINIC_ADMIN" | null;

export interface AccessDisplayInput {
  relationshipKind: RelationshipKind;
  accessScope: AccessScope;
  purpose?: string | null;
  professionalRole?: ProfessionalRole;
  role?: "OBSERVER" | "CAREGIVER" | "ADMIN" | "observer" | "caregiver" | "admin";
}

export function accessScopeLabel(scope: AccessScope) {
  if (scope === "LEARNING_ONLY") return "Nur Lernen / Notfall";
  if (scope === "SUMMARY_ONLY") return "Nur Überblick";
  return "Live-Medizin";
}

export function accessScopeBadgeLabel(scope: AccessScope) {
  if (scope === "SUMMARY_ONLY") return "Überblick";
  if (scope === "LEARNING_ONLY") return "Notfall";
  return "Live";
}

export function relationshipLabel(kind: RelationshipKind, purpose?: string | null) {
  const normalizedPurpose = (purpose ?? "").toLowerCase();
  if (kind === "PROFESSIONAL") return "Fachperson";
  if (kind === "SCHOOL") return "Schule / Trainer";
  if (kind === "LEARNING_GUEST") return "Gast-Lernen";
  if (normalizedPurpose.includes("grosseltern") || normalizedPurpose.includes("großeltern")) {
    return "Großeltern / Betreuung";
  }
  if (normalizedPurpose.includes("partner") || normalizedPurpose.includes("geschwister")) {
    return "Partner / Geschwister";
  }
  return "Familie";
}

export function accessSummaryLabel(input: AccessDisplayInput) {
  if (input.relationshipKind === "SCHOOL") {
    return "Schule/Trainer · Notfallhilfe · keine Messwerte";
  }
  if (input.relationshipKind === "LEARNING_GUEST") {
    return "Lern- & Notfallzugang · keine Messwerte";
  }
  if (input.relationshipKind === "FAMILY" && input.accessScope === "LEARNING_ONLY") {
    return "Großeltern/Betreuung · Notfallhilfe · keine Messwerte";
  }
  if (input.relationshipKind === "FAMILY" && input.accessScope === "SUMMARY_ONLY") {
    return "Partner/Geschwister · Wochenüberblick · kein Live-Zugriff";
  }
  if (input.relationshipKind === "PROFESSIONAL") {
    return input.accessScope === "LIVE_MEDICAL"
      ? "Fachperson · zeitlich begrenzte Lesefreigabe"
      : "Fachperson · eingeschränkte Lesefreigabe";
  }
  if (input.accessScope === "SUMMARY_ONLY") return "Wochenzusammenfassung · kein Live-Zugriff";
  if (input.accessScope === "LEARNING_ONLY") return "Notfallhilfe · keine Messwerte";
  return input.role === "admin" || input.role === "ADMIN" ? "Familie · Verwaltung" : "Familie · Betreuung";
}

export function accessPurposeNote(input: AccessDisplayInput) {
  if (input.accessScope === "LEARNING_ONLY") {
    return "Keine Live-Werte, keine Einträge, keine Schreib- oder Admin-Funktionen.";
  }
  if (input.accessScope === "SUMMARY_ONLY") {
    return "Nur aggregierter Überblick, keine Einzelmessungen und kein Live-Dashboard.";
  }
  if (input.relationshipKind === "PROFESSIONAL") {
    return "Lesender Fachzugriff mit Zweckbindung und Ablaufzeit.";
  }
  return "Live-Zugriff nur für bewusst freigegebene Familienrollen.";
}
