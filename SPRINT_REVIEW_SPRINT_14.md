# Sprint Review — Sprint 14

> Stand: 2026-04-15  
> Branch: `codex/sprint-14-einladung-dsgvo-safety`

## Sprintziel
Sprint 14 sollte das Fundament für Einladung, Einwilligung, DSGVO und Safety legen, damit Zucker-Held klarer zwischen Familie, Fachpersonen, Schule/Alltag und Lern-/Gastrollen trennt und gleichzeitig datenschutz- und reviewfähig wird.

## Gelieferter Umfang
- Privacy-Hub mit Überblick, Datenschutz-Export und Lösch-/Widerrufslogik
- Zweckgebundene Invite-Presets für:
  - Familie
  - Fachperson
  - Schule / Alltag
  - Gast-Lernen
- Erweiterung von `ProfileLink` um:
  - `relationshipKind`
  - `accessScope`
  - `purpose`
- Scope-basierter Schutz:
  - nur `LIVE_MEDICAL` gelangt in Watching / Observer
  - `SUMMARY_ONLY` und `LEARNING_ONLY` bleiben aus dem Live-Observer-Flow heraus
- Pending-Invites in Settings sichtbar
- zusätzliche Safety-/DSGVO-Hinweise in:
  - Settings
  - Login
  - Observer
  - Share
  - Assistant
  - Notfall-Karte
- Start-/Stop-Skripte weiter betriebsnah verifiziert

## Technischer Prüfstand
- `cd backend && mvn test` grün
- `cd frontend && npm run build` grün
- `npm test` grün
- `./scripts/start-local-stack.sh` grün
- Abschlusslauf bewusst in Produktionsreihenfolge geprüft:
  - `./scripts/stop-local-stack.sh`
  - `cd frontend && npm run build`
  - `./scripts/start-local-stack.sh`
- Laufzeit erfolgreich geprüft:
  - Docker läuft
  - Backend `UP`
  - Frontend `/login` erreichbar
  - API-Bridge `/api/v1/profiles` erreichbar
  - Login-Smoke-Test erfolgreich

## Key-User- und Stakeholder-Sicht
### Sarah (Elternteil)
- positiv:
  - Datenschutz und Freigaben sind deutlich transparenter
  - Pending-Invites und Presets sind verständlicher als reine Rollenbuttons
- Anmerkung:
  - Familienrollen müssen weiter sehr klar erklären, welche Handlungsmöglichkeiten wirklich bestehen

### Jonas (16)
- positiv:
  - Rollen- und Freigabelogik wirkt weniger chaotisch
  - Assistent kommuniziert Grenzen ehrlicher
- Anmerkung:
  - Für spätere Sprints wären ein noch ruhigerer Fachpersonen-Flow und mehr Autonomie im Umgang mit Freigaben sinnvoll

### Anna (Erwachsene)
- positiv:
  - Privacy-Hub und Share-Hinweise wirken erwachsener und vertrauenswürdiger
  - Export/Widerruf sind sichtbar statt versteckt
- Anmerkung:
  - Eine richtige Einwilligungszentrale mit Historie wäre der nächste logische Schritt

### Dr. Krause / Diabetologe
- positiv:
  - Fachpersonen-Freigabe ist jetzt klarer vom Familienzugriff getrennt
  - Arzt-Share bleibt lesend und zweckgebunden
- Anmerkung:
  - Für eine klinische Nutzung wäre mittelfristig ein strukturierterer Fachpersonen-View wichtig

### Schule / Alltag / Betreuung
- positiv:
  - Kein versehentlicher Voll- oder Live-Zugriff mehr über generische Observer-Flows
- Anmerkung:
  - Ein eigener Schule-/Alltagsmodus fehlt noch als finaler Ziel-Flow

## UI/UX-Review
- Invite-Presets sind jetzt deutlich verständlicher.
- Beobachtung, Share und Invite sind semantisch besser getrennt.
- Assistant und Notfallkarte kommunizieren Grenzen und Eskalation klarer.
- Restoffen:
  - Ein eigener finaler Flow für `SUMMARY_ONLY` und `LEARNING_ONLY`
  - eine noch stärkere visuelle Differenzierung zwischen Fachpersonen- und Familienzugriff

## QA- und Safety-Review
- Scope-Grenzen sind jetzt technisch sauberer und sichtbarer kommuniziert.
- Observer bleibt bewusst lesend.
- Schule/Gast-Lernen werden aktuell sicher aus Live-Medizin herausgehalten.
- Datenschutz-Export ist vorhanden und mit Warnhinweis versehen.
- Notfallkarte eskaliert jetzt klarer auf `112`.
- Assistant, Share und Invite-Kommunikation machen Zweckbindung und Grenzen jetzt sichtbar, statt implizit mehr Handlungsmacht zu versprechen.

## Offene Restpunkte nach Sprint 14
- vollständige Einwilligungszentrale mit Historie / Journal
- eigener Ziel-Flow für `SUMMARY_ONLY` / `LEARNING_ONLY`
- weiterer Safety-Layer für spätere Nachrichten-/Empfehlungsfunktionen
- strukturierter Fachpersonen-View

## Review-Fazit
Sprint 14 ist auf diesem Stand **reviewfähig und technisch abnahmefähig**.

Wichtig dabei:
- Der operative Consent-/Invite-Slice ist geliefert.
- DSGVO-Basis und Safety-Kommunikation sind sichtbar.
- Die Scope-Grenzen halten technisch und kommunikativ.

Nicht vollständig abgeschlossen ist die langfristige Zielarchitektur rund um vollständige Einwilligungsverwaltung, Fachpersonen-Flow und Schule-/Gast-Lernen-Zielansichten. Das sind aber **Folgesprints**, keine Blocker für den aktuellen Sprint-14-Abschluss.
