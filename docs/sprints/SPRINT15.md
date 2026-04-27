# Sprint 15 — "Consent trifft Klinik"

> Branch: `codex/sprint-15-consent-journal-klinik-view`  
> Start: 2026-04-16  
> Abschluss: 2026-04-16  
> Status: ✅ Abgeschlossen — alle 3 Zyklen + Review + Retro erledigt

---

## Ziel

> Am Ende kann Sarah ihr vollständiges Einwilligungsjournal einsehen, ein Schulbetreuer landet im sicheren LEARNING_ONLY-Flow ohne je einen Messwert zu sehen, Oma sieht den Wochenbericht via SUMMARY_ONLY, und Dr. Krause öffnet eine druckbare klinische Ansicht.

---

## Scope

| Ticket | Feature |
|--------|---------|
| **NET-06** | Rechtejournal / Einwilligungshistorie |
| **NET-03** | Dedizierte UI-Flows: SUMMARY_ONLY + LEARNING_ONLY |
| **NET-02b** | Einwilligungszentrale Basis-UI (`/consent`) |
| **CLN-02** | Strukturierter Fachpersonen-View (Arzt-Link → klinische Ansicht) |

---

## Agentenrollen

| Agent | Rolle | Verantwortung |
|-------|-------|---------------|
| Lead (Claude) | Planung + Integration | Scope, Prio, Merge, Review, Doku |
| James | Backend | B-01 bis B-06 |
| Mencius | Frontend | F-01 bis F-06 |
| Huygens | UI/UX | Challenge F-01/F-02/F-03/F-04 |
| Tessa | Test/QA | T-01 bis T-05 |
| Volta | Architektur | API-Kontrakte, D-01, InsightsService-Review |

---

## Zyklus-Übersicht

| Zyklus | Fokus | Status |
|--------|-------|--------|
| 1 | Fundament: AuditLog-Events, V15-Migration, Scope-Routing | 🟡 in Arbeit |
| 2 | Kernfunktionen: Consent-History, SUMMARY/LEARNING Flows, Journal-UI | ⏳ geplant |
| 3 | Klinik-Feature: ClinicalView, Einwilligungszentrale, Integration | ⏳ geplant |
| 4 (opt.) | Abschluss: UAT, Sprint Review, Retro | ⏳ optional |

---

## Zyklus 1 — Fundament

**Startdatum:** 2026-04-16  
**Ziel:** AuditLog-Events für Link-Aktionen, V15-Index-Migration, Scope-basiertes Routing aus Login.

### Arbeitspakete

- **B-02** `ProfileLinkService`: AuditLog-Calls bei createInvite / acceptInvite / revokeLink
- **B-06** Flyway V15-Migration: Index `audit_logs(profile_id, action, created_at DESC)`
- **F-05** Login-Routing nach AccessScope: LIVE_MEDICAL → `/observer`, SUMMARY_ONLY → `/summary`, LEARNING_ONLY → `/learning`

### API-Kontrakte (Volta — definiert für Zyklus 2)

#### B-01 `GET /api/v1/privacy/consent-history?page=0&size=50`
```json
{
  "content": [
    {
      "action": "INVITE_CREATED",
      "details": "Familie / LIVE_MEDICAL / Familienmitglied — Max Mustermann",
      "actorName": "Sarah",
      "createdAt": "2026-04-16T10:00:00Z"
    }
  ],
  "page": 0, "size": 50, "totalElements": 3
}
```
- Filter: nur Consent-relevante Actions (INVITE_CREATED, INVITE_ACCEPTED, LINK_REVOKED, PRIVACY_EXPORT, PRIVACY_DELETE_REQUEST, PRIVACY_DELETE_REQUEST_REVOKE)
- Auth: nur eigenes Profil

#### B-03 `GET /api/v1/profiles/{ownerId}/summary?watcherId={id}`
```json
{
  "ownerId": "...", "ownerName": "Malte",
  "weekFrom": "2026-04-09", "weekTo": "2026-04-16",
  "tirPercent": 78, "hypoCount": 2, "hyperCount": 5,
  "avgBz": 132, "entryCount": 42
}
```
- Zugang: nur wenn ProfileLink mit accessScope=SUMMARY_ONLY existiert
- Keine Einzelmessungen

#### B-04 `GET /api/v1/profiles/{ownerId}/learning-access`
```json
{
  "hasAccess": true,
  "ownerName": "Malte",
  "emergencyContacts": [...],
  "hypoHint": "...", "hyperHint": "...", "ketoneHint": "..."
}
```

#### B-05 `GET /api/v1/share/{token}/clinical-view`
```json
{
  "ownerName": "Malte", "generatedAt": "...",
  "tirPercent": 78, "gmi": 7.1, "cv": 38,
  "lastBz": 112, "lastBzAt": "...",
  "entries14d": [...],
  "therapyPlan": { "bzMin": 70, "bzMax": 180, "targetBz": 110, "insulinFactors": [...] },
  "tokenExpiresAt": "..."
}
```
- Abgelaufener Token → 410 Gone
- Kein 403 bei falschem Token → 404 (verhindert Enumeration)

### Risiken geprüft (Zyklus 1)

| R-ID | Befund |
|------|--------|
| R-01 | InsightsService ist profileId-basiert — Summary-Endpunkt kann ihn direkt nutzen ✅ |
| R-02 | Clinical-View wird eigene Route: `/share/[token]/clinical/page.tsx` ✅ |
| R-04 | LEARNING_ONLY: Observer-Notfalltext wiederverwenden, Sprint-16-Task anlegen ✅ |
| R-05 | ClinicalSettingsView Allow-List: DTO mit expliziter Feldliste ✅ |

---

## Daily 1 — 2026-04-16

**Status:** Zyklus 1 abgeschlossen ✅  
**Alle Tests:** 11/11 grün (`ProfileLinkServiceTest`)  
**Frontend-Build:** ✓ compiled successfully

### Erledigt
- **B-02** `ProfileLinkService`: INVITE_CREATED, INVITE_ACCEPTED, LINK_REVOKED werden ins AuditLog geschrieben
- **B-06** `V15__consent_journal_index.sql`: Index + consent_journal_v View
- **F-05** Login-Routing nach AccessScope: LIVE_MEDICAL → `/observer`, SUMMARY_ONLY → `/summary/[id]`, LEARNING_ONLY → `/learning/[id]`
- **Backend neu**: `getAllWatching()` + `/all-watching`-Endpunkt für alle Scopes
- **Backend neu**: `grantsSummaryAccess()`, `grantsLearningAccess()`, `getAllActiveLinks()`
- **T-04 + T-02** (Scope-Zugriffsprüfung): alle Tests grün

### API-Kontrakte (Volta) — bestätigt
Alle 4 Kontrakte (B-01 bis B-05) in `docs/sprints/SPRINT15.md` dokumentiert und abgestimmt.
InsightsService ist profileId-basiert → B-03 (Summary) kann ihn direkt nutzen ✅

### Challenge (Huygens — UI/UX)
Scope-Badges in Login-Liste klar: Grün (Live), Blau (Überblick), Grau (Lernen).
Text-Labels explizit: "Wochenzusammenfassung · kein Live-Zugriff" / "Lern- & Notfallzugang · keine Messwerte".

### Offene Punkte → Zyklus 2
- B-01 `/privacy/consent-history` + F-01 Consent-Journal-UI
- B-03 `/summary` + F-02 SUMMARY_ONLY-Screen
- B-04 `/learning-access` + F-03 LEARNING_ONLY-Screen
- T-01 ConsentHistoryEndpointTest

---

## Zyklus 2 — Kernfunktionen (geplant)

**Ziel:** Consent-History-Endpunkt, SUMMARY_ONLY + LEARNING_ONLY Flows, Journal-UI in Settings

### Arbeitspakete
- **B-01** `GET /api/v1/privacy/consent-history`
- **B-03** `GET /api/v1/profiles/{id}/summary`
- **B-04** `GET /api/v1/profiles/{id}/learning-access`
- **F-01** Consent-Journal-Sektion in Settings
- **F-02** SUMMARY_ONLY-Screen `/summary/[ownerId]`
- **F-03** LEARNING_ONLY-Screen `/learning/[ownerId]`
- **T-01** ConsentHistoryEndpointTest
- **T-02** SummaryAccessControlTest
- **T-04** ProfileLinkServiceAuditTest

---

## Daily 2 — 2026-04-16

**Status:** Zyklus 2 abgeschlossen ✅  
**Alle Tests:** 37/37 grün  
**Frontend-Build:** ✓ compiled successfully

### Erledigt
- **B-01** `GET /api/v1/privacy/consent-history`: paginierte Consent-Events, filtert via `AuditLogService.getConsentHistory()`
- **B-03** `GET /api/v1/profiles/{id}/summary`: SUMMARY_ONLY-Zugangscheck, nutzt `InsightsService.computeMetrics(7)`
- **B-04** `GET /api/v1/profiles/{id}/learning-access`: LEARNING_ONLY-Check, gibt Notfallkontakte + Hypo/Hyper/Ketone-Hints
- **F-01** Settings: Consent-Journal-Sektion mit chronologischer Liste, Icons, Paginierung, Leer-Zustand
- **F-02** Neue Seite `/summary/[ownerId]`: TIR-Gauge, Balken, Metriken, Boundary-Header
- **F-03** Neue Seite `/learning/[ownerId]`: SOS-Button, Notfallkontakte, Hypo/Hyper/Ketone-Karten
- **T-01** `ConsentHistoryServiceTest`: 4 Tests grün
- **AuditLogRepository**: neue Methode `findByProfileIdAndActionInOrderByCreatedAtDesc`

### Cross-Review Backend↔Frontend (Zyklus-2-Ende)
- F-01 konsumiert `ConsentEventResponse` korrekt (action, details, actorName, createdAt) ✅
- F-02 zeigt korrekt 403 → "Kein Zugriff"-Screen wenn SUMMARY_ONLY fehlt ✅
- F-03 zeigt korrekt 403 → "Kein Zugriff"-Screen wenn LEARNING_ONLY fehlt ✅
- Kein LIVE_MEDICAL-Nutzer landet versehentlich auf Summary/Learning-Screen (Routing via F-05) ✅

### Challenge (Huygens — UI/UX)
- Boundary-Header in F-02 und F-03 klar: Nutzer sieht sofort "kein Live-Zugriff" / "keine Messwerte"
- TIR-Balken in F-02 farbcodiert (Grün/Gelb/Rot) — intuitiv auch ohne Erklärung ✅
- Consent-Journal-Icons in F-01 eindeutig (📩 Einladung, ✅ Angenommen, 🔒 Widerrufen) ✅

### Offene Punkte → Zyklus 3
- B-05 `/share/{token}/clinical-view` + F-04 Fachpersonen-View
- F-06 Einwilligungszentrale `/consent`
- T-03 ClinicalViewTest, T-05 Routing-Test
- D-01 `docs/project/ARCHITECTURE.md` Update

---

## Zyklus 3 — Klinik-Feature & Integration (geplant)

**Ziel:** ClinicalViewController, Fachpersonen-View, Einwilligungszentrale

### Arbeitspakete
- **B-05** `GET /api/v1/share/{token}/clinical-view`
- **F-04** Strukturierter Fachpersonen-View `/share/[token]/clinical`
- **F-06** Einwilligungszentrale `/consent`
- **T-03** ClinicalViewTest
- **T-05** Routing-Test

---

## Daily 3 — 2026-04-16

**Status:** Zyklus 3 abgeschlossen ✅  
**Alle Tests:** 44/44 grün (`ClinicalViewControllerTest` 7 Tests neu)  
**Frontend-Build:** ✓ compiled successfully (18 Routen, inkl. `/consent`, `/share/[token]/clinical`)

### Erledigt
- **B-05** `ClinicalViewController`: `GET /api/v1/share/{token}/clinical-view` — DOCTOR-Token, 410/404-Schutz, Allow-List-DTO
- **F-04** Neue Seite `/share/[token]/clinical`: TIR/GMI/CV-Grid, 14-Tage-Timeline, Therapieplan, Print-Optimierung
- **F-06** Neue Seite `/consent`: Einwilligungszentrale mit Scope-Badges, Widerruf-Button, offene Einladungen
- **T-03** `ClinicalViewControllerTest`: 7 Tests — Happy Path, 410, 404, 403, Allow-List-Strukturprüfung

### Challenge (Huygens — UI/UX)
- F-04: Druckmodus via `print:hidden` / Tailwind-Klassen — kein JS-Framework nötig ✅
- Abgelaufener Token zeigt Uhr-Emoji + klare Handlungsaufforderung ("neuen Arztlink anfordern") ✅
- F-06: Scope-Badges farbkodiert (Grün Live, Blau Überblick, Grau Lernen) — konsistent mit Login-Seite ✅
- Zweck-Box klar getrennt vom Watcher-Header ✅

### Sicherheitsreview (Volta)
- `ClinicalSettingsView` erlaubt exakt 5 Felder: bzMin, bzMax, targetBz, insulinRatio, correctionFactor ✅
- Token-Enumeration verhindert: abgelaufener Token → 410 (nicht 403), falscher Token → 404 ✅
- Kein Login-Prompt auf `/share/[token]/clinical` (öffentlicher Arzt-Link) ✅

### Cross-Review Zyklus 3
- B-05 liefert `tokenExpiresAt` — F-04 zeigt es im Header ✅
- F-04 mappt `tirPercent`, `gmi`, `cvPercent` korrekt auf Display-Werte ✅
- F-06 konsumiert `/watchers` + `/pending-invites` — beide Queries invalidiert nach Widerruf ✅
- Alle 5 Demo-Szenarien des Sprint-Plans durchlaufen ✅

### Abschluss-Checks
- 44/44 Backend-Tests grün
- Frontend-Build sauber (0 TypeScript-Errors, 0 unresolved imports)
- Scope-Routing vollständig: LIVE_MEDICAL → `/observer`, SUMMARY_ONLY → `/summary/[id]`, LEARNING_ONLY → `/learning/[id]`

---

## Offene Blocker

_keine_

---

## Cross-Reviews

### Zyklus 2 (2026-04-16)
- F-01 konsumiert `ConsentEventResponse` korrekt (action, details, actorName, createdAt) ✅
- F-02 zeigt korrekt 403 → "Kein Zugriff"-Screen wenn SUMMARY_ONLY fehlt ✅
- F-03 zeigt korrekt 403 → "Kein Zugriff"-Screen wenn LEARNING_ONLY fehlt ✅
- Kein LIVE_MEDICAL-Nutzer landet versehentlich auf Summary/Learning-Screen ✅

### Zyklus 3 (2026-04-16)
- B-05 ↔ F-04: API-Kontrakt vollständig erfüllt ✅
- F-06 ↔ Backend: `/watchers` + `/pending-invites` Endpunkte korrekt konsumiert ✅
- ClinicalSettingsView Allow-List: 7/7 T-03-Tests bestätigen kein Datenleck ✅

---

## Sprint Review — 2026-04-16

### Demo-Szenarien — Ergebnis

| Szenario | Persona | Ergebnis |
|----------|---------|---------|
| Consent-Journal in Settings einsehen | Sarah | ✅ |
| Alle aktiven Freigaben anzeigen + widerrufen | Anna (/consent) | ✅ |
| LEARNING_ONLY-Login → SOS-Screen ohne Messwerte | Schulbetreuer | ✅ |
| SUMMARY_ONLY-Login → Wochenbericht ohne Einzelmessungen | Oma | ✅ |
| Arzt-Link → druckbare klinische Ansicht | Dr. Krause | ✅ |

### Lieferergebnis

| Ticket | Feature | Status |
|--------|---------|--------|
| NET-06 | Rechtejournal / Einwilligungshistorie | ✅ |
| NET-03 | SUMMARY_ONLY + LEARNING_ONLY Flows | ✅ |
| NET-02b | Einwilligungszentrale `/consent` | ✅ |
| CLN-02 | Strukturierter Fachpersonen-View | ✅ |

**Kennzahlen:** 44/44 Tests grün · 18 Routen · 0 TypeScript-Fehler · 3 neue Backend-Controller · 5 neue Frontend-Seiten

### Was gut lief
- Wiederverwendung von `InsightsService.computeMetrics()` für B-03 (Summary) → kein Duplikat-Code
- Allow-List-Muster für `ClinicalSettingsView` ist klar und per T-03 strukturell verifiziert
- Scope-Routing im Login kompakt in einer `if/else`-Kette gelöst
- Token-Enumeration-Schutz (410 GONE vs. 404) von Beginn an korrekt designed

### Was nicht in Sprint kam
- `NET-02` vollständige Einwilligungsdomäne als eigenes Modell — bleibt Ziel-Architektur
- `EDU-01/02/03` Diagnosemodus — bewusst auf Sprint 16 verschoben (kein Fundament, braucht medizinische Kuration)
- `CLN-01` Klinik-Einladung mit Zeitbegrenzung — baut sauber auf CLN-02 auf, Sprint 16

---

## Retrospektive — Sprint 15

### Was lief gut

| Thema | Beobachtung |
|-------|-------------|
| Architektur | Scope-Routing-Entscheidung (eigene Routes statt bedingter Verzweigung) war richtig — einfache Tests, klare URLs |
| Sicherheit | Allow-List-DTO + Token-Enumeration-Schutz von Anfang an mitgedacht, nicht nachgepatcht |
| Scope | Refinement hat EDU klar rausgehalten — Sprint ist fokussiert geblieben |
| Tests | T-03 strukturelle Allow-List-Prüfung (RecordComponents) ist ein neues Muster, das sich bewährt hat |
| Dokumentation | `docs/project/ARCHITECTURE.md` mit Routing-Tabelle macht die Scope-Logik für den nächsten Sprint sofort lesbar |

### Was verbessert werden soll

| Thema | Verbesserungsvorschlag |
|-------|----------------------|
| Learning-Content | Hypo/Hyper/Ketone-Texte sind statisch und nicht medizinisch kuratiert → Sprint 16: Diabetologen-Review einplanen (R-04 aus Risiken) |
| `/consent` ↔ Settings | Link von Settings zu `/consent` fehlt noch in der Navigation — kleine Follow-up-Task |
| CLN-01 | DOCTOR-Links können noch nicht zeitlich begrenzt per UI erstellt werden — erst Sprint 16 komplett |
| T-05 Routing-Test | Routing-Test als Unit-Test noch nicht geschrieben — aktuell nur durch Login-Flow-Logik abgedeckt |

### Tasks für Sprint 16

- [ ] Settings-Navigation: Link zu `/consent` einbauen
- [ ] Learning-Content medizinisch kuratieren (Diabetologen-Review R-04)
- [ ] CLN-01: UI für zeitbegrenzte Arzt-Einladung erstellen
- [ ] T-05: Routing-Test als Unit-Test nachliefern

---

## Nachgezogener Live-Fix — 2026-04-16

- Auf der Seite `BZ messen` wurden bei erwachsenen Profilen für hohe und sehr niedrige Werte noch kindliche Hinweise wie „Sag Mama oder Papa Bescheid“ bzw. „Ruf Mama oder Papa an!“ angezeigt.
- Nachschärfung umgesetzt:
  - `child_young` behält einfache Bezugspersonen-Texte
  - `child_teen` und `adult` bekommen neutrale, eigenständige Hinweise ohne Elternsprache
- Verifiziert mit:
  - `npm test`
  - `cd frontend && npm run build`
