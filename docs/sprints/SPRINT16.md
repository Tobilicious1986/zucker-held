# Sprint 16 — „Care Team, Klinik-Readiness & Design-Overhaul"

**Zeitraum:** 2026-04-17 bis offen  
**Branch:** `claude/review-and-plan-L5A74`  
**Sprint-Owner:** Claude  
**Status:** 🔄 Zyklus 1 läuft

---

## Ziel

> Alle offenen Sprint-14/15-Schulden schließen, Sicherheitslücken fixen, CarbTracker-AI-Analyzer integrieren, gesamtes UI auf Dark-Glassmorphism-Design umstellen und Fundament für CLN-06/CLN-01/CLN-03 legen.

---

## Supersprint-Audit (2026-04-24)

### Code-Audit-Ergebnis Sprint 14 & 15

| Bereich | Befund |
|---------|--------|
| Backend Sprint 14 | ✅ 95% implementiert — `ProfileLink`, `PrivacyController`, `ConsentHistory`, Privacy Hub vollständig |
| Backend Sprint 15 | ✅ 90% implementiert — `ClinicalViewController`, `SummaryController`, `LearningAccessController` vorhanden |
| Frontend Sprint 14 | ✅ 100% — alle Seiten: observer, summary, learning, consent vorhanden |
| Frontend Sprint 15 | ✅ 100% — clinical-view Token-Flow, Scope-Routing vollständig |
| **Sicherheitslücke R-02** | ❌ `expiresAt` wurde in keiner der 3 Access-Methoden geprüft — totes Recht für abgelaufene Links |
| **DSGVO-Gap** | ❌ `CONSENT_HISTORY_VIEWED` Audit-Event fehlte in `PrivacyController` |

---

## Zyklus 1 — Sicherheitsfixes & CarbTracker & Design-System

### ✅ Erledigte Arbeiten

#### Backend — Sicherheitsfixes

- **`ProfileLink.java`**: `isExpired()` Methode hinzugefügt (prüft `expiresAt` gegen `OffsetDateTime.now(ZoneOffset.UTC)`), `grantsLiveMedicalAccess()` ergänzt um `!isExpired()` Check
- **`ProfileLinkService.java`**: `grantsSummaryAccess()` und `grantsLearningAccess()` ergänzt um `!l.isExpired()` Check — alle 3 Access-Methoden sind nun sicher
- **`PrivacyController.java`**: DSGVO-konformes Audit-Logging `CONSENT_HISTORY_VIEWED` bei `page == 0` des Consent-History-Endpoints

#### Frontend — CarbTracker AI-Mahlzeiten-Analyzer

- **`frontend/src/app/(app)/calc/page.tsx`**: Komplett neu — CarbTracker-Komponente integriert
  - 3 Eingabe-Tabs: Text / Zutatenliste / Foto (Drag & Drop)
  - Ruft Backend-Proxy `/api/v1/ai/analyze-meal` auf (kein direkter Anthropic-Call)
  - JSON-Format A (Rückfragen) und Format B (vollständige Analyse) werden erkannt
  - Ergebnisanzeige: KH/BE/KE Hero-Card, Kcal+GI-Stats, BZ-Prognose-SVG-Chart, Zutatenliste mit Stepper, Insulin-Hinweis, GI-Skala
  - Prüft `settings.aiChatAvailable` — zeigt Setup-Hinweis wenn kein API-Key
  - Animierter CarbLoader während der AI-Analyse
  - Inline-Styling (Dark Glassmorphism, kein Tailwind in der Komponente)

#### Frontend — Design-System Dark Glassmorphism

- **`frontend/src/app/globals.css`**: Vollständiges Design-System-Overhaul
  - `:root` Default ist jetzt Dark Glassmorphism (kein `data-theme="dark"` mehr nötig)
  - `--zh-bg: #030305`, Radial-Gradienten (lila/pink/orange)
  - `--zh-surface: rgba(24,24,27,0.7)` + `backdrop-filter: blur(20px)`
  - `--zh-text: #f4f4f5`, `--zh-muted: #71717a`
  - `--zh-accent-gradient: linear-gradient(135deg, #fb923c, #ec4899, #a855f7)`
  - `.nav-pill--active` → Accent-Gradient
  - `.primary-button` → Accent-Gradient
  - Light-Fallback in `html[data-theme="light"]` bleibt erhalten
  - BZ-Status-Farben für dunklen Hintergrund angepasst

- **`frontend/src/app/layout.tsx`**: Default `data-theme="dark"`, `themeColor: "#a855f7"`

- **`frontend/src/app/(app)/layout.tsx`**: Default-Theme `"dark"` statt `"light"`

#### Legacy-PWA — Design-Token-Update

- **`styles.css`**: `:root` auf Dark Glassmorphism umgestellt
  - Brand-Palette: Orange→Pink→Purple (`--brand-gradient`)
  - Surfaces: glassmorphism (`--surface-0: rgba(24,24,27,0.70)`)
  - Text: hell auf dunkel (`--text-primary: #f4f4f5`)
  - Status-Farben: dark-contrast
  - Shadows: deep dark shadows
  - `.card` erhält `backdrop-filter` und Border
  - `.bottom-nav` erhält glassmorphism Background
  - `html` Background: Radial-Gradienten lila/pink/orange auf `#030305`
  - Splash: `--brand-gradient` statt statische Gradients

---

## UAT-Status Sprint 15

| Szenario | Status |
|----------|--------|
| UAT-15 gesamt (19 Szenarien) | ⏳ ausstehend — kein laufender Server verfügbar |
| Nachholplan | Bei nächstem Lauf von `./scripts/start-local-stack.sh` alle Szenarien abarbeiten |

---

## Strukturpflege — Dokumentationsordnung (2026-04-27)

### Erledigt

- Root-MD-Einstiege auf `AGENTS.md`, `CLAUDE.md` und `README.md` verschlankt.
- Ausführliche Agentenregeln nach `docs/agents/PROJECT_RULES.md` zentralisiert.
- Branching und Agent-Workflow nach `docs/agents/` verschoben.
- Projekt-, Architektur-, Backlog-, Cookbook-, Review-, Strategie- und ADR-Doku nach `docs/project/` verschoben.
- Sprint-Lagebilder nach `docs/sprints/`, Reviews nach `docs/reviews/`, UAT-Pläne nach `docs/uat/` verschoben.
- Root-, Frontend- und Projektdoku-Verweise auf die neue Struktur nachgezogen.

### Verifikation

- `rg --files -g '*.md' -g '!node_modules' -g '!frontend/node_modules'` zur Strukturkontrolle ausgeführt.
- Stale-Reference-Suche nach alten Root-MD-Pfaden und alten absoluten Review-Links ausgeführt.
- Keine Code- oder Runtime-Änderung; Build-/Unit-Tests nicht erforderlich.

### Architekturprüfung

- Einstiegskette geprüft: `AGENTS.md` und `CLAUDE.md` bleiben im Repository-Root, verweisen aber auf `docs/agents/PROJECT_RULES.md`.
- Spezialisierte Agentenregeln geprüft: `frontend/AGENTS.md` und `frontend/CLAUDE.md` zeigen auf die neue `docs/`-Struktur.
- Doku-Domänen geprüft: Agentenregeln, Projektdoku, Sprints, Reviews und UAT-Pläne sind getrennt und ohne doppelte Root-Regelblöcke auffindbar.

---

## Offene Punkte Zyklus 1 → Zyklus 2

- [ ] Settings → `/consent`-Link hinzufügen (3-Zeilen-Fix)
- [ ] T-05 Routing-Unit-Test
- [ ] CLN-06: `ProfessionalRole` Enum + Migration V16
- [ ] CLN-01: Professioneller Einladungsflow Backend + Frontend
- [ ] UAT Sprint 15 live abarbeiten

---

## Test-Status

| Test | Status |
|------|--------|
| `cd backend && mvn test` | ⏳ ausstehend — kein Maven-Lauf in dieser Session |
| `cd frontend && npm run build` | ⏳ ausstehend — keine node_modules installiert |
| CarbTracker UI im Browser | ⏳ ausstehend |
| Dark Glassmorphism Design | ⏳ ausstehend |

---

## Risiken

| Risiko | Status |
|--------|--------|
| R-02: `expiresAt`-Guard fehlend | ✅ BEHOBEN — alle 3 Access-Methoden gesichert |
| R-05: Sprint 15 Features nicht getestet | ⏳ Audit bestätigt Implementierung, UAT noch ausstehend |
| Design-Overhaul bricht bestehende Seiten | ⏳ ohne laufenden Server nicht verifizierbar |

---

## Letzter stabiler Stand

Branch `claude/review-and-plan-L5A74` nach Zyklus-1-Commit:
- Backend-Sicherheitsfixes committed
- CarbTracker in `calc/page.tsx` integriert
- globals.css + layout.tsx Dark-Glassmorphism
- styles.css (Legacy-PWA) Dark-Glassmorphism Tokens
