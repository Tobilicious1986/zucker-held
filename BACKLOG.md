# Zucker-Held — Produkt-Backlog

> Letzte Aktualisierung: 2026-04-14 (Sprint 11 abgeschlossen: Lebensmittel-DB, Barcode & hybride Food-Suche)  
> Primäre Nutzer: Malte (8, T1D), Familie (Eltern, Oma), Jugendliche (16), Erwachsene, Ärzte

---

## ✅ Fertig (zuletzt implementiert)

| ID | Feature | Sprint |
|----|---------|--------|
| BL-01 | Insulin-Dosierungs-Rechner | Sprint 1 |
| BL-02 | 7-Tage-Chart (renderFullChart) | — |
| BL-03 | localStorage Fehlerbehandlung | Sprint 1 |
| BL-04 | Admin/Betreuer-Modus | Sprint 1 |
| BL-07 | Browser-Benachrichtigungen | Sprint 1 |
| BL-S01 | Insulin-Rechner: Warnung bei unrealistischen Parametern | Sprint 2 |
| BL-S06 | Korrektur-Fenster im Insulin-Rechner | Sprint 2 |
| BL-M04 | Hinweis wenn kein BZ eingegeben | Sprint 2 |
| BL-M06 | Kinderfreundliche Alert-Texte | Sprint 2 |
| BL-H06 | Streak-Anzeige auf Dashboard | Sprint 2 |
| BL-H08 | Ketone-Warnung & DKA-Protokoll | Sprint 2 |
| NEU-F1 | Familien-Rollen: profile_links + Einladungsflow | Sprint 3 |
| NEU-F2 | Ampel-Dashboard für Betreuer (Observer Page) | Sprint 3 |
| NEU-F3 | Geführter Notfall-Flow für Betreuer | Sprint 3 |
| NEU-F4 | Adaptive UI: useAgeGroup Hook (child_young/child_teen/adult) | Sprint 3 |
| BL-H01 | Admin-PIN auf 4 oder 6 Stellen (pinLength) | Sprint 3 |
| BL-H02 | Elevation Session-Timeout (15 Min, elevationExpiresAt) | Sprint 3 |
| NEU-F8 | Sport-/Aktivitäts-Kontext mit BZ-Warnungen | Sprint 4 |
| NEU-F9 | Tages-Zusammenfassung per Queue/Scheduler | Sprint 4 |
| NEU-F10 | Druckbare Notfall-Karte | Sprint 4 |
| NEU-F11 | Gamification / XP-Widget | Sprint 4 |
| BL-H03 | CSV-Export | Sprint 4 |
| BL-H07 | Mahlzeit-Favoriten | Sprint 4 |
| NEU-F6 | Arzt-Link ohne Login | Sprint 5 |
| NEU-F12 | Dark Mode Basis | Sprint 5 |
| NEU-F14 | Mini-Share-Modus | Sprint 5 |
| NEU-F15 | Konsensus-Kennzahlen (TIR, GMI, CV) | Sprint 5 |
| NEU-F7 | Muster-Erkennung Basis | Sprint 5 |
| NEU-F13 | Adaptiver Bolus-Hinweis | Sprint 6 |
| NEU-F5 | Eltern-Ping Basis | Sprint 6 |
| BL-L04 | PIN-Rate-Limiting | Sprint 6 |
| BL-L05 | Audit-Log für Admin-Aktionen | Sprint 6 |
| NEU-F17 | CGM-/Nightscout-Gap-Erkennung | Sprint 8 |
| NEU-F26 | Datenqualitätsindikatoren | Sprint 8 |
| SR-04 / NEU-F21 | Muster-Erkennung mit Zeitfenstern | Sprint 8 |
| UX-00 | Designsystem-Basis, App-Shell und Experience Overhaul | Sprint 9 |
| BR-01 | Settings-Schreibflow wieder funktionsfähig | Sprint 9 |
| BR-02 | Invite-/Watcher-Flow wieder funktionsfähig | Sprint 9 |
| BR-03 | KI-Chat kontrolliert degradiert statt 500 | Sprint 9 |
| SR-03 / NEU-F18 | Arzt-Link als druckbarer Kurzbericht | Sprint 9 |
| SR-01 / NEU-F14 | Mini-Share klar auf Lesemodus begrenzt | Sprint 9 |
| SR-06 / NEU-F5 | Eltern-Ping mit Zustellfeedback | Sprint 9 |
| FD-01 | DACH-Food-Katalog (300+ kuratierte Built-ins mit Aliases und Portionspresets) | Sprint 11 |
| FD-02 | Hybride Food-Suche: lokal + explizite Open-Food-Facts-Online-Suche | Sprint 11 |
| FD-03 | KH-Rechner mit Barcode, Portionen und Meal-Handoff | Sprint 11 |

---

## 🟣 Teilweise umgesetzt / konsolidieren

| ID | Thema | Status |
|----|-------|--------|
| NEU-F19 | Sicherheits-Härtung Rollen & Sessions | Teilweise umgesetzt: Rate-Limit, Audit-Log und Session-Bausteine vorhanden, Konsolidierung offen |
| NEU-F21 | Muster-Erkennung mit Hinweisen | Teilweise umgesetzt: Basis-Patterns vorhanden, Zeitfenster und Präzision offen |
| NEU-F22 | Reminder-Motor mit Ruhezeiten | Teilweise umgesetzt: Quiet Hours und Routine-Reminder-Basis vorhanden |
| NEU-F5 | Eltern-Ping steuerbar durch Kind/Jugendlichen | Teilweise umgesetzt: Ping-Basis und Settings vorhanden, Zustellfeedback/Ausbau offen |

---

## 🟣 Doku / Enablement

### DOC-01 · Nutzerhandbuch / Bedienanleitung
**Priorität:** 🟠 HOCH  
**Inhalt:** Separates Nutzerhandbuch für Familien, Jugendliche, Erwachsene und Betreuer mit typischen Abläufen, Screens und Rollenbeispielen.  
**Hinweis:** Nicht Teil von Sprint 8. Sprint 8 liefert bewusst nur Betriebsdoku (`README`, `ARCHITECTURE`, `COOKBOOK`, `REVIEW`).

---

## 🔴 KRITISCH — Sicherheit / Medizin

### BL-S01 · Insulin-Rechner: Warnung bei unrealistischen Parametern
**Gefunden in:** Sprint-1-Review (Diabetesberater)  
**Problem:** Wenn Admin insulinRatio auf 1 oder 50 setzt, gibt es keine Warnung. Dosierungsfehler möglich.  
**Fix:** Warndialog bei Speichern wenn Ratio < 5 oder > 30 (außerhalb klinischer Norm).  
**Dateien:** `src/modules/settings.js` (_saveInsulinSettings)

### BL-S02 · _trimOldEntries: Dexcom-CSV-Quelle fehlte ✅ BEHOBEN
**Gefunden in:** Sprint-1-Review  
**Problem:** CGM-Einträge mit `source='dexcom'` wurden nicht getrimmt.  
**Fix:** `CGM_SOURCES = new Set(['nightscout', 'dexcom'])` — bereits behoben.

### BL-S03 · Notifications Toggle: visueller Widerspruch ✅ BEHOBEN
**Gefunden in:** Sprint-1-Review  
**Fix:** Permission erst anfragen, dann State setzen — bereits behoben.

### BL-S04 · Notification-Click öffnet jetzt BZ-Seite ✅ BEHOBEN
**Gefunden in:** Sprint-1-Review  
**Fix:** SW sendet `OPEN_PAGE`-Message, App navigiert zur BZ-Seite — bereits behoben.

### BL-S05 · Keine Warnung vor Auto-Löschung von CGM-Daten
**Problem:** Wenn Speicher voll ist, werden CGM-Daten > 90 Tage still gelöscht. Für Arzt-Berichte und HbA1c-Trends problematisch.  
**Fix:** Vor Trim-Aktion Export-Angebot anzeigen (CSV-Download der betroffenen Daten).  
**Dateien:** `src/state.js` (_trimOldEntries), neue Exportfunktion

### BL-S06 · Korrektur-Fenster im Insulin-Rechner
**Problem:** Rechner schlägt Korrektur vor wenn BZ = 130 und Ziel = 120 → nur 10 mg/dL Differenz, klinisch unnötig.  
**Fix:** Korrektur nur wenn |BZ - Ziel| > 30 mg/dL (konfigurierbares Fenster).  
**Dateien:** `src/modules/insulin.js` (_calcInsulinDose)

---

## 🟠 HOCH — UX / Betreuer

### BL-H01 · Admin-PIN auf 6 Stellen (optional)
**Gefunden in:** Sprint-1-Review (Eltern-Perspektive)  
**Problem:** 4-stellig = 10.000 Kombis, bei 0,5s/Versuch in < 2h crackbar ohne Rate-Limit.  
**Fix:** PIN-Länge konfigurierbar 4–6 Stellen bei Profilerstellung.  
**Dateien:** `app.js` (openAddProfile, pinKey), `src/auth/local-provider.js` (checkPin)

### BL-H02 · Admin-Rollenhochstufung: Session-Timeout
**Problem:** `elevateRole('admin')` ist bis Seitenreload aktiv. Kind könnte Admin-Zugang bekommen wenn Eltern Gerät weggeben.  
**Fix:** Automatischer Downgrade nach 15 Min Inaktivität.  
**Dateien:** `app.js` (_elevateToAdmin, setInterval), `src/auth/local-provider.js`

### BL-H03 · Datenexport (PDF / CSV)
**Status:** Geplant seit Backlog-Init  
**Inhalt:** CSV aller Einträge (Datum, Uhrzeit, Typ, Wert), PDF-Wochenbericht mit Chart + TIR  
**Dateien:** Neue Datei `src/export.js`, `src/modules/settings.js`

### BL-H04 · Eltern-Benachrichtigungen: Nightscout-Gap-Erkennung
**Problem:** Wenn CGM-Sensor offline > 20 Min, merkt die App es nicht.  
**Fix:** In `_autoSyncNightscout` prüfen ob letzter Eintrag > 25 Min alt → Alert "CGM-Signal verloren".  
**Dateien:** `app.js` (_autoSyncNightscout), `src/notifications.js`

### BL-H05 · Settings: Profil ohne PIN kann Admin-Gate nicht schützen
**Problem:** `_adminGate()` deaktiviert Schutz wenn Profil keinen PIN hat → unsichtbare Änderungen.  
**Fix:** Wenn kein PIN vorhanden → Hinweis "Admin-PIN in Profil-Einstellungen setzen" anzeigen statt Gate zu deaktivieren.  
**Dateien:** `src/modules/settings.js` (_adminGate)

### BL-H06 · Streak-Anzeige auf Dashboard
**Status:** Aus BL-09 übernommen  
**Problem:** `getMaxStreak()` existiert, wird aber im Dashboard nicht angezeigt.  
**Fix:** Streak-Widget im Dashboard ("🔥 X Tage in Folge")  
**Dateien:** `src/widgets/stats.js` oder neues Widget

### BL-H08 · Ketone-Warnung & DKA-Protokoll bei BZ > 300
**Wunsch von:** Eltern / Diabetesberater (Sprint-2-Planning)  
**Medizinischer Hintergrund:** Bei BZ > 300 mg/dL muss nicht sofort der Arzt gerufen werden — aber nach **1 Stunde** müssen Ketone gemessen werden. Sind Ketone erhöht (> 0,6 mmol/L bzw. je nach Klinik-Schwelle), wird der Notfallplan ausgelöst.  
**Ablauf:**
1. BZ-Eintrag > 300 mg/dL → sofortiger Hinweis in der App: "⚠️ Hoher BZ — bitte in 1 Stunde Ketone messen!"
2. Nach 1 Stunde → Erinnerungsbenachrichtigung: "Jetzt Ketone messen!" (Browser Notification)
3. Neuer Eintrag-Typ `ketone` mit Wert (mmol/L oder mg/dL)  
4. Wenn Ketone > Schwellwert (konfigurierbar, Default 0,6 mmol/L) → **Notfall-Banner** + Empfehlung Arzt kontaktieren + SOS-Flow öffnen
5. Wenn Ketone normal → Entwarnung, App protokolliert
**Konfiguration:** Ketone-Schwellwert in Settings (Admin-Gate), Einheit mmol/L oder mg/dL  
**Dateien:** Neuer Eintrag-Typ in `src/state.js`, `src/modules/bz.js` (Trigger nach Speichern), neue Seite `src/modules/ketone.js`, `src/notifications.js`, `src/modules/settings.js`

### BL-H07 · Mahlzeit-Favoriten / Schnelleingabe
**Status:** Aus BL-10 übernommen  
**Problem:** Mahlzeit erfassen = 4 Klicks, keine Favoriten für "Schulfrühstück".  
**Dateien:** `src/state.js` (favorites[]), `src/modules/meal.js`, `src/modules/calc.js`

---

## 🟡 MITTEL — Spielspass / Retention

### BL-M01 · Tägliche Challenges / Quests
**Status:** Aus BL-08 übernommen  
**Inhalt:** 3 tägliche Aufgaben ("Miss vor dem Frühstück"), Fortschrittsbalken, Coins-System  
**Dateien:** `src/config.js`, `src/achievements.js`, neue Datei `src/challenges.js`

### BL-M02 · BZ-Trend-Pfeile (Nightscout direction-Feld)
**Status:** Aus BL-12 übernommen  
**Inhalt:** ↗ ↘ → neben aktuellem BZ-Wert  
**Dateien:** `app.js` (_autoSyncNightscout), `src/api.js` (fetchNightscout direction-Feld importieren)

### BL-M03 · BZ-Wert prominent auf Dashboard
**Status:** Aus BL-11 übernommen  
**Inhalt:** Großer aktueller BZ-Wert oben im Dashboard (nicht nur Sparkline)  
**Dateien:** `src/widgets/bz-status.js`

### BL-M04 · Insulin-Rechner: Hinweis wenn kein BZ eingegeben
**Gefunden in:** Sprint-1-Review (Malte-Perspektive)  
**Problem:** Berechnung ohne BZ zeigt nur Mahlzeit-IE ohne Korrektur — könnte Unterdosierung verursachen.  
**Fix:** Gelber Hinweis wenn BZ-Feld leer: "Ohne aktuellen BZ wird keine Korrektur berechnet."  
**Dateien:** `src/modules/insulin.js` (_calcInsulinDose)

### BL-M05 · Notification-Cooldown konfigurierbar / kürzer für Kritisch
**Gefunden in:** Sprint-1-Review  
**Problem:** 1h Cooldown auch für BZ < 55 (Lebensgefahr!). Kritische Alerts sollten alle 15 Min wiederholt werden.  
**Fix:** Unterschiedliche Cooldowns: kritisch = 15 Min, hoch = 2h, Lücke = 4h  
**Dateien:** `src/notifications.js`

### BL-M06 · Alert-Texte kinderfreundlicher
**Gefunden in:** Sprint-1-Review (Malte-Perspektive)  
**Problem:** "Sofort handeln!" klingt dramatisch für ein Kind.  
**Fix:** "BZ ist 45 — iss 3 Traubenzucker-Stücke und ruf Papa/Mama an 📞"  
**Dateien:** `src/notifications.js` (checkBZAlert)

---

## 🔵 NIEDRIG — Polish / Langfristig

### BL-L01 · Fuzzy-Suche Lebensmittel (Tipp-Fehler-Toleranz)
**Status:** Aus BL-14 übernommen

### BL-L02 · DKA-Warnungen verbessern (BZ > 300 → Ketone)
**Status:** Hochgestuft auf 🟠 HOCH — siehe BL-H08

### BL-L03 · KH-Datenbank Genauigkeit prüfen
**Status:** Aus BL-16 übernommen

### BL-L04 · PIN Rate-Limiting für normalen Login
**Status:** Aus BL-13 übernommen (Elevation hat Rate-Limit, Login noch nicht)

### BL-L05 · Audit-Log für Admin-Aktionen
**Gefunden in:** Sprint-1-Review (Eltern + Berater-Perspektive)  
**Inhalt:** JSON-Log in localStorage: wer hat wann was geändert (insulinRatio, Zielbereich, Einträge gelöscht)  
**Dateien:** `src/state.js`, neue Datei `src/audit.js`

### BL-L06 · Vibration + Sound für kritische Alerts
**Gefunden in:** Sprint-1-Review  
**Fix:** `navigator.vibrate([500, 200, 500])` bei BZ < 55  
**Dateien:** `src/notifications.js`

---

## 🚀 MEILENSTEIN — KI-Assistent

### BL-KI01 · Persönlicher Diabetes-KI-Assistent
**Priorität:** 🟠 HOCH — Großer Meilenstein, Sprint 5+  
**Wunsch von:** Eltern / Nutzer (Sprint-2-Planning)  
**Vision:** Ein integrierter KI-Chat-Assistent, den man Fragen zu Diabetes stellen kann — mit persönlichen Unterlagen (z.B. aus der Diabetes-Ambulanz) als Wissensgrundlage. Für Themen die nicht in den Unterlagen stehen, greift die KI auf allgemeine Diabetes-Informationen zurück.

#### Kernfunktionen
1. **Chat-Interface** — einfache Fragen stellen ("Was tue ich bei BZ 45?", "Wie viel KH hat Kartoffelbrei?", "Warum schwankt mein BZ nach dem Sport?")
2. **Eigene Unterlagen hochladen** — PDF/Text aus der Diabetes-Ambulanz, Therapieplan, individuelle Behandlungsempfehlungen → werden als Kontext für die KI-Antworten genutzt
3. **Multi-Provider-Support** — Nutzer kann wählen zwischen:
   - Claude (Anthropic) — bereits API-Key-Support vorhanden
   - ChatGPT (OpenAI)
   - Gemini (Google)
   - Lokale Modelle (Ollama, optional)
4. **Kontext-Priorisierung** — Antworten aus eigenen Unterlagen werden bevorzugt, mit klarer Kennzeichnung "Laut Ihrem Therapieplan:" vs. "Allgemeine Information:"
5. **Sicherheitshinweis** — Klare Disclaimer dass die KI kein Arzt ist und Notfallsituationen (BZ < 55, Ketone hoch) immer den SOS-Flow triggern

#### Technische Architektur
```
src/
  ai-assistant/
    assistant.js          — Chat-Logik, Provider-Facade
    providers/
      claude-provider.js  — Anthropic API (bereits api.js Grundlage)
      openai-provider.js  — OpenAI Chat Completions API
      gemini-provider.js  — Google Gemini API
    document-store.js     — Unterlagen hochladen + indexieren (localStorage)
    prompt-builder.js     — System-Prompt aus Unterlagen + Nutzerdaten aufbauen
src/modules/
  assistant.js            — Chat-UI Seite
```

#### Unterlagen-Management
- PDFs/Text-Dateien können lokal gespeichert werden (Base64 in localStorage oder IndexedDB)
- Volltextsuche in den Dokumenten → relevante Passagen als Kontext mitgeben
- Dateien können benannt und verwaltet werden ("Therapieplan 2026", "Notfallprotokoll DRK")
- **Datenschutz:** Alle Unterlagen bleiben lokal — nur der relevante Textausschnitt wird an die KI-API gesendet (kein Upload der ganzen Datei)

#### System-Prompt Strategie
```
Du bist ein Diabetes-Assistent für [Name]. 
Aktuelle Werte: BZ [X], letztes Insulin [X] IE vor [X] Min.
Behandlungsplan (aus persönlichen Unterlagen):
---
[Relevanter Ausschnitt aus hochgeladenen Dokumenten]
---
Beantworte die Frage basierend auf dem Behandlungsplan.
Für Themen außerhalb des Plans: gib allgemeine Informationen mit dem Hinweis "Allgemeine Information".
Bei Notfällen: Leite immer zum SOS-Modus weiter.
```

#### Settings
- KI-Provider wählen + API-Key eingeben (Admin-Gate)
- Unterlagen verwalten (hochladen, umbenennen, löschen)
- Chat-Verlauf löschen

**Dateien (neu):** `src/modules/assistant.js`, `src/ai-assistant/assistant.js`, `src/ai-assistant/providers/*.js`, `src/ai-assistant/document-store.js`, `src/ai-assistant/prompt-builder.js`  
**Dateien (anpassen):** `index.html` (neue Seite + Nav-Button), `src/ui/router.js` (PAGE_REGISTRY), `src/modules/settings.js` (Provider + API-Keys), `src/api.js` (OpenAI/Gemini Clients)

---

## ⚪ Langfristig / Externe APIs

| ID | Feature | Komplexität |
|----|---------|-------------|
| BL-X01 | Direkte Dexcom API v3 (OAuth) | Sehr hoch |
| BL-X02 | Omnipod 5 Integration | Sehr hoch (proprietäre API) |
| BL-X03 | Keycloak SSO für Arztpraxen | Hoch |
| BL-X04 | IOB/COB im Insulin-Rechner | Hoch |
| BL-X05 | Tageszeit-spezifische Zielwerte | Mittel |

### Food-Folgeausbau
| ID | Feature | Priorität |
|----|---------|-----------|
| FD-04 | BE/KE/FPE als zusätzliche Food-Metriken | Mittel |
| FD-05 | Zusätzliche Food-Provider (Food Repo / USDA) hinter Provider-Abstraktion | Mittel |
| FD-06 | Persistente Online-Favoriten / Recents für häufige Scan-Produkte | Mittel |

---

## Sprint-Empfehlung

### ✅ Sprint 2 (Sicherheit zuerst) — FERTIG
1. ✅ BL-S01 · Warnung bei unrealistischen Insulin-Parametern
2. ✅ BL-S06 · Korrektur-Fenster im Insulin-Rechner
3. ✅ BL-M04 · Hinweis wenn kein BZ eingegeben
4. ✅ BL-M06 · Kinderfreundliche Alert-Texte
5. ✅ BL-H06 · Streak-Dashboard
6. ✅ BL-H08 · Ketone-Warnung & DKA-Protokoll

### ✅ Sprint 3 (Familien-Rollen) — FERTIG
> Basis: Nutzerforschung mit 6 Personas (Elternteil, Kind 8, Jugendlicher 16, Erwachsene, Arzt, Oma)
1. ✅ NEU-F1 · Familien-Rollen: profile_links + Einladungsflow (Backend + Frontend)
2. ✅ NEU-F2/F3 · Ampel-Dashboard + Notfall-Flow für Betreuer (Observer Page)
3. ✅ NEU-F4 · Adaptive UI: useAgeGroup Hook
4. ✅ BL-H01 · PIN-Länge 4 oder 6 Stellen
5. ✅ BL-H02 · Elevation Session-Timeout (15 Min)

### Sprint 4 (Nutzer-getriebene Features — Forschungs-Prioritäten)
> Priorisiert nach Nutzerforschung Sprint 3
1. NEU-F9 · Tages-Zusammenfassung als morgendliche Push-Nachricht (Sarah)
2. NEU-F10 · Druckbare Notfall-Karte / QR-Code für Lehrer (Sarah)
3. NEU-F11 · Malte-Spielmodus: Charakter + Punkte + Leveling (Malte)
4. NEU-F8 · Sport/Aktivitäts-Kontext-Modus mit Vorab-Empfehlungen (Jonas)
5. BL-H03 · Datenexport PDF/CSV (Anna, Dr. Krause)
6. BL-H07 · Mahlzeit-Favoriten (Sarah)

### Sprint 5 (Professionelle Daten & Arzt-Integration)
> Priorisiert nach Arzt + Erwachsene-Nutzer-Forschung
1. NEU-F6 · Zeitlich begrenzter Arzt-Link ohne Login (Anna, Dr. Krause)
2. NEU-F7 · Muster-Erkennung (wiederkehrende BZ-Muster) (Jonas, Anna)
3. NEU-F15 · Konsensus-Kennzahlen-Dashboard (TIR, GMI, CV%) (Anna, Dr. Krause)
4. NEU-F12 · Dark Mode (Anna)
5. NEU-F14 · Mini-Share-Modus für Trainer/Lehrer (Jonas)
6. BL-M01 · Tägliche Challenges/Quests (Malte)

### Sprint 6 (Intelligenz & Automation)
1. NEU-F13 · Adaptiver Bolus-Rechner (lernt aus History) (Anna)
2. BL-KI01 · KI-Assistent (Grundversion: Claude + Dokument-Upload)
3. BL-KI01 · Multi-Provider (OpenAI, Gemini)
4. NEU-F5 · Eltern-Ping steuerbar durch Kind/Jugendlichen (Jonas)

### Sprint 7 (Sicherheits- & Versorgungs-Upgrade — KOMPLETTPAKET)
> Neuer Sprint mit allen priorisierten Punkten aus der letzten Produkt-Runde (Sicherheit + Versorgung + Alltagstauglichkeit)
1. NEU-F16 · Kritisch-Alert Eskalationskette
   - Bestätigungspflichtige kritische Alerts (Hypo/Hyper)
   - Eskalationskette: Eltern 1 -> Eltern 2 -> Notfallkontakt
   - Verknüpfung mit Notfall-Flow für Betreuer
2. NEU-F17 · CGM-/Nightscout-Gap-Erkennung
   - Alarm bei ausbleibenden CGM-Daten nach definierter Zeit
   - Eigene Hinweislogik für Betreuer-/Schulmodus
3. NEU-F18 · Medizinischer Wochenbericht (PDF + Datenexport Plus)
   - PDF mit TIR, Hypo-/Hyper-Episoden, Ketone-Ereignissen, Streaks
   - FHIR/CSV-Export für Arztkommunikation vereinheitlichen
4. NEU-F19 · Sicherheits-Härtung Rollen & Sessions
   - PIN-Rate-Limiting beim Login
   - Audit-Log für Admin-Aktionen (wer, was, wann)
   - Strengere Session-Timeouts bei sensiblen Änderungen
5. NEU-F20 · Schul-/Betreuer-Modus 2.0
   - "3-Klick-Notfallhilfe" für nicht-medizinisches Personal
   - Rollenabhängige Aktionsfreigaben (Lesen vs. dokumentieren)
   - Druck-/Tageskarte für Schule und Sportverein
6. NEU-F21 · Muster-Erkennung mit Hinweisen
   - Erkennung wiederkehrender Muster (z.B. nach Frühstück/Sport)
   - Konkrete, nicht-dosierende Handlungshinweise
7. NEU-F22 · Reminder-Motor mit Ruhezeiten
   - Wiederkehrende Routinen (Messzeiten, Ketone, Materialcheck)
   - Quiet Hours + kindgerechte Sprache
8. NEU-F23 · Familien-Kommunikation im Verlauf
   - Kurze Kommentare/Notizen direkt an Einträgen für Eltern, Schule, Betreuer
9. NEU-F24 · Therapie-Übergabe-Flow (Kind -> Teen -> Erwachsen)
   - Schrittweise UI-/Rechte-Umstellung je Reifegrad
10. NEU-F25 · Tagesreflexion "Was hat heute geholfen?"
    - 1-Tap Rückblick für Lern- und Motivationsfeedback
11. NEU-F26 · Datenqualitätsindikatoren
    - Erkennung von Messlücken, veralteten Werten, unvollständigen Einträgen

**Sprint-7 Prioritätsblöcke (Umsetzungsreihenfolge innerhalb des Sprints):**
1. Sicherheitskern: `NEU-F16`, `NEU-F17`, `NEU-F19`
2. Versorgung/Arzt: `NEU-F18`, `NEU-F21`, `NEU-F26`
3. Alltag & Retention: `NEU-F20`, `NEU-F22`, `NEU-F23`, `NEU-F24`, `NEU-F25`

### Sprint 8 (Plattformstabilität, Doku & Signalqualität)
1. REVIEW · Anwendungs-Review und Bestandsaufnahme
2. DOKU · README, Architektur und Frontend-Doku auf Ist-Zustand ziehen
3. OPS · Cookbook / Betriebsanleitung erstellen
4. BACKLOG · Status bereinigen und teilweise umgesetzte Themen sichtbar machen
5. NEU-F17 · CGM-/Nightscout-Gap-Erkennung
6. NEU-F26 · Datenqualitätsindikatoren
7. SR-04 / NEU-F21 · Muster-Erkennung mit Zeitfenstern

### Sprint 9 (Experience Overhaul, Freigabe-Reparaturen & visuelle Modernisierung)
1. UX-00 · Designsystem-Basis, App-Shell, Typografie und GUI-Relaunch
2. BR-01 · Settings-Schreibflow reparieren
3. BR-02 · Invite-/Watcher-Flow reparieren
4. BR-03 · KI-Chat stabilisieren oder kontrolliert degradieren
5. SR-03 / NEU-F18 · Arzt-Link als druckbarer Kurzbericht
6. SR-01 / NEU-F14 · Mini-Share klar auf Lesemodus begrenzen
7. SR-06 / NEU-F5 · Eltern-Ping mit Zustellfeedback

### Sprint 10 (Freigabe-Fix, Integrität & Experience-Polish)
> Vormerkung aus Sprint-9-Review, Persona-UAT und Spezialisten-Review
1. BR-04 / UX-01 · Observer-Schreibfluss korrekt machen oder bis zum Fix read-only schalten
   - Einträge aus dem Observer-/Betreuer-Modus müssen sicher im beobachteten Profil landen
   - Falls das nicht sprinttauglich sauber lösbar ist, werden Schreibaktionen im Observer-Modus vorübergehend deaktiviert
2. UX-02 · Settings mit explizitem Speichermodell und kontrollierten Feldern
   - sensible Werte nicht nur implizit auf `blur`
   - klare Rückmeldung, wann ein Wert lokal geändert, serverseitig gespeichert oder abgewiesen wurde
3. UX-03 · Sekundärseiten vollständig ins neue Designsystem ziehen
   - `BZ`, `Insulin`, `Meal`, `Activity`, `History`, `Ketone`, `Calc`, `Emergency`
   - keine „alter Screen mit neuem Header“-Brüche mehr
   - Assistant-Ausgabe ohne Roh-Markup und mit hochwertiger Quellen-/Kontext-Trennung
4. UX-04 · Konsistenz-Polish für Navigation und Altersgruppen
   - Navigation komplett deutsch
   - Root-Screens ohne irritierende Zurück-Mechanik
   - stärkere visuelle Trennung `child_young` vs `child_teen` vs `adult`
5. ARC-01 · Architektur-Integritätsreview für Observer-, API- und Zustandsmodell
   - Review durch Architektur-Perspektive verpflichtend vor Sprint-Abnahme
   - Fokus auf Rollen, Profilzuordnung, State-Integrität und API-Klarheit
6. DOC-02 · Doku- und Architektur-Delta je Sprint verpflichtend nachziehen
   - `README.md`, `ARCHITECTURE.md` und betroffene Betriebsdoku müssen immer mit dem Code-Stand aktualisiert werden

### ✅ Sprint 11 (Lebensmittel-DB, Barcode & hybride Suche) — FERTIG
1. FD-01 · Kuratierter DACH-Food-Katalog mit 300+ Built-ins, Aliases, Kategorien und Portionspresets
2. FD-02 · Hybride Food-Suche: lokale Suche als Standard, explizite Open-Food-Facts-Suche online
3. FD-03 · Barcode-Flow mit `lokal -> Open Food Facts`-Fallback
4. FD-03 · Portionseditor und KH-Summenbildung direkt im Rechner
5. FD-03 · Handoff vom KH-Rechner in den Mahlzeiten-Flow
6. DOC-03 · README, Architektur und Cookbook auf Food-Architektur erweitert

### Sprintreview-Follow-ups (freigegeben mit Anmerkungen)

#### SR-01 · Mini-Share klarer abgrenzen
**Quelle:** Sprintreview  
**Keyuser:** Jonas, Oma/Betreuung  
**Follow-up zu:** `NEU-F14`

**User Story:** Als nicht-medizinische Begleitperson moechte ich im Mini-Share nur lesen-orientierte Informationen sehen, damit ich nicht versehentlich medizinische Handlungen ausfuehre, die ausserhalb meiner Rolle liegen.

**Akzeptanzkriterien:**
1. Mini-Share zeigt nur Status-, Verlaufs- und Notfallinformationen, aber keine missverstaendlichen Handlungs-CTAs.
2. Medizinische Aktionsbuttons bleiben Arzt-/Betreuer-Ansichten vorbehalten.
3. Die Ansicht erklaert klar, dass bei kritischen Werten Eltern oder Betreuer kontaktiert werden sollen.

#### SR-02 · KI-Antwort-Herkunft sichtbar machen
**Quelle:** Sprintreview  
**Keyuser:** Anna, Dr. Krause  
**Follow-up zu:** `BL-KI01`

**User Story:** Als Nutzerin moechte ich sehen, ob eine KI-Antwort aus meinem persoenlichen Kontext oder aus allgemeinem Wissen stammt, damit ich die Antwort besser einordnen kann.

**Akzeptanzkriterien:**
1. Jede KI-Antwort kennzeichnet sichtbar `Persoenlicher Kontext` oder `Allgemeine Information`.
2. Antworten mit persoenlichem Kontext priorisieren vorhandene Unterlagen und markieren das nachvollziehbar.
3. Falls kein persoenlicher Kontext verwendet wird, ist das ebenfalls explizit sichtbar.

#### SR-03 · Arzt-Link als Kurzbericht druckbar machen
**Quelle:** Sprintreview  
**Keyuser:** Dr. Krause, Anna  
**Follow-up zu:** `NEU-F18`

**User Story:** Als Arzt moechte ich einen kompakten, druckbaren Kurzbericht aus dem Arzt-Link erhalten, damit ich die wichtigsten Informationen schnell in der Sprechstunde erfassen kann.

**Akzeptanzkriterien:**
1. Der Arzt-Link bietet eine druckfreundliche Kurzansicht mit Kennzahlen, letzten relevanten Ereignissen und Basis-Notfallhinweis.
2. Die Druckansicht funktioniert ohne Login und ohne unnoetige Navigationselemente.
3. Die Kurzansicht bleibt klar von der Mini-Share-Ansicht getrennt.

#### SR-04 · Mustererkennung mit Zeitfenstern
**Quelle:** Sprintreview  
**Keyuser:** Jonas, Anna  
**Follow-up zu:** `NEU-F21`

**User Story:** Als Nutzer moechte ich bei Mustern konkrete Zeitfenster sehen, damit ich erkenne, wann ein wiederkehrendes Problem typischerweise auftritt.

**Akzeptanzkriterien:**
1. Musterhinweise nennen konkrete Zeitfenster wie `nach dem Fruehstueck zwischen 8:00 und 10:00 Uhr`.
2. Zeitfenster werden aus den erkannten Daten abgeleitet und nicht nur generisch benannt.
3. Die Hinweise bleiben nicht-dosierend und verweisen nur auf beobachtete Muster.

#### SR-05 · Dark-Mode-Polish
**Quelle:** Sprintreview  
**Keyuser:** Anna  
**Follow-up zu:** `NEU-F12`

**User Story:** Als Nutzerin moechte ich einen visuell ausgereiften Dark Mode, damit Karten, Statusfarben und Kontraste auch bei laengerer Nutzung angenehm und klar lesbar bleiben.

**Akzeptanzkriterien:**
1. Karten, Statuskomponenten und Navigation erhalten abgestimmte Dark-Mode-Farben mit ausreichendem Kontrast.
2. Kritische Statusfarben bleiben auch im Dark Mode klar unterscheidbar.
3. Der Dark Mode wirkt konsistent und nicht wie eine reine Invertierung des Light Modes.

#### SR-06 · Eltern-Ping mit Zustellfeedback
**Quelle:** Sprintreview  
**Keyuser:** Sarah, Jonas  
**Follow-up zu:** `NEU-F5`

**User Story:** Als Kind oder Jugendlicher moechte ich nach einem Eltern-Ping sehen, an wen und an wie viele Betreuer die Nachricht gesendet wurde, damit ich direkt Rueckmeldung ueber die Zustellung bekomme.

**Akzeptanzkriterien:**
1. Nach dem Ping zeigt die App an, an wie viele Empfaenger gesendet wurde.
2. Wenn technisch moeglich, werden die betroffenen Betreuer namentlich genannt.
3. Wenn keine Empfaenger verfuegbar sind, gibt die App ein klares Feedback statt eines stillen Erfolgs.

### Sprint 10 (UX-Freigabe, Rollenfluss & Konsistenz)
1. UX-01 · Observer-Schreibfluss absichern
   - Beobachtete Profile und aktive Schreibziele muessen visuell und technisch klar getrennt sein.
   - Schnellaktionen im Beobachtungsmodus duerfen nur ins beobachtete Profil schreiben.
   - Die UI muss eindeutig zeigen, ob gerade das eigene oder ein fremdes Profil aktiv ist.

2. UX-02 · Settings als kontrollierte Formular-UI
   - Einstellungsfelder muessen den gespeicherten Wert zuverlaessig widerspiegeln und nicht nur beim Blur erfasst werden.
   - Nach dem Speichern braucht es klares Feedback, ob der Server den Wert akzeptiert oder normalisiert hat.
   - Medizinisch relevante Felder duerfen nicht stillschweigend von der UI abweichen.

3. UX-03 · Assistant-Ausgabe lesbar und ehrlich machen
   - KI-Antworten muessen sauber formatiert erscheinen, ohne rohe Markdown-Reste.
   - Der deaktivierte oder nicht verfuegbare Zustand muss sichtbar und ruhig erklaert werden.
   - Quelle, Kontext und Verfuegbarkeit sollen auch visuell klar getrennt sein.

4. UX-04 · Visuelle Konsistenz ueber alle Sekundaerseiten
   - BZ, Insulin, Mahlzeit, Aktivitaet, Verlauf und weitere Seiten muessen dieselbe Typo-, Card- und CTA-Sprache sprechen.
   - Alte Ad-hoc-Farben, uneinheitliche Abstaende und gemischte Surface-Stile sollen verschwinden.
   - Die App soll sich nicht nur auf einzelnen Screens modern anfuehlen, sondern durchgaengig.
