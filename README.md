# Zucker-Held

Zucker-Held ist eine Full-Stack-Anwendung für Diabetes-Management mit Fokus auf Familien, Kinder, Jugendliche, Erwachsene und betreuende Personen.  
Der aktuelle Stand kombiniert medizinische Dokumentation, familienorientierte Rollenmodelle, Beobachter-/Share-Flows, Verlauf, Insights, alltagstaugliche Sicherheitsmechaniken und einen KH-first Lebensmittel-Flow für den deutschsprachigen Alltag.

## Produktüberblick
- Rollenbasiertes Arbeiten mit Profilen, PIN/Elevation und Observer-Modus
- BZ-, Insulin-, Mahlzeit-, Aktivitäts- und Ketoneinträge
- KH-Rechner mit lokalem DACH-Katalog, Barcode-Einstieg und expliziter Open-Food-Facts-Suche
- familienfreundliche Login- und Beobachtungsflüsse
- Insights mit Kennzahlen, Mustererkennung und Signalqualitäts-Hinweisen
- Share-Links für Arzt- und Mini-Ansichten
- Benachrichtigungs- und Queue-basierte Reminder/Alerts
- adaptive UI nach Altersgruppe (kind_young, kind_teen, adult)
- BZ-Hero-Widget mit Trendpfeil auf dem Dashboard
- Tägliche Challenges (Messen, Mahlzeit, Aktivität) + Coin-System
- Registrierungsflow mit lokaler Profilerstellung und optionalem Keycloak-Konto
- Tageszeitabhängige Insulinfaktoren für den Therapieplan

## Sprint 12 — Sicherheit & Alltags-UX (2026-04-15)
- **SEC-01** PIN-Hashing: SHA-256 via Web Crypto API — keine Klartextpasswörter mehr
- **SEC-02** Observer-Write-Guard: Beobachter-Rolle kann nicht mehr fälschlicherweise Einträge speichern
- **SEC-03** Audit-Log: 5 kritische Admin-Aktionen werden protokolliert und in Settings angezeigt
- **SEC-04** Service Worker v12: foods.js Network-First, neue Widget-Dateien gecacht
- **UX-02** Settings: Dirty-State-Indikator (gelber Rahmen) für medizinische Felder
- **UX-04** Altersgruppen-Theme `kind_young`: größere Buttons (min-height 56px), runde Ecken
- **DASH-01** BZ-Hero-Widget: BZ als 72px-Zahl + Trendpfeil (↗ ↘ →) auf Dashboard
- **DASH-02** Tägliche Challenges + Coin-System für Malte
- **TECH-01** Barcode-Scanner: manueller EAN-Fallback für Browser ohne BarcodeDetector

## Sprint 13 — Registrierung & Therapieplan (2026-04-15)
- **AUD-01** `pin_changed` wird im Audit-Log protokolliert
- **BL-S05** Warnbanner + CSV-Download wenn alte CGM-Daten automatisch archiviert werden
- **REG-01** neues Registrierungsformular auf der Login-Seite
- **KC-01** Keycloak-Basis in Docker Compose inklusive Realm-Import
- **RR-01** Rollen- und Rechtekonzept als ADR dokumentiert
- **INS-01** Tageszeitabhängige KI-/KF-Zeitblöcke für den Insulin-Rechner

## Tech-Stack
- Frontend: Next.js App Router, React 19, TypeScript, Zustand, TanStack Query, Tailwind 4
- Backend: Spring Boot 3.2, Java 21, Spring Security, JWT, JPA/Hibernate, Flyway
- Infrastruktur: PostgreSQL, RabbitMQ, Docker Compose
- Standards/Integrationen: Swagger/OpenAPI, FHIR R4, Share-Links, Queue-Publishing
- externe Food-Quelle in Sprint 11: Open Food Facts (read-only, nur über das Backend)

## Rollenmodell
- `observer`: lesender Zugriff
- `caregiver`: dokumentieren + lesen
- `patient`: regulärer Vollzugriff auf das eigene Profil
- `admin`: erweiterte Rechte, Settings und Freigaben

Ergänzend gibt es:
- `profile_links` für Familien-/Betreuerbeziehungen
- `X-Viewing-Profile-Id` für Observer-Reads
- zeitlich begrenzte Share-Links für `DOCTOR` und `MINI`

## Lokal starten
### Voraussetzungen
- Docker / Docker Compose
- Java 21
- Node.js / npm

### Infrastruktur
```bash
docker compose up -d postgres rabbitmq
```

Optional für Sprint-13-Registrierung / Keycloak-Basis:
```bash
docker compose up -d postgres rabbitmq keycloak
```

### Backend
```bash
cd backend
mvn spring-boot:run
```

Backend läuft standardmäßig auf `http://localhost:8080`.

### Frontend
```bash
cd frontend
npm run dev
```

Frontend läuft standardmäßig auf `http://localhost:3000`.

## Lebensmittel- und KH-Flow
- Der lokale KH-Rechner liegt unter `/calc`.
- Lokale Lebensmittel kommen aus einem kuratierten DACH-Katalog plus eigenen Lebensmitteln.
- Online-Suche und Barcode-Fallback laufen explizit über das Backend gegen Open Food Facts.
- Die Online-Suche wird bewusst nicht bei jedem Tastendruck ausgelöst.
- Ergebnisse aus dem KH-Rechner werden als vorbereitete Mahlzeit an `/meal` übergeben; gespeichert wird weiter im Mahlzeiten-Flow.

## Tests und Build
### Backend
```bash
cd backend
mvn test
```

### Root-Tests
```bash
npm test
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

## Sprint-13-Abnahme
- `SPRINT_REVIEW_SPRINT_13.md` dokumentiert den gelieferten Scope
- `ADR-001-rollen-rechtekonzept.md` hält die Architekturentscheidung zum Rollenmodell fest

## Wichtige Doku-Dateien
- `ARCHITECTURE.md` — System- und Laufzeitarchitektur
- `COOKBOOK.md` — Betriebsanleitung / Runbook
- `REVIEW.md` — aktuelles Systemreview
- `BACKLOG.md` — Produkt- und Sprint-Backlog
- `BRANCHING.md` — verbindliche Branch-Regeln für Codex und Claude

## Bekannte Grenzen
- Es gibt aktuell noch keinen separaten Nutzerleitfaden; das ist als eigenes Doku-Thema im Backlog vorgesehen.
- RabbitMQ-Publishing ist in mehreren Flows bereits vorhanden, die vollständige Endzustellung ist aber nicht für alle Reminder-Ketten ausgebaut.
- Die App ist funktional weiter als einzelne historische Dokumente; deshalb gilt im Zweifel die aktuelle Doku dieses Sprints.
- Sprint 11 nutzt bewusst nur Open Food Facts als aktive externe Food-Quelle; Food Repo, USDA, FatSecret und Edamam bleiben spätere Erweiterungsoptionen.
