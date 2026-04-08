// ═══════════════════════════════════════════════════════════
//  KEYCLOAK AUTH PROVIDER — Zucker-Held v4
//  Wird nur dynamisch geladen wenn mode === 'keycloak'
// ═══════════════════════════════════════════════════════════

export class KeycloakAuthProvider {
  constructor({ url, realm, clientId }) {
    // window.Keycloak wurde von auth.js per Script-Tag geladen
    this._kc   = new window.Keycloak({ url, realm, clientId });
    this._user = null;
  }

  async login() {
    const authenticated = await this._kc.init({
      onLoad:           'login-required',
      checkLoginIframe: false,
      pkceMethod:       'S256',
    });
    if (authenticated) {
      this._user = this._mapToken(this._kc.tokenParsed);
      this._scheduleRefresh();
    }
    return this._user;
  }

  async logout() {
    this._user = null;
    await this._kc.logout();
  }

  async getUser() {
    if (this._user) return this._user;
    if (this._kc.authenticated) {
      this._user = this._mapToken(this._kc.tokenParsed);
    }
    return this._user;
  }

  isAuthenticated() {
    return !!this._kc.authenticated;
  }

  async refreshSession() {
    try {
      await this._kc.updateToken(60);
    } catch {
      await this._kc.login();
    }
  }

  canWrite() {
    return this._user && this._user.role !== 'observer';
  }

  isAdmin() {
    return this._user && this._user.role === 'admin';
  }

  _mapToken(token) {
    if (!token) return null;
    const roles = token?.realm_access?.roles || [];
    let role = 'patient';
    if (roles.includes('zh-admin'))     role = 'admin';
    if (roles.includes('zh-caregiver')) role = 'caregiver';
    if (roles.includes('zh-observer'))  role = 'observer';

    return {
      id:          token.sub,
      name:        token.given_name || token.preferred_username || 'Nutzer',
      avatar:      token.avatar     || '🦸',
      role,
      profileType: token.profile_type || 'erwachsen',
      tenantId:    token.realm || 'keycloak',
      storageKey:  `zucker-held-v4-kc-${token.sub}`,
      _v3key:      null,
    };
  }

  _scheduleRefresh() {
    // Token alle 60s prüfen
    setInterval(async () => {
      try { await this._kc.updateToken(60); } catch { /* silent */ }
    }, 60000);
  }
}
