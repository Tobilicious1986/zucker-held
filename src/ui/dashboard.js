// ═══════════════════════════════════════════════════════════
//  DASHBOARD — Zucker-Held v4
//  Widget-Renderer + Drag & Drop
// ═══════════════════════════════════════════════════════════
import { WIDGET_REGISTRY, getDefaultWidgetConfig } from '../widgets/widget-registry.js';
import { state, save }   from '../state.js';

const ROLE_ORDER = ['observer', 'caregiver', 'patient', 'admin'];
function hasMinRole(user, minRole) {
  return ROLE_ORDER.indexOf(user?.role || 'patient') >= ROLE_ORDER.indexOf(minRole || 'observer');
}

// ── Drag State ────────────────────────────────────────────
let _dragId    = null;
let _dragOver  = null;
let _editMode  = false;

// ── Dashboard rendern ─────────────────────────────────────
export function renderDashboard(container, user) {
  if (!container) return;

  const config  = getWidgetConfig();
  const visible = config.order.filter(id => !config.disabled.includes(id));

  container.innerHTML = `
    <div class="dashboard-header">
      <div>
        <div class="dashboard-greeting" id="dashGreeting"></div>
      </div>
      <button class="btn-dashboard-edit" id="dashEditBtn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Anpassen
      </button>
    </div>
    <div class="widget-list" id="widgetList"></div>`;

  // Greeting setzen
  _setGreeting(user);

  // Widgets rendern
  const list = container.querySelector('#widgetList');
  for (const widgetId of visible) {
    const def = WIDGET_REGISTRY.find(w => w.id === widgetId);
    if (!def) continue;
    if (!hasMinRole(user, def.minRole)) continue;

    const el = document.createElement('div');
    el.className = 'widget-item';
    el.setAttribute('data-widget-id', widgetId);
    el.setAttribute('draggable', 'false');
    list.appendChild(el);

    // Handle + Toggle (nur im Edit-Mode sichtbar via CSS)
    el.insertAdjacentHTML('beforeend', `
      <div class="widget-drag-handle" title="Ziehen zum Verschieben">⠿</div>
      <label class="toggle-switch widget-toggle" title="Widget ${config.disabled.includes(widgetId) ? 'aktivieren' : 'deaktivieren'}">
        <input type="checkbox" ${!config.disabled.includes(widgetId) ? 'checked' : ''}
               onchange="window._toggleWidget('${widgetId}', this.checked)" />
        <span class="toggle-slider"></span>
      </label>`);

    try { def.component(el, state, user); }
    catch (e) { console.warn('[Dashboard] Widget-Fehler:', widgetId, e); }
  }

  // Edit-Button
  document.getElementById('dashEditBtn')?.addEventListener('click', () => {
    _editMode = !_editMode;
    list.classList.toggle('editing', _editMode);
    list.querySelectorAll('.widget-item').forEach(el => {
      el.setAttribute('draggable', _editMode ? 'true' : 'false');
    });
    document.getElementById('dashEditBtn')?.classList.toggle('active', _editMode);
  });

  // Drag & Drop
  _setupDragAndDrop(list, user);

  // Widget-Toggle global
  window._toggleWidget = (id, enabled) => {
    const cfg = getWidgetConfig();
    if (enabled) cfg.disabled = cfg.disabled.filter(d => d !== id);
    else if (!cfg.disabled.includes(id)) cfg.disabled.push(id);
    saveWidgetConfig(cfg);
    renderDashboard(container, user);
  };
}

// ── Widget-Config ─────────────────────────────────────────
export function getWidgetConfig() {
  const saved = state.settings.widgetConfig;
  if (saved && saved.order) return saved;
  return getDefaultWidgetConfig();
}

export function saveWidgetConfig(cfg) {
  state.settings.widgetConfig = cfg;
  save();
}

// ── Greeting ──────────────────────────────────────────────
function _setGreeting(user) {
  const el = document.getElementById('dashGreeting');
  if (!el) return;
  const h = new Date().getHours();
  const greet = h < 11 ? 'Guten Morgen' : h < 17 ? 'Hallo' : 'Guten Abend';
  const name  = user?.name?.split(' ')[0] || '';
  el.textContent = `${greet}, ${name}! ${user?.avatar || '👋'}`;
}

// ── Drag & Drop ───────────────────────────────────────────
function _setupDragAndDrop(list, user) {
  list.addEventListener('dragstart', e => {
    const item = e.target.closest('.widget-item');
    if (!item) return;
    _dragId = item.dataset.widgetId;
    e.dataTransfer.effectAllowed = 'move';
    item.style.opacity = '0.5';
  });

  list.addEventListener('dragend', e => {
    const item = e.target.closest('.widget-item');
    if (item) item.style.opacity = '';
    _dragId = null;
    _dragOver = null;
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.widget-item');
    if (!item || item.dataset.widgetId === _dragId) return;
    _dragOver = item.dataset.widgetId;
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    if (!_dragId || !_dragOver || _dragId === _dragOver) return;

    const cfg   = getWidgetConfig();
    const order = [...cfg.order];
    const from  = order.indexOf(_dragId);
    const to    = order.indexOf(_dragOver);
    if (from === -1 || to === -1) return;

    order.splice(from, 1);
    order.splice(to, 0, _dragId);
    cfg.order = order;
    saveWidgetConfig(cfg);
    renderDashboard(list.closest('#page-home'), user);
  });
}
