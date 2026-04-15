// ═══════════════════════════════════════════════════════════
//  WIDGET REGISTRY — Zucker-Held v4
// ═══════════════════════════════════════════════════════════
import { bzHeroWidget }      from './bz-hero.js';
import { bzStatusWidget }    from './bz-status.js';
import { statsWidget }       from './stats.js';
import { quickActionsWidget} from './quick-actions.js';
import { todayLogWidget }    from './today-log.js';
import { tipWidget }         from './tip.js';
import { chart7dayWidget }   from './chart-7day.js';
import { achWidget }         from './achievements.js';
import { dailyChallengesWidget } from './daily-challenges.js';

export const WIDGET_REGISTRY = [
  { id: 'bz-hero',       title: 'BZ Aktuell',          icon: '🩸', component: bzHeroWidget,      defaultEnabled: true,  defaultOrder: 0, minRole: 'observer'  },
  { id: 'bz-status',     title: 'BZ Karte (klein)',    icon: '💧', component: bzStatusWidget,    defaultEnabled: false, defaultOrder: 1, minRole: 'observer'  },
  { id: 'stats',         title: 'Statistiken',         icon: '📊', component: statsWidget,       defaultEnabled: true,  defaultOrder: 2, minRole: 'observer'  },
  { id: 'quick-actions', title: 'Schnellaktionen',     icon: '⚡', component: quickActionsWidget, defaultEnabled: true,  defaultOrder: 3, minRole: 'caregiver' },
  { id: 'daily-challenges', title: 'Tages-Challenges', icon: '🎯', component: dailyChallengesWidget, defaultEnabled: true, defaultOrder: 4, minRole: 'patient' },
  { id: 'today-log',     title: 'Heute',               icon: '📅', component: todayLogWidget,    defaultEnabled: true,  defaultOrder: 5, minRole: 'observer'  },
  { id: 'tip',           title: 'Tages-Tipp',          icon: '💡', component: tipWidget,         defaultEnabled: true,  defaultOrder: 6, minRole: 'observer'  },
  { id: 'chart-7day',    title: '7-Tage-Verlauf',      icon: '📈', component: chart7dayWidget,   defaultEnabled: false, defaultOrder: 7, minRole: 'observer'  },
  { id: 'achievements',  title: 'Errungenschaften',     icon: '🏆', component: achWidget,         defaultEnabled: false, defaultOrder: 8, minRole: 'patient'   },
];

export function getDefaultWidgetConfig() {
  return {
    order:    WIDGET_REGISTRY.sort((a,b) => a.defaultOrder - b.defaultOrder).map(w => w.id),
    disabled: WIDGET_REGISTRY.filter(w => !w.defaultEnabled).map(w => w.id),
  };
}
