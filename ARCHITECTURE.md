# Zucker-Held — Architektur

> Letzte Aktualisierung: 2026-04-14 (Sprint 10 — Rollen-Integrität, Settings-Save, Design-Polish)

## Überblick
Zucker-Held ist eine Full-Stack-Anwendung für diabetesbezogene Alltagsdokumentation, Beobachtung und Auswertung.  
Die Plattform besteht aus einem Next.js-Frontend und einem Spring-Boot-Backend mit PostgreSQL und RabbitMQ.

## Hauptbausteine
### Frontend
- Next.js App Router unter `frontend/src/app`
- Zustand für Auth/UI-State
- TanStack Query für Server-Daten
- zentrale API-Kommunikation über `frontend/src/lib/api-client.ts`
- adaptive UI über Altersgruppen-Hooks und rollenabhängige Views

Wichtige Seiten:
- `login`
- `dashboard`
- `bz`, `insulin`, `meal`, `activity`, `ketone`, `history`
- `observer`
- `assistant`
- `settings`
- `share/[token]`
- `emergency-card`

### Backend
- REST-API unter `backend/src/main/java/de/zuckerheld/api/controller`
- Domain-Modelle und Fachlogik in `domain/model` und `domain/service`
- Persistenz über Spring Data JPA in `infrastructure/repository`
- Security über JWT-Filter und Spring Security
- Messaging über RabbitMQ
- Schema-Management über Flyway-Migrationen

Wichtige Controller:
- `AuthController`
- `ProfileController`
- `EntryController`
- `SettingsController`
- `ProfileLinkController`
- `InsightsController`
- `ShareController`
- `AuditLogController`
- `AiProxyController`
- `FhirController`

## Kernarchitektur
### Identität, Rollen und Zugriff
- Login erfolgt über JWT mit Access- und Refresh-Token.
- Rollen: `observer`, `caregiver`, `patient`, `admin`
- Familien-/Betreuerbeziehungen werden über `profile_links` modelliert.
- Observer-Zugriffe auf fremde Daten laufen lesend über `X-Viewing-Profile-Id`.
- Öffentliche Freigaben laufen über zeitlich begrenzte Share-Links.

### Datenmodell
Zentrale Domänenobjekte:
- `Profile`
- `Settings`
- `Entry`
- `ProfileLink`
- `ShareLink`
- `AuditLog`

Einträge decken aktuell ab:
- BZ
- Insulin
- Mahlzeit
- Aktivität
- Ketone

### Signal- und Reminder-Flows
RabbitMQ-Exchange:
- `zh.alerts`

Aktuelle Queue-Typen:
- BZ-Alerts
- Ketone-Reminder
- Daily Summary
- Guardian Ping
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

### Beobachter- und Share-Modus
1. Familien- oder Betreuerbeziehungen werden per Invite-Code erstellt.
2. Observer liest Daten eines anderen Profils ohne Token-Weitergabe.
3. Share-Links veröffentlichen gezielte lesende Ansichten ohne Login.

## Betriebsrelevante Konfiguration
### Backend
- `application.yml` konfiguriert PostgreSQL, RabbitMQ, JWT, CORS und Swagger
- Standard-Ports:
  - Backend `8080`
  - PostgreSQL `5432`
  - RabbitMQ `5672`

### Frontend
- `NEXT_PUBLIC_API_URL` steuert das Ziel-Backend
- `next.config.ts` enthält Rewrites für `/api/*` und `/fhir/*`
- Turbopack-Root ist explizit auf das Frontend-Verzeichnis gesetzt

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
- `COOKBOOK.md` beschreibt Betrieb, Fehlerbehebung und tägliche Abläufe
- `REVIEW.md` beschreibt den aktuellen Audit-Stand und Risiken
