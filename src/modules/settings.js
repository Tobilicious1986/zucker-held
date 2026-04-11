// ═══════════════════════════════════════════════════════════
//  EINSTELLUNGEN — Modul
// ═══════════════════════════════════════════════════════════
<<<<<<< HEAD
import { state, save, clearAll, getActiveUser } from '../state.js';
import { loadProfiles, createProfile, archiveProfile,
         getActiveProfileId, PROFILE_TYPES,
         hasMinRole }                          from '../auth/local-provider.js';
=======
import { state, save, clearAll } from '../state.js';
import { loadProfiles, createProfile, updateProfile, archiveProfile,
         getActiveProfileId, PROFILE_TYPES }  from '../auth/local-provider.js';
>>>>>>> origin/main
import { loadAuthConfig, saveAuthConfig }     from '../auth/auth-config.js';
import { AVATARS, ACHIEVEMENTS }              from '../config.js';
import { renderAchievements }                 from '../achievements.js';
import { getWidgetConfig, saveWidgetConfig }  from '../ui/dashboard.js';
import { WIDGET_REGISTRY }                    from '../widgets/widget-registry.js';
import { openModal, closeModal, renderModal } from '../ui/modal.js';
import { applyTheme }                         from '../ui/theme.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Einstellungen</h2>
      <span class="page-icon">⚙️</span>
    </div>
    <div id="settingsContent"></div>
    <div id="modal-add-profile-settings" class="modal-overlay hidden"></div>`;
}

export function init() { _renderSettings(); }
export function refresh() { _renderSettings(); }

/** Zeigt admin-geschützte Inhalte oder ein Schloss-Banner (BL-04) */
function _adminGate(label, html) {
  const user    = getActiveUser();
  const isAdmin = hasMinRole(user, 'admin');
  if (isAdmin) return html;

  // Prüfen ob das Profil überhaupt einen PIN hat
  const profiles      = loadProfiles();
  const activeProfile = profiles.find(p => p.id === user?.id);
  if (!activeProfile?.pin) return html; // Kein PIN → kein Schutz

  return `
    <div class="admin-gate-row">
      <span class="admin-gate-icon">🔒</span>
      <span class="admin-gate-label">${_esc(label)} — nur für Admin</span>
      <button class="btn btn-secondary btn-small"
              onclick="window._elevateToAdmin(() => window.showPage('settings'))">
        PIN eingeben
      </button>
    </div>`;
}

function _renderSettings() {
  const el = document.getElementById('settingsContent');
  if (!el) return;

  const profiles  = loadProfiles();
  const activeId  = getActiveProfileId();
  const authCfg   = loadAuthConfig();
  const wCfg      = getWidgetConfig();
  const user      = getActiveUser();
  const isAdmin   = hasMinRole(user, 'admin');

  el.innerHTML = `

    <!-- Profil -->
    <div class="settings-section">
      <div class="settings-section-title">Profile</div>
      ${profiles.map(p => `
        <div class="profile-settings-item">
          <div class="profile-settings-avatar">${p.avatar}</div>
          <div class="profile-settings-info">
            <div class="profile-settings-name">${_esc(p.name)}</div>
            <div class="profile-settings-type">
              ${p.type === 'kind' ? '👦 Kind' : '🧑 Erwachsener'} · ${p.role}${p.pin ? ' 🔒' : ''}
              ${p.id === activeId ? ' <span style="color:var(--status-ok);font-weight:700">● Aktiv</span>' : ''}
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-small" onclick="window.openEditProfile('${p.id}')">✏️</button>
            ${p.id !== activeId ? `<button class="btn btn-secondary btn-small" onclick="window.switchToProfile('${p.id}')">Wechseln</button>` : ''}
            ${profiles.length > 1 ? `<button class="btn btn-danger btn-small" onclick="window._archiveProfile('${p.id}')">✕</button>` : ''}
          </div>
        </div>`).join('')}
      <div class="settings-row">
        <button class="btn btn-ghost" style="width:100%" onclick="window.openAddProfile()">➕ Weiteres Profil</button>
      </div>
    </div>

    <!-- BZ-Einstellungen (Admin) -->
    <div class="settings-section">
      <div class="settings-section-title">Blutzucker-Zielbereich</div>
      ${_adminGate('Zielbereich', `
        <div class="settings-row">
          <div class="settings-row-label">Unterer Grenzwert (mg/dL)</div>
          <input class="form-input" type="number" id="settingMin" value="${state.settings.min}"
                 style="width:90px;text-align:right" min="40" max="100" />
        </div>
        <div class="settings-row">
          <div class="settings-row-label">Oberer Grenzwert (mg/dL)</div>
          <input class="form-input" type="number" id="settingMax" value="${state.settings.max}"
                 style="width:90px;text-align:right" min="140" max="300" />
        </div>
        <div class="settings-row">
          <button class="btn btn-primary" onclick="window._saveRange()">Speichern</button>
        </div>
      `)}
    </div>

    <!-- Notfallkontakte (Admin) -->
    <div class="settings-section">
      <div class="settings-section-title">Notfallkontakte</div>
      ${(state.settings.contacts || []).map((c, i) => `
        <div class="settings-row">
          <div class="settings-row-label">
            <div>${_esc(c.name)}</div>
            <div class="settings-row-sub">${_esc(c.phone)}</div>
          </div>
          ${isAdmin ? `<button class="btn btn-secondary btn-small" onclick="window._deleteContact(${i})">✕</button>` : ''}
        </div>`).join('')}
      ${_adminGate('Kontakte verwalten', `
        <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
          <input class="form-input" type="text" id="newContactName" placeholder="Name" maxlength="40" />
          <input class="form-input" type="tel"  id="newContactPhone" placeholder="Telefonnummer" />
          <button class="btn btn-secondary" onclick="window._addContact()">➕ Kontakt hinzufügen</button>
        </div>
      `)}
    </div>

    <!-- Insulin-Einstellungen (Admin, BL-01) -->
    <div class="settings-section">
      <div class="settings-section-title">Insulin-Einstellungen</div>
      ${_adminGate('Insulin-Parameter', `
        <div class="settings-row">
          <div class="settings-row-label">
            <div>KH-Verhältnis</div>
            <div class="settings-row-sub">1 IE pro X g Kohlenhydrate</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="text-muted text-sm">1 IE / </span>
            <input class="form-input" type="number" id="settingInsulinRatio"
                   value="${state.settings.insulinRatio || 10}"
                   style="width:70px;text-align:right" min="1" max="50" />
            <span class="text-muted text-sm">g</span>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <div>Korrekturfaktor</div>
            <div class="settings-row-sub">1 IE senkt BZ um X mg/dL</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span class="text-muted text-sm">1 IE = </span>
            <input class="form-input" type="number" id="settingCorrFactor"
                   value="${state.settings.correctionFactor || 30}"
                   style="width:70px;text-align:right" min="5" max="200" />
            <span class="text-muted text-sm">mg/dL</span>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <div>Ziel-Blutzucker</div>
            <div class="settings-row-sub">Korrektur-Zielwert (mg/dL)</div>
          </div>
          <input class="form-input" type="number" id="settingTargetBZ"
                 value="${state.settings.targetBZ || 120}"
                 style="width:90px;text-align:right" min="70" max="200" />
        </div>
        <div class="settings-row">
          <button class="btn btn-primary" onclick="window._saveInsulinSettings()">Speichern</button>
        </div>
      `)}
    </div>

    <!-- Dashboard-Widgets -->
    <div class="settings-section">
      <div class="settings-section-title">Dashboard-Widgets</div>
      ${WIDGET_REGISTRY.map((w, idx) => {
        const isEnabled = !wCfg.disabled.includes(w.id);
        const order     = wCfg.order.indexOf(w.id);
        return `<div class="widget-config-item">
          <span class="widget-config-drag">⠿</span>
          <span class="widget-config-icon">${w.icon}</span>
          <span class="widget-config-name">${w.title}</span>
          <div class="widget-config-order-btns">
            <button class="widget-order-btn" onclick="window._moveWidget('${w.id}', -1)" ${order <= 0 ? 'disabled' : ''}>↑</button>
            <button class="widget-order-btn" onclick="window._moveWidget('${w.id}', 1)"  ${order >= WIDGET_REGISTRY.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${isEnabled ? 'checked' : ''}
                   onchange="window._toggleWidget('${w.id}', this.checked)" />
            <span class="toggle-slider"></span>
          </label>
        </div>`;
      }).join('')}
    </div>

    <!-- Keycloak (Admin) -->
    <div class="settings-section">
      <div class="settings-section-title">Anmelde-Modus</div>
      ${_adminGate('Anmelde-Modus', `
        <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:12px">
          <div class="seg-control">
            <button class="seg-btn ${authCfg.mode === 'local' ? 'active' : ''}" onclick="window._setAuthMode('local')">Lokal</button>
            <button class="seg-btn ${authCfg.mode === 'keycloak' ? 'active' : ''}" onclick="window._setAuthMode('keycloak')">Keycloak (Praxis)</button>
          </div>
          <p class="text-muted text-sm">
            ${authCfg.mode === 'local'
              ? 'Profile werden nur auf diesem Gerät gespeichert.'
              : 'Login über Keycloak-Server.'}
          </p>
          <div id="kcFields" style="display:${authCfg.mode === 'keycloak' ? 'flex' : 'none'};flex-direction:column;gap:8px">
            <input class="form-input" type="url" id="kcUrl" placeholder="https://auth.praxis.de" value="${authCfg.keycloak.url}" />
            <input class="form-input" type="text" id="kcRealm" placeholder="realm-name" value="${authCfg.keycloak.realm}" />
            <input class="form-input" type="text" id="kcClientId" placeholder="client-id" value="${authCfg.keycloak.clientId}" />
            <button class="btn btn-secondary" onclick="window._testKC()">🔌 Verbindung testen</button>
            <div id="kcTestResult" class="kc-test-status kc-test-pending" style="display:none"></div>
            <button class="btn btn-primary" onclick="window._saveKC()">✅ Speichern & Neu starten</button>
          </div>
        </div>
      `)}
    </div>

    <!-- KI-Schätzung (Claude API) — Admin -->
    <div class="settings-section">
      <div class="settings-section-title">KI-Schätzung (Claude API)</div>
      ${_adminGate('Claude API-Key', `
        <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
          <p class="text-muted text-sm" style="margin:0">
            Eigenen Anthropic API-Key eingeben, um KH aus Mahlzeitbeschreibungen zu schätzen.
            Key bleibt lokal auf dem Gerät.
          </p>
          <input class="form-input" type="password" id="claudeApiKeyInput"
            placeholder="sk-ant-api03-…"
            value="${state.settings.claudeApiKey || ''}" />
          <button class="btn btn-primary btn-small" onclick="window._saveClaudeKey()">Speichern</button>
        </div>
      `)}
    </div>

    <!-- Dexcom CLARITY CSV-Import -->
    <div class="settings-section">
      <div class="settings-section-title">Dexcom CLARITY Import</div>
      <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
        <p class="text-muted text-sm" style="margin:0">
          CSV-Datei aus Dexcom CLARITY (Export → Geräte-Berichte) importieren.
          Bestehende Einträge bleiben erhalten, Duplikate werden übersprungen.
        </p>
        <label class="btn btn-secondary" style="text-align:center;cursor:pointer">
          📂 CSV-Datei auswählen
          <input type="file" id="dexcomCsvInput" accept=".csv" style="display:none" />
        </label>
        <div id="dexcomImportStatus" style="display:none" class="text-sm"></div>
      </div>
    </div>

    <!-- Nightscout (Admin für Konfiguration, Sync für alle) -->
    <div class="settings-section">
      <div class="settings-section-title">Nightscout / CGM-Sync</div>
      ${_adminGate('Nightscout konfigurieren', `
        <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
          <p class="text-muted text-sm" style="margin:0">
            Verbindet mit einer Nightscout-Instanz und importiert CGM-Werte der letzten 24h.
          </p>
          <input class="form-input" type="url" id="nsUrlInput"
            placeholder="https://nightscout.meinserver.de"
            value="${state.settings.nightscoutUrl || ''}" />
          <input class="form-input" type="text" id="nsTokenInput"
            placeholder="Access Token (optional)"
            value="${state.settings.nightscoutToken || ''}" />
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary" style="flex:1" onclick="window._testNightscout()">🔌 Testen</button>
            <button class="btn btn-primary" style="flex:1" onclick="window._syncNightscout()">🔄 Jetzt sync</button>
          </div>
          <button class="btn btn-secondary btn-small" onclick="window._saveNightscout()">💾 Einstellungen speichern</button>
          <div id="nsStatus" style="display:none" class="text-sm"></div>
        </div>
      `)}
      ${!isAdmin && state.settings.nightscoutUrl ? `
        <div class="settings-row">
          <button class="btn btn-primary" style="width:100%" onclick="window._syncNightscout()">🔄 CGM-Werte aktualisieren</button>
          <div id="nsStatus" style="display:none" class="text-sm"></div>
        </div>` : ''}
    </div>

    <!-- Benachrichtigungen (BL-07) -->
    <div class="settings-section">
      <div class="settings-section-title">🔔 Benachrichtigungen</div>
      ${(() => {
        const notifSupported = typeof Notification !== 'undefined';
        if (!notifSupported) return `<div class="settings-row"><div class="settings-row-label text-muted">Nicht unterstützt in diesem Browser</div></div>`;
        const permStatus = Notification.permission;
        const enabled    = state.settings.notificationsEnabled;
        const statusText = permStatus === 'granted' ? '✅ Erlaubt' :
                           permStatus === 'denied'  ? '❌ Verweigert — in Browser-Einstellungen aktivieren' :
                                                      '❓ Noch nicht angefragt';
        return `
          <div class="settings-row">
            <div class="settings-row-label">
              <div>Alerts aktivieren</div>
              <div class="settings-row-sub">Bei Unterzucker, sehr hohem BZ oder langer Mess-Pause</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="notifToggle" ${enabled ? 'checked' : ''}
                     onchange="window._toggleNotifications(this.checked)" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-row">
            <div class="settings-row-label">
              <div>Browser-Erlaubnis</div>
              <div class="settings-row-sub">${statusText}</div>
            </div>
            ${permStatus !== 'granted' && permStatus !== 'denied' ? `
              <button class="btn btn-secondary btn-small"
                      onclick="window._requestNotifPermission()">Erlauben</button>` : ''}
          </div>
          <div class="settings-row">
            <div class="settings-row-label text-muted text-sm">
              Alertgrenzen: BZ &lt; 55 mg/dL · BZ &gt; 350 mg/dL · &gt; 8h keine Messung
            </div>
          </div>`;
      })()}
    </div>

    <!-- Errungenschaften -->
    <div class="settings-section">
      <div class="settings-section-title" style="padding:12px 20px 8px">Errungenschaften</div>
      <div style="padding:0 16px 16px">
        <div id="achievementsContainer"></div>
      </div>
    </div>

    <!-- Gefahrenzone (Admin) -->
    <div class="settings-section">
      <div class="settings-section-title">Gefahrenzone</div>
      ${_adminGate('Daten löschen', `
        <div class="settings-row">
          <div class="settings-row-label">
            <div>Alle Daten löschen</div>
            <div class="settings-row-sub">Einträge, Lebensmittel, Achievements</div>
          </div>
          <button class="btn btn-danger btn-small" onclick="window._confirmClear()">Löschen</button>
        </div>
      `)}
    </div>`;

  // Achievements rendern
  renderAchievements('achievementsContainer');

  // Globale Handler
  window._saveRange = () => {
    const min = parseInt(document.getElementById('settingMin')?.value);
    const max = parseInt(document.getElementById('settingMax')?.value);
    if (min >= max || min < 40 || max > 300) { window.showError('Ungültiger Zielbereich.'); return; }
    state.settings.min = min;
    state.settings.max = max;
    save();
    window.showToast('Zielbereich gespeichert ✅', 'success');
  };

  // BL-01: Insulin-Parameter speichern
  window._saveInsulinSettings = () => {
    const ratio  = parseInt(document.getElementById('settingInsulinRatio')?.value);
    const cf     = parseInt(document.getElementById('settingCorrFactor')?.value);
    const target = parseInt(document.getElementById('settingTargetBZ')?.value);
    if (isNaN(ratio) || ratio < 1 || ratio > 50) { window.showError('Ungültiges KH-Verhältnis (1–50).'); return; }
    if (isNaN(cf) || cf < 5 || cf > 200)          { window.showError('Ungültiger Korrekturfaktor (5–200).'); return; }
    if (isNaN(target) || target < 70 || target > 200) { window.showError('Ungültiger Ziel-BZ (70–200 mg/dL).'); return; }
    state.settings.insulinRatio      = ratio;
    state.settings.correctionFactor  = cf;
    state.settings.targetBZ          = target;
    save();
    window.showToast('Insulin-Einstellungen gespeichert ✅', 'success');
  };

  window._addContact = () => {
    const name  = document.getElementById('newContactName')?.value?.trim();
    const phone = document.getElementById('newContactPhone')?.value?.trim();
    if (!name || !phone) { window.showError('Name und Telefon eingeben.'); return; }
    state.settings.contacts = state.settings.contacts || [];
    state.settings.contacts.push({ name, phone });
    save();
    _renderSettings();
    // SOS-FAB aktualisieren
    const fab = document.getElementById('sosFab');
    if (fab) fab.classList.toggle('hidden', state.settings.contacts.length === 0);
  };

  window._deleteContact = (i) => {
    state.settings.contacts.splice(i, 1);
    save();
    _renderSettings();
  };

  window._archiveProfile = (id) => {
    if (!confirm('Profil wirklich archivieren?')) return;
    archiveProfile(id);
    _renderSettings();
  };

  window._moveWidget = (id, dir) => {
    const cfg   = getWidgetConfig();
    const order = [...cfg.order];
    const idx   = order.indexOf(id);
    const to    = idx + dir;
    if (to < 0 || to >= order.length) return;
    [order[idx], order[to]] = [order[to], order[idx]];
    cfg.order = order;
    saveWidgetConfig(cfg);
    _renderSettings();
  };

  window._toggleWidget = (id, enabled) => {
    const cfg = getWidgetConfig();
    if (enabled) cfg.disabled = cfg.disabled.filter(d => d !== id);
    else if (!cfg.disabled.includes(id)) cfg.disabled.push(id);
    saveWidgetConfig(cfg);
  };

  window._setAuthMode = (mode) => {
    document.querySelectorAll('.seg-btn').forEach((b, i) => b.classList.toggle('active', i === (mode === 'local' ? 0 : 1)));
    const kcFields = document.getElementById('kcFields');
    if (kcFields) kcFields.style.display = mode === 'keycloak' ? 'flex' : 'none';
  };

  window._testKC = async () => {
    const url   = document.getElementById('kcUrl')?.value?.trim();
    const realm = document.getElementById('kcRealm')?.value?.trim();
    const res   = document.getElementById('kcTestResult');
    if (!url || !realm) return;
    if (res) { res.style.display = ''; res.className = 'kc-test-status kc-test-pending'; res.textContent = '⏳ Teste Verbindung...'; }
    try {
      const r = await fetch(`${url}/realms/${realm}/.well-known/openid-configuration`);
      if (r.ok) {
        if (res) { res.className = 'kc-test-status kc-test-ok'; res.textContent = `✅ Verbindung erfolgreich (Realm: ${realm})`; }
      } else { throw new Error(r.status); }
    } catch {
      if (res) { res.className = 'kc-test-status kc-test-fail'; res.textContent = '❌ Verbindung fehlgeschlagen. URL und Realm prüfen.'; }
    }
  };

  window._saveKC = () => {
    const mode     = document.querySelector('.seg-btn.active')?.textContent === 'Lokal' ? 'local' : 'keycloak';
    const url      = document.getElementById('kcUrl')?.value?.trim() || '';
    const realm    = document.getElementById('kcRealm')?.value?.trim() || '';
    const clientId = document.getElementById('kcClientId')?.value?.trim() || '';
    saveAuthConfig({ mode, keycloak: { url, realm, clientId } });
    window.showToast('Gespeichert — App startet neu...', 'success');
    setTimeout(() => location.reload(), 1500);
  };

  // BL-07: Notifications-Handler (Permission erst anfragen, dann State setzen)
  window._toggleNotifications = async (enabled) => {
    if (!enabled) {
      state.settings.notificationsEnabled = false;
      save();
      return;
    }
    // Permission prüfen/anfragen BEVOR State gesetzt wird
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const p = await window.requestNotificationPermission?.();
      if (p !== 'granted') {
        // Toggle visuell zurücksetzen
        const toggle = document.getElementById('notifToggle');
        if (toggle) toggle.checked = false;
        window.showError('Berechtigung verweigert. In Browser-Einstellungen aktivieren.');
        return;
      }
    }
    state.settings.notificationsEnabled = true;
    save();
    window.showToast('🔔 Benachrichtigungen aktiviert', 'success');
  };

  window._requestNotifPermission = async () => {
    const result = await window.requestNotificationPermission?.();
    if (result === 'granted') {
      state.settings.notificationsEnabled = true;
      save();
      window.showToast('🔔 Benachrichtigungen aktiviert', 'success');
    } else {
      window.showError('Berechtigung verweigert. In Browser-Einstellungen aktivieren.');
    }
    _renderSettings();
  };

  window._confirmClear = () => {
    if (!confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden!')) return;
    clearAll();
    window.showSuccess('🗑️', 'Alle Daten gelöscht');
    _renderSettings();
  };

  window._saveClaudeKey = () => {
    const key = document.getElementById('claudeApiKeyInput')?.value?.trim() || '';
    state.settings.claudeApiKey = key;
    save();
    window.showToast(key ? '🤖 API-Key gespeichert' : 'API-Key entfernt', 'success');
  };

  window._saveNightscout = () => {
    state.settings.nightscoutUrl   = document.getElementById('nsUrlInput')?.value?.trim()   || '';
    state.settings.nightscoutToken = document.getElementById('nsTokenInput')?.value?.trim() || '';
    save();
    window.showToast('Nightscout-Einstellungen gespeichert', 'success');
  };

  window._testNightscout = async () => {
    const url   = document.getElementById('nsUrlInput')?.value?.trim();
    const token = document.getElementById('nsTokenInput')?.value?.trim();
    const status = document.getElementById('nsStatus');
    if (!url) { window.showError('Bitte URL eingeben.'); return; }
    if (status) { status.style.display = ''; status.textContent = '⏳ Verbinde…'; }
    try {
      const { fetchNightscout } = await import('../api.js');
      const entries = await fetchNightscout(url, token, 1);
      if (status) { status.textContent = entries.length ? `✅ Verbindung OK — letzter BZ: ${entries[0].value} mg/dL` : '✅ Verbunden (keine Einträge)'; }
    } catch (e) {
      if (status) { status.textContent = '❌ ' + e.message; }
    }
  };

  window._syncNightscout = async () => {
    const url   = state.settings.nightscoutUrl;
    const token = state.settings.nightscoutToken;
    if (!url) { window.showError('Nightscout-URL nicht konfiguriert.'); return; }
    const status = document.getElementById('nsStatus');
    if (status) { status.style.display = ''; status.textContent = '⏳ Synchronisiere…'; }
    try {
      const { fetchNightscout } = await import('../api.js');
      const nsEntries = await fetchNightscout(url, token, 288);
      const existingIds = new Set(state.entries.map(e => e.id));
      const newEntries  = nsEntries.filter(e => !existingIds.has(e.id));
      state.entries.push(...newEntries);
      state.entries.sort((a, b) => b.timestamp - a.timestamp);
      save();
      if (status) { status.textContent = `✅ ${newEntries.length} neue Einträge importiert`; }
      window.showSuccess('🔄', `${newEntries.length} CGM-Werte synchronisiert`);
    } catch (e) {
      if (status) { status.textContent = '❌ ' + e.message; }
      window.showError('Nightscout-Fehler: ' + e.message);
    }
  };

  // Dexcom CSV File-Input Handler
  document.getElementById('dexcomCsvInput')?.addEventListener('change', async (e) => {
    const file   = e.target.files?.[0];
    const status = document.getElementById('dexcomImportStatus');
    if (!file) return;
    if (status) { status.style.display = ''; status.textContent = '⏳ Lese Datei…'; }
    try {
      const text    = await file.text();
      const entries = _parseDexcomCSV(text);
      const existingTs = new Set(state.entries.map(e => e.timestamp));
      const newEntries = entries.filter(e => !existingTs.has(e.timestamp));
      state.entries.push(...newEntries);
      state.entries.sort((a, b) => b.timestamp - a.timestamp);
      save();
      const msg = `✅ ${newEntries.length} von ${entries.length} Einträgen importiert`;
      if (status) { status.textContent = msg; }
      window.showSuccess('📂', msg);
    } catch (err) {
      if (status) { status.textContent = '❌ ' + err.message; }
      window.showError('Import-Fehler: ' + err.message);
    }
    e.target.value = '';
  });
}

/** Parst eine Dexcom CLARITY CSV-Exportdatei */
function _parseDexcomCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Kopfzeile suchen (enthält "Zeitstempel" oder "Timestamp")
  let headerIdx = -1;
  let tsCol = -1, bzCol = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim().toLowerCase());
    // Deutsche CLARITY: "Zeitstempel (JJJJ-MM-TTThh:mm:ss)", "Glukosewert (mg/dL)"
    // Englische CLARITY: "Timestamp (YYYY-MM-DDThh:mm:ss)", "Glucose Value (mg/dL)"
    const tsIdx  = cols.findIndex(c => c.includes('zeitstempel') || c.includes('timestamp'));
    const bzIdx  = cols.findIndex(c => c.includes('glukosewert') || c.includes('glucose value'));
    if (tsIdx >= 0 && bzIdx >= 0) {
      headerIdx = i; tsCol = tsIdx; bzCol = bzIdx;
      break;
    }
  }
  if (headerIdx < 0) throw new Error('Keine CLARITY-Spalten gefunden. Bitte deutschen oder englischen Export verwenden.');

  const entries = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const tsRaw = cols[tsCol];
    const bzRaw = parseFloat(cols[bzCol]);
    if (!tsRaw || isNaN(bzRaw) || bzRaw <= 0) continue;
    const ts = new Date(tsRaw).getTime();
    if (isNaN(ts)) continue;
    entries.push({
      type:      'bz',
      timestamp: ts,
      value:     Math.round(bzRaw),
      note:      'Dexcom CGM',
      source:    'dexcom',
    });
  }
  return entries;
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
