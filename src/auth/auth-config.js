// ═══════════════════════════════════════════════════════════
//  AUTH KONFIGURATION — Zucker-Held v4
// ═══════════════════════════════════════════════════════════

export const AUTH_CONFIG_KEY = 'zucker-held-auth-config';

/** Standard-Konfiguration (lokal, kein Keycloak) */
export const DEFAULT_AUTH_CONFIG = {
  mode: 'local',    // 'local' | 'keycloak'
  keycloak: {
    url:      '',   // z.B. 'https://auth.praxis.de'
    realm:    '',   // z.B. 'diabetes-praxis'
    clientId: '',   // z.B. 'zucker-held-app'
  },
};

/** Lädt gespeicherte Auth-Config (überschreibt Default) */
export function loadAuthConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_CONFIG_KEY) || 'null');
    if (!stored) return { ...DEFAULT_AUTH_CONFIG };
    return {
      mode: stored.mode || DEFAULT_AUTH_CONFIG.mode,
      keycloak: { ...DEFAULT_AUTH_CONFIG.keycloak, ...(stored.keycloak || {}) },
    };
  } catch {
    return { ...DEFAULT_AUTH_CONFIG };
  }
}

/** Speichert Auth-Config */
export function saveAuthConfig(config) {
  localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(config));
}
