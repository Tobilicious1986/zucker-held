# UAT Sprint 15 — "Consent trifft Klinik"

> Datum: 2026-04-16  
> Branch: `codex/sprint-15-consent-journal-klinik-view`  
> Status: ⚠️ UAT noch nicht durchgeführt — Szenarien sind definiert, aber kein laufender Server verfügbar war.  
> Nachholplan: UAT auf laufender Instanz (Docker + Backend + Frontend) durchführen, danach Statusfelder aktualisieren.

---

## Hinweis zur Testintegrität

Gemäß Projektregeln (`CLAUDE.md`, `AGENT_WORKFLOW.md`) dürfen UAT-Szenarien **nur dann als ✅ markiert werden, wenn sie auf einer laufenden Instanz wirklich durchgespielt wurden.** Die Szenarien unten sind als Testplan definiert — der Status bleibt `⏳ ausstehend` bis zur tatsächlichen Durchführung.

---

## Personas & Szenarien

### Persona 1 — Sarah (Patientin, ADMIN-Rolle)
**Ziel:** Einwilligungshistorie einsehen + aktive Freigaben verwalten

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| S-01 | Login als Sarah → Settings öffnen → Consent-Journal-Sektion | Chronologische Liste aller Consent-Events mit Icon, Akteur, Datum und Details | ⏳ |
| S-02 | Keine Consent-Events vorhanden | Leer-Zustand: "Noch keine Freigabe-Aktionen aufgezeichnet." | ⏳ |
| S-03 | Mehr als 50 Events vorhanden → "Mehr laden" klicken | Nächste Seite lädt (paginiert) | ⏳ |
| S-04 | Settings → "Meine Freigaben" → `/consent` öffnen | Alle aktiven Links mit Scope-Badge, Zweck, Watcher-Name, Ablaufdatum | ⏳ |
| S-05 | `/consent` → Widerruf-Button klicken | Toast "Freigabe widerrufen ✅" — Link verschwindet sofort aus der Liste | ⏳ |
| S-06 | Offene Einladungen in `/consent` vorhanden | Separate Sektion "Offene Einladungen" mit "Zurückziehen"-Button | ⏳ |

---

### Persona 2 — Schulbetreuer (LEARNING_ONLY-Flow)
**Ziel:** Sicher in LEARNING_ONLY-Flow landen ohne je einen Messwert zu sehen

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| L-01 | Login → Profil mit LEARNING_ONLY-Badge auswählen | Scope-Badge "Lernen" (grau) sichtbar, Text "Lern- & Notfallzugang · keine Messwerte" | ⏳ |
| L-02 | Nach Login-Klick | Weiterleitung zu `/learning/[ownerId]` | ⏳ |
| L-03 | Auf `/learning/[ownerId]` | SOS-Button (tel:112), Notfallkontakte, Hypo/Hyper/Ketone-Karten — kein BZ-Wert sichtbar | ⏳ |
| L-04 | Direktaufruf `/observer` ohne LIVE_MEDICAL | 403 "Kein Zugriff" (Header-Guard via Query-Fehler) | ⏳ |
| L-05 | Direktaufruf `/learning/[andereId]` ohne LEARNING_ONLY-Link | 403 "Kein Zugriff"-Screen | ⏳ |

---

### Persona 3 — Oma (SUMMARY_ONLY-Flow)
**Ziel:** Wochenbericht einsehen ohne Einzelmessungen

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| W-01 | Login → Profil mit SUMMARY_ONLY-Badge | Scope-Badge "Überblick" (blau), Text "Wochenzusammenfassung · kein Live-Zugriff" | ⏳ |
| W-02 | Nach Login-Klick | Weiterleitung zu `/summary/[ownerId]` | ⏳ |
| W-03 | Auf `/summary/[ownerId]` | TIR-Balken (farbkodiert), Metriken Hypo/Hyper-Zähler, Ø-BZ — keine Einzelmessungen | ⏳ |
| W-04 | Direktaufruf `/summary/[andereId]` ohne SUMMARY_ONLY-Link | 403 "Kein Zugriff"-Screen | ⏳ |

---

### Persona 4 — Dr. Krause (DOCTOR-Share-Link)
**Ziel:** Druckbare klinische Ansicht öffnen

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| D-01 | Gültiger DOCTOR-Link → `/share/[token]/clinical` | Klinisches Layout: Header mit Patientenname + Ablaufdatum, TIR/GMI/CV/Letzter-BZ-Grid | ⏳ |
| D-02 | Therapieplan in Settings vorhanden | Therapieplan-Sektion mit bzMin/Max, Zielwert, Insulin-/Korrekturfaktor sichtbar | ⏳ |
| D-03 | Einträge der letzten 14 Tage vorhanden | Timeline-Tabelle (max. 50 Einträge, nur BZ/Insulin/Mahlzeit/Ketone, BZ farbkodiert) | ⏳ |
| D-04 | "Drucken / Als PDF speichern" klicken | Systemdialog für Drucken öffnet sich; Print-Button selbst nicht gedruckt (`print:hidden`) | ⏳ |
| D-05 | Abgelaufener Token | Uhr-Emoji + "Dieser Link ist abgelaufen" + "neuen Arztlink anfordern" | ⏳ |
| D-06 | Ungültiger / widerrufener Token | Schloss-Emoji + "Link nicht gefunden oder widerrufen" | ⏳ |
| D-07 | MINI-Token auf `/clinical`-URL | 403 Forbidden (kein klinischer Zugriff für Nicht-DOCTOR-Links) | ⏳ |
| D-08 | Kein Login-Prompt sichtbar | Seite lädt ohne Auth-Check (öffentlicher Arzt-Link by Design) | ⏳ |

---

### Persona 5 — Anna (LIVE_MEDICAL-Flow, unverändert)
**Ziel:** Bestehender Observer-Flow läuft weiterhin korrekt

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| A-01 | Login → Profil mit LIVE_MEDICAL-Badge | Scope-Badge "Live" (grün), Weiterleitung zu `/observer` | ⏳ |
| A-02 | Observer-Seite lädt Live-Daten | BZ-Werte, Einträge sichtbar — kein Scope-Downgrade | ⏳ |

---

## Sicherheitschecks

| # | Check | Erwartetes Ergebnis | Status |
|---|-------|---------------------|--------|
| SEC-01 | SUMMARY_ONLY-Nutzer ruft `/observer` auf | 403 oder Redirect — kein Live-Datenzugriff | ⏳ |
| SEC-02 | Consent-History von fremdem Profil (`/privacy/consent-history` mit anderer profileId) | 403 Forbidden | ⏳ |
| SEC-03 | `ClinicalSettingsView` enthält keine apiKey/contacts/pinHash-Felder | Strukturprüfung T-03 bestätigt 5-Felder-Allow-List | ✅ (Unit-Test T-03 wirklich ausgeführt) |
| SEC-04 | Widerruf einer Freigabe → sofortiger Zugriffsverlust | Nach DELETE sieht Watcher keinen Eintrag mehr | ⏳ |
| SEC-05 | Abgelaufener DOCTOR-Token → 410 (nicht 403) | Token-Enumeration verhindert | ✅ (Unit-Test T-03 wirklich ausgeführt) |

---

## Abnahmekriterien (Sprint-Plan)

| Kriterium | Ergebnis |
|-----------|---------|
| Sarah sieht chronologisches Einwilligungsjournal | ⏳ UAT ausstehend |
| Schulbetreuer landet auf LEARNING_ONLY-Flow ohne Messwerte | ⏳ UAT ausstehend |
| Oma sieht Wochenbericht ohne Einzelmessungen | ⏳ UAT ausstehend |
| Dr. Krause öffnet druckbare klinische Ansicht | ⏳ UAT ausstehend |
| Anna widerruft Freigabe mit einem Klick in `/consent` | ⏳ UAT ausstehend |
| 44/44 Backend-Tests grün | ✅ mvn test wirklich ausgeführt |
| Frontend-Build sauber (0 TypeScript-Fehler) | ✅ npm run build wirklich ausgeführt |
