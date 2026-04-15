# Zucker-Held — Projektregeln für Codex

## Projektübersicht
Zucker-Held ist eine mehrsprachige, nutzerspezifische Diabetes-Management-App für Kinder (T1D) und Erwachsene. Aktuell primärer Nutzer: Malte, 8 Jahre, T1D mit Omnipod 5 + Dexcom G7.

---

## PFLICHTREGELN — Codex muss diese immer einhalten

### Branching & Git-Disziplin
- Die verbindlichen Branch-Regeln stehen in `BRANCHING.md`.
- Die agentenübergreifende Sprint- und Kollaborationslogik steht in `AGENT_WORKFLOW.md`.
- Bei jeder Git-Arbeit muss `BRANCHING.md` vor Branch-, Merge- oder Push-Entscheidungen beachtet werden.
- Bei Konflikt zwischen Ad-hoc-Workflow und `BRANCHING.md` gilt `BRANCHING.md`.
- Abweichungen sind nur mit expliziter Nutzeranweisung erlaubt.

### Dokumentation & Architekturpflege
- Wenn sich Code, Verhalten, Abläufe, Architektur oder Betriebsweise ändern, **müssen** die betroffenen Doku-Dateien im selben Arbeitsauftrag mit aktualisiert werden.
- Mindestens zu prüfen sind dabei: `README.md`, `ARCHITECTURE.md`, `COOKBOOK.md`, `BACKLOG.md` sowie sprintbezogene Review-/UAT-Dokumente.
- Für jeden aktiven Sprint muss zusätzlich eine fortlaufende Arbeitsdatei `SPRINT{N}.md` gepflegt werden, damit bei Ausfällen oder Kontextverlust jederzeit klar ist, was bereits erledigt, in Arbeit oder als Nächstes geplant ist.
- `SPRINT{N}.md` ist vom Sprint-Start bis zum Sprint-Abschluss laufend mitzupflegen und gehört zur Pflichtdokumentation des Sprints.
- Architekturänderungen, Integrationsänderungen, Rollen-/State-/API-Änderungen oder neue Querschnittsmuster dürfen nicht abgeschlossen werden, ohne dass `ARCHITECTURE.md` auf den Ist-Zustand nachgezogen wird.
- Vor Sprint-Abschluss, Commit oder PR muss immer eine zusätzliche **Architekten-Perspektive** auf die Änderung schauen.
- Wenn kein echter zweiter Mensch verfügbar ist, muss Codex/Claude dafür eine explizite Architektur-Review durchführen oder einen passenden Spezialisten-Agenten hinzuziehen.
- Code ohne passendes Doku-/Architektur-Delta gilt als unvollständig.

### Zusammenarbeit & Parallelisierung
- Wenn der Nutzer Parallelisierung erlaubt oder mehrere voneinander trennbare Arbeitspakete vorliegen, sollen Tickets nach Möglichkeit in mehreren Agenten parallel bearbeitet werden.
- Jeder parallele Strang bekommt einen klaren Owner; ein führender Agent bleibt immer für Planung, Priorisierung, Zusammenführung, Endabnahme und die Pflege von `SPRINT{N}.md` verantwortlich.
- Parallele Agenten müssen klar getrennte Zuständigkeiten, Dateibereiche oder Fragestellungen bekommen, damit keine doppelte oder kollidierende Arbeit entsteht.
- Parallele Arbeit gilt erst dann als abgeschlossen, wenn sich die Agenten gegenseitig kontrolliert, challengt und mindestens eine kurze Cross-Review auf die Ergebnisse durchgeführt haben.
- Während längerer Arbeiten müssen in regelmäßigen Abständen kurze Dailies/Synchronisationen stattfinden; offene Fragen, Risiken, Entscheidungen und nächste Schritte sind in `SPRINT{N}.md` mitzuprotokollieren.
- Diese Dailies sind auch ein Pflicht-Challenge-Loop: Annahmen, Risiken und Grenzfälle sollen aktiv von einem zweiten Agenten hinterfragt werden.
- Wenn mehrere Arbeitspakete parallel laufen, werden Zwischenstände vor Abschluss gegeneinander geprüft und bei Bedarf nachgeschärft.
- `SPRINT{N}.md` ist das gemeinsame Lagebild für Parallelisierung, Dailies, Cross-Reviews, offene Blocker und den letzten stabilen Stand.
- Wenn ein UI-/UX-, Architektur-, Security- oder Fachthema kritisch ist, soll zusätzlich ein passender Spezialisten-Agent zur Gegenprüfung oder Challenge hinzugezogen werden.

### Sprintlogik & Kadenz
- Jeder Sprint durchläuft verpflichtend **10 Zyklen**.
- Jeder Zyklus enthält mindestens: kurze Zielschärfung, Umsetzung, Daily/Synchronisation, Challenge durch einen zweiten Agenten oder Spezialisten und einen Eintrag in `SPRINT{N}.md`.
- Damit hat jeder Sprint verpflichtend **10 Dailies**, in denen sich die beteiligten Agenten austauschen, Risiken sichtbar machen und ihre Annahmen gegenseitig challengen.
- Wenn nur ein Agent aktiv implementiert, muss für die Daily-/Challenge-Perspektive trotzdem mindestens ein zweiter Agent oder Spezialisten-Agent zur Gegenprüfung hinzugezogen werden.
- Nach Zyklus 10 folgt verpflichtend ein **Sprintabschluss** mit Review- und Abnahmevorbereitung.
- Danach folgt verpflichtend eine **Retrospektive**, in der Verbesserungen für Arbeitsweise, Architektur, Zusammenarbeit, Testtiefe und Dokumentation für den nächsten Sprint festgehalten werden.
- Diese Sprintlogik gilt unabhängig davon, ob der Sprint von `Claude` oder `Codex` gestartet oder geführt wird.
- Details zu Dailies, Cross-Reviews, agentenspezifischen Commits, Retros und Laufzeitpruefung stehen in `AGENT_WORKFLOW.md`.

### Dateiverwaltung
- **NIEMALS Dateien löschen.** Stattdessen in `_deleted/` verschieben.
  - Beispiel: `mv styles.css _deleted/styles.css.bak`
  - Der Nutzer löscht den `_deleted/`-Ordner manuell wenn er bereit ist.
- **NIEMALS bestehende Daten im localStorage überschreiben** ohne Migration.
  - Immer einen neuen Storage-Key verwenden und alte Daten migrieren.
  - Schema: `zucker-held-v{N}` — bei brechenden Änderungen N erhöhen.
- Neue Feature-Dateien immer in `src/` (Module) oder `data/` (Daten) ablegen.
- Keine neuen Abhängigkeiten (npm packages, CDN) ohne explizite Anfrage.

### Architektur
- Das Repository enthält aktuell **zwei Architekturflächen**:
  - die ältere Root-/Legacy-PWA unter `app.js`, `styles.css`, `src/`, `data/`
  - die aktuelle Full-Stack-App unter `frontend/` (Next.js App Router) und `backend/` (Spring Boot)
- Vor jeder Änderung muss klar sein, auf **welcher** Architekturfläche gearbeitet wird.
- Die folgenden Regeln zu nativen ES-Modulen, `window.functionName`, `src/config.js` und `src/state.js` gelten **nur** für die Root-/Legacy-PWA.
- Für Full-Stack-Arbeit gelten die tatsächlichen Stack-Regeln aus `ARCHITECTURE.md`, `frontend/CLAUDE.md`, `frontend/AGENTS.md` und den vorhandenen `backend/`-/`frontend/`-Konventionen.
- Legacy-PWA:
  - nutzt **native ES-Module** (`type="module"`) — kein Bundler
  - Funktionen die von HTML `onclick`-Handlern gerufen werden, **müssen** über `window.functionName = functionName` exportiert werden (am Ende von `app.js`)
  - alle Konstanten und Konfigurationswerte gehören in `src/config.js`
  - alle State-Operationen gehen über `src/state.js` — kein direktes `localStorage.setItem()` außerhalb davon

### Datensicherheit & Medizin
- **Niemals** BZ-Grenzwerte oder medizinische Empfehlungen ohne explizite Anweisung ändern.
- Notfall-Informationen (SOS-Modus, Unterzucker-Protokoll) sind besonders kritisch — Änderungen nur mit ausdrücklicher Bestätigung.
- Keine Daten an externe Server senden außer: Open Food Facts API (Lebensmittelsuche).

---

## Projektstruktur

```
/Diabeteshelper/
├── index.html          — Haupt-UI (alle Seiten als <div id="page-*">)
├── app.js              — Haupt-Einstiegspunkt (ES-Modul, importiert alles)
├── styles.css          — Alle Styles (kein CSS-Framework)
├── manifest.json       — PWA-Manifest
├── sw.js               — Service Worker (Offline-Cache)
│
├── data/
│   └── foods.js        — Eingebaute Lebensmittel-Datenbank (ES-Modul, editierbar)
│
├── src/
│   ├── config.js       — Konstanten: TIPS, AVATARS, ACHIEVEMENTS, ACTIVITIES
│   ├── state.js        — State-Objekt + save()/load() + Migration
│   ├── utils.js        — Hilfsfunktionen: BZ-Status, Datum, KH-Berechnung
│   ├── api.js          — Open Food Facts API (Suche + Barcode)
│   ├── chart.js        — Canvas BZ-Sparkline + 7-Tage-Chart
│   └── achievements.js — Errungenschaften: Prüflogik + UI
│
├── _deleted/           — Hier landen gelöschte Dateien (manuell leeren)
│
└── AGENTS.md           — Diese Datei
```

---

## Nutzerprofile & Rollen

### Profiltypen (geplant / in Entwicklung)
Die App unterstützt mehrere Profile mit unterschiedlichen UI-Modi:

#### Typ `kind` — Kind mit T1D
- Vereinfachte, farbenfrohe UI
- Eltern/Betreuer haben **Admin-Zugriff** (PIN-geschützt)
- Admins können: Zielbereich ändern, Kontakte verwalten, Daten exportieren
- Betreuer-Modus: Eingeschränkte Ansicht ohne Admin-Features

#### Typ `erwachsen` — Erwachsener mit T1D
- Vollständige Self-Management-UI
- Optionaler **Einblick für Dritte** (Arzt, Familie) — nur lesend
- Alle Features selbst bedienbar

### Profil-Datenspeicherung
- Jedes Profil hat einen eigenen localStorage-Eintrag: `zucker-held-profile-{id}`
- Profilindex: `zucker-held-profiles` (Array von Profil-IDs)
- Kein Profil überschreibt das andere

---

## Feature-Status

| Feature | Status | Datei |
|---------|--------|-------|
| BZ-Messung erfassen | ✅ Fertig | src/modules/bz.js |
| Insulin erfassen | ✅ Fertig | src/modules/insulin.js |
| **Insulin-Dosierungs-Rechner** | ✅ Fertig | src/modules/insulin.js |
| Mahlzeit erfassen | ✅ Fertig | src/modules/meal.js |
| KH-Rechner + Mahlzeit-Builder | ✅ Fertig | src/modules/calc.js |
| Lebensmittel-DB (200+ Einträge) | ✅ Fertig | data/foods.js |
| Open Food Facts Integration | ✅ Fertig | src/api.js |
| Barcode-Scanner | ✅ Fertig | src/modules/calc.js |
| BZ-Sparkline Chart | ✅ Fertig | src/chart.js |
| Statistik-Widget (TIR, Ø, Streak) | ✅ Fertig | src/widgets/stats.js |
| Sport/Aktivitäts-Logging | ✅ Fertig | src/modules/activity.js |
| Errungenschaften (16 Badges) | ✅ Fertig | src/achievements.js |
| Service Worker (Offline) | ✅ Fertig | sw.js |
| SOS Helfer-Modus | ✅ Fertig | app.js |
| Lernmodul (5 Tabs) | ✅ Fertig | src/modules/learn.js |
| Multi-User Profile | ✅ Fertig | src/auth/local-provider.js |
| **Admin/Betreuer-Modus** | ✅ Fertig | src/modules/settings.js |
| **localStorage Fehlerbehandlung** | ✅ Fertig | src/state.js |
| **Browser-Benachrichtigungen** | ✅ Fertig | src/notifications.js |
| **Datenexport (PDF/CSV)** | 📋 Geplant (BL-H03) | - |
| **7-Tage BZ-Chart (Vollansicht)** | 📋 Geplant (BL-02) | src/chart.js |
| **Mahlzeit-Favoriten** | 📋 Geplant (BL-H07) | - |
| **Tägliche Challenges** | 📋 Geplant (BL-M01) | - |

---

## Coding-Konventionen

- **Sprache**: Alles auf Deutsch (UI-Text, Kommentare in Code)
- **Keine externen Libraries** (kein React, Vue, Chart.js etc.)
- **Inline-onclick statt addEventListener** — ist konsistenter mit dem bestehenden Muster
- **Kommentare**: Sektions-Trenner mit `// ═══...═══` für Übersichtlichkeit
- **CSS-Variablen** für alle Farben — niemals Hex-Werte inline im CSS neu definieren

## Typische Aufgaben

### Neues Lebensmittel hinzufügen
→ In `data/foods.js` ein neues Objekt zum `BUILTIN_FOODS`-Array hinzufügen.

### Neue Errungenschaft hinzufügen
→ In `src/config.js` zum `ACHIEVEMENTS`-Array, `check`-Funktion implementieren.

### Neue Seite hinzufügen
1. `<div id="page-xyz" class="page">` in `index.html`
2. Navigation: `showPage('xyz')` aufrufen wo nötig
3. In `showPage()` in `app.js` den Refresh-Call hinzufügen
4. Ggf. Nav-Button in `<nav class="bottom-nav">` ergänzen

### Neuen Storage-Key bei Schemaänderung
1. `STORAGE_KEY` in `src/config.js` erhöhen (v3 → v4)
2. `load()` in `src/state.js` um Migration von vorherigem Key erweitern
3. Service Worker Cache-Version in `sw.js` ebenfalls erhöhen
