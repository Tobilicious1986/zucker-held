// ═══════════════════════════════════════════════════════════
//  ZUCKER-HELD v4 — Entry Point
//  Boot → Auth → State → Theme → Dashboard
// ═══════════════════════════════════════════════════════════
import { auth }                    from './src/auth/auth.js';
import { migrateLegacyProfiles,
         loadProfiles, createProfile,
         updateProfile, archiveProfile,
         getActiveProfile, setActiveProfile,
         checkPin, PROFILE_TYPES }
                                   from './src/auth/local-provider.js';
import { state, setActiveUser, load, save, clearAll,
         hasSaveError, clearSaveError }
                                   from './src/state.js';
import { AVATARS, TIPS, ACTIVITIES } from './src/config.js';
import { showPage, setHomeRefreshFn, goBack }
                                   from './src/ui/router.js';
import { openModal, closeModal, renderModal, setupBackdropClose }
                                   from './src/ui/modal.js';
import { showToast, showSuccess, showError }
                                   from './src/ui/toast.js';
import { applyTheme }              from './src/ui/theme.js';
import { checkAndUnlockAchievements } from './src/achievements.js';
import { getBZStatus, getBZAdvice, formatTime }
                                   from './src/utils.js';
import { checkAndNotify, requestPermission, getPermissionStatus }
                                   from './src/notifications.js';

// ── Boot ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Service Worker registrieren
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // Nachrichten vom SW empfangen (z.B. Notification-Click → BZ-Seite)
    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'OPEN_PAGE') showPage(e.data.page || 'home');
    });
  }

  try {
    // Splash anzeigen (kurz)
    await delay(800);
    hideSplash();

    // Auth initialisieren
    const provider = await auth.init();

    // Legacy-Profile migrieren (einmalig)
    migrateLegacyProfiles();

    // Bereits eingeloggt?
    if (provider.isAuthenticated()) {
      const user = await provider.getUser();
      if (user) { await launchApp(user); return; }
    }

    // Profile laden und entscheiden
    const profiles = loadProfiles();
    if (profiles.length === 0) {
      showProfileSelector(true);
    } else if (profiles.length === 1) {
      // Direkt einloggen (kein PIN nötig für patient-Zugang)
      await autoLogin(profiles[0]);
    } else {
      showProfileSelector(false);
    }
  } catch (err) {
    console.error('[Zucker-Held] Boot-Fehler:', err);
    showBootError();
  }
});

// ── Splash ────────────────────────────────────────────────
function hideSplash() {
  const s = document.getElementById('splash');
  if (s) { s.classList.add('fade-out'); setTimeout(() => s.classList.add('hidden'), 400); }
}

function showBootError() {
  const s = document.getElementById('splash');
  if (!s) return;
  s.classList.remove('fade-out', 'hidden');
  s.innerHTML = `
    <div class="splash-content">
      <div class="splash-icon">⚠️</div>
      <h1>Zucker-Held</h1>
      <p style="opacity:.8">App konnte nicht geladen werden.</p>
      <button onclick="window.location.reload()" style="margin-top:24px;padding:12px 28px;border-radius:24px;border:none;background:rgba(255,255,255,0.25);color:white;font-size:16px;cursor:pointer">Neu laden</button>
    </div>
    <div class="splash-version">v4.3</div>`;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Profil-Auswahl ────────────────────────────────────────
function showProfileSelector(forceCreate = false) {
  const el = document.getElementById('profileSelector');
  if (el) el.classList.remove('hidden');
  renderProfileList(forceCreate);
}

function renderProfileList(forceCreate) {
  const list     = document.getElementById('profileList');
  const profiles = loadProfiles();
  if (!list) return;

  if (profiles.length === 0 || forceCreate) {
    list.innerHTML = `<p class="profile-empty">Noch kein Profil vorhanden.<br>Erstelle jetzt dein erstes Profil!</p>`;
    return;
  }

  list.innerHTML = profiles.map(p => `
    <button class="profile-card" onclick="window.selectProfile('${p.id}')">
      <span class="profile-card-avatar">${p.avatar}</span>
      <div class="profile-card-info">
        <div class="profile-card-name">${escHtml(p.name)}</div>
        <div class="profile-card-type">${p.type === 'kind' ? '👦 Kind' : '🧑 Erwachsener'}${p.pin ? ' 🔒' : ''}</div>
      </div>
      <span class="profile-card-arrow">›</span>
    </button>`).join('');
}

async function autoLogin(profile) {
  try {
    const user = await auth.provider.login({ profileId: profile.id, pin: null });
    await launchApp(user);
  } catch { showProfileSelector(false); }
}

// ── App starten ───────────────────────────────────────────
async function launchApp(user) {
  // State laden
  setActiveUser(user);
  load();

  // Theme anwenden
  applyTheme(user);

  // Header aktualisieren
  const avatar = document.getElementById('heroAvatar');
  if (avatar) avatar.textContent = user.avatar;
  updateHeaderDate();

  // App anzeigen
  document.getElementById('profileSelector')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');

  // Dashboard setup
  let renderDashboard;
  try {
    ({ renderDashboard } = await import('./src/ui/dashboard.js'));
  } catch (err) {
    console.error('[Zucker-Held] Dashboard-Import fehlgeschlagen:', err);
    document.getElementById('app')?.classList.add('hidden');
    showBootError();
    return;
  }
  const homePage = document.getElementById('page-home');
  if (homePage) renderDashboard(homePage, user);

  // Router konfigurieren
  setHomeRefreshFn(() => {
    import('./src/ui/dashboard.js').then(({ renderDashboard }) => {
      renderDashboard(document.getElementById('page-home'), user);
    });
  });

  // SOS-FAB prüfen
  updateSosFab();

  // Rollenbasierte UI-Einschränkungen
  applyRoleRestrictions(user);

  // Achievements nach jedem Load prüfen
  checkAndUnlockAchievements();

  // BL-03: Speicher-Fehler prüfen und melden
  if (hasSaveError()) {
    showToast('⚠️ Speicher fast voll — alte CGM-Daten wurden archiviert.', 'warning');
    clearSaveError();
  }

  // Nightscout Auto-Sync (im Hintergrund, kein Blocking)
  _autoSyncNightscout();

  // BL-07: BZ-Checks nach App-Start
  checkAndNotify(state.entries, state.settings);
}

async function _autoSyncNightscout() {
  const url   = state.settings.nightscoutUrl;
  const token = state.settings.nightscoutToken;
  if (!url) return;
  try {
    const { fetchNightscout } = await import('./src/api.js');
    const nsEntries = await fetchNightscout(url, token, 288);
    const existingIds = new Set(state.entries.map(e => e.id));
    const newEntries  = nsEntries.filter(e => !existingIds.has(e.id));
    if (newEntries.length === 0) return;
    state.entries.push(...newEntries);
    state.entries.sort((a, b) => b.timestamp - a.timestamp);
    save();
    showToast(`🔄 ${newEntries.length} CGM-Werte synchronisiert`, 'info');
    // BL-07: Nach Sync auf kritische Werte prüfen
    checkAndNotify(state.entries, state.settings);
  } catch {
    // Fehler beim Auto-Sync still ignorieren
  }
}

function updateHeaderDate() {
  const el = document.getElementById('headerDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ── Profil auswählen ──────────────────────────────────────
async function selectProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;

  if (profile.pin) {
    // PIN-Abfrage öffnen
    openPinModal(profile);
  } else {
    await autoLogin(profile);
  }
}

// ── Profil erstellen Modal ────────────────────────────────
let _newAvatar = '🦊';
let _newType   = 'kind';

function openAddProfile() {
  document.getElementById('profileSelector')?.classList.add('hidden');
  _newAvatar = '🦊';
  _newType   = 'kind';

  renderModal('modal-add-profile', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">🙋 Neues Profil</span>
        <button class="btn-icon" onclick="window.closeAddProfile()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Name:</label>
          <input class="form-input" type="text" id="newProfileName" placeholder="z.B. Malte oder Oma Ingrid" maxlength="30" />
        </div>

        <div class="form-group">
          <label class="form-label">Profiltyp:</label>
          <div class="profile-type-options">
            ${Object.entries(PROFILE_TYPES).map(([key, pt]) => `
              <button class="profile-type-btn ${key === _newType ? 'active' : ''}"
                      onclick="window.selectProfileType('${key}')">
                <span class="profile-type-emoji">${pt.emoji}</span>
                <div class="profile-type-info">
                  <div class="profile-type-label">${pt.label}</div>
                  <div class="profile-type-desc">${pt.desc}</div>
                </div>
              </button>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Avatar:</label>
          <div class="avatar-grid" id="newProfileAvatarGrid">
            ${AVATARS.map(a => `
              <button class="avatar-btn ${a === _newAvatar ? 'active' : ''}"
                      onclick="window.selectNewAvatar('${a}')">${a}</button>`).join('')}
          </div>
        </div>

        <div class="form-group" id="pinSection">
          <label class="form-label">Admin-PIN (für Eltern, optional):</label>
          <input class="form-input" type="number" id="newProfilePin"
                 placeholder="z.B. 1234" maxlength="4" min="1000" max="9999"
                 inputmode="numeric" />
          <p class="text-muted text-sm mt-2">Mit PIN können Eltern/Betreuer auf Einstellungen zugreifen.</p>
        </div>

        <button class="btn btn-primary" onclick="window.saveNewProfile()">
          ✅ Profil erstellen
        </button>
      </div>
    </div>`);

  setupBackdropClose('modal-add-profile');
}

function closeAddProfile() {
  closeModal('modal-add-profile');
  const profiles = loadProfiles();
  if (profiles.length === 0) {
    document.getElementById('profileSelector')?.classList.remove('hidden');
  }
}

function selectProfileType(type) {
  _newType = type;
  document.querySelectorAll('.profile-type-btn').forEach(b =>
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${type}'`))
  );
  // PIN-Sektion nur bei Kind anzeigen
  const pinSection = document.getElementById('pinSection');
  if (pinSection) pinSection.style.display = type === 'kind' ? '' : 'none';
}

function selectNewAvatar(avatar) {
  _newAvatar = avatar;
  document.querySelectorAll('.avatar-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === avatar)
  );
}

async function saveNewProfile() {
  const name = document.getElementById('newProfileName')?.value?.trim();
  if (!name) { showError('Bitte gib einen Namen ein.'); return; }

  const pin = document.getElementById('newProfilePin')?.value?.trim() || null;
  if (pin && (pin.length !== 4 || isNaN(pin))) {
    showError('PIN muss genau 4 Ziffern haben.');
    return;
  }

  const profile = createProfile({ name, avatar: _newAvatar, type: _newType, pin });
  closeModal('modal-add-profile');
  showSuccess('🎉', `Willkommen, ${name}!`);

  const user = await auth.provider.login({ profileId: profile.id, pin: null });
  await launchApp(user);
}

// ── PIN Modal ─────────────────────────────────────────────
let _pinTarget = null;
let _pinBuffer = '';

function openPinModal(profile) {
  _pinTarget = profile;
  _pinBuffer = '';

  renderModal('modal-pin', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">🔒 PIN eingeben</span>
        <button class="btn-icon" onclick="window.closePinModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-muted text-center mb-4">Für ${escHtml(profile.name)}</p>
        <div class="pin-display" id="pinDisplay">· · · ·</div>
        <div class="pin-grid">
          ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
            <button class="pin-btn ${k === '⌫' ? 'pin-btn-del' : ''}"
                    onclick="window.pinKey('${k}')"
                    ${k === '' ? 'style="visibility:hidden"' : ''}>${k}</button>`).join('')}
        </div>
      </div>
    </div>`);
}

function closePinModal() {
  _pinTarget = null;
  _pinBuffer = '';
  closeModal('modal-pin');
  showProfileSelector(false);
}

async function pinKey(k) {
  if (k === '⌫') {
    _pinBuffer = _pinBuffer.slice(0, -1);
  } else if (_pinBuffer.length < 4) {
    _pinBuffer += k;
  }

  // Display aktualisieren
  const display = document.getElementById('pinDisplay');
  if (display) {
    display.textContent = '●'.repeat(_pinBuffer.length) + '·'.repeat(4 - _pinBuffer.length);
  }

  if (_pinBuffer.length === 4) {
    if (checkPin(_pinTarget, _pinBuffer)) {
      closeModal('modal-pin');
      const user = await auth.provider.login({ profileId: _pinTarget.id, pin: _pinBuffer });
      await launchApp(user);
    } else {
      _pinBuffer = '';
      if (display) {
        display.textContent = '✗ Falscher PIN';
        display.style.color = '#DC2626';
        setTimeout(() => {
          display.textContent = '· · · ·';
          display.style.color = '';
        }, 1200);
      }
    }
  }
}

// ── Admin-Elevation (BL-04) ───────────────────────────────
// Öffnet PIN-Modal um temporär Admin-Rechte zu erlangen
// Nach Erfolg: callback() aufrufen (Settings neu rendern)
let _elevateCallback = null;
let _elevateAttempts = 0;
const _ELEVATE_MAX_ATTEMPTS = 3;
const _ELEVATE_LOCKOUT_MS   = 30_000;
let _elevateLocked = false;

function _elevateToAdmin(callback) {
  if (_elevateLocked) {
    showError('Zu viele Fehlversuche. Bitte 30 Sekunden warten.');
    return;
  }
  const user     = auth.provider._user;
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === user?.id);
  if (!profile?.pin) {
    // Kein PIN = kein Schutz → direkt erhöhen
    auth.provider.elevateRole('admin');
    if (callback) callback();
    return;
  }

  _elevateCallback = callback;
  _pinTarget  = profile;
  _pinBuffer  = '';

  renderModal('modal-pin-elevate', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">🔒 Admin-PIN</span>
        <button class="btn-icon" onclick="window._closeElevateModal()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-muted text-center mb-4">Eltern-PIN für Einstellungen</p>
        <div class="pin-display" id="pinDisplayElevate">· · · ·</div>
        <div class="pin-grid">
          ${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => `
            <button class="pin-btn ${k === '⌫' ? 'pin-btn-del' : ''}"
                    onclick="window._elevateKey('${k}')"
                    ${k === '' ? 'style="visibility:hidden"' : ''}>${k}</button>`).join('')}
        </div>
      </div>
    </div>`);
}

function _closeElevateModal() {
  _elevateCallback = null;
  _pinBuffer = '';
  closeModal('modal-pin-elevate');
}

function _elevateKey(k) {
  if (k === '⌫') {
    _pinBuffer = _pinBuffer.slice(0, -1);
  } else if (_pinBuffer.length < 4) {
    _pinBuffer += k;
  }

  const display = document.getElementById('pinDisplayElevate');
  if (display) {
    display.textContent = '●'.repeat(_pinBuffer.length) + '·'.repeat(4 - _pinBuffer.length);
  }

  if (_pinBuffer.length === 4) {
    if (checkPin(_pinTarget, _pinBuffer)) {
      _elevateAttempts = 0;
      auth.provider.elevateRole('admin');
      closeModal('modal-pin-elevate');
      _pinBuffer = '';
      if (_elevateCallback) { _elevateCallback(); _elevateCallback = null; }
    } else {
      _elevateAttempts++;
      _pinBuffer = '';
      if (display) {
        display.textContent = '✗ Falscher PIN';
        display.style.color = '#DC2626';
        if (_elevateAttempts >= _ELEVATE_MAX_ATTEMPTS) {
          _elevateLocked = true;
          closeModal('modal-pin-elevate');
          showError('Zu viele Fehlversuche — 30 Sekunden gesperrt.');
          setTimeout(() => { _elevateLocked = false; _elevateAttempts = 0; }, _ELEVATE_LOCKOUT_MS);
        } else {
          setTimeout(() => {
            display.textContent = '· · · ·';
            display.style.color = '';
          }, 1200);
        }
      }
    }
  }
}

// ── SOS ───────────────────────────────────────────────────
function updateSosFab() {
  const fab = document.getElementById('sosFab');
  if (!fab) return;
  const hasContacts = (state.settings.contacts || []).length > 0;
  fab.classList.toggle('hidden', !hasContacts);
}

function openSOS() {
  const overlay  = document.getElementById('helperOverlay');
  const contacts = state.settings.contacts || [];
  if (!overlay) return;

  overlay.innerHTML = `
    <h2 class="helper-title">🆘 Was ist los?</h2>
    <div class="helper-choice">
      <button class="helper-btn" onclick="window.showSOSInfo('low')">
        📉 Unterzucker (BZ zu niedrig)
      </button>
      <button class="helper-btn" onclick="window.showSOSInfo('high')">
        📈 Überzucker (BZ zu hoch)
      </button>
    </div>
    ${contacts.length ? `
      <div class="helper-info">
        <h3>📞 Notfallkontakte</h3>
        ${contacts.map(c => `
          <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.2)">
            <strong>${escHtml(c.name)}</strong><br>
            <a href="tel:${escHtml(c.phone)}" style="color:white;font-size:1.2em">${escHtml(c.phone)}</a>
          </div>`).join('')}
      </div>` : ''}
    <button class="helper-close" onclick="window.closeHelper()">✕ Schließen</button>`;

  overlay.classList.add('active');
}

function showSOSInfo(type) {
  const overlay = document.getElementById('helperOverlay');
  if (!overlay) return;

  const content = type === 'low' ? {
    title: '📉 Unterzucker',
    steps: [
      '15-20g schnelle KH essen (Traubenzucker, Saft, Cola)',
      '15 Minuten warten, BZ messen',
      'Wenn BZ noch < 70: nochmals 15g KH',
      'Wenn bewusstlos: Glucagon geben, Notarzt rufen!'
    ]
  } : {
    title: '📈 Überzucker',
    steps: [
      'BZ genau messen, Ketonwert prüfen',
      'Insulin nach Korrekturschema spritzen',
      'Viel Wasser trinken',
      'Wenn Ketone > 3 oder Übelkeit: Arzt anrufen!'
    ]
  };

  const prevContent = overlay.innerHTML;
  overlay.innerHTML = `
    <h2 class="helper-title">${content.title}</h2>
    <div class="helper-info">
      <ol class="learn-steps" style="list-style:none;padding:0">
        ${content.steps.map(s => `<li style="color:white;border-color:rgba(255,255,255,0.2)">${s}</li>`).join('')}
      </ol>
    </div>
    <button class="helper-btn" onclick="window.openSOS()">← Zurück</button>
    <button class="helper-close" onclick="window.closeHelper()">✕ Schließen</button>`;
}

function closeHelper() {
  const overlay = document.getElementById('helperOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ── Profilwechsel & Logout ────────────────────────────────
function logoutToProfileSelector() {
  auth.provider.logout?.();
  document.getElementById('app')?.classList.add('hidden');
  showProfileSelector(false);
}

async function switchToProfile(id) {
  logoutToProfileSelector();
  // Kurz warten bis UI settled, dann Profil auswählen
  setTimeout(() => selectProfile(id), 50);
}

// ── Profil bearbeiten ─────────────────────────────────────
let _editProfileId = null;
let _editAvatar    = '🦊';

function openEditProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;

  _editProfileId = id;
  _editAvatar    = profile.avatar;

  renderModal('modal-edit-profile', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">✏️ Profil bearbeiten</span>
        <button class="btn-icon" onclick="window.closeEditProfile()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Name:</label>
          <input class="form-input" type="text" id="editProfileName"
                 value="${escHtml(profile.name)}" maxlength="30" />
        </div>

        <div class="form-group">
          <label class="form-label">Avatar:</label>
          <div class="avatar-grid" id="editProfileAvatarGrid">
            ${AVATARS.map(a => `
              <button class="avatar-btn ${a === _editAvatar ? 'active' : ''}"
                      onclick="window.selectEditAvatar('${a}')">${a}</button>`).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">PIN ${profile.pin ? 'ändern' : 'setzen'} (optional):</label>
          <input class="form-input" type="number" id="editProfilePin"
                 placeholder="${profile.pin ? 'Leer lassen = unverändert' : 'z.B. 1234 (leer = kein PIN)'}"
                 maxlength="4" min="1000" max="9999" inputmode="numeric" />
          ${profile.pin ? `<button class="btn btn-ghost btn-small" style="margin-top:8px" onclick="window._removeEditPin()">🔓 PIN entfernen</button>` : ''}
        </div>

        <button class="btn btn-primary" onclick="window.saveEditProfile()">
          💾 Speichern
        </button>
      </div>
    </div>`);

  setupBackdropClose('modal-edit-profile');
}

function closeEditProfile() {
  closeModal('modal-edit-profile');
}

function selectEditAvatar(avatar) {
  _editAvatar = avatar;
  document.querySelectorAll('#editProfileAvatarGrid .avatar-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === avatar)
  );
}

async function saveEditProfile() {
  const name = document.getElementById('editProfileName')?.value?.trim();
  if (!name) { showError('Bitte gib einen Namen ein.'); return; }

  const pinInput = document.getElementById('editProfilePin')?.value?.trim();
  const changes  = { name, avatar: _editAvatar };

  if (pinInput) {
    if (pinInput.length !== 4 || isNaN(pinInput)) {
      showError('PIN muss genau 4 Ziffern haben.');
      return;
    }
    changes.pin = pinInput;
  }

  updateProfile(_editProfileId, changes);
  closeModal('modal-edit-profile');
  showSuccess('✅', 'Profil aktualisiert!');

  // Header-Avatar aktualisieren falls aktives Profil bearbeitet
  const activeProfile = getActiveProfile();
  if (activeProfile?.id === _editProfileId) {
    const avatarEl = document.getElementById('heroAvatar');
    if (avatarEl) avatarEl.textContent = _editAvatar;
  }
}

function _removeEditPin() {
  updateProfile(_editProfileId, { pin: null });
  closeModal('modal-edit-profile');
  showSuccess('🔓', 'PIN entfernt.');
}

// ── Rollenbasierte UI ─────────────────────────────────────
function applyRoleRestrictions(user) {
  const role = user.role;
  // Einstellungen nur für patient und admin sichtbar
  if (role === 'caregiver' || role === 'observer') {
    document.getElementById('settingsBtn')?.classList.add('hidden');
  }
  // Observer: keine Dateneingabe möglich
  if (role === 'observer') {
    document.querySelectorAll('.fab, .btn-primary').forEach(btn => {
      btn.setAttribute('disabled', 'true');
      btn.style.opacity = '0.4';
      btn.style.pointerEvents = 'none';
    });
  }
}

// ── Hilfsfunktionen ───────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                  .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ── Globale Exports (für HTML onclick + Module) ───────────
Object.assign(window, {
  // Navigation
  showPage,
  goBack,

  // Profile
  selectProfile,
  openAddProfile,
  closeAddProfile,
  selectProfileType,
  selectNewAvatar,
  saveNewProfile,
  switchToProfile,
  logoutToProfileSelector,

  // Profil bearbeiten
  openEditProfile,
  closeEditProfile,
  selectEditAvatar,
  saveEditProfile,
  _removeEditPin,

  // PIN
  closePinModal,
  pinKey,

  // Admin-Elevation (BL-04)
  _elevateToAdmin,
  _closeElevateModal,
  _elevateKey,

  // SOS
  openSOS,
  showSOSInfo,
  closeHelper,

  // Utility (für Module)
  showToast,
  showSuccess,
  showError,
  checkAndUnlockAchievements,

  // Notifications (BL-07)
  requestNotificationPermission: requestPermission,
  getNotificationStatus: getPermissionStatus,

  // State-Zugriff für Module
  getState: () => state,
  doSave:   save,
  doClear:  clearAll,
});
