# Sprint Review — Sprint 12

> Stand: 2026-04-15  
> Reviewform: Simuliertes Review mit Key-User-Perspektiven + Architektur- und Security-Experten-Sicht  
> Testsuite: `npm test` — 52 Tests, 4 Dateien, alle grün ✅

---

## Sprint-Ziele im Überblick

Sprint 12 hatte zwei Pfeiler:

1. **Sicherheit & Datenintegrität** — Observer-Write-Bug (medizinisch kritisch), Klartext-PINs, Audit-Log, SW-Cache
2. **Alltags-Erleben** — BZ-Wert prominent, tägliche Challenges für Malte, Settings-Feedback, Altersgruppen-UI

---

## 1 · Ticket-Abnahme

### SEC-01 · PIN-Hashing ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| PIN wird als SHA-256-Hash (64-Hex) gespeichert | ✅ bestätigt via Code + Test |
| Korrekter PIN wird akzeptiert | ✅ `checkPin` async, bestätigt |
| Falscher PIN wird abgewiesen | ✅ |
| Legacy-Klartext-PIN (Altprofil) wird als Fallback erkannt | ✅ Regex-Check `/^[0-9a-f]{64}$/` |
| Kein npm-Paket — nur Web Crypto API | ✅ |

**Befund im Review:** Die Änderung zu `async createProfile` + `async checkPin` hat 16 existierende Tests zum Rot geführt. Diese wurden **im Review sofort korrigiert** (Tests auf `async/await` umgestellt, neue `hashPin`-Tests ergänzt). Prozesshinweis → siehe Abschnitt 6.

---

### SEC-02 · Observer-Write-Guard ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| `state.save()` wirft `ObserverWriteError` bei `role='observer'` | ✅ `src/state.js:110` |
| Alle 5 Entry-Points fangen den Fehler | ✅ bz, insulin, meal, activity, calc |
| User sieht Toast „Beobachter können keine Einträge speichern." | ✅ Code bestätigt |
| Kein Rollback-Verlust | ✅ `state.entries.shift()` vor Toast |

**Bewertung:** Dies war der medizinische Blocker aus Sprint-9-Review. Mit SEC-02 ist Finding 1 aus `SPRINT_REVIEW_SPRINT_9.md` vollständig geschlossen.

---

### SEC-03 · Audit-Log ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| 5 kritische Events geloggt | ✅ `bz_range_changed`, `insulin_settings_changed`, `contact_added`, `contact_removed`, `data_cleared` |
| `logAudit()` in `state.js` | ✅ persistent, max. 100 Einträge |
| Anzeige in Settings (Admin-only) | ✅ |
| `pin_changed` nicht im Log | ⚠️ Wurde im Plan genannt, fehlt in der Umsetzung — Nacharbeit Sprint 13 |

---

### SEC-04 · Service Worker Cache v12 ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| Cache-Name `zucker-held-v12.0` | ✅ `sw.js:1` |
| Neue Widget-Dateien gecacht | ✅ `bz-hero.js`, `daily-challenges.js` |
| `foods.js` Network-First | ✅ bereits als `.js` in Network-First-Gruppe |

---

### UX-02 · Dirty-State in Settings ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| Gelber Rahmen bei ungespeichertem Feld | ✅ `.input-dirty` CSS-Klasse + `_markDirty()` |
| Grüner Rahmen nach Speichern | ✅ `.input-saved` (kurze Animation) |
| Rot + Fehlermeldung bei ungültigem Wert | ✅ `.input-error` |

---

### UX-04 · Altersgruppen-Theme `kind_young` ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| `data-age-group="kind_young"` auf `<body>` | ✅ `src/ui/theme.js` |
| Buttons min-height 56px | ✅ CSS-Override |
| Border-radius 20px | ✅ CSS-Override |
| Navigation zeigt „Start" statt „Home" | ✅ visuell bestätigt im Preview |

---

### DASH-01 · BZ-Hero-Widget ✅ Abgenommen (mit Bugfix)

| Kriterium | Ergebnis |
|---|---|
| BZ-Wert 72px auf Dashboard | ✅ `font-size: 72px` bestätigt per `preview_inspect` |
| Farbkodierung (grün/gelb/rot) | ✅ CSS-Klassen `bz-hero-ok/low/critical/high/veryhigh` |
| Trendpfeil ↗/↘/→ aus letzten 2 Messungen | ✅ Δ > 15 → ↗, Δ < −15 → ↘, sonst → |
| Stale-Banner nach 90 Min. | ✅ Code bestätigt |

**Bugfixes im Review gefunden und behoben:**
- `last.timestamp` → `last.ts` (Entry-Feld heißt `ts`, nicht `timestamp` → NaN-Alter)
- `{ level, label }` → `{ level, emoji: label }` (`getBZStatus` liefert `emoji`-Feld, nicht `label` → „undefined" im Status)

---

### DASH-02 · Tägliche Challenges ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| 3 tägliche Challenges (BZ, Mahlzeit, Aktivität) | ✅ Widget registriert + gerendert |
| Reset um Mitternacht | ✅ Datum-Vergleich in `_getTodayChallenges()` |
| +10 Coins pro abgeschlossener Challenge | ✅ `state.coins` |
| Konfetti-Toast bei Abschluss | ✅ `showToast` mit 🎉 |

---

### TECH-01 · Barcode-Scanner Fallback ✅ Abgenommen

| Kriterium | Ergebnis |
|---|---|
| Kamera-Scan via `BarcodeDetector` wenn verfügbar | ✅ |
| Manuelles EAN-Eingabefeld als Fallback | ✅ `window._manualBarcodeSearch` |
| EAN wird an `api.js searchByBarcode()` übergeben | ✅ |

---

## 2 · Persona-Perspektiven

### 🦊 Malte (8 Jahre, T1D, Hauptnutzer)

**Was sich für Malte verbessert hat:**
- Der BZ-Wert ist jetzt das Erste, was er auf dem Dashboard sieht — groß, klar, farbig
- Die 3 täglichen Challenges geben ihm Struktur: „Messe deinen BZ → ✅ +10 Coins"
- Buttons sind auf dem kind_young-Theme deutlich größer und treffsicherer

**Offene Punkte:**
- Die Challenges sind aktuell alle drei gleich wichtig und statisch — für Malte wäre eine Priorisierung nach aktuellem BZ oder Tageszeit motivierender (Sprint 13)
- Das Coin-System hat noch keine Belohnungsebene — Coins werden gezählt aber nicht eingelöst

**Status: Freigabefähig für Alltag** ✅

---

### 👩 Sarah (Elternteil / Admin)

**Was sich für Sarah verbessert hat:**
- Sie kann sicher sein: **als Beobachterin eingetragene Werte landen nicht mehr im falschen Profil** — das war der medizinische Blocker
- Wenn sie Korrekturfaktor oder Zielbereich ändert, sieht sie jetzt den gelben Rahmen als Signal „noch nicht gespeichert"
- Alle Admin-Aktionen sind nachverfolgbar (Audit-Log in Settings)

**Offene Punkte:**
- `pin_changed` fehlt noch im Audit-Log — wurde im Plan geplant, aber nicht implementiert
- Das Audit-Log ist nur in Settings sichtbar, kein Push-Benachrichtigung bei kritischen Ereignissen

**Status: Freigabefähig** ✅ (mit offenen Punkten für Sprint 13)

---

### 🏗️ Architekt-Perspektive

**Positiv:**
- Observer-Guard sitzt an der richtigen Stelle: in `state.save()`, nicht in jedem einzelnen Modul-Handler — korrekte Separation of Concerns
- PIN-Hashing ohne npm-Paket (Web Crypto API) — kein neuer Dependency-Footprint
- Audit-Log in `state.js` integriert, max. 100 Einträge, persistiert mit dem restlichen State — saubere Lösung
- SW-Cache-Versionierung auf `v12.0` macht Rollout-Verhalten vorhersagbar

**Findings:**
- `bz-hero.js` nutzte falsche Entry-Feldnamen (`timestamp` statt `ts`) — **im Review behoben**. Zeigt, dass es keinen gemeinsamen Typ/Interface-Vertrag für Entry-Objekte gibt. Risiko für zukünftige Widgets.
- `formatTime(last.ts)` wird in `bz-hero.js` berechnet aber nie im Template genutzt (`timeStr` ungenutzte Variable) — harmlos, aber sauber entfernen in Sprint 13

**Architektur-Empfehlung für Sprint 13:**
- Entry-Objekte in `src/config.js` als JSDoc-Typedef dokumentieren, damit alle Widgets denselben Vertrag sehen

---

### 🔒 Security-Experte-Perspektive

**Positiv:**
- SHA-256 über Web Crypto API ist korrekt und zeitgemäß
- Legacy-Erkennung per Regex ist sauber und verhindert harte Migrationspflicht
- Observer-Write-Guard wirft `ObserverWriteError` mit `.name`-Property — ermöglicht präzises Catching ohne String-Vergleich
- Audit-Log ist append-only und mit State persistiert — nicht leicht zu manipulieren

**Findings:**
- `pin_changed`-Event fehlt im Audit-Log — wurde geplant, nicht geliefert. Für vollständige Compliance-Abdeckung notwendig
- Die Testsuite war zu Beginn des Reviews wegen SEC-01 rot (16 Testfehler). Tests liefen gegen eine async-umgestellte Funktion synchron. **Blocker für Release wurde im Review behoben.** Prozessregel aufgenommen (→ Abschnitt 6)
- PIN-Länge ist weiterhin frei wählbar — BL-H01 (6-stellig optional) liegt noch im Backlog

---

## 3 · Dokumentationsprüfung

| Dokument | Pflicht | Status |
|---|---|---|
| `README.md` | Sprint-Features im Überblick | ✅ aktualisiert |
| `ARCHITECTURE.md` | PIN-Hashing, Observer-Guard, Widgets | ✅ aktualisiert |
| `BACKLOG.md` | Sprint-12-Tickets als ✅ markiert | ✅ aktualisiert |
| `COOKBOOK.md` | Betriebsanleitung / Widget-Anleitung | ⚠️ nicht aktualisiert in diesem Sprint |
| `REVIEW.md` | Systemreview auf aktuellen Stand | ⚠️ Stand noch Sprint-11-Niveau |
| `SPRINT_REVIEW_SPRINT_12.md` | Dieses Dokument | ✅ erstellt |
| `UAT_SPRINT_12.md` | Abnahme-Szenarien | 📋 fehlt — wird nach Review erstellt |

---

## 4 · Testprüfung

| Testsuite | Ergebnis |
|---|---|
| `tests/food-utils.test.js` (4 Tests) | ✅ grün |
| `tests/gamification.test.js` (3 Tests) | ✅ grün |
| `tests/multi-user.test.js` (29 Tests) | ✅ grün (async-Migration im Review) |
| `tests/sprint12.test.js` (16 Tests) | ✅ grün (neu im Review erstellt) |
| **Gesamt** | **52 Tests, 0 Fehler** |

**Neu abgedeckt durch Sprint-12-Tests:**
- SEC-01: `hashPin` deterministisch, SHA-256-Format, Legacy-Fallback
- SEC-01: `createProfile` hashed PIN, `checkPin` async
- DASH-01: `getBZTrend` alle vier Fälle (steigend/fallend/stabil/zu wenig Daten)
- DASH-02: Challenge-Erkennung nach Eintragstyp und Datum

---

## 5 · Freigabeempfehlung

### Empfehlung: **Freigeben** ✅

**Begründung:**
- Der medizinische Blocker aus Sprint 9 (SEC-02) ist vollständig geschlossen
- Alle 10 Sprint-12-Tickets implementiert
- Testsuite vollständig grün (52 Tests)
- 2 Bugs in `bz-hero.js` während Review gefunden und sofort behoben
- Keine offenen sicherheitskritischen Findings

**Ausnahme:** Die folgenden Punkte sind bekannt und für Sprint 13 eingeplant:
- `pin_changed` im Audit-Log fehlt
- `COOKBOOK.md` nicht aktualisiert
- `REVIEW.md` nicht auf Sprint-12-Stand
- Ungenutzte Variable `timeStr` in `bz-hero.js`

Diese Punkte sind **keine Release-Blocker**.

---

## 6 · Prozessregeln — Verbindlich ab Sprint 13

Folgende Prozessmängel wurden im Review festgestellt. Sie werden als **verbindliche Prozessregeln** im BACKLOG und CLAUDE.md festgehalten:

### REGEL P-01 · Testpflicht pro Sprint (NEU)
**Jeder Sprint, der neuen Code liefert, muss auch Testfälle für diesen Code liefern.**
- Neue Funktionen: mindestens 1 Happy-Path-Test + 1 Fehlerfall-Test
- Änderungen an bestehenden Funktionen: bestehende Tests müssen aktualisiert werden
- Testsuite muss am Ende des Sprints vollständig grün sein
- **Verstöße gegen diese Regel sind Release-Blocker**

**Hintergrund:** SEC-01 (async PIN-Hashing) hat 16 existierende Tests zum Rot gebracht, ohne dass neue Tests mitgeliefert wurden. Dieser Zustand wäre ohne Review-Phase in den Branch eingegangen.

### REGEL P-02 · Backlog-Review nach jedem Sprint (NEU)
**Nach jedem Sprint ist das Backlog zu prüfen und fortzuschreiben:**
- Abgeschlossene Tickets als ✅ markieren
- Neue Findings aus dem Sprint Review aufnehmen
- Prioritäten neu bewerten wenn Sprint-Inhalte sich verschoben haben
- `BACKLOG.md` ist primäre Planungsquelle — kein Sprint ohne aktuelles Backlog

**Hintergrund:** Der Backlog-Stand hinkt dem tatsächlichen Produktstand mehrfach hinterher gewesen (Findings aus REVIEW.md Sprint 8/9). Das Fortschreiben ist Pflicht, nicht optional.

---

## 7 · Nacharbeiten Sprint 13 (Prio-geordnet)

| Prio | ID | Thema |
|---|---|---|
| 🔴 | AUD-01 | `pin_changed`-Event in Audit-Log ergänzen |
| 🟠 | DOC-03 | `COOKBOOK.md` auf Sprint-12-Stand bringen (neue Widgets, PIN-Flow) |
| 🟠 | DOC-04 | `REVIEW.md` auf Sprint-12-Stand bringen |
| 🟡 | DASH-03 | Coins einlösbar machen (Belohnungsebene für Malte) |
| 🟡 | ARCH-01 | Entry-Typedef in `src/config.js` — gemeinsamer Vertrag für alle Widgets |
| 🟡 | BZ-01 | `timeStr` aus `bz-hero.js` entfernen (ungenutzte Variable) |
| 🟡 | DASH-04 | Challenges nach aktuellem BZ / Tageszeit priorisieren |
| ⚪ | BL-H01 | PIN-Länge 6-stellig optional |
