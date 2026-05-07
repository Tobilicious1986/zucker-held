# Sprint 17 — Alltag im Umfeld

> Status: UAT lokal abgeschlossen, Implementierungs-PR offen
> Branch-Empfehlung: `codex/sprint-17-alltag-umfeld`
> Planning-Quelle: `docs/reviews/BACKLOG_REFINEMENT_SPRINT17.md`
> Key-User-Basis: simulierte Persona-/Proxy-Interviews, keine realen externen Interviews

## Umsetzungsstand 2026-04-28

Branch: `codex/sprint-17-alltag-umfeld`

Code-Stand:
- `NET-04`: Schule-/Trainer-Preset nutzt `SCHOOL` + `LEARNING_ONLY`; kein Live-Zugriff.
- `NET-05`: Großeltern/Betreuung nutzt `FAMILY` + `LEARNING_ONLY`; Partner/Geschwister nutzt `FAMILY` + `SUMMARY_ONLY`.
- `DAY-01`: Lern-/Notfallzugang enthält ein organisatorisches Alltagspaket `Sport/Schule` ohne Messwertliste.
- `MSG-01A` / `TRU-02b`: Guardian-Ping unterstützt `CHECK_IN`, `ALL_CLEAR`, `HELP_NEEDED`; offensichtliche Dosierungsnachrichten werden serverseitig blockiert.
- `CARE-01`: Login, Settings und Consent zeigen Zweck, Zugriffsumfang und Grenzen der Alltagspfade verständlicher.

Reale Checks:
- ✅ `cd backend && mvn test` — 58 Tests grün
- ✅ `npm test` — 64 Tests grün
- ✅ `cd frontend && npm run build` — erfolgreich
- ❌ Runtime/UAT blockiert: `./scripts/start-local-stack.sh` scheitert an `docker: command not found`

UAT-Integrität:
- Keine UAT-Szenarien wurden als bestanden markiert.
- `docs/uat/UAT_SPRINT_17.md` dokumentiert den Runtime-Blocker und lässt alle Szenarien unbestanden.

## Runtime-Nachlauf 2026-05-06

Blocker-Auflösung:
- Docker Desktop wurde lokal unter `~/Applications/Docker.app` verfügbar gemacht.
- Docker Desktop startete zunächst nicht, weil Rosetta-Installation in der Virtualization-Framework-Engine fehlschlug.
- `UseVirtualizationFrameworkRosetta=false` wurde in den lokalen Docker-Desktop-Settings gesetzt; danach war der Docker-Daemon erreichbar.
- `scripts/start-local-stack.sh` und `scripts/stop-local-stack.sh` finden Docker jetzt auch in App-Bundle-Pfaden und prüfen fehlende Voraussetzungen verständlich.

Reale Runtime-Checks:
- ✅ Docker Compose: Postgres, RabbitMQ und Keycloak laufen.
- ✅ Backend-Health: `GET http://127.0.0.1:8080/actuator/health` liefert `{"status":"UP"}`.
- ✅ Frontend: `GET http://127.0.0.1:3000/login` liefert die Login-Seite.
- ✅ Frontend-API-Bridge: `GET http://127.0.0.1:3000/api/v1/profiles` liefert das Smoke-Profil `Stack Smoke`.
- ✅ Browser-Smoke: `/login` rendert im In-App-Browser mit Titel `Zucker-Held Local` und sichtbarer Login-Oberfläche.

Offen:
- Fachliche UAT-Szenarien aus `docs/uat/UAT_SPRINT_17.md` wurden am 2026-05-07 lokal nachgezogen und bestanden.

## UAT-Abschluss 2026-05-07

Testdaten:
- Lokale synthetische UAT-Profile mit Suffix `537076`: Owner, Fachperson, Partner/Geschwister, Schule/Trainer, Großeltern/Betreuung, Ablauf-Watcher, Widerruf-Watcher und Caregiver.
- Testinstanz: Browser gegen `http://localhost:3000`, API gegen `http://127.0.0.1:8080`, lokale Postgres-Testdatenbank.

Reale fachliche UAT-Checks:
- ✅ Supersprint-Nachhol-UAT `SS-01` bis `SS-09` bestanden.
- ✅ Sprint-17-UAT `S17-01` bis `S17-08` bestanden.
- ✅ Browser: Settings `Meine Freigaben` → `/consent`; Consent zeigt Schule/Trainer, Großeltern/Betreuung und Partner/Geschwister mit Zweck und Scope.
- ✅ Browser: Fachpersonen-Invite-UI zeigt Fachrolle, Zugriffsdauer ab Annahme und erstellt einen Code.
- ✅ Browser: `SUMMARY_ONLY` routet nach `/summary/p_1778143537101_n07cb`, zeigt echten Owner-Namen und keine Einzelmessungen.
- ✅ Browser: `LEARNING_ONLY` routet nach `/learning/p_1778143537101_n07cb`, zeigt Notfallkontakte, Alltagspaket `Sport/Schule`, drei Handlungsschritte und keine Live-/Admin-Ansicht.
- ✅ API: Fachpersonen-Invite wurde angenommen und erhielt `expiresAt` ab Annahme.
- ✅ API: abgelaufene akzeptierte und abgelaufene Pending-Testlinks werden aus den relevanten Listen gefiltert.
- ✅ API/Browser: Widerruf entfernt den Zugriff aus Watcher-/Consent-Listen und protokolliert `LINK_REVOKED`.
- ✅ API: Guardian-Ping `ALL_CLEAR` wird geliefert; Dosierungsnachricht mit `2 IE Insulin` wird mit HTTP 400 blockiert.
- ✅ Browser/API: CarbScan ohne Provider-Key zeigt eine verständliche Nichtverfügbarkeit statt rohem Fehler.

UAT-Einschränkung:
- Keine realen externen Key-User-Interviews durchgeführt; diese UAT ist eine lokale technische/fachliche Abnahme mit synthetischen Profilen.

## Sprintziel

Zucker-Held soll sicherer und nützlicher für Menschen werden, die Malte und andere Nutzer im Alltag begleiten: Schule, Trainer, Oma/Großeltern, Geschwister, Partner und Eltern/Carer.

## Geplanter Scope

| Priorität | Ticket | Ziel |
|-----------|--------|------|
| P0 | `OPS-17-01` | Runtime-/Docker-Blocker klären und UAT-Fähigkeit herstellen oder ehrlich dokumentieren |
| P0 | `UAT-SS-01` | offene Supersprint-UAT-Szenarien nachholen, sobald Runtime verfügbar ist |
| P1 | `NET-04` | Schule-/Trainer-Modus MVP ohne Live-Medizinzugriff |
| P1 | `NET-05` | Begleitpfade für Großeltern, Geschwister und Partner |
| P1 | `MSG-01A` | sichere Kurzkommunikation: Ping, OK, Hilfe gebraucht, strukturierte Hinweise |
| P1 | `DAY-01` | erstes Alltagspaket für Sport/Schule |
| P1 | `CARE-01` | Verantwortungsübersicht für Eltern/Carer |
| P1 | `TRU-02b` | Safety-Grenzen für Kommunikation und Alltagshinweise |

## Nicht im Scope

- vollständiger Ende-zu-Ende-verschlüsselter Familienchat
- konkrete Insulindosierungen oder medizinische Grenzwertänderungen
- `CLN-03` Visit Pack
- `EDU-01` Diagnose-Startpfad
- neues fundamentales Consent-Domänenmodell

## Arbeitsmodell

Sprint 17 folgt der verbindlichen Sprintlogik aus `docs/agents/AGENT_WORKFLOW.md`:
- 3 Zyklen plus optionaler 4. Abschlusszyklus
- je Zyklus Daily/Synchronisation und Challenge-Loop
- Architektur-, UI/UX-, Test/QA- und DevOps/Runtime-Perspektive
- Key-User-Perspektive zunächst als simulierte Persona-Perspektive, später nach Möglichkeit real validieren

## Zyklusplanung

### Zyklus 1 — Runtime und Safety-Schnitt

Ziel:
- Runtime-Blocker prüfen.
- Safety-Regeln für Schule/Trainer, Begleitrollen und Kommunikation festlegen.
- UAT-Szenarien finalisieren.

Erwartete Ergebnisse:
- Runtime-UAT aktuell nicht ausführbar, weil `docker` lokal nicht verfügbar ist.
- `TRU-02b` Akzeptanzkriterien wurden in Guardian-Ping-Service und Tests konkretisiert.
- keine UAT-✅ ohne echte Durchführung.

### Zyklus 2 — Alltagspfade MVP

Ziel:
- Schule-/Trainer- und Großeltern-/Partner-Pfade konzeptionell und technisch schneiden.
- Alltagspaket Sport/Schule als ersten Demo-Slice umsetzen.

Erwartete Ergebnisse:
- eingeschränkte Rollen bleiben ohne Live-Medizinzugriff.
- Eltern/Carer sehen aktive Übergaben, Zwecke und Zugriffsumfang in Settings/Consent/Login.

### Zyklus 3 — Kurzkommunikation und Abschlussprüfung

Ziel:
- sichere Kurzkommunikation finalisieren.
- UI-/UX-Review, Architektur-Review und Test-/UAT-Vorbereitung abschließen.

Erwartete Ergebnisse:
- Ping/OK/Hilfe-Flows sind als strukturierte Guardian-Pings umgesetzt.
- Dosierungsanweisungen werden serverseitig abgelehnt.
- Sprintreview dokumentiert das offene Runtime-/UAT-Risiko.

## Architektur-/Safety-Review 2026-04-28

- Kein neues Rollen- oder Datenbankmodell eingeführt; Sprint 17 nutzt bewusst die bestehenden `ProfileLink`-Scopes.
- `LEARNING_ONLY` bleibt ohne Messwerte und Eintragslisten; das Alltagspaket ergänzt nur organisatorische Hinweise.
- Medizinische Schwellen und bestehende Learning-Texte wurden nicht geändert.
- Guardian-Ping bleibt Kurzkommunikation, kein Chat: strukturierte Nachrichtentypen, max. kurze Nachricht, Dosierungsblocker.

## Retrospektive-Zwischenstand

- Gut: Bestehende Scope-Architektur aus Sprint 15/16 konnte ohne Migration weiterverwendet werden.
- Risiko: Runtime-UAT ist weiter abhängig von Docker-Verfügbarkeit auf der lokalen Maschine.
- Verbesserung für den nächsten Schritt: Vor manueller UAT zuerst Docker-Verfügbarkeit herstellen oder eine alternative verlässliche Laufzeitumgebung dokumentieren.

### Optionaler Zyklus 4 — Runtime-Nachlauf

Nur nutzen, wenn Docker/Runtime während des Sprints verfügbar wird und UAT real nachgezogen werden kann.

## Definition of Done

- Backlog- und Architektur-Doku sind auf den Sprintstand aktualisiert.
- UAT-Status ist ehrlich dokumentiert.
- Tests/Builds sind passend zum gelieferten Code real ausgeführt.
- Keine medizinischen Texte, Grenzwerte oder Dosierungsregeln wurden ohne explizite Freigabe verändert.
- Sprintreview und Retrospektive sind dokumentiert.

## Planning-Entscheidungen

- Sprint 17 ist der nächste reguläre Sprint nach dem unnummerierten Supersprint.
- Fokus ist Alltag im Umfeld, nicht Klinik/Diagnose.
- Simulierte Interviews dürfen Produktannahmen liefern, ersetzen aber keine echte Nutzendenvalidierung.
