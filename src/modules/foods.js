// ═══════════════════════════════════════════════════════════
//  LEBENSMITTEL-DATENBANK — Modul
// ═══════════════════════════════════════════════════════════
import { state, save }   from '../state.js';
import { BUILTIN_FOODS } from '../../data/foods.js';
import { searchOnlineFood } from '../api.js';
import { openModal, closeModal, renderModal } from '../ui/modal.js';
import { checkAndUnlockAchievements } from '../achievements.js';

export function render(container) {
  container.innerHTML = `
    <div class="page-header">
      <button class="btn-back" onclick="window.showPage('home')">‹</button>
      <h2 class="page-title">Lebensmittel</h2>
      <button class="btn btn-secondary btn-small" id="addFoodBtn">+ Neu</button>
    </div>

    <div class="form-group">
      <input class="form-input" type="search" id="foodDBSearch"
             placeholder="🔍 Suchen..." />
    </div>

    <div class="filter-row" id="foodsFilter">
      <button class="filter-btn active" data-filter="all">Alle</button>
      <button class="filter-btn" data-filter="custom">Meine</button>
      <button class="filter-btn" data-filter="online">Online</button>
      <button class="filter-btn" data-filter="builtin">Standard</button>
    </div>

    <div id="foodDBList" class="food-list" style="margin-top:4px"></div>
    <div id="modal-new-food" class="modal-overlay hidden"></div>`;
}

export function init() {
  let debounce = null;
  document.getElementById('foodDBSearch')?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => _renderFoodList(e.target.value.trim()), 300);
  });

  document.getElementById('foodsFilter')?.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    document.querySelectorAll('#foodsFilter .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.foodsDBFilter = btn.dataset.filter;
    _renderFoodList(document.getElementById('foodDBSearch')?.value || '');
  });

  document.getElementById('addFoodBtn')?.addEventListener('click', _openNewFoodModal);
  _renderFoodList('');
}

export function refresh() { _renderFoodList(''); }

function _getAllFoods() {
  const filter = state.foodsDBFilter || 'all';
  if (filter === 'custom')  return state.foodDB.filter(f => f.source === 'custom');
  if (filter === 'online')  return state.foodDB.filter(f => f.source === 'online');
  if (filter === 'builtin') return BUILTIN_FOODS;
  return [...BUILTIN_FOODS, ...state.foodDB];
}

function _renderFoodList(q) {
  const el = document.getElementById('foodDBList');
  if (!el) return;
  let foods = _getAllFoods();
  if (q) { const lq = q.toLowerCase(); foods = foods.filter(f => f.name.toLowerCase().includes(lq)); }

  if (!foods.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🥗</div><div class="empty-state-text">Keine Lebensmittel gefunden</div></div>`;
    return;
  }
  el.innerHTML = foods.slice(0, 50).map(f => `
    <div class="food-item" style="cursor:default">
      <span class="food-emoji">${f.emoji || '🍽️'}</span>
      <div class="food-info">
        <div class="food-name">${f.name}</div>
        <div class="food-kh">${f.khPer100g} g KH / 100g</div>
      </div>
      ${f.source === 'custom' ? `<button class="btn-icon" style="width:28px;height:28px;font-size:14px" onclick="window._deleteFood('${f.id}')">🗑️</button>` : ''}
    </div>`).join('');

  window._deleteFood = (id) => {
    state.foodDB = state.foodDB.filter(f => f.id !== id);
    save();
    _renderFoodList(document.getElementById('foodDBSearch')?.value || '');
  };
}

function _openNewFoodModal() {
  renderModal('modal-new-food', `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-header">
        <span class="modal-title">➕ Neues Lebensmittel</span>
        <button class="btn-icon" onclick="window._closeNewFood()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" type="text" id="newFoodName" placeholder="z.B. Omas Kuchen" maxlength="50" />
        </div>
        <div class="form-group">
          <label class="form-label">KH pro 100g</label>
          <input class="form-input" type="number" id="newFoodKH" placeholder="45" min="0" max="100" inputmode="decimal" />
        </div>
        <div class="form-group">
          <label class="form-label">Emoji</label>
          <input class="form-input" type="text" id="newFoodEmoji" placeholder="🍰" maxlength="2" />
        </div>
        <button class="btn btn-primary" onclick="window._saveNewFood()">✅ Speichern</button>
      </div>
    </div>`);

  window._closeNewFood = () => closeModal('modal-new-food');
  window._saveNewFood  = () => {
    const name  = document.getElementById('newFoodName')?.value?.trim();
    const kh    = parseFloat(document.getElementById('newFoodKH')?.value);
    const emoji = document.getElementById('newFoodEmoji')?.value?.trim() || '🍽️';
    if (!name || isNaN(kh)) { window.showError('Name und KH-Wert pflicht.'); return; }
    state.foodDB.push({
      id:         'custom_' + Date.now(),
      name, emoji,
      khPer100g:  kh,
      source:     'custom',
      defaultAmounts: [50, 100, 150],
    });
    save();
    checkAndUnlockAchievements();
    closeModal('modal-new-food');
    _renderFoodList('');
  };
}
