# Zucker-Held — Architektur

> Letzte Aktualisierung: 2026-04-28 (Sprint 17: Alltagspfade, Alltagspaket Sport/Schule, strukturierte Guardian-Pings)

## Überblick
Zucker-Held ist eine Full-Stack-Anwendung für diabetesbezogene Alltagsdokumentation, Beobachtung und Auswertung.  
Die Plattform besteht aus einem Next.js-Frontend und einem Spring-Boot-Backend mit PostgreSQL und RabbitMQ.

## Strategisches Zielbild
Zucker-Held wird architektonisch nicht nur als Logbuch-App gedacht, sondern als **Begleitplattform für Diagnose, Alltag, Lernen, Safety und Versorgung**.

Die strategische Leitlinie ist:
- **DACH Familien-first**
- **T1D-first**
- **Empfehlung-zuerst** aus Klinik, Ambulanz und Schulung

Das bedeutet für die Zielarchitektur:
- getrennte Einstiege für Betroffene, Begleitungen, Fachpersonen und Bildungs-/Notfallnutzer
- klare Trennung zwischen Live-Daten-Zugriff und reinem Lern-/Hilfemodus
- Einwilligungen und Rollen als eigenständige Domäne statt nur als Share- oder Observer-Nebenfunktion
- Lern- und Übergabefunktionen als gleichwertige Produktbausteine neben Dokumentation

## Hauptbausteine
### Frontend
- Next.js App Router unter `frontend/src/app`
- Zustand für Auth/UI-State
- TanStack Query für Server-Daten
- zentrale API-Kommunikation über `frontend/src/lib/api-client.ts`
- adaptive UI über Altersgruppen-Hooks und rollenabhängige Views
- Schriftvariablen werden lokal per CSS-Fallback gesetzt; der Production-Build darf keinen Google-Font-Netzwerkzugriff benötigen.

Wichtige Seiten:
- `login`
- `dashboard`
- `bz`, `insulin`, `meal`, `activity`, `ketone`, `history`
- `calc` als KH-Rechner mit lokaler Suche, Barcode und Online-Suche
- `observer` (LIVE_MEDICAL-Flow)
- `summary/[ownerId]` (SUMMARY_ONLY-Flow — Wochenzusammenfassung, keine Einzelmessungen)
- `learning/[ownerId]` (LEARNING_ONLY-Flow — SOS-Hilfe, Notfallkontakte, Alltagspaket, keine Messwerte)
- `assistant`
- `settings` (inkl. Consent-Journal-Sektion)
- `consent` (Einwilligungszentrale — alle aktiven Freigaben + Widerruf)
- `share/[token]`
- `share/[token]/clinical` (Klinische Ansicht für DOCTOR-Share-Links, druckbar)
- `emergency-card`
- `RegisterForm` auf der Login-Seite für neue Konten

### Backend
- REST-API unter `backend/src/main/java/de/zuckerheld/api/controller`
- Domain-Modelle und Fachlogik in `domain/model` und `domain/service`
- Persistenz über Spring Data JPA in `infrastructure/repository`
- Security über JWT-Filter und Spring Security
- optionale Keycloak-Account-Erstellung über `KeycloakAdminService`
- Messaging über RabbitMQ
- Schema-Management über Flyway-Migrationen

Wichtige Controller:
- `AuthController`
- `ProfileController`
- `EntryController`
- `FoodController`
- `SettingsController`
- `ProfileLinkController` (inkl. `/all-watching` für alle Scope-Typen)
- `InsightsController`
- `ShareController`
- `AuditLogController`
- `PrivacyController` (inkl. `GET /privacy/consent-history`)
- `SummaryController` (`GET /profiles/{id}/summary` — SUMMARY_ONLY-gesichert)
- `LearningAccessController` (`GET /profiles/{id}/learning-access` — LEARNING_ONLY-gesichert)
- `ClinicalViewController` (`GET /share/{token}/clinical-view` — DOCTOR-Token-gesichert)
- `AiProxyController`
- `FhirController`

## Sprint-12-Änderungen (Vanilla-JS-PWA-Schicht)

### Sicherheit & Mandantentrennung (SEC-01–04)
- **PIN-Hashing:** Admin-PINs werden jetzt als SHA-256-Hash gespeichert (`src/auth/local-provider.js`: `hashPin()`, async `checkPin()`). Legacy-Klartextpins werden beim nächsten Login-Versuch erkannt und müssen einmalig neu bestätigt werden.
- **Observer-Write-Guard:** `state.save()` wirft `ObserverWriteError` wenn `_activeUser.role === 'observer'`. Alle Entry-Points (`bz.js`, `insulin.js`, `meal.js`, `activity.js`, `calc.js`) fangen diesen Fehler ab und zeigen eine Toast-Meldung.
- **Audit-Log:** `state.auditLog[]` wird persistent gespeichert. `logAudit(event, details)` in `state.js`. Kritische Events: `bz_range_changed`, `insulin_settings_changed`, `contact_added`, `contact_removed`, `data_cleared`. Anzeige in Settings (Admin-only).
- **SW Cache v12:** Cache-Name `zucker-held-v12.0`, neue Widget-Dateien gecacht. Alle `.js`-Dateien Network-First (food.js inbegriffen).

### Neue Widgets (DASH-01, DASH-02)
- **bz-hero.js:** Großes BZ-Hero-Widget (72px-Wert, Trendpfeil ↗/↘/→, Farb-Status, Stale-Banner nach 90 Min). Ersetzt `bz-status` als Standard-Widget.
- **daily-challenges.js:** 3 tägliche Challenges (BZ, Mahlzeit, Aktivität). Challenge-State in `state.dailyChallenges`. Coin-System in `state.coins`. Konfetti-Toast bei Abschluss.
- `getBZTrend(entries)` in `utils.js` berechnet Trendpfeil aus letzten 2 BZ-Werten (Schwelle: ±15 mg/dL).

### UX-Verbesserungen (UX-02, UX-04)
- **Dirty-State:** Medizinische Settings-Felder zeigen gelben Rahmen (`input-dirty`) bis Speichern-Klick, grünen Rahmen danach (`input-saved`).
- **Altersgruppen-Theme:** `data-age-group="kind_young"` auf `<body>` via `theme.js`. CSS-Overrides: Buttons min-height 56px, border-radius 20px, größere Inputs.

### State-Schema v12
```
state: {
  ...v11-Felder,
  auditLog:        [{ ts, event, details }],  // NEU
  dailyChallenges: { date, completed: [] },   // NEU
  coins:           0,                         // NEU
}
```

## Kernarchitektur
### Identität, Rollen und Zugriff
**Aktuell**
- Login erfolgt über JWT mit Access- und Refresh-Token.
- Neue Konten können zusätzlich über den Registrierungsflow angelegt werden.
- Rollen: `observer`, `caregiver`, `patient`, `admin`
- Familien-/Betreuerbeziehungen werden über `profile_links` modelliert.
- `profile_links` tragen seit Sprint 14 neben der technischen Rolle auch einen **Beziehungstyp** (`FAMILY`, `PROFESSIONAL`, `SCHOOL`, `LEARNING_GUEST`), einen **Zugriffsumfang** (`LIVE_MEDICAL`, `SUMMARY_ONLY`, `LEARNING_ONLY`) und einen gebundenen **purpose`.
- Observer-Zugriffe auf fremde Daten laufen lesend über `X-Viewing-Profile-Id`, aber nur dann, wenn der Link serverseitig wirklich `LIVE_MEDICAL` erlaubt.
- Öffentliche Freigaben laufen über zeitlich begrenzte Share-Links.
- Das Rollenmodell und die Skalierungsentscheidung sind in `docs/project/adr/ADR-001-rollen-rechtekonzept.md` dokumentiert.

**Zielbild ab Sprint 14+**
- getrennte Nutzergruppen für `Patient/Betroffener`, `Angehörige/Begleitungen`, `Professionelle`, `Bildungsnutzer`
- feinere Zielrollen wie `patient_primary`, `family_admin`, `family_caregiver`, `support_person`, `school_staff`, `diabetes_educator`, `clinician`, `clinic_admin`, `education_guest`
- Einwilligungen nicht nur als Invite, sondern als eigenständige Freigabeobjekte mit Zweck, Scope, Laufzeit und Widerruf
- professioneller Zugriff immer explizit freigegeben, zeitlich begrenzt und auditierbar

### Zukünftige Domänenmodelle (noch nicht vollständig implementiert)
Diese Modelle sind die konzeptionelle Leitplanke für Backlog und spätere Implementierung:
- `care_relationship` für Haushalt, Familie, Schule und Klinikbeziehungen
- `consent_grant` für Freigaben mit `subject`, `grantee`, `scope`, `purpose`, `expiresAt`, `revokedAt`
- `learning_track`, `learning_unit`, `completion`, `quiz_check` für die Lernakademie
- `visit_pack`, `school_pack`, `diagnosis_pack` für strukturierte Übergaben und Notfall-/Lernpakete

### Datenmodell
Zentrale Domänenobjekte:
- `Profile`
- `Settings`
- `Entry`
- `FoodItem`
- `ProfileLink`
- `ShareLink`
- `AuditLog`

`ProfileLink` ist aktuell das operative Übergangsmodell für Sprint 14:
- **technische Rolle**: `OBSERVER`, `CAREGIVER`, `ADMIN`
- **Beziehungstyp**: Familie, Fachperson, Schule/Alltag, Gast-Lernen
- **Access Scope**: Live-Medizin, Überblick, Lernen
- **ProfessionalRole**: `DOCTOR`, `DIABETES_COUNSELOR`, `NURSING`, `CLINIC_ADMIN` für Fachpersonen-Freigaben
- **purpose**: gebundener Freigabezweck für UI, Audit und spätere Einwilligungsdomäne
- **inviteExpiresAt**: Ablauf des Einladungscodes
- **expiresAt**: Ablauf eines akzeptierten Zugriffs

Wichtig für die aktuelle Safety-Logik:
- Nur `LIVE_MEDICAL` darf in den Observer-/Viewing-Flow.
- `SUMMARY_ONLY` leitet in den `/summary/[ownerId]`-Flow (aggregierte Wochendaten, keine Einzelmessungen).
- `LEARNING_ONLY` leitet in den `/learning/[ownerId]`-Flow (SOS-Hilfe, Notfallkontakte, keine Messwerte).
- Fachpersonen-Freigaben bleiben lesend, brauchen eine Fachrolle und sind zeitlich begrenzt.
- Abgelaufene akzeptierte Links und abgelaufene Einladungen werden aus Watching-/Consent-/Privacy-Listen herausgefiltert.
- Sprint 17 nutzt weiterhin diese bestehende Domäne: Schule/Trainer = `SCHOOL` + `LEARNING_ONLY`, Großeltern/Betreuung = `FAMILY` + `LEARNING_ONLY`, Partner/Geschwister = `FAMILY` + `SUMMARY_ONLY`.

#### Scope-Routing-Tabelle (Sprint 15)

| AccessScope | Frontend-Route | Sichtbare Daten |
|-------------|---------------|-----------------|
| `LIVE_MEDICAL` | `/observer` | Live-BZ, Einträge, voller Beobachtungs-Flow |
| `SUMMARY_ONLY` | `/summary/[ownerId]` | TIR%, Hypo/Hyper-Zähler, Ø-BZ — keine Einzelmessungen |
| `LEARNING_ONLY` | `/learning/[ownerId]` | SOS-Notruf, Notfallkontakte, Alltagspaket Sport/Schule, Hypo/Hyper/Ketone-Hints — keine Messwerte |

Das Routing wird im Login nach `accessScope` des gewählten ProfileLink entschieden. Die Route wird zentral über `frontend/src/lib/access-routing.ts` berechnet; der `all-watching`-Endpunkt gibt alle aktiven Scope-Typen zurück.

#### Alltagspfade und Kurzkommunikation (Sprint 17)

- Invite-Presets in Settings bilden Alltagspfade ohne neue DB-Migration ab.
- Login, Settings und Consent nutzen gemeinsame Frontend-Labels aus `frontend/src/lib/alltag-access.ts`, damit Zweck, Beziehung und Zugriffsumfang gleichlautend bleiben.
- `LearningAccessController` ergänzt den `LEARNING_ONLY`-Response um `relationshipKind`, `purpose` und `everydayPackage`.
- Das Alltagspaket `Sport/Schule` ist organisatorisch: Kontakte, Rolle, Eskalation, keine Eintragsliste und keine Dosierungsanweisungen.
- `GuardianPingRequest` akzeptiert optional `kind` mit `CHECK_IN`, `ALL_CLEAR`, `HELP_NEEDED`; `message` bleibt kompatibel.
- `GuardianPingResponse` liefert `messageKind` und `deliveredMessage` zusätzlich zu Empfängerzahl und Empfängernamen.
- Der Backend-Service blockiert offensichtliche Dosierungs-/Insulinanweisungen in Ping-Nachrichten.

#### Consent-Journal-Architektur (Sprint 15 — NET-06)

- `AuditLog`-Tabelle enthält alle Consent-relevanten Events: `INVITE_CREATED`, `INVITE_ACCEPTED`, `LINK_REVOKED`, `PRIVACY_EXPORT`, `PRIVACY_DELETE_REQUEST`, `PRIVACY_DELETE_REQUEST_REVOKE`, `CONSENT_HISTORY_VIEWED`
- `AuditLogService.getConsentHistory(profileId, pageable)` filtert via `AuditLogService.CONSENT_ACTIONS`
- Flyway V15-Migration legt Index `idx_audit_logs_consent` auf `(profile_id, action, created_at DESC)` und View `consent_journal_v` an
- Frontend: Settings-Seite zeigt chronologisches Consent-Journal mit Icons, Paginierung, Leer-Zustand
- Frontend: `/consent`-Seite (Einwilligungszentrale) zeigt alle aktiven Freigaben mit Scope-Badges und Widerruf-Button

#### AI-Mahlzeitenanalyse

- `POST /api/v1/ai/analyze-meal` liefert `rawJson`, `provider`, `available` und `errorMessage`.
- Fehlende Provider-Keys werden kontrolliert mit `available=false` beantwortet; das Frontend zeigt daraus einen verständlichen Fehler statt rohem JSON.
- Claude und OpenAI erhalten Text- und Bilddaten; Gemini erhält Foto-Eingaben als `inline_data`.

#### Klinische Ansicht — Design (Sprint 15 — CLN-02)

- `ShareLink` mit `mode = DOCTOR` berechtigt zum Abruf der klinischen Ansicht
- `ClinicalViewController` validiert Token in dieser Reihenfolge: existiert + nicht widerrufen → 404, abgelaufen → 410, falscher Modus → 403
- `ClinicalSettingsView` ist ein Allow-List-DTO: exakt `bzMin`, `bzMax`, `targetBz`, `insulinRatio`, `correctionFactor` — kein API-Key, keine UI-Prefs, kein Kontakt-JSON
- Token-Enumeration verhindert: falscher/widerrufener Token → 404 (nicht 403), abgelaufener Token → 410 GONE
- Frontend `/share/[token]/clinical`: kein Login-Prompt, kein Navigationsmenü, `print:hidden` für Print-Button, `window.print()` direkt

Einträge decken aktuell ab:
- BZ
- Insulin
- Mahlzeit
- Aktivität
- Ketone

### Food-Domain / KH-Rechner
- `food_items` enthält eingebaute und nutzereigene Lebensmittel.
- Eingebaute Lebensmittel werden nicht mehr nur über SQL-Seeds gepflegt, sondern aus `backend/src/main/resources/data/foods-catalog.json` gespiegelt.
- `FoodCatalogSynchronizer` synchronisiert den kuratierten DACH-Katalog beim Backend-Start idempotent in die Datenbank.
- `FoodSearchService` vereinheitlicht lokale Suche, Alias-/Synonym-Matching, Barcode-Lookup und Online-Fallback.
- `OpenFoodFactsProvider` ist in Sprint 11 die einzige aktive externe Quelle.
- Online-Treffer bleiben ephemer: sie werden angezeigt und an den Meal-Flow übergeben, aber in Sprint 11 nicht global gecacht.

### Signal- und Reminder-Flows
RabbitMQ-Exchange:
- `zh.alerts`

Aktuelle Queue-Typen:
- BZ-Alerts
- Ketone-Reminder
- Daily Summary
- Guardian Ping (`CHECK_IN`, `ALL_CLEAR`, `HELP_NEEDED`, keine Dosierungsanweisungen)
- Routine Reminder

Signalqualität baut auf denselben Entry- und Reminder-Grundlagen auf:
- Auswertung vorhandener Glukose-/CGM-Daten
- Erkennung von Messlücken
- Warnung bei veraltetem Signal
- keine Therapieautomatisierung

## Laufzeitfluss
### Login und App-Start
1. Frontend lädt Profile / Login-Optionen.
2. Login liefert JWT und Profilkontext.
3. Zustand wird im Auth-Store gehalten.
4. App-Routen laden Daten per Query aus dem Backend.

### Dokumentation von Einträgen
1. UI erfasst Werte über Formularseiten.
2. API speichert Einträge im Backend.
3. Dashboard, History und Insights lesen dieselben Daten wieder aus.
4. Benachrichtigungslogik reagiert auf kritische oder fehlende Daten.

### Lebensmittel-Suche und KH-Handoff
1. Die Seite `/calc` startet standardmäßig mit lokaler Suche im kuratierten DACH-Katalog.
2. Lokale Ergebnisse kommen aus `GET /api/v1/foods` und berücksichtigen Aliase, Kategorien und Portionspresets.
3. Online-Suche wird bewusst nur explizit über `GET /api/v1/foods/search-online?q=` ausgelöst.
4. Barcode-Lookups laufen über `GET /api/v1/foods/barcode/{code}` mit Reihenfolge `lokal -> Open Food Facts`.
5. Die ausgewählten Portionen werden im Frontend zu einer KH-Summe aggregiert und als Prefill in den Mahlzeiten-Flow übergeben.

### Beobachter- und Share-Modus
1. Familien- oder Betreuerbeziehungen werden per Invite-Code erstellt.
2. Invite-Codes tragen neben der Rolle auch Beziehungstyp, Access Scope und Zweckbindung.
3. Observer liest Daten eines anderen Profils ohne Token-Weitergabe, aber nur für Links mit `LIVE_MEDICAL`.
4. Schule/Alltag und Gast-Lernen bleiben bewusst außerhalb des Observer-Flows.
5. Share-Links veröffentlichen gezielte lesende Ansichten ohne Login.

## Betriebsrelevante Konfiguration
### Backend
- `application.yml` konfiguriert PostgreSQL, RabbitMQ, JWT, CORS und Swagger
- Standard-Ports:
  - Backend `8080`
  - PostgreSQL `5432`
  - RabbitMQ `5672`
  - Keycloak `8180` (optional für Sprint 13)

### Frontend
- `NEXT_PUBLIC_API_URL` steuert das Ziel-Backend
- `next.config.ts` enthält Rewrites für `/api/*` und `/fhir/*`
- Turbopack-Root ist explizit auf das Frontend-Verzeichnis gesetzt
- Fonts sind Buildzeit-netzwerkfrei über CSS-Fallback-Variablen definiert.
- Browser greifen auch für Food-Suche und Barcode nur same-origin auf `/api/*` zu; keine direkte Fremd-API im Frontend

## Tests und Qualität
- Backend: JUnit / Mockito-Service-Tests
- Root: Vitest für ausgewählte produktkritische Logik
- Frontend: TypeScript- und Production-Build als Integritätscheck

Aktuell gut abgedeckt:
- Insights
- Auth-Rate-Limit
- Guardian Ping
- Daily Summary
- Gamification-Helferlogik

Weniger tief abgedeckt:
- größere UI-Flows
- Share-UI-End-to-End
- Settings-/Observer-/Dashboard-Integrationen
- vollständige Kamera-Barcode-Flows in realen Browser-Matrizen

## Sprint-10-Architektur-Delta (PWA-Layer, 2026-04-14)

### Observer- und Betreuer-Schutz (BR-04 / ARC-01)

**Problem:** Observer/Caregiver-Profile konnten über Quick-Action-Buttons Einträge erstellen, die ins eigene Profil statt ins beobachtete Profil schrieben.

**Lösung Sprint 10 (interim — bis vollständiges Profil-Routing):**
- `widget-registry.js`: `quick-actions`-Widget von `minRole: 'caregiver'` auf `minRole: 'patient'` erhöht
- `app.js` `applyRoleRestrictions()`: `.action-btn` jetzt auch für `caregiver` deaktiviert (vorher nur `observer`)
- `dashboard.js`: `_buildRoleBanner()` — erklärender Banner für Observer/Caregiver-Rollen
- `bz.js`, `insulin.js`, `meal.js`, `activity.js`: `canWrite`-Guard via `getActiveUser().role === 'observer'` am Anfang jeder Save-Funktion

**Offenes Follow-up:** Vollständiges Schreiben-im-Namen-von-Profil (observer→patient-Routing) bleibt für spätere Sprint-Arbeit offen. Das Datenmodell braucht dann einen zweiten `targetProfileId`-Kontext.

### Settings-Save-Modell (UX-02)

Alle Settings-Sektionen hatten bereits explizite "Speichern"-Buttons. Sprint 10 fügte **Post-Save Field-Refresh** hinzu:
- `_saveRange()` und `_saveInsulinSettings()` schreiben nach `save()` die tatsächlich gespeicherten Werte zurück in die Input-Felder
- Verhindert visuelle Divergenz wenn `parseInt()` / Normalisierung den eingetippten Wert verändert

### Rollen-Hierarchie (Referenz)

```
observer (0) < caregiver (1) < patient (2) < admin (3)
```

Implementiert an zwei Stellen:
- `src/auth/local-provider.js`: `ROLE_LEVEL`-Objekt + `hasMinRole()`
- `src/ui/dashboard.js`: lokale Kopie mit `ROLE_ORDER`-Array (identische Logik, Duplikat-Risiko bei Änderungen)

### Design-Token-Hinweis

`styles.css` enthält in Nicht-Print-Sektionen ~24 hardcodierte Hex-Werte (vor allem in Action-Button-Gradienten und `info-banner-blue`). Die in Sprint 10 neu hinzugefügten `.role-banner`-Styles verwenden vollständig CSS-Variablen. Restliche Hex-Werte sind technische Schulden für einen späteren CSS-Cleanup-Sprint.

## Doku-Orientierung
- `README.md` beschreibt Produkt, Start und zentrale Nutzung
- `docs/project/COOKBOOK.md` beschreibt Betrieb, Fehlerbehebung und tägliche Abläufe
- `docs/project/REVIEW.md` beschreibt den aktuellen Audit-Stand und Risiken
- `docs/project/PRODUCT_STRATEGY.md` beschreibt Zielgruppen, Marktbild und die Roadmap zur Klinik-Empfehlung
- `docs/reviews/SPRINT_REVIEW_SPRINT_13.md` beschreibt Scope und Abnahme des Sprints
- `docs/project/adr/ADR-001-rollen-rechtekonzept.md` dokumentiert die Rollen- und Rechteentscheidung
