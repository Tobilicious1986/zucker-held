# Zucker-Held Cookbook

## Zweck
Dieses Cookbook ist die Betriebsanleitung für Entwicklung, Start, Tests, Fehlerbehebung und Release-Arbeit.

## Täglicher Start
### Infrastruktur starten
```bash
docker compose up -d postgres rabbitmq
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

## Git- und Branch-Ablauf
Es gelten verbindlich die Regeln aus `BRANCHING.md`.

Kurzfassung:
- nie direkt auf `main` arbeiten
- nie direkt nach `main` pushen
- immer auf `codex/<zweck>` oder `claude/<zweck>`
- Merge nach `main` nur per PR
- vor Push prüfen: keine Build-Artefakte, keine Dubletten, keine lokalen Tooling-Dateien

## Typische Fehlerbilder
### Backend startet nicht
Prüfen:
- läuft PostgreSQL auf `localhost:5432`
- läuft RabbitMQ auf `localhost:5672`
- sind Docker-Container aktiv
- ist die `mainClass` im Maven-Plugin korrekt

### Frontend-Build schlägt fehl
Prüfen:
- Dubletten mit Namen wie `* 2.*`, `* 3.*`, `* 4.*`
- Lockfile-/Workspace-Root-Konflikte
- TypeScript-Fehler in generierten oder versehentlichen Artefakten
- ob `next.config.ts` den Turbopack-Root korrekt setzt

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
- Branch entspricht `BRANCHING.md`
- PR-Beschreibung benennt Produkt-, Betriebs- und Teständerungen klar

## Medizinisch sensible Bereiche
Mit besonderer Vorsicht behandeln:
- Notfall-Flow
- Hypo-/Hyper-Hinweise
- Settings für Zielbereiche und Insulinparameter
- Rollen- und Freigabelogik
- alle Formulierungen, die wie Therapieanweisungen wirken könnten
