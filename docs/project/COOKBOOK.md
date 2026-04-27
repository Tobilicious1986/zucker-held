# Zucker-Held Cookbook

## Zweck
Dieses Cookbook ist die Betriebsanleitung für Entwicklung, Start, Tests, Fehlerbehebung und Release-Arbeit.

## Täglicher Start
### Start-Skript
```bash
./scripts/start-local-stack.sh
```

Das Skript startet Docker, Backend und Frontend und wartet, bis Login und Healthcheck erreichbar sind.
Zusätzlich prüft es einen lokalen Login-Smoke-Test und räumt bei Startfehlern halbe Stacks automatisch wieder auf.

### Testdaten und Smoke-Profil
- Das Start-Skript nutzt ein lokales Smoke-Profil `Stack Smoke`, um Login und Basisfluss reproduzierbar zu prüfen.
- Für Sprint-Reviews und UATs sollen belastbare Testdaten vorhanden sein:
  - mindestens ein Patientenprofil
  - mindestens ein Familien-/Begleitprofil
  - mindestens eine Fachpersonen-Freigabe
  - mindestens ein bewusst eingeschränkter Schule-/Gast-Lernen-Fall
- Testdaten gehören in Test- und Review-Umgebungen zur Pflicht, damit Rollen- und Safety-Logik nicht nur theoretisch demonstriert wird.

### Infrastruktur starten
```bash
docker compose up -d postgres rabbitmq
```

Für Sprint-13-Registrierung und Keycloak-Basis:
```bash
docker compose up -d postgres rabbitmq keycloak
```

### Backend starten
```bash
cd backend
mvn spring-boot:run
```

### Frontend starten
```bash
cd frontend
npm run dev
```

### Alles sauber herunterfahren
```bash
./scripts/stop-local-stack.sh
```

### Lebensmittel-Katalog beachten
- Beim Backend-Start wird der kuratierte Katalog aus `backend/src/main/resources/data/foods-catalog.json` idempotent in `food_items` gespiegelt.
- Änderungen an Built-ins gehören deshalb zuerst in den JSON-Katalog, nicht nur in SQL.

## Standard-Checks
### Backend-Tests
```bash
cd backend
mvn test
```

### Root-Tests
```bash
npm test
```

### Frontend-Build
```bash
cd frontend
npm run build
```

Wichtig:
- Einen Produktionsbuild nicht parallel zu einem laufenden lokalen Frontend-Prozess auf derselben `.next`-Struktur ziehen.
- Der Frontend-Build darf ohne Google-Font-Netzwerkzugriff funktionieren; Font-Variablen kommen aus lokalen CSS-Fallbacks.
- Empfohlene Reihenfolge für Sprintabschluss oder Release-Prüfung:
  1. `./scripts/stop-local-stack.sh`
  2. `cd frontend && npm run build`
  3. `./scripts/start-local-stack.sh`

## Git- und Branch-Ablauf
Es gelten verbindlich die Regeln aus `docs/agents/BRANCHING.md`.

Kurzfassung:
- nie direkt auf `main` arbeiten
- nie direkt nach `main` pushen
- immer auf `codex/<zweck>` oder `claude/<zweck>`
- Merge nach `main` nur per PR
- vor Push prüfen: keine Build-Artefakte, keine Dubletten, keine lokalen Tooling-Dateien
- Root-`node_modules/` ist nicht versioniert; falls es versehentlich auftaucht, nach `_deleted/` verschieben und aus dem Git-Index entfernen

## Typische Fehlerbilder
### Backend startet nicht
Prüfen:
- läuft PostgreSQL auf `localhost:5432`
- läuft RabbitMQ auf `localhost:5672`
- läuft Keycloak auf `localhost:8180`, wenn Registrierung mit Keycloak geprüft werden soll
- sind Docker-Container aktiv
- ist die `mainClass` im Maven-Plugin korrekt

### Frontend-Build schlägt fehl
Prüfen:
- Dubletten mit Namen wie `* 2.*`, `* 3.*`, `* 4.*`
- Lockfile-/Workspace-Root-Konflikte
- TypeScript-Fehler in generierten oder versehentlichen Artefakten
- ob `next.config.ts` den Turbopack-Root korrekt setzt
- ob ein laufender Frontend-Prozess gerade dieselbe `.next`-Struktur verwendet

Wenn der Fehler `ENOTEMPTY ... .next/server` auftaucht:
1. `./scripts/stop-local-stack.sh`
2. `cd frontend && npm run build`
3. danach den Stack mit `./scripts/start-local-stack.sh` wieder hochfahren

### Lebensmittel-Suche liefert nichts
Prüfen:
- läuft das Backend und ist `GET /api/v1/foods` erreichbar
- wurde der Food-Katalog beim Start in `food_items` gespiegelt
- wurde bei Online-Suche wirklich explizit gesucht und nicht nur lokal gefiltert
- bei Barcode: zuerst manuelle EAN prüfen, dann optional Kamera-Scan testen

### Open Food Facts ist langsam oder leer
Prüfen:
- die lokale Suche funktioniert unabhängig davon weiter
- externe Food-Suche läuft nur explizit über `GET /api/v1/foods/search-online`
- Barcode-Fallback darf bei OFF-Problemen nicht zu `500` führen
- Open Food Facts braucht einen sauberen `User-Agent`; die Implementierung dafür liegt im Backend-Provider

### Unerwartete Dubletten im Repo
Regel:
- nichts löschen
- nach `_deleted/` verschieben
- nie solche Artefakte mit in einen PR nehmen

### `_deleted/` wächst an
Das ist erwartbar, wenn Dubletten oder Fehlstände bereinigt wurden.  
Der Ordner ist ein Sicherheitsnetz und wird nicht automatisch geleert.

## Umgang mit versehentlichen Artefakten
Vor jedem Commit und Push prüfen:
- `node_modules` nicht versehentlich in PRs ziehen
- keine `* 2.*`, `* 3.*`, `* 4.*`
- keine lokalen `.claude`-Nebenartefakte
- keine versehentlichen Lockfiles aus übergeordneten Verzeichnissen

## Release-/PR-Checkliste
- `mvn test` grün
- `npm test` grün
- `frontend npm run build` grün
- Diff enthält nur fachlich gewollte Änderungen
- keine Build-Artefakte im Commit
- Branch entspricht `docs/agents/BRANCHING.md`
- PR-Beschreibung benennt Produkt-, Betriebs- und Teständerungen klar
- bei Food-Sprints zusätzlich: Katalog-JSON, Backend-Suche und Meal-Handoff gemeinsam prüfen
- bei Sprint-Review-Releases zusätzlich: Key-User-, UI/UX- und Test-/QA-Rückmeldung dokumentieren

## Sprint 13 — zusätzliche Prüfpunkte
- Registrierung über `POST /api/v1/auth/register` funktioniert
- Keycloak darf bei Ausfall die lokale Registrierung nicht blockieren
- Insulin-Rechner zeigt den aktiven Zeitblock an
- `docs/reviews/SPRINT_REVIEW_SPRINT_13.md` und `docs/project/adr/ADR-001-rollen-rechtekonzept.md` sind aktuell

## Medizinisch sensible Bereiche
Mit besonderer Vorsicht behandeln:
- Notfall-Flow
- Hypo-/Hyper-Hinweise
- Settings für Zielbereiche und Insulinparameter
- Rollen- und Freigabelogik
- alle Formulierungen, die wie Therapieanweisungen wirken könnten
