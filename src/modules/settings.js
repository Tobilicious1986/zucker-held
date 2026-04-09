// ═══════════════════════════════════════════════════════════
//  EINSTELLUNGEN — Modul
// ═══════════════════════════════════════════════════════════
import { state, save, clearAll } from '../state.js';
import { loadProfiles, createProfile, archiveProfile,
         getActiveProfileId, PROFILE_TYPES }  from '../auth/local-provider.js';
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

function _renderSettings() {
  const el = document.getElementById('settingsContent');
  if (!el) return;

  const profiles  = loadProfiles();
  const activeId  = getActiveProfileId();
  const authCfg   = loadAuthConfig();
  const wCfg      = getWidgetConfig();

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
            ${p.id !== activeId ? `<button class="btn btn-secondary btn-small" onclick="window.switchToProfile('${p.id}')">Wechseln</button>` : ''}
            ${profiles.length > 1 ? `<button class="btn btn-danger btn-small" onclick="window._archiveProfile('${p.id}')">✕</button>` : ''}
          </div>
        </div>`).join('')}
      <div class="settings-row">
        <button class="btn btn-ghost" style="width:100%" onclick="window.openAddProfile()">➕ Weiteres Profil</button>
      </div>
    </div>

    <!-- BZ-Einstellungen -->
    <div class="settings-section">
      <div class="settings-section-title">Blutzucker-Zielbereich</div>
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
    </div>

    <!-- Notfallkontakte -->
    <div class="settings-section">
      <div class="settings-section-title">Notfallkontakte</div>
      ${(state.settings.contacts || []).map((c, i) => `
        <div class="settings-row">
          <div class="settings-row-label">
            <div>${_esc(c.name)}</div>
            <div class="settings-row-sub">${_esc(c.phone)}</div>
          </div>
          <button class="btn btn-secondary btn-small" onclick="window._deleteContact(${i})">✕</button>
        </div>`).join('')}
      <div class="settings-row" style="flex-direction:column;align-items:stretch;gap:8px">
        <input class="form-input" type="text" id="newContactName" placeholder="Name" maxlength="40" />
        <input class="form-input" type="tel"  id="newContactPhone" placeholder="Telefonnummer" />
        <button class="btn btn-secondary" onclick="window._addContact()">➕ Kontakt hinzufügen</button>
      </div>
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

    <!-- Keycloak (nur Admin) -->
    <div class="settings-section">
      <div class="settings-section-title">Anmelde-Modus</div>
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
    </div>

    <!-- Errungenschaften -->
    <div class="settings-section">
      <div class="settings-section-title" style="padding:12px 20px 8px">Errungenschaften</div>
      <div style="padding:0 16px 16px">
        <div id="achievementsContainer"></div>
      </div>
    </div>

    <!-- Gefahrenzone -->
    <div class="settings-section">
      <div class="settings-section-title">Gefahrenzone</div>
      <div class="settings-row">
        <div class="settings-row-label">
          <div>Alle Daten löschen</div>
          <div class="settings-row-sub">Einträge, Lebensmittel, Achievements</div>
        </div>
        <button class="btn btn-danger btn-small" onclick="window._confirmClear()">Löschen</button>
      </div>
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

  window._confirmClear = () => {
    if (!confirm('Wirklich ALLE Daten löschen? Das kann nicht rückgängig gemacht werden!')) return;
    clearAll();
    window.showSuccess('🗑️', 'Alle Daten gelöscht');
    _renderSettings();
  };
}

function _esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
