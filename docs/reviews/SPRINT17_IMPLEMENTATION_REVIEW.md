# Sprint 17 Implementation Review — Alltag im Umfeld

> Stand: 2026-04-28
> Status: Code-Review abgeschlossen, Runtime-UAT blockiert

## Ergebnis

Sprint 17 wurde als MVP für Alltagspfade umgesetzt:
- Schule/Trainer, Großeltern/Betreuung und Partner/Geschwister nutzen bestehende `ProfileLink`-Scopes.
- `LEARNING_ONLY` zeigt ein organisatorisches Alltagspaket Sport/Schule ohne Messwerte.
- Guardian-Ping unterstützt `CHECK_IN`, `ALL_CLEAR`, `HELP_NEEDED` und blockiert offensichtliche Dosierungsanweisungen.
- Login, Settings und Consent zeigen Zweck, Beziehung und Zugriffsumfang konsistenter.

## Review-Perspektiven

| Perspektive | Ergebnis |
|-------------|----------|
| Architektur | Kein neues Rechte-/DB-Modell; bestehende Scope-Architektur bleibt stabil |
| UI/UX | Alltagspfade sind als konkrete Presets und Labels sichtbar |
| Safety | Keine medizinischen Schwellen geändert; Pings bleiben Kurzkommunikation |
| Test/QA | Backend, Root-Vitest und Frontend-Build erfolgreich |
| Runtime/DevOps | UAT blockiert durch fehlendes `docker` Binary |

## Ausgeführte Checks

- `cd backend && mvn test` — 58 Tests grün
- `npm test` — 64 Tests grün
- `cd frontend && npm run build` — erfolgreich
- `./scripts/start-local-stack.sh` — fehlgeschlagen: `docker: command not found`

## Offene Abnahme

Alle UAT-Szenarien bleiben unbestanden, bis Docker/Runtime verfügbar ist und die Szenarien wirklich durchgespielt wurden.
