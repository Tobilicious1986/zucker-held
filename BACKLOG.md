# Zucker-Held — Produkt-Backlog

> Letzte Aktualisierung: 2026-04-09 (Sprint-2-Planung + Neue Meilensteine)  
> Primärer Nutzer: Malte, 8 Jahre, T1D, Omnipod 5 + Dexcom G7

---

## ✅ Fertig (zuletzt implementiert)

| ID | Feature | Sprint |
|----|---------|--------|
| BL-01 | Insulin-Dosierungs-Rechner | Sprint 1 |
| BL-02 | 7-Tage-Chart (renderFullChart) | — |
| BL-03 | localStorage Fehlerbehandlung | Sprint 1 |
| BL-04 | Admin/Betreuer-Modus | Sprint 1 |
| BL-07 | Browser-Benachrichtigungen | Sprint 1 |

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

---

## Sprint-Empfehlung

### Sprint 2 (Sicherheit zuerst)
1. BL-S01 · Warnung bei unrealistischen Insulin-Parametern
2. BL-S05 · Export-Angebot vor CGM-Datenlöschung
3. BL-S06 · Korrektur-Fenster im Insulin-Rechner
4. BL-M04 · Hinweis wenn kein BZ eingegeben
5. BL-M05 · Kritische Alerts alle 15 Min (kein 1h-Cooldown)
6. BL-M06 · Kinderfreundliche Alert-Texte

### Sprint 3 (UX & Betreuer)
1. BL-H01 · Admin-PIN auf 6 Stellen
2. BL-H02 · Rollen-Session-Timeout
3. BL-H05 · _adminGate ohne PIN → Hinweis
4. BL-H06 · Streak-Dashboard
5. BL-M03 · BZ prominent auf Dashboard

### Sprint 4 (Export & Langzeitdaten)
1. BL-H03 · Datenexport PDF/CSV
2. BL-H07 · Mahlzeit-Favoriten
3. BL-M01 · Tägliche Challenges

### Sprint 5 (Medizinische Sicherheit)
1. BL-H08 · Ketone-Warnung & DKA-Protokoll bei BZ > 300
2. BL-L02 · (aufgestuft → BL-H08)

### Sprint 6+ (KI-Meilenstein)
1. BL-KI01 · KI-Assistent (Grundversion: Claude + Dokument-Upload)
2. BL-KI01 · Multi-Provider (OpenAI, Gemini)
3. BL-KI01 · Erweiterte Dokumenten-Indexierung
