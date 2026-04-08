// ═══════════════════════════════════════════════════════════
//  ZUCKER-HELD v3 — Hauptdatei
//  Omnipod 5 + Dexcom G7 Setup für Malte
// ═══════════════════════════════════════════════════════════
import { AVATARS, TIPS, ACTIVITIES }      from './src/config.js';
import {
  loadProfiles, createProfile, updateProfile, archiveProfile,
  getActiveProfile, getActiveProfileId, setActiveProfile,
  checkPin, migrateLegacyData,
}                                         from './src/profiles.js';
import { state, save, load, clearAll }    from './src/state.js';
import { BUILTIN_FOODS }                  from './data/foods.js';
import {
  getBZStatus, getBZAdvice, calcKH,
  getTimeInRange, getAvgBZ, getCurrentStreak,
  formatTime, toDateStr, formatDateLabel,
  escHtml, escAttr, emptyState,
}                                         from './src/utils.js';
import { searchOnlineFood, lookupBarcodeOnline } from './src/api.js';
import { renderSparkline }                from './src/chart.js';
import { checkAndUnlockAchievements, renderAchievements } from './src/achievements.js';

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Legacy-Daten in Profil migrieren (einmalig)
  migrateLegacyData();

  // Splash ausblenden, dann Profil-Auswahl oder App starten
  setTimeout(() => {
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('splash').classList.add('hidden');
      initApp();
    }, 500);
  }, 1400);
});

function initApp() {
  const profiles = loadProfiles();

  // Kein Profil → Profil-Erstellen erzwingen
  if (profiles.length === 0) {
    showProfileSelector(true); // true = kein "Zurück"-Button
    return;
  }

  // Genau ein Profil → direkt laden (ohne PIN)
  if (profiles.length === 1) {
    launchWithProfile(profiles[0]);
    return;
  }

  // Mehrere Profile → Auswahl zeigen
  const lastId = getActiveProfileId();
  const last   = lastId ? profiles.find(p => p.id === lastId) : null;
  if (last) {
    launchWithProfile(last);
    return;
  }
  showProfileSelector(false);
}

function launchWithProfile(profile) {
  setActiveProfile(profile.id, true);
  load();
  buildAvatarGrid();
  loadSettings();
  renderContactSettings();
  injectHelperUI();
  buildActivityGrid();
  renderProfileHeader(profile);

  document.getElementById('profileSelector').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  refreshDashboard();
}

function renderProfileHeader(profile) {
  document.getElementById('heroAvatar').textContent = profile.avatar || '🦸';
}

// ── Profil-Auswahl ────────────────────────────────────────
function showProfileSelector(forceCreate = false) {
  const el = document.getElementById('profileSelector');
  el.classList.remove('hidden');
  renderProfileList(forceCreate);
}

function renderProfileList(forceCreate) {
  const profiles = loadProfiles();
  const list = document.getElementById('profileList');

  if (profiles.length === 0 || forceCreate) {
    list.innerHTML = `
      <div style="text-align:center;padding:20px 0;color:#aaa;font-size:15px">
        Noch kein Profil vorhanden.<br>Erstelle jetzt dein erstes Profil!
      </div>`;
    return;
  }

  list.innerHTML = profiles.map(p => `
    <button class="profile-card" onclick="selectProfile('${p.id}')">
      <span class="profile-card-avatar">${p.avatar}</span>
      <div class="profile-card-info">
        <div class="profile-card-name">${escHtml(p.name)}</div>
        <div class="profile-card-type">${p.type === 'kind' ? '👦 Kind' : '🧑 Erwachsener'}</div>
      </div>
      <span class="profile-card-arrow">›</span>
    </button>
  `).join('');
}

function selectProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;
  launchWithProfile(profile);
}

// ── Profil erstellen ──────────────────────────────────────
let _newProfileAvatar = '🦊';
let _newProfileType   = 'kind';

function openAddProfile() {
  document.getElementById('profileSelector').classList.add('hidden');
  document.getElementById('modal-add-profile').classList.remove('hidden');
  document.getElementById('newProfileName').value = '';
  document.getElementById('newProfilePin').value  = '';
  _newProfileAvatar = '🦊';
  _newProfileType   = 'kind';
  buildNewProfileAvatarGrid();
  updatePinSectionVisibility();
  setTimeout(() => document.getElementById('newProfileName').focus(), 200);
}

function closeAddProfile() {
  document.getElementById('modal-add-profile').classList.add('hidden');
  // Profil-Selektor wieder zeigen, falls gerade aktiv
  const profiles = loadProfiles();
  if (profiles.length === 0) {
    document.getElementById('profileSelector').classList.remove('hidden');
  }
}

function buildNewProfileAvatarGrid() {
  document.getElementById('newProfileAvatarGrid').innerHTML = AVATARS.map(a =>
    `<div class="avatar-opt${a === _newProfileAvatar ? ' selected' : ''}"
          onclick="selectNewProfileAvatar(this,'${a}')">${a}</div>`
  ).join('');
}

function selectNewProfileAvatar(el, avatar) {
  document.querySelectorAll('#newProfileAvatarGrid .avatar-opt').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
  _newProfileAvatar = avatar;
}

function selectProfileType(btn) {
  document.querySelectorAll('.profile-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _newProfileType = btn.dataset.ptype;
  updatePinSectionVisibility();
}

function updatePinSectionVisibility() {
  document.getElementById('newProfilePinSection').style.display =
    _newProfileType === 'kind' ? '' : 'none';
}

function saveNewProfile() {
  const name = document.getElementById('newProfileName').value.trim();
  if (!name) { showToast('Bitte einen Namen eingeben'); return; }

  const pin = _newProfileType === 'kind'
    ? (document.getElementById('newProfilePin').value.trim() || null)
    : null;

  const profile = createProfile({
    name, avatar: _newProfileAvatar, type: _newProfileType, pin,
  });

  closeAddProfile();
  launchWithProfile(profile);
}

// ── Profil-Management in Einstellungen ───────────────────
function renderProfileSettings() {
  const el       = document.getElementById('profileSettingsArea');
  if (!el) return;
  const profiles  = loadProfiles();
  const activeId  = getActiveProfileId();

  el.innerHTML = profiles.map(p => `
    <div class="profile-settings-item ${p.id === activeId ? 'active-profile' : ''}">
      <span class="profile-settings-avatar">${p.avatar}</span>
      <div class="profile-settings-info">
        <div class="profile-settings-name">${escHtml(p.name)}</div>
        <div class="profile-settings-type">${p.type === 'kind' ? '👦 Kind' : '🧑 Erwachsener'}${p.pin ? ' 🔒' : ''}</div>
      </div>
      <div class="profile-settings-actions">
        ${p.id !== activeId ? `<button class="btn-secondary small" onclick="switchToProfile('${p.id}')">Wechseln</button>` : '<span style="font-size:12px;color:var(--green);font-weight:700">● Aktiv</span>'}
      </div>
    </div>
  `).join('') + `
    <button class="btn-add-profile" onclick="openAddProfile()" style="margin-top:10px">
      ➕ Weiteres Profil hinzufügen
    </button>
  `;
}

function switchToProfile(id) {
  const profiles = loadProfiles();
  const profile  = profiles.find(p => p.id === id);
  if (!profile) return;

  // Falls Ziel-Profil ein Kind-Profil ohne PIN ist, direkt wechseln
  launchWithProfile(profile);
  showPage('home');
}

// ── PIN-Modal (für Admin-Zugang) ──────────────────────────
let _pinCallback = null;

function requestPin(callback) {
  _pinCallback = callback;
  document.getElementById('pinInput').value = '';
  document.getElementById('pinError').style.display = 'none';
  document.getElementById('modal-pin').classList.remove('hidden');
  setTimeout(() => document.getElementById('pinInput').focus(), 200);
}

function closePinModal() {
  document.getElementById('modal-pin').classList.add('hidden');
  _pinCallback = null;
}

function submitPin() {
  const pin     = document.getElementById('pinInput').value.trim();
  const profile = getActiveProfile();

  if (checkPin(profile, pin)) {
    closePinModal();
    if (_pinCallback) _pinCallback();
  } else {
    document.getElementById('pinError').style.display = 'block';
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
  }
}

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
function refreshDashboard() {
  const now = new Date();

  document.getElementById('headerDate').textContent = now.toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  document.getElementById('heroAvatar').textContent = state.settings.avatar || '🦸';

  // Begrüßung
  const name  = state.settings.name || 'Held';
  const hour  = now.getHours();
  const greet = hour < 11 ? '☀️ Guten Morgen' : hour < 17 ? '🌤️ Hallo' : '🌙 Guten Abend';
  document.getElementById('greeting').textContent = `${greet}, ${name}! 👋`;

  // Letzter BZ + Status
  const bzEntries = state.entries.filter(e => e.type === 'bz');
  const statusCard = document.getElementById('statusCard');
  if (bzEntries.length > 0) {
    const last = bzEntries[bzEntries.length - 1];
    document.getElementById('lastBZ').textContent    = last.value;
    document.getElementById('lastBZTime').textContent = formatTime(last.timestamp);
    const { emoji, cls } = getBZStatus(last.value, state.settings);
    document.getElementById('statusEmoji').textContent = emoji;
    statusCard.className = 'status-card ' + cls;
  } else {
    document.getElementById('lastBZ').textContent    = '--';
    document.getElementById('lastBZTime').textContent = 'Schau auf deinen Dexcom G7 📡';
    document.getElementById('statusEmoji').textContent = '📊';
    statusCard.className = 'status-card';
  }

  // Heute-Zähler
  const today        = toDateStr(now);
  const todayEntries = state.entries.filter(e => toDateStr(new Date(e.timestamp)) === today);
  document.getElementById('bzCount').textContent      = todayEntries.filter(e => e.type === 'bz').length;
  document.getElementById('insulinCount').textContent = todayEntries.filter(e => e.type === 'insulin').length;
  document.getElementById('mealCount').textContent    = todayEntries.filter(e => e.type === 'meal').length;

  // Tages-Tipp
  document.getElementById('tipCard').textContent = TIPS[now.getDate() % TIPS.length];

  // Statistik-Widget
  renderStatsWidget();

  // Sparkline-Chart
  renderDashboardChart();
}

function renderStatsWidget() {
  const tir    = getTimeInRange(state.entries, state.settings);
  const avg    = getAvgBZ(state.entries, 7);
  const streak = getCurrentStreak(state.entries);

  document.getElementById('statTIR').textContent    = tir    != null ? tir + '%'    : '--';
  document.getElementById('statAvg').textContent    = avg    != null ? avg + ' mg'  : '--';
  document.getElementById('statStreak').textContent = streak > 0 ? streak + ' 🔥' : '--';
}

function renderDashboardChart() {
  const canvas = document.getElementById('bzSparkline');
  if (!canvas) return;
  const bzEntries = state.entries.filter(e => e.type === 'bz');

  // Skalierung für Retina
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  canvas.getContext('2d').scale(dpr, dpr);

  renderSparkline(canvas, bzEntries, state.settings);
}

// ═══════════════════════════════════════════════════════════
//  BLUTZUCKER
// ═══════════════════════════════════════════════════════════
function previewBZRange() {
  const val = parseInt(document.getElementById('bzValue').value);
  const el  = document.getElementById('bzPreviewMsg');
  if (!val) { el.textContent = ''; el.className = 'bz-preview-msg'; return; }

  const { level } = getBZStatus(val, state.settings);
  const texts = {
    critical: '🚨 SOFORT! 2 Traubenzucker nehmen und Erwachsenen rufen!',
    low:      '😟 Unterzucker — 1 Traubenzucker + blutig nachmessen!',
    ok:       '🎉 Super — genau im Zielbereich!',
    high:     '😅 Etwas hoch — viel Wasser trinken!',
    veryhigh: '⚠️ Sehr hoch — beobachten, nach 1h nochmal messen.',
  };
  el.textContent = texts[level];
  el.className   = 'bz-preview-msg ' + level;
}

function saveBZ() {
  const val = parseInt(document.getElementById('bzValue').value);
  if (!val || val < 20 || val > 600) {
    showToast('Bitte einen gültigen Wert eingeben (20–600)');
    return;
  }
  const note = document.getElementById('bzNote').value;
  state.entries.push({
    type: 'bz', value: val,
    when: state.selectedMeasureTime,
    note, timestamp: Date.now(),
  });
  save();

  const { level, emoji } = getBZStatus(val, state.settings);
  const messages = {
    critical: ['🚨 SOFORT 2 Traubenzucker! Erwachsenen rufen!'],
    low:      ['🍬 1 Traubenzucker nehmen. Dexcom per blutigem Test bestätigen!',
               '😟 Unterzucker! Traubenzucker + nach 15 Min. nochmal messen.'],
    ok:       ['Super Wert! 🎉 Du bist ein Held!', 'Perfekt — weiter so! ⭐',
               'Toller Wert! Dein Omnipod macht einen super Job! 💪'],
    high:     ['💧 Viel Wasser trinken! Dein Omnipod passt auf dich auf.',
               'Gut gemessen! Etwas hoch — Wasser hilft! 💧'],
    veryhigh: ['⚠️ Sehr hoch — beobachten & nach 1 Stunde nochmal messen.',
               '💧 Viel Wasser trinken. Erst nach 1h wird es wirklich kritisch.'],
  };
  const msgs = messages[level] || messages.ok;
  showSuccess(emoji, msgs[Math.floor(Math.random() * msgs.length)]);

  document.getElementById('bzValue').value    = '';
  document.getElementById('bzNote').value     = '';
  document.getElementById('bzPreviewMsg').textContent = '';
  refreshRecentBZ();
  refreshDashboard();
  checkAndUnlockAchievements();
}

// ═══════════════════════════════════════════════════════════
//  INSULIN
// ═══════════════════════════════════════════════════════════
function saveInsulin() {
  const units = state.insulinUnits;
  if (units === 0) { showToast('Bitte Einheiten eingeben'); return; }
  const note = document.getElementById('insulinNote').value;
  state.entries.push({
    type: 'insulin', value: units,
    insulinType: state.selectedInsulinType,
    note, timestamp: Date.now(),
  });
  save();
  showSuccess('💉', `${units} IE gespeichert!`);
  state.insulinUnits = 0;
  document.getElementById('insulinValue').textContent = '0';
  document.getElementById('insulinNote').value        = '';
  refreshRecentInsulin();
  refreshDashboard();
}

function stepInsulin(delta) {
  state.insulinUnits = Math.max(0, Math.min(100, parseFloat((state.insulinUnits + delta).toFixed(1))));
  document.getElementById('insulinValue').textContent = state.insulinUnits;
}

function selectInsulinType(btn) {
  document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedInsulinType = btn.dataset.type;
}

// ═══════════════════════════════════════════════════════════
//  MAHLZEIT (Schnelleintrag)
// ═══════════════════════════════════════════════════════════
function saveMeal() {
  const name  = document.getElementById('mealName').value.trim();
  const carbs = parseInt(document.getElementById('mealCarbs').value);
  if (!name) { showToast('Bitte Mahlzeit eingeben'); return; }
  state.entries.push({
    type: 'meal', name, carbs: carbs || 0,
    mealTime: state.selectedMealTime,
    timestamp: Date.now(),
  });
  save();
  showSuccess('🍽️', `${name} eingetragen! Vergiss den Omnipod nicht! 💉`);
  document.getElementById('mealName').value  = '';
  document.getElementById('mealCarbs').value = '';
  refreshRecentMeals();
  refreshDashboard();
  checkAndUnlockAchievements();
}

// ═══════════════════════════════════════════════════════════
//  SPORT / AKTIVITÄT
// ═══════════════════════════════════════════════════════════
function buildActivityGrid() {
  const grid = document.getElementById('activityGrid');
  if (!grid) return;
  grid.innerHTML = ACTIVITIES.map(a =>
    `<button class="activity-btn" data-activity="${a.id}" onclick="selectActivity(this)">
      <span>${a.emoji}</span><span>${a.name}</span>
    </button>`
  ).join('');
}

function selectActivity(btn) {
  document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedActivity = btn.dataset.activity;
}

function selectActivityIntensity(btn) {
  document.querySelectorAll('.intensity-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedActivityIntensity = btn.dataset.intensity;
}

function saveActivity() {
  const activityId   = state.selectedActivity;
  const intensityId  = state.selectedActivityIntensity || 'mittel';
  const duration     = parseInt(document.getElementById('activityDuration').value) || 30;
  const note         = document.getElementById('activityNote').value.trim();

  if (!activityId) { showToast('Bitte Sport auswählen'); return; }

  const act = ACTIVITIES.find(a => a.id === activityId) || { emoji: '🏅', name: 'Sport' };

  state.entries.push({
    type:       'activity',
    activity:   activityId,
    name:       act.name,
    emoji:      act.emoji,
    intensity:  intensityId,
    duration,
    note,
    timestamp:  Date.now(),
  });
  save();
  showSuccess(act.emoji, `${act.name} (${duration} Min.) gespeichert!`);

  // Reset
  document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('activityDuration').value = '30';
  document.getElementById('activityNote').value     = '';
  state.selectedActivity = null;

  refreshDashboard();
  checkAndUnlockAchievements();

  // BZ-Hinweis nach Sport
  setTimeout(() => showToast('💡 Tipp: Sport kann den BZ senken — im Auge behalten!'), 2500);
}

// ═══════════════════════════════════════════════════════════
//  KH-RECHNER — Mahlzeit-Builder
// ═══════════════════════════════════════════════════════════
function selectCalcMealTime(btn) {
  document.querySelectorAll('#calcMealTimeOptions .time-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.currentMeal.mealTime = btn.dataset.meal;
}

function renderMealBuilder() {
  const items = state.currentMeal.items;
  document.getElementById('mealBuilderEmpty').style.display = items.length === 0 ? '' : 'none';

  const list = document.getElementById('mealBuilderList');
  if (items.length === 0) { list.innerHTML = ''; updateKHTotals(); return; }

  list.innerHTML = items.map((item, idx) => {
    const kh = calcKH(item.khPer100g, item.amountG);
    return `<div class="meal-item">
      <span class="meal-item-emoji">${item.emoji || '🍽️'}</span>
      <div class="meal-item-body">
        <div class="meal-item-name">${escHtml(item.name)}</div>
        <div class="meal-item-meta">${item.amountG}g · ${item.khPer100g}g KH/100g</div>
      </div>
      <div class="meal-item-kh">${kh}g <small>KH</small></div>
      <button class="btn-remove-item" onclick="removeMealItem(${idx})">🗑️</button>
    </div>`;
  }).join('');

  updateKHTotals();
}

function updateKHTotals() {
  const items = state.currentMeal.items;
  const total = items.reduce((s, i) => s + calcKH(i.khPer100g, i.amountG), 0);
  const be    = (total / 12).toFixed(1);

  const card = document.getElementById('khTotalCard');
  card.style.display = items.length > 0 ? '' : 'none';

  document.getElementById('khTotalValue').textContent      = total;
  document.getElementById('khBEValue').textContent         = `= ${be} BE`;
  document.getElementById('khTotalForOmnipod').textContent = total;
}

function removeMealItem(idx) {
  state.currentMeal.items.splice(idx, 1);
  renderMealBuilder();
}

function clearMealBuilder() {
  state.currentMeal.items = [];
  renderMealBuilder();
}

function saveCalcMeal() {
  const items = state.currentMeal.items;
  if (items.length === 0) { showToast('Keine Lebensmittel hinzugefügt'); return; }

  const total = items.reduce((s, i) => s + calcKH(i.khPer100g, i.amountG), 0);
  const names = items.map(i => i.emoji + ' ' + i.name).join(', ');

  state.entries.push({
    type: 'meal', name: names, carbs: total,
    mealTime: state.currentMeal.mealTime,
    items: [...items], timestamp: Date.now(),
  });
  save();
  showSuccess('🧮', `${total}g KH gespeichert!\nIn Omnipod eingeben ✅`);
  state.currentMeal.items = [];
  renderMealBuilder();
  refreshDashboard();
  checkAndUnlockAchievements();
}

// ═══════════════════════════════════════════════════════════
//  LEBENSMITTEL-SUCHE
// ═══════════════════════════════════════════════════════════
function getAllFoods() {
  const builtin = BUILTIN_FOODS.map(f => ({ ...f, source: 'builtin' }));
  return [...state.foodDB, ...builtin];
}

function openFoodSearch() {
  document.getElementById('modal-food-search').classList.remove('hidden');
  document.getElementById('foodSearchInput').value = '';
  document.getElementById('searchResultsSection').classList.add('hidden');
  document.getElementById('recentFoodsSection').style.display = '';
  document.getElementById('foodSearchStatus').classList.add('hidden');
  renderRecentFoods();
  setTimeout(() => document.getElementById('foodSearchInput').focus(), 200);
}

function closeFoodSearch() {
  document.getElementById('modal-food-search').classList.add('hidden');
}
function closeFoodSearchOnBackdrop(e) {
  if (e.target === document.getElementById('modal-food-search')) closeFoodSearch();
}

function renderRecentFoods() {
  const all    = getAllFoods();
  const recent = state.recentFoodIds
    .map(id => all.find(f => f.id === id))
    .filter(Boolean)
    .slice(0, 8);

  const chips = document.getElementById('recentFoodsList');
  if (recent.length === 0) {
    document.getElementById('recentFoodsSection').style.display = 'none';
    return;
  }
  chips.innerHTML = recent.map(f =>
    `<div class="food-chip" onclick="selectFoodFromSearch('${escAttr(f.id)}')">
      ${f.emoji || '🍽️'} ${escHtml(f.name)}
    </div>`
  ).join('');
}

function onFoodSearch(query) {
  clearTimeout(state._foodSearchDebounce);
  query = query.trim();

  if (!query) {
    document.getElementById('searchResultsSection').classList.add('hidden');
    document.getElementById('recentFoodsSection').style.display = '';
    document.getElementById('foodSearchStatus').classList.add('hidden');
    return;
  }

  document.getElementById('recentFoodsSection').style.display = 'none';
  document.getElementById('searchResultsSection').classList.remove('hidden');

  const localResults = searchLocalFoods(query);
  renderSearchResults(localResults, state._lastOnlineResults || []);

  state._foodSearchDebounce = setTimeout(async () => {
    const status = document.getElementById('foodSearchStatus');
    status.classList.remove('hidden');
    status.textContent = '🌍 Suche online…';
    try {
      const onlineResults = await searchOnlineFood(query);
      state._lastOnlineResults = onlineResults;
      status.classList.add('hidden');
      renderSearchResults(searchLocalFoods(query), onlineResults);
    } catch {
      status.textContent = '⚠️ Offline — nur lokale Ergebnisse';
      setTimeout(() => status.classList.add('hidden'), 3000);
    }
  }, 500);
}

function searchLocalFoods(query) {
  const q = query.toLowerCase();
  return getAllFoods().filter(f => f.name.toLowerCase().includes(q)).slice(0, 12);
}

function renderSearchResults(local, online) {
  const label  = document.getElementById('searchResultsLabel');
  const listEl = document.getElementById('searchResultsList');
  const total  = local.length + online.length;

  label.textContent = `${total} Ergebnis${total !== 1 ? 'se' : ''}`;

  const renderItem = f => {
    const sourceCls   = f.source === 'online' ? 'source-online' :
                        f.source === 'builtin' ? 'source-builtin' : 'source-local';
    const sourceLabel = f.source === 'online' ? '🌍 Online' :
                        f.source === 'builtin' ? '📚 Eingebaut' : '⭐ Eigen';
    const safeId = escAttr(f.id);
    return `<div class="search-result-item" onclick="selectFoodFromSearch('${safeId}')">
      <span class="search-result-emoji">${f.emoji || '🍽️'}</span>
      <div class="search-result-body">
        <div class="search-result-name">${escHtml(f.name)}</div>
        <div class="search-result-kh">${f.khPer100g}g KH pro 100g</div>
      </div>
      <span class="search-result-source ${sourceCls}">${sourceLabel}</span>
    </div>`;
  };

  if (total === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-light)">
      Keine Ergebnisse — <a onclick="openAddNewFood()" style="color:var(--purple);cursor:pointer">Selbst anlegen?</a>
    </div>`;
    return;
  }

  // Online-Ergebnisse im State zwischenspeichern für selectFoodFromSearch
  online.forEach(f => {
    if (!state.foodDB.find(fb => fb.id === f.id)) {
      // Temporär hinzufügen (ohne save) damit selectFoodFromSearch es findet
      state._lastOnlineResults = online;
    }
  });

  listEl.innerHTML = [...local, ...online].map(renderItem).join('');
}

function selectFoodFromSearch(foodId) {
  let food = getAllFoods().find(f => f.id === foodId);

  // Online-Ergebnis aus Puffer holen
  if (!food) {
    food = (state._lastOnlineResults || []).find(f => f.id === foodId);
  }

  if (!food) { showToast('Lebensmittel nicht gefunden'); return; }

  // Online-Lebensmittel speichern
  if (food.source === 'online') {
    if (!state.foodDB.find(f => f.id === food.id)) {
      state.foodDB.push({ ...food });
      save();
    }
  }

  addToRecent(food.id);
  closeFoodSearch();
  openAmountModal(food);
}

function addToRecent(id) {
  state.recentFoodIds = [id, ...state.recentFoodIds.filter(i => i !== id)].slice(0, 8);
  save();
}

// ═══════════════════════════════════════════════════════════
//  BARCODE SCANNER
// ═══════════════════════════════════════════════════════════
async function openBarcodeScanner() {
  closeFoodSearch();
  document.getElementById('modal-barcode').classList.remove('hidden');
  document.getElementById('barcodeManualSection').style.display = 'none';
  showBarcodeStatus('📷 Kamera wird gestartet…');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    state._barcodeStream = stream;
    const video = document.getElementById('barcodeVideo');
    video.srcObject = stream;
    await video.play();

    if ('BarcodeDetector' in window) {
      const detector = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });
      showBarcodeStatus('🔍 Halte einen Barcode vor die Kamera…');
      state._barcodeTimer = setInterval(async () => {
        try {
          const codes = await detector.detect(video);
          if (codes.length > 0) {
            clearInterval(state._barcodeTimer);
            stopBarcodeCamera();
            showBarcodeStatus('✅ Barcode erkannt! Suche…');
            await handleBarcodeResult(codes[0].rawValue);
          }
        } catch { /* Erkennungsfehler ignorieren */ }
      }, 300);
    } else {
      showBarcodeStatus('📷 Kamera bereit — bitte Barcode manuell eingeben');
      document.getElementById('barcodeManualSection').style.display = '';
    }
  } catch {
    showBarcodeStatus('❌ Kamera nicht verfügbar');
    document.getElementById('barcodeManualSection').style.display = '';
  }
}

async function handleBarcodeResult(code) {
  showBarcodeStatus('🔍 Barcode wird gesucht…');
  try {
    const food = await lookupBarcodeOnline(code);
    if (!food) {
      showBarcodeStatus('❌ Produkt nicht gefunden — bitte manuell eingeben');
      document.getElementById('barcodeManualSection').style.display = '';
      return;
    }
    if (!state.foodDB.find(f => f.id === food.id)) {
      state.foodDB.push(food);
      save();
    }
    closeBarcodeScanner();
    addToRecent(food.id);
    openAmountModal(food);
    checkAndUnlockAchievements();
  } catch {
    showBarcodeStatus('⚠️ Offline — Barcode kann nicht gesucht werden');
    document.getElementById('barcodeManualSection').style.display = '';
  }
}

function lookupManualBarcode() {
  const code = document.getElementById('manualBarcodeInput').value.trim();
  if (!code) return;
  handleBarcodeResult(code);
}

function stopBarcodeCamera() {
  if (state._barcodeStream) {
    state._barcodeStream.getTracks().forEach(t => t.stop());
    state._barcodeStream = null;
  }
  clearInterval(state._barcodeTimer);
}

function closeBarcodeScanner() {
  stopBarcodeCamera();
  document.getElementById('modal-barcode').classList.add('hidden');
}

function showBarcodeStatus(msg) {
  document.getElementById('barcodeStatus').textContent = msg;
}

// ═══════════════════════════════════════════════════════════
//  MENGEN-MODAL
// ═══════════════════════════════════════════════════════════
function openAmountModal(food) {
  state.selectedFoodForAmount = food;
  document.getElementById('modal-amount').classList.remove('hidden');
  document.getElementById('amountFoodTitle').textContent = `${food.emoji || '🍽️'} ${food.name}`;
  document.getElementById('amountKhPer100').value = food.khPer100g;

  const defaultAmt = food.defaultAmounts?.[0] || 100;
  document.getElementById('amountGrams').value = defaultAmt;

  const amounts = food.defaultAmounts || [50, 100, 150, 200];
  document.getElementById('quickAmounts').innerHTML = amounts.map(a =>
    `<button class="quick-amount-btn${a === defaultAmt ? ' active' : ''}"
             onclick="setQuickAmount(${a}, this)">${a}g</button>`
  ).join('');

  updateAmountCalc();
}

function closeAmountModal() {
  document.getElementById('modal-amount').classList.add('hidden');
  state.selectedFoodForAmount = null;
}
function closeAmountOnBackdrop(e) {
  if (e.target === document.getElementById('modal-amount')) closeAmountModal();
}

function setQuickAmount(amount, btn) {
  document.getElementById('amountGrams').value = amount;
  document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updateAmountCalc();
}

function stepAmount(delta) {
  const input = document.getElementById('amountGrams');
  input.value = Math.max(1, (parseInt(input.value) || 0) + delta);
  updateAmountCalc();
}

function updateAmountCalc() {
  const kh100 = parseFloat(document.getElementById('amountKhPer100').value) || 0;
  const g     = parseInt(document.getElementById('amountGrams').value)      || 0;
  const kh    = calcKH(kh100, g);
  const be    = (kh / 12).toFixed(1);
  document.getElementById('amountKHResult').textContent = kh;
  document.getElementById('amountBEResult').textContent = `= ${be} BE`;
}

function addFoodToMeal() {
  const food = state.selectedFoodForAmount;
  if (!food) return;
  const kh100  = parseFloat(document.getElementById('amountKhPer100').value) || food.khPer100g;
  const amount = parseInt(document.getElementById('amountGrams').value)       || 100;

  state.currentMeal.items.push({
    id: food.id, name: food.name,
    emoji: food.emoji || '🍽️',
    khPer100g: kh100, amountG: amount,
  });

  closeAmountModal();
  renderMealBuilder();
  showToast(`${food.emoji || ''} ${food.name} hinzugefügt`);
}

// ═══════════════════════════════════════════════════════════
//  NEUES LEBENSMITTEL MODAL
// ═══════════════════════════════════════════════════════════
function openAddNewFood() {
  document.getElementById('modal-new-food').classList.remove('hidden');
  document.getElementById('newFoodName').value  = '';
  document.getElementById('newFoodKH').value    = '';
  document.getElementById('newFoodEmoji').value = '';
  setTimeout(() => document.getElementById('newFoodName').focus(), 200);
}

function closeNewFoodModal() {
  document.getElementById('modal-new-food').classList.add('hidden');
}
function closeNewFoodOnBackdrop(e) {
  if (e.target === document.getElementById('modal-new-food')) closeNewFoodModal();
}

function saveNewFood() {
  const name  = document.getElementById('newFoodName').value.trim();
  const kh    = parseFloat(document.getElementById('newFoodKH').value);
  const emoji = document.getElementById('newFoodEmoji').value.trim() || '🍽️';

  if (!name)                           { showToast('Bitte Namen eingeben'); return; }
  if (isNaN(kh) || kh < 0 || kh > 100) { showToast('Bitte KH/100g eingeben (0–100)'); return; }

  const food = {
    id: 'custom_' + Date.now(), name, emoji, khPer100g: kh,
    source: 'custom', defaultAmounts: [50, 100, 150],
  };
  state.foodDB.unshift(food);
  save();
  closeNewFoodModal();
  showSuccess('⭐', `${emoji} ${name} gespeichert!`);
  renderFoodsDB();
  checkAndUnlockAchievements();
}

// ═══════════════════════════════════════════════════════════
//  LEBENSMITTEL-DB SEITE
// ═══════════════════════════════════════════════════════════
function filterFoodsDB(btn) {
  document.querySelectorAll('[data-dbfilter]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.foodsDBFilter = btn.dataset.dbfilter;
  renderFoodsDB();
}

function renderFoodsDB() {
  const query  = (document.getElementById('foodsDBSearch')?.value || '').toLowerCase().trim();
  const filter = state.foodsDBFilter;

  let foods = getAllFoods();
  if (filter === 'custom')  foods = foods.filter(f => f.source === 'custom' || f.source === 'online');
  if (filter === 'builtin') foods = foods.filter(f => f.source === 'builtin');
  if (query) foods = foods.filter(f => f.name.toLowerCase().includes(query));

  const el = document.getElementById('foodsDBList');
  if (!el) return;

  if (foods.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🥗</div><p>Keine Lebensmittel gefunden</p></div>`;
    return;
  }

  el.innerHTML = foods.map(f => {
    const canDelete = f.source === 'custom' || f.source === 'online';
    return `<div class="foods-db-item">
      <span class="foods-db-emoji">${f.emoji || '🍽️'}</span>
      <div class="foods-db-body">
        <div class="foods-db-name">${escHtml(f.name)}</div>
        <div class="foods-db-kh">${f.khPer100g}g KH pro 100g</div>
      </div>
      <div class="foods-db-actions">
        <button class="btn-use-food" onclick="useFoodFromDB('${escAttr(f.id)}')">+ Nutzen</button>
        ${canDelete ? `<button class="btn-delete-food" onclick="deleteFoodFromDB('${escAttr(f.id)}')">🗑️</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function useFoodFromDB(id) {
  const food = getAllFoods().find(f => f.id === id);
  if (!food) return;
  addToRecent(food.id);
  showPage('calc');
  openAmountModal(food);
}

function deleteFoodFromDB(id) {
  state.foodDB        = state.foodDB.filter(f => f.id !== id);
  state.recentFoodIds = state.recentFoodIds.filter(i => i !== id);
  save();
  renderFoodsDB();
  showToast('Lebensmittel gelöscht');
}

// ═══════════════════════════════════════════════════════════
//  EINSTELLUNGEN
// ═══════════════════════════════════════════════════════════
function saveSettings() {
  state.settings.name = document.getElementById('settingName').value.trim() || 'Malte';
  state.settings.min  = parseInt(document.getElementById('settingMin').value) || 70;
  state.settings.max  = parseInt(document.getElementById('settingMax').value) || 180;
  save();
  showSuccess('⚙️', 'Einstellungen gespeichert!');
  document.getElementById('heroAvatar').textContent = state.settings.avatar || '🦸';
  setTimeout(() => { refreshDashboard(); showPage('home'); }, 1500);
}

function loadSettings() {
  document.getElementById('settingName').value = state.settings.name || '';
  document.getElementById('settingMin').value  = state.settings.min  || 70;
  document.getElementById('settingMax').value  = state.settings.max  || 180;
}

function buildAvatarGrid() {
  document.getElementById('avatarGrid').innerHTML = AVATARS.map(a =>
    `<div class="avatar-opt${a === state.settings.avatar ? ' selected' : ''}" onclick="selectAvatar(this,'${a}')">${a}</div>`
  ).join('');
}

function selectAvatar(el, avatar) {
  document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
  state.settings.avatar = avatar;
}

function clearAllData() {
  if (confirm('Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden!')) {
    clearAll();
    refreshDashboard();
    showToast('Alle Daten wurden gelöscht');
    showPage('home');
  }
}

// ── Notfallkontakte ───────────────────────────────────────
function addContact() {
  const name = document.getElementById('newContactName').value.trim();
  const num  = document.getElementById('newContactNum').value.trim();
  if (!name || !num) { showToast('Bitte Name und Nummer eingeben'); return; }
  if (!state.settings.contacts) state.settings.contacts = [];
  state.settings.contacts.push({ name, num });
  save();
  document.getElementById('newContactName').value = '';
  document.getElementById('newContactNum').value  = '';
  renderContactSettings();
  showToast('Kontakt gespeichert!');
}

function deleteContact(idx) {
  state.settings.contacts.splice(idx, 1);
  save();
  renderContactSettings();
}

function renderContactSettings() {
  const el       = document.getElementById('contactSettingsList');
  const contacts = state.settings.contacts || [];
  if (contacts.length === 0) {
    el.innerHTML = '<div style="font-size:14px;color:var(--text-light);margin-bottom:8px">Noch keine Kontakte gespeichert.</div>';
    return;
  }
  el.innerHTML = contacts.map((c, i) =>
    `<div class="saved-contact">
      <div><strong>${escHtml(c.name)}</strong> — ${escHtml(c.num)}</div>
      <button class="contact-del" onclick="deleteContact(${i})">🗑️</button>
    </div>`
  ).join('');
}

function focusContactSettings() {
  setTimeout(() => document.getElementById('newContactName').focus(), 300);
}

// ═══════════════════════════════════════════════════════════
//  VERLAUFS-LISTE
// ═══════════════════════════════════════════════════════════
function refreshRecentBZ() {
  const el      = document.getElementById('recentBZ');
  const entries = state.entries.filter(e => e.type === 'bz').slice(-5).reverse();
  if (!entries.length) { el.innerHTML = emptyState('🩸', 'Noch keine Messungen'); return; }
  el.innerHTML = entries.map(e => {
    const { cls, level } = getBZStatus(e.value, state.settings);
    const badgeCls = cls.replace('range-', 'badge-');
    const labels   = { critical: '🚨 Kritisch', low: '😟 Niedrig', ok: '✅ Super', high: '😅 Hoch', veryhigh: '⚠️ Sehr hoch' };
    return `<div class="entry-card">
      <span class="entry-icon">🩸</span>
      <div class="entry-body">
        <div class="entry-value">${e.value} <small style="font-size:14px;color:var(--text-light)">mg/dL</small></div>
        <div class="entry-meta">${e.when} · ${formatTime(e.timestamp)}${e.note ? ' · '+e.note : ''}</div>
      </div>
      <span class="entry-badge ${badgeCls}">${labels[level]}</span>
    </div>`;
  }).join('');
}

function refreshRecentInsulin() {
  const el      = document.getElementById('recentInsulin');
  const entries = state.entries.filter(e => e.type === 'insulin').slice(-5).reverse();
  if (!entries.length) { el.innerHTML = emptyState('💉', 'Noch keine Einträge'); return; }
  el.innerHTML = entries.map(e =>
    `<div class="entry-card">
      <span class="entry-icon">💉</span>
      <div class="entry-body">
        <div class="entry-value">${e.value} IE</div>
        <div class="entry-meta">${e.insulinType}wirkend · ${formatTime(e.timestamp)}${e.note ? ' · '+e.note : ''}</div>
      </div>
    </div>`
  ).join('');
}

function refreshRecentMeals() {
  const el      = document.getElementById('recentMeals');
  const entries = state.entries.filter(e => e.type === 'meal').slice(-5).reverse();
  if (!entries.length) { el.innerHTML = emptyState('🍎', 'Noch keine Mahlzeiten'); return; }
  el.innerHTML = entries.map(e =>
    `<div class="entry-card">
      <span class="entry-icon">🍽️</span>
      <div class="entry-body">
        <div class="entry-value">${escHtml(e.name)}</div>
        <div class="entry-meta">${e.mealTime} · ${formatTime(e.timestamp)}${e.carbs ? ' · '+e.carbs+'g KH' : ''}</div>
      </div>
    </div>`
  ).join('');
}

function refreshHistory() {
  const el = document.getElementById('historyList');
  let entries = [...state.entries];
  if (state.historyFilter !== 'all') entries = entries.filter(e => e.type === state.historyFilter);
  entries = entries.reverse();

  if (!entries.length) { el.innerHTML = emptyState('📖', 'Noch keine Einträge'); return; }

  const groups = {};
  entries.forEach(e => {
    const d = toDateStr(new Date(e.timestamp));
    if (!groups[d]) groups[d] = [];
    groups[d].push(e);
  });

  let html = '';
  Object.keys(groups).sort().reverse().forEach(date => {
    html += `<div class="history-date-header">${formatDateLabel(date)}</div>`;
    html += groups[date].map(renderEntryCard).join('');
  });
  el.innerHTML = html;
}

function renderEntryCard(e) {
  if (e.type === 'bz') {
    const { cls, level } = getBZStatus(e.value, state.settings);
    const badgeCls = cls.replace('range-', 'badge-');
    const labels   = { critical: '🚨 Kritisch', low: '😟 Niedrig', ok: '✅ Super', high: '😅 Hoch', veryhigh: '⚠️ Sehr hoch' };
    return `<div class="entry-card">
      <span class="entry-icon">🩸</span>
      <div class="entry-body">
        <div class="entry-value">${e.value} <small style="font-size:14px;color:var(--text-light)">mg/dL</small></div>
        <div class="entry-meta">${e.when} · ${formatTime(e.timestamp)}${e.note ? ' · '+e.note : ''}</div>
      </div>
      <span class="entry-badge ${badgeCls}">${labels[level]}</span>
    </div>`;
  }
  if (e.type === 'insulin') {
    return `<div class="entry-card">
      <span class="entry-icon">💉</span>
      <div class="entry-body">
        <div class="entry-value">${e.value} IE</div>
        <div class="entry-meta">${e.insulinType}wirkend · ${formatTime(e.timestamp)}</div>
      </div>
    </div>`;
  }
  if (e.type === 'meal') {
    return `<div class="entry-card">
      <span class="entry-icon">🍽️</span>
      <div class="entry-body">
        <div class="entry-value">${escHtml(e.name)}</div>
        <div class="entry-meta">${e.mealTime} · ${formatTime(e.timestamp)}${e.carbs ? ' · '+e.carbs+'g KH' : ''}</div>
      </div>
    </div>`;
  }
  if (e.type === 'activity') {
    const intensityLabel = { leicht: '🟢 Leicht', mittel: '🟡 Mittel', hoch: '🔴 Intensiv' };
    return `<div class="entry-card">
      <span class="entry-icon">${e.emoji || '🏅'}</span>
      <div class="entry-body">
        <div class="entry-value">${escHtml(e.name)}</div>
        <div class="entry-meta">${intensityLabel[e.intensity] || e.intensity} · ${e.duration} Min. · ${formatTime(e.timestamp)}</div>
      </div>
    </div>`;
  }
  return '';
}

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const el  = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');
  else document.getElementById('nav-home')?.classList.add('active');

  if (page === 'bz')       refreshRecentBZ();
  if (page === 'insulin')  refreshRecentInsulin();
  if (page === 'meal')     refreshRecentMeals();
  if (page === 'history')  refreshHistory();
  if (page === 'home')     refreshDashboard();
  if (page === 'calc')     renderMealBuilder();
  if (page === 'foods')    renderFoodsDB();
  if (page === 'activity') buildActivityGrid();
  if (page === 'settings') {
    loadSettings();
    renderContactSettings();
    renderAchievements('achievementsContainer');
    renderProfileSettings();
  }
  if (page === 'learn') {
    state.learnVisits = (state.learnVisits || 0) + 1;
    save();
    checkAndUnlockAchievements();
  }

  document.querySelector('.main').scrollTop = 0;
}

// ── Auswahl-Helfer ────────────────────────────────────────
function selectTime(btn) {
  document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedMeasureTime = btn.dataset.time;
}

function selectMealTime(btn) {
  document.querySelectorAll('[data-meal]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedMealTime = btn.dataset.meal;
}

function showLearnTab(btn, tabId) {
  document.querySelectorAll('.learn-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.learn-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function filterHistory(btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.historyFilter = btn.dataset.filter;
  refreshHistory();
}

// ═══════════════════════════════════════════════════════════
//  UI-HELFER
// ═══════════════════════════════════════════════════════════
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

function showSuccess(icon, text) {
  const el = document.getElementById('successAnim');
  document.getElementById('successIcon').textContent = icon;
  document.getElementById('successText').textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2000);
}

// ═══════════════════════════════════════════════════════════
//  HELFER-MODUS (SOS)
// ═══════════════════════════════════════════════════════════
function injectHelperUI() {
  const fab = document.createElement('button');
  fab.className = 'sos-fab';
  fab.onclick   = openHelperMode;
  fab.innerHTML = '<span>🆘</span>HILFE';
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.id        = 'helperOverlay';
  overlay.className = 'helper-overlay';
  overlay.style.display = 'none';
  overlay.innerHTML = `
    <div class="helper-header">
      <div>
        <h1>🆘 HILFE für ${state.settings.name || 'Malte'}</h1>
        <p>Diabetes-Notfall — Schritt für Schritt</p>
      </div>
      <button class="helper-close" onclick="closeHelperMode()">✕</button>
    </div>
    <div class="helper-body">
      <div class="helper-bz-display" id="helperBZDisplay">
        <div class="label">Letzter bekannter Blutzucker</div>
        <div class="value" id="helperBZValue">-- mg/dL</div>
        <div style="font-size:12px;color:var(--text-light);margin-top:4px" id="helperBZTime"></div>
      </div>
      <div id="helperChoiceScreen">
        <div class="helper-choice-title">Wie fühlt sich ${state.settings.name || 'Malte'} an?</div>
        <div class="helper-choices">
          <button class="choice-btn choice-btn-low" onclick="showHelperSteps('low')">
            <span class="choice-icon">😟</span>
            <div class="choice-text">Zittrig, schwitzig, blass<br><small>→ Wahrscheinlich Unterzucker</small></div>
          </button>
          <button class="choice-btn choice-btn-high" onclick="showHelperSteps('high')">
            <span class="choice-icon">😅</span>
            <div class="choice-text">Sehr durstig, müde, Kopfschmerzen<br><small>→ Wahrscheinlich Überzucker</small></div>
          </button>
          <button class="choice-btn" style="background:linear-gradient(135deg,#E74C3C,#8E44AD)" onclick="showHelperSteps('sos')">
            <span class="choice-icon">🚨</span>
            <div class="choice-text">Bewusstlos oder nicht ansprechbar<br><small>→ Sofort Notruf!</small></div>
          </button>
        </div>
      </div>
      <div id="helperStepsLow" class="helper-steps-view">
        <button class="helper-back-btn" onclick="showHelperChoice()">← Zurück</button>
        <div class="helper-step-title">😟 Unterzucker</div>
        <div class="helper-step-subtitle">Blutzucker unter 70 mg/dL — jetzt schnell handeln!</div>
        <div class="helper-step-card urgent">
          <div class="step-label">⚡ SOFORT</div>
          <div class="step-text">Traubenzucker geben!</div>
          <div class="step-sub">3–4 Täfelchen Traubenzucker ODER 150ml Apfelsaft / Cola (kein Light!)<br>Traubenzucker ist im Schulranzen oder in der Hosentasche!</div>
        </div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 1 — nach 5 Minuten</div>
          <div class="step-text">Kind ruhig hinsetzen lassen</div>
          <div class="step-sub">Es braucht etwas Zeit, damit der Zucker steigt</div>
        </div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 2 — nach 15 Minuten</div>
          <div class="step-text">Dexcom G7 oder Omnipod-App anschauen</div>
          <div class="step-sub">Steigt der Wert? Wenn ja: Super! Ein kleiner Snack mit KH (z.B. Brot)</div>
        </div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 3</div>
          <div class="step-text">Eltern informieren</div>
        </div>
        <div class="helper-step-card urgent">
          <div class="step-label">⚠️ WENN KEINE BESSERUNG</div>
          <div class="step-text">Notruf 112 anrufen!</div>
          <div class="step-sub">Sagen: "Das Kind hat Diabetes und einen schweren Unterzucker"</div>
        </div>
        <div class="helper-contacts" id="helperContactsLow"></div>
      </div>
      <div id="helperStepsHigh" class="helper-steps-view">
        <button class="helper-back-btn" onclick="showHelperChoice()">← Zurück</button>
        <div class="helper-step-title">😅 Überzucker</div>
        <div class="helper-step-subtitle">Blutzucker über 180 mg/dL — ruhig bleiben!</div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 1</div>
          <div class="step-text">Viel Wasser trinken lassen</div>
          <div class="step-sub">Kein Saft, kein Limonade — nur Wasser!</div>
        </div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 2</div>
          <div class="step-text">Omnipod-App anschauen</div>
          <div class="step-sub">Der Omnipod 5 bemerkt hohen Zucker und gibt automatisch mehr Insulin</div>
        </div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 3</div>
          <div class="step-text">Eltern informieren</div>
        </div>
        <div class="helper-step-card urgent">
          <div class="step-label">⚠️ BEI SEHR HOHEM WERT (über 300)</div>
          <div class="step-text">Sofort Eltern anrufen!</div>
        </div>
        <div class="helper-contacts" id="helperContactsHigh"></div>
      </div>
      <div id="helperStepsSos" class="helper-steps-view">
        <button class="helper-back-btn" onclick="showHelperChoice()">← Zurück</button>
        <div class="helper-step-title">🚨 Notfall</div>
        <div class="helper-step-subtitle">Kind ist nicht ansprechbar — sofort handeln!</div>
        <div class="helper-step-card urgent">
          <div class="step-label">⚡ SOFORT — Schritt 1</div>
          <div class="step-text">NOTRUF 112 ANRUFEN</div>
          <div class="step-sub">Sagen: "Das Kind hat Typ-1-Diabetes und ist bewusstlos. Wir vermuten schweren Unterzucker."</div>
        </div>
        <div class="helper-step-card urgent">
          <div class="step-label">⚡ SOFORT — Schritt 2</div>
          <div class="step-text">Eltern anrufen</div>
        </div>
        <div class="helper-step-card normal">
          <div class="step-label">Schritt 3</div>
          <div class="step-text">In stabile Seitenlage bringen</div>
          <div class="step-sub">Mund freihalten, nichts schlucken lassen</div>
        </div>
        <div class="helper-contacts" id="helperContactsSos"></div>
        <a href="tel:112" class="contact-call-btn" style="margin-top:20px;justify-content:center">
          <span class="call-icon">📞</span> Notruf 112 anrufen
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function openHelperMode() {
  const overlay = document.getElementById('helperOverlay');
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';

  const bzEntries = state.entries.filter(e => e.type === 'bz');
  if (bzEntries.length > 0) {
    const last = bzEntries[bzEntries.length - 1];
    document.getElementById('helperBZValue').textContent = last.value + ' mg/dL';
    document.getElementById('helperBZTime').textContent  = '(gemessen: ' + formatTime(last.timestamp) + ')';
  } else {
    document.getElementById('helperBZValue').textContent = 'Schau auf den Dexcom G7 📡';
    document.getElementById('helperBZTime').textContent  = '';
  }

  showHelperChoice();
  renderHelperContacts();
}

function closeHelperMode() {
  document.getElementById('helperOverlay').style.display = 'none';
}

function showHelperChoice() {
  document.getElementById('helperChoiceScreen').style.display = 'block';
  ['Low','High','Sos'].forEach(t => document.getElementById('helperSteps'+t).classList.remove('active'));
}

function showHelperSteps(type) {
  document.getElementById('helperChoiceScreen').style.display = 'none';
  ['Low','High','Sos'].forEach(t => document.getElementById('helperSteps'+t).classList.remove('active'));
  document.getElementById('helperSteps' + type.charAt(0).toUpperCase() + type.slice(1)).classList.add('active');
}

function renderHelperContacts() {
  const contacts = state.settings.contacts || [];
  ['Low','High','Sos'].forEach(type => {
    const el = document.getElementById('helperContacts' + type);
    if (!el) return;
    if (contacts.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = '<h3>📞 Jetzt anrufen:</h3>' +
      contacts.map(c =>
        `<a href="tel:${escAttr(c.num)}" class="contact-call-btn">
          <span class="call-icon">📞</span>
          <span><strong>${escHtml(c.name)}</strong><br><span style="font-size:14px;opacity:0.9">${escHtml(c.num)}</span></span>
        </a>`
      ).join('');
  });
}

// ═══════════════════════════════════════════════════════════
//  GLOBALE EXPORTS (für HTML onclick-Handler)
// ═══════════════════════════════════════════════════════════
Object.assign(window, {
  // Profil-System
  showProfileSelector, selectProfile, openAddProfile, closeAddProfile,
  saveNewProfile, selectProfileType, selectNewProfileAvatar,
  switchToProfile, requestPin, closePinModal, submitPin,
  // App-Seiten
  showPage, saveBZ, previewBZRange, selectTime,
  saveInsulin, stepInsulin, selectInsulinType,
  saveMeal, selectMealTime,
  saveActivity, selectActivity, selectActivityIntensity,
  selectCalcMealTime, renderMealBuilder, removeMealItem, clearMealBuilder, saveCalcMeal,
  openFoodSearch, closeFoodSearch, closeFoodSearchOnBackdrop, onFoodSearch, selectFoodFromSearch,
  openBarcodeScanner, closeBarcodeScanner, lookupManualBarcode,
  openAmountModal, closeAmountModal, closeAmountOnBackdrop, setQuickAmount, stepAmount, updateAmountCalc, addFoodToMeal,
  openAddNewFood, closeNewFoodModal, closeNewFoodOnBackdrop, saveNewFood,
  filterFoodsDB, renderFoodsDB, useFoodFromDB, deleteFoodFromDB,
  saveSettings, clearAllData, selectAvatar, addContact, deleteContact, focusContactSettings,
  filterHistory, showLearnTab,
  openHelperMode, closeHelperMode, showHelperChoice, showHelperSteps,
});
