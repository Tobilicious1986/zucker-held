# UAT — Supersprint S14-S16 Cleanup

> Stand: 2026-04-27
> Status: ❌ nicht ausgeführt — lokale Runtime blockiert

## Testintegrität

Alle Szenarien bleiben `⏳`, bis sie auf einer laufenden Instanz wirklich ausgeführt wurden. Kein Szenario darf vorab als ✅ markiert werden.

## Blocker

`./scripts/start-local-stack.sh` benötigt Docker Compose für Postgres, RabbitMQ und Keycloak. Auf dieser Maschine ist `docker` aktuell nicht installiert, daher wurde keine laufende Instanz gestartet und kein UAT-Szenario als bestanden markiert.

## Szenarien

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| UAT-01 | Settings öffnen | Button `Meine Freigaben` führt nach `/consent` | ⏳ |
| UAT-02 | Fachpersonen-Invite erstellen | Fachrolle und Zugriffsdauer sind auswählbar; Code wird erstellt | ⏳ |
| UAT-03 | Fachpersonen-Invite annehmen | Link wird aktiv; Zugriff hat `expiresAt` ab Annahme | ⏳ |
| UAT-04 | Abgelaufener akzeptierter Link | Link erscheint nicht mehr in Login-/Watching-/Consent-Listen | ⏳ |
| UAT-05 | Abgelaufener Pending-Code | Pending Invite erscheint nicht mehr in offenen Einladungen | ⏳ |
| UAT-06 | SUMMARY_ONLY-Login | Routing nach `/summary/[ownerId]`, echter Owner-Name sichtbar, keine Einzelmessungen | ⏳ |
| UAT-07 | LEARNING_ONLY-Login | Routing nach `/learning/[ownerId]`, keine Messwerte sichtbar | ⏳ |
| UAT-08 | Consent-History öffnen | `CONSENT_HISTORY_VIEWED` wird protokolliert und im Rechtejournal sichtbar | ⏳ |
| UAT-09 | CarbScan ohne Provider-Key | Verständliche Nichtverfügbarkeit statt rohem Fehler | ⏳ |
| UAT-10 | Gemini-Fotoanalyse | Foto wird an Backend übergeben; falls Provider verfügbar ist, Analyseantwort verarbeitet | ⏳ |

## Nachholplan

1. Docker/Docker Compose lokal bereitstellen.
2. `./scripts/start-local-stack.sh` ausführen.
3. Obige Szenarien mit Testprofilen durchspielen.
4. Nur tatsächlich bestandene Szenarien auf ✅ setzen und Belege im Review ergänzen.
