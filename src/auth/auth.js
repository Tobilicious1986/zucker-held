// ═══════════════════════════════════════════════════════════
//  AUTH MANAGER — Zucker-Held v4
//  Facade: wählt Local- oder Keycloak-Provider
// ═══════════════════════════════════════════════════════════

import { loadAuthConfig } from './auth-config.js';
import { LocalAuthProvider } from './local-provider.js';

class AuthManager {
  constructor() {
    this._provider = null;
    this._config   = loadAuthConfig();
  }

  async init() {
    if (this._config.mode === 'keycloak' && this._config.keycloak.url) {
      try {
        // Keycloak-Script dynamisch vom Server laden
        await this._injectKeycloakScript(this._config.keycloak.url);
        const { KeycloakAuthProvider } = await import('./keycloak-provider.js');
        this._provider = new KeycloakAuthProvider(this._config.keycloak);
      } catch (e) {
        console.warn('[Auth] Keycloak nicht erreichbar, Fallback auf lokal:', e);
        this._provider = new LocalAuthProvider();
      }
    } else {
      this._provider = new LocalAuthProvider();
    }
    return this._provider;
  }

  /** Gibt den aktuell aktiven Provider zurück (nach init()) */
  get provider() {
    return this._provider;
  }

  get config() {
    return this._config;
  }

  isKeycloakMode() {
    return this._config.mode === 'keycloak';
  }

  // Delegations-Methoden (direkter Zugriff ohne .provider.)
  isAuthenticated() { return this._provider?.isAuthenticated() ?? false; }
  canWrite()        { return this._provider?.canWrite() ?? false; }
  isAdmin()         { return this._provider?.isAdmin() ?? false; }
  async getUser()   { return this._provider?.getUser() ?? null; }
  async logout()    { return this._provider?.logout(); }

  /** Injiziert das Keycloak-JS vom eigenen Server (Version-Match garantiert) */
  _injectKeycloakScript(serverUrl) {
    return new Promise((resolve, reject) => {
      if (window.Keycloak) { resolve(); return; }
      const s = document.createElement('script');
      s.src    = `${serverUrl}/js/keycloak.js`;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Keycloak-Script nicht geladen'));
      document.head.appendChild(s);
    });
  }
}

// Singleton
export const auth = new AuthManager();
