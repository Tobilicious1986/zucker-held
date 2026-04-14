# Zucker-Held — Architektur

> Letzte Aktualisierung: 2026-04-14

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
- `calc` als KH-Rechner mit lokaler Suche, Barcode und Online-Suche
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
- `FoodController`
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
- `FoodItem`
- `ProfileLink`
- `ShareLink`
- `AuditLog`

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

### Lebensmittel-Suche und KH-Handoff
1. Die Seite `/calc` startet standardmäßig mit lokaler Suche im kuratierten DACH-Katalog.
2. Lokale Ergebnisse kommen aus `GET /api/v1/foods` und berücksichtigen Aliase, Kategorien und Portionspresets.
3. Online-Suche wird bewusst nur explizit über `GET /api/v1/foods/search-online?q=` ausgelöst.
4. Barcode-Lookups laufen über `GET /api/v1/foods/barcode/{code}` mit Reihenfolge `lokal -> Open Food Facts`.
5. Die ausgewählten Portionen werden im Frontend zu einer KH-Summe aggregiert und als Prefill in den Mahlzeiten-Flow übergeben.

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

## Doku-Orientierung
- `README.md` beschreibt Produkt, Start und zentrale Nutzung
- `COOKBOOK.md` beschreibt Betrieb, Fehlerbehebung und tägliche Abläufe
- `REVIEW.md` beschreibt den aktuellen Audit-Stand und Risiken
