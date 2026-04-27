export type AccessScope = "LIVE_MEDICAL" | "SUMMARY_ONLY" | "LEARNING_ONLY";

export function routeForAccessScope(scope: AccessScope, ownerId: string) {
  if (scope === "SUMMARY_ONLY") return `/summary/${ownerId}`;
  if (scope === "LEARNING_ONLY") return `/learning/${ownerId}`;
  return "/observer";
}
