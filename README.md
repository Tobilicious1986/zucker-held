# Zucker-Held

Zucker-Held ist eine Full-Stack-Anwendung für Diabetes-Management mit Fokus auf Familien, Kinder, Jugendliche, Erwachsene und betreuende Personen.  
Der aktuelle Stand kombiniert medizinische Dokumentation, familienorientierte Rollenmodelle, Beobachter-/Share-Flows, Verlauf, Insights und alltagstaugliche Sicherheitsmechaniken.

## Produktüberblick
- Rollenbasiertes Arbeiten mit Profilen, PIN/Elevation und Observer-Modus
- BZ-, Insulin-, Mahlzeit-, Aktivitäts- und Ketoneinträge
- familienfreundliche Login- und Beobachtungsflüsse
- Insights mit Kennzahlen, Mustererkennung und Signalqualitäts-Hinweisen
- Share-Links für Arzt- und Mini-Ansichten
- Benachrichtigungs- und Queue-basierte Reminder/Alerts
- adaptive UI nach Altersgruppe

## Tech-Stack
- Frontend: Next.js App Router, React 19, TypeScript, Zustand, TanStack Query, Tailwind 4
- Backend: Spring Boot 3.2, Java 21, Spring Security, JWT, JPA/Hibernate, Flyway
- Infrastruktur: PostgreSQL, RabbitMQ, Docker Compose
- Standards/Integrationen: Swagger/OpenAPI, FHIR R4, Share-Links, Queue-Publishing

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
