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
import { state, setActiveUser, load, save, clearAll }
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

// ── Boot ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Service Worker registrieren
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
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

  // Achievements nach jedem Load prüfen
  checkAndUnlockAchievements();

  // Nightscout Auto-Sync (im Hintergrund, kein Blocking)
  _autoSyncNightscout();
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

// ── Profilwechsel (aus Settings) ──────────────────────────
async function switchToProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;
  await autoLogin(profile);
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

  // PIN
  closePinModal,
  pinKey,

  // SOS
  openSOS,
  showSOSInfo,
  closeHelper,

  // Utility (für Module)
  showToast,
  showSuccess,
  showError,
  checkAndUnlockAchievements,

  // State-Zugriff für Module
  getState: () => state,
  doSave:   save,
  doClear:  clearAll,
});
