// ═══════════════════════════════════════════════════════════
//  KH-RECHNER + MEAL BUILDER — Modul
// ═══════════════════════════════════════════════════════════
import { state, save }   from '../state.js';
import { BUILTIN_FOODS } from '../../data/foods.js';
import { searchOnlineFood, lookupBarcodeOnline } from '../api.js';
import { calcKH }        from '../utils.js';
import { openModal, closeModal, renderModal } from '../ui/modal.js';
import { checkAndUnlockAchievements } from '../achievements.js';

const MEAL_TIMES = ['Frühstück','Mittagessen','Abendessen','Snack'];

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">KH-Rechner</h2>
      <span class="page-icon">🧮</span>
    </div>

    <div class="card card-padded">
      <div class="form-group">
        <label class="form-label">Mahlzeit</label>
        <div class="toggle-group" id="calcMealTimeGroup">
          ${MEAL_TIMES.map((t,i) =>
            `<button class="toggle-btn${i===0?' active':''}" data-time="${t}">${t}</button>`
          ).join('')}
        </div>
      </div>
    </div>

    <div class="card card-padded">
      <div class="flex justify-between items-center mb-3">
        <div class="card-section-title" style="margin:0">Lebensmittel</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-small" id="openFoodSearchBtn">
            🔍 Suchen
          </button>
          <button class="btn btn-secondary btn-small" id="openBarcodeBtn">
            📷 Scan
          </button>
        </div>
      </div>
      <div id="mealBuilderList" class="meal-builder">
        <div class="empty-state" style="padding:20px 0">
          <div class="empty-state-icon">🍽️</div>
          <div class="empty-state-text">Lebensmittel hinzufügen</div>
        </div>
      </div>
    </div>

    <div class="meal-kh-total" id="khTotalCard" style="display:none">
      <div class="meal-kh-total-label">Gesamt Kohlenhydrate</div>
      <div>
        <span class="meal-kh-total-value" id="khTotalValue">0</span>
        <span class="meal-kh-total-unit"> g KH</span>
      </div>
    </div>

    <div id="omnipodHint" class="info-banner info-banner-purple" style="display:none">
      🎯 <strong>Omnipod 5:</strong> Gib <strong id="omnipodKH">0</strong> g KH in den Pod ein.
      Er berechnet die Insulindosis automatisch.
    </div>

    <div style="display:flex;gap:10px" id="calcActions" style="display:none">
      <button class="btn btn-secondary" style="flex:1" id="clearMealBtn">🗑️ Leeren</button>
      <button class="btn btn-primary" style="flex:2" id="saveMealBtn">💾 Mahlzeit speichern</button>
    </div>

    <!-- Modals -->
    <div id="modal-food-search" class="modal-overlay hidden"></div>
    <div id="modal-amount" class="modal-overlay hidden"></div>
    <div id="modal-barcode" class="modal-overlay hidden"></div>`;
}

export function init() {
  document.getElementById('calcMealTimeGroup')?.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#calcMealTimeGroup .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentMeal.mealTime = btn.dataset.time;
  });

  document.getElementById('openFoodSearchBtn')?.addEventListener('click', openFoodSearch);
  document.getElementById('openBarcodeBtn')?.addEventListener('click', openBarcodeScanner);
  document.getElementById('clearMealBtn')?.addEventListener('click', clearMeal);
  document.getElementById('saveMealBtn')?.addEventListener('click', saveMeal);

  if (!state.currentMeal) state.currentMeal = { items: [], mealTime: 'Frühstück' };
  _renderMealBuilder();
}

export function refresh() { _renderMealBuilder(); }

// ── Meal Builder ──────────────────────────────────────────
function _renderMealBuilder() {
  const list  = document.getElementById('mealBuilderList');
  const total = document.getElementById('khTotalCard');
  const hint  = document.getElementById('omnipodHint');
  const acts  = document.getElementById('calcActions');
  if (!list) return;

  const items = state.currentMeal?.items || [];
  const khSum = items.reduce((s, i) => s + (i.kh || 0), 0);

  if (!items.length) {
    list.innerHTML = `<div class="empty-state" style="padding:20px 0">
      <div class="empty-state-icon">🍽️</div>
      <div class="empty-state-text">Lebensmittel hinzufügen</div>
    </div>`;
    total && (total.style.display = 'none');
    hint  && (hint.style.display  = 'none');
    acts  && (acts.style.display  = 'none');
    return;
  }

  list.innerHTML = items.map((item, idx) => `
    <div class="meal-item">
      <span style="font-size:22px">${item.emoji || '🍽️'}</span>
      <div class="meal-item-info">
        <div class="meal-item-name">${item.name}</div>
        <div class="meal-item-kh">${item.amount}g · ${item.kh}g KH</div>
      </div>
      <button class="btn-icon" onclick="window._removeMealItem(${idx})" style="width:28px;height:28px;font-size:14px">✕</button>
    </div>`).join('');

  if (total) { total.style.display = ''; document.getElementById('khTotalValue').textContent = Math.round(khSum); }
  if (hint)  { hint.style.display  = ''; document.getElementById('omnipodKH').textContent = Math.round(khSum); }
  if (acts)  { acts.style.display  = 'flex'; }

  // Global für inline-onclick
  window._removeMealItem = (idx) => {
    state.currentMeal.items.splice(idx, 1);
    _renderMealBuilder();
  };
}

// ── Lebensmittel-Suche ────────────────────────────────────
let _searchDebounce = null;
let _onlineBuf      = [];

function openFoodSearch() {
  renderModal('modal-food-search', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">🔍 Lebensmittel suchen</span>
        <button class="btn-icon" onclick="window._closeFoodSearch()">✕</button>
      </div>
      <div class="modal-body">
        <div class="food-search-row">
          <input class="form-input" type="text" id="foodSearchInput"
                 placeholder="z.B. Vollkornbrot, Apfel..." autocomplete="off" />
        </div>
        <div id="foodSearchResults" class="food-list"></div>
      </div>
    </div>`);

  window._closeFoodSearch = () => closeModal('modal-food-search');

  const input = document.getElementById('foodSearchInput');
  input?.addEventListener('input', () => {
    clearTimeout(_searchDebounce);
    const q = input.value.trim();
    if (q.length < 2) { _renderLocalResults('', []); return; }
    _searchDebounce = setTimeout(async () => {
      const local  = _searchLocal(q);
      _renderLocalResults(q, local);
      const online = await searchOnlineFood(q).catch(() => []);
      _onlineBuf   = online;
      _renderLocalResults(q, [...local, ...online]);
    }, 400);
  });
  input?.focus();
  _renderLocalResults('', getAllFoods().slice(0, 12));
}

function _searchLocal(q) {
  const lq = q.toLowerCase();
  return getAllFoods().filter(f => f.name.toLowerCase().includes(lq)).slice(0, 8);
}

function getAllFoods() {
  return [...BUILTIN_FOODS, ...state.foodDB];
}

function _renderLocalResults(q, foods) {
  const el = document.getElementById('foodSearchResults');
  if (!el) return;
  if (!foods.length) { el.innerHTML = `<div class="empty-state" style="padding:20px 0"><div class="empty-state-text">Keine Treffer</div></div>`; return; }
  el.innerHTML = foods.map(f => `
    <button class="food-item" onclick="window._selectFood('${f.id}')">
      <span class="food-emoji">${f.emoji || '🍽️'}</span>
      <div class="food-info">
        <div class="food-name">${f.name}</div>
        <div class="food-kh">${f.khPer100g}g KH / 100g</div>
      </div>
      <span class="food-source food-source-${f.source || 'builtin'}">${f.source === 'custom' ? 'Eigenes' : f.source === 'online' ? 'Online' : ''}</span>
    </button>`).join('');

  window._selectFood = (id) => {
    const food = getAllFoods().find(f => f.id === id);
    if (food) openAmountModal(food);
  };
}

// ── Mengen-Modal ──────────────────────────────────────────
function openAmountModal(food) {
  closeModal('modal-food-search');
  state.selectedFoodForAmount = food;

  let amount = food.defaultAmounts?.[1] || 100;

  const renderAmount = () => {
    const kh = calcKH(food.khPer100g, amount);
    document.getElementById('amountDisplay').textContent = amount;
    document.getElementById('amountKH').textContent = kh;
  };

  renderModal('modal-amount', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">${food.emoji || '🍽️'} ${food.name}</span>
        <button class="btn-icon" onclick="window._closeAmount()">✕</button>
      </div>
      <div class="modal-body">
        <div class="amount-display" id="amountDisplay">${amount}</div>
        <div style="text-align:center;color:var(--text-secondary);font-size:13px;margin-top:-8px">Gramm</div>

        <div class="amount-kh-result">
          <div class="amount-kh-label">Kohlenhydrate</div>
          <div class="amount-kh-value"><span id="amountKH">${calcKH(food.khPer100g, amount)}</span> g KH</div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;margin:8px 0">
          <button class="stepper-btn" onclick="window._stepAmount(-10)">−10</button>
          <button class="stepper-btn" onclick="window._stepAmount(-5)">−5</button>
          <button class="stepper-btn" onclick="window._stepAmount(5)">+5</button>
          <button class="stepper-btn" onclick="window._stepAmount(10)">+10</button>
        </div>

        <div class="amount-presets">
          ${(food.defaultAmounts || [50,100,150]).map(a =>
            `<button class="amount-preset-btn" onclick="window._setAmount(${a})">${a}g</button>`
          ).join('')}
        </div>

        <input class="form-input text-center" type="number" id="amountInput"
               value="${amount}" min="1" max="2000" inputmode="decimal"
               style="font-size:24px;font-weight:700;text-align:center" />

        <button class="btn btn-primary" onclick="window._addToMeal()">➕ Zur Mahlzeit hinzufügen</button>
      </div>
    </div>`);

  document.getElementById('amountInput')?.addEventListener('input', e => {
    amount = parseInt(e.target.value) || 0;
    renderAmount();
  });

  window._closeAmount   = () => closeModal('modal-amount');
  window._stepAmount    = (delta) => {
    amount = Math.max(1, amount + delta);
    document.getElementById('amountInput').value = amount;
    renderAmount();
  };
  window._setAmount     = (val) => {
    amount = val;
    document.getElementById('amountInput').value = val;
    renderAmount();
  };
  window._addToMeal     = () => {
    const kh = calcKH(food.khPer100g, amount);
    if (!state.currentMeal) state.currentMeal = { items: [], mealTime: 'Frühstück' };
    state.currentMeal.items.push({ ...food, amount, kh });
    closeModal('modal-amount');
    _renderMealBuilder();
  };
}

// ── Barcode-Scanner ────────────────────────────────────────
function openBarcodeScanner() {
  renderModal('modal-barcode', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">📷 Barcode scannen</span>
        <button class="btn-icon" onclick="window._closeBarcode()">✕</button>
      </div>
      <div class="modal-body">
        <div class="barcode-video-container">
          <video id="barcodeVideo" autoplay playsinline muted></video>
          <div class="barcode-line"></div>
        </div>
        <p class="text-muted text-sm text-center mt-3">Barcode in den roten Bereich halten</p>
        <div id="barcodeStatus" class="info-banner info-banner-blue mt-3" style="display:none"></div>
      </div>
    </div>`);

  window._closeBarcode = () => {
    if (state._barcodeStream) { state._barcodeStream.getTracks().forEach(t => t.stop()); state._barcodeStream = null; }
    clearTimeout(state._barcodeTimer);
    closeModal('modal-barcode');
  };

  _startBarcodeScanner();
}

async function _startBarcodeScanner() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    state._barcodeStream = stream;
    const video = document.getElementById('barcodeVideo');
    if (video) { video.srcObject = stream; video.play(); }
    _detectBarcode(video);
  } catch {
    const s = document.getElementById('barcodeStatus');
    if (s) { s.style.display = ''; s.textContent = '📷 Kamera nicht verfügbar. Bitte Zugriff erlauben.'; s.className = 'info-banner info-banner-orange mt-3'; }
  }
}

function _detectBarcode(video) {
  if (!('BarcodeDetector' in window)) {
    const s = document.getElementById('barcodeStatus');
    if (s) { s.style.display = ''; s.textContent = 'Barcode-Scanner nicht unterstützt. Bitte manuell eingeben.'; }
    return;
  }
  const detector = new BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e'] });
  const scan = async () => {
    if (!document.getElementById('barcodeVideo')) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length > 0) {
        const code = codes[0].rawValue;
        if (state._barcodeStream) { state._barcodeStream.getTracks().forEach(t => t.stop()); state._barcodeStream = null; }
        const s = document.getElementById('barcodeStatus');
        if (s) { s.style.display = ''; s.textContent = `🔍 Suche ${code}...`; }
        const food = await lookupBarcodeOnline(code);
        closeModal('modal-barcode');
        if (food) {
          if (!state.foodDB.find(f => f.id === food.id)) state.foodDB.push(food);
          openAmountModal(food);
        } else {
          window.showError('Produkt nicht gefunden.');
        }
        return;
      }
    } catch {}
    state._barcodeTimer = setTimeout(scan, 500);
  };
  state._barcodeTimer = setTimeout(scan, 500);
}

// ── Mahlzeit speichern ────────────────────────────────────
function saveMeal() {
  const items = state.currentMeal?.items || [];
  if (!items.length) return;
  const kh   = items.reduce((s, i) => s + (i.kh || 0), 0);
  const name = items.length === 1 ? items[0].name : `${items.length} Lebensmittel`;

  state.entries.unshift({
    type:      'meal',
    timestamp: Date.now(),
    name,
    kh:        Math.round(kh),
    mealTime:  state.currentMeal.mealTime || 'Mittagessen',
    items:     items.map(i => ({ name: i.name, amount: i.amount, kh: i.kh })),
  });
  save();
  window.showSuccess('🍽️', `${Math.round(kh)} g KH gespeichert`);
  checkAndUnlockAchievements();
  clearMeal();
}

function clearMeal() {
  state.currentMeal = { items: [], mealTime: state.currentMeal?.mealTime || 'Frühstück' };
  _renderMealBuilder();
}
