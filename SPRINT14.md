# Sprint 14 — Einladung, Einwilligung, DSGVO, Safety

> Status: reviewbereit / technisch abnahmefähig  
> Branch: `codex/sprint-14-einladung-dsgvo-safety`  
> Startdatum: 2026-04-15

## Zielbild
Sprint 14 baut das Fundament für:
- Haushalts-/Begleitmodell mit klarer Rollentrennung
- Einwilligungen und Freigaben mit Zweck, Sichtbarkeit und Laufzeit
- DSGVO-Basisfunktionen (Export, Löschung, Widerruf)
- Safety-Regeln für Nachrichten, Hinweise und Notfallpfade

## Ausgangslage beim Sprint-Start
- Sprint-14-Branch wurde regelkonform als `codex/...` neu angelegt.
- Die strategische Roadmap und das Nutzendenkonzept wurden in `BACKLOG.md`, `README.md`, `ARCHITECTURE.md` und `PRODUCT_STRATEGY.md` verankert.
- Der finale Sprint-13-Stand wurde auf diesen Branch übernommen, damit Sprint 14 nicht auf veraltetem `main` startet.

## Bereits erledigt
- Strategische Produkt-Richtung für Familien-first, T1D-first und Klinik-Empfehlung dokumentiert
- neue Epics `EDU`, `NET`, `CLN`, `TRU`, `GTM` ins Backlog aufgenommen
- `PRODUCT_STRATEGY.md` als separates Leitdokument angelegt
- Sprint-13-Basis in den Sprint-14-Branch übernommen
- Pflicht zur laufenden Sprint-Dokumentation in die Anweisungsdokumente aufgenommen
- Pflicht zur koordinierten Parallelisierung mit Dailies, Cross-Reviews und Challenge-Loop in die Anweisungsdokumente aufgenommen
- verpflichtende Sprintkadenz auf `3` Zyklen umgestellt, mit optionalem `4.` Abschlusszyklus statt künstlich langer `10`-Zyklen-Schleife
- `AGENT_WORKFLOW.md` als zentrales, KI-uebergreifendes Agenten-Playbook angelegt
- Start-/Stop-Skripte fuer Docker, Backend und Frontend vorgesehen, damit der spaetere Sprintabschluss auf einer laufenden Instanz reproduzierbar pruefbar ist
- Frontend-spezifische Anweisungsdokumente ebenfalls auf die gemeinsame Protokoll- und Challenge-Pflicht vereinheitlicht
- zusätzlicher Arbeitslog `SPRINT14.md` als laufendes Lagebild etabliert
- erste Frontend-Slice-Schnittstelle für Datenschutz-/Freigabe-Hub vorbereitet: Settings, Observer, Share und Login wurden als Zielbereiche bestätigt
- Frontend-Consent-Hub als erster Slice umgesetzt: Settings, Login, Observer und Share zeigen jetzt klare Freigabehinweise und defensive Export-/Widerrufs-Interaktion
- Privacy-Hub backendseitig umgesetzt: `PrivacyController`, `PrivacyHubService`, `PrivacyDtos`, `V13__privacy_hub.sql`
- Frontend-Hub auf echte Backend-Endpunkte integriert: Datenschutz-Export und Löschanfrage laufen nicht mehr ueber lokale Fallbacks
- Start-/Stop-Skripte `scripts/start-local-stack.sh` und `scripts/stop-local-stack.sh` angelegt
- Start-/Stop-Skripte gegen echte Laufzeitprobleme gehaertet:
  - Keycloak-DB wird auch auf wiederverwendeten Postgres-Volumes nachgezogen
  - Startfehler räumen halbe Stacks wieder auf
  - Restprozesse auf `3000` und `8080` werden beim Stop mit abgeräumt
  - lokaler Login-Smoke-Test ist Teil des Start-Checks

## In Arbeit
- kein produktkritischer Restblock mehr im Sprint selbst offen
- verbleibende Themen wurden als Folgesprint-Punkte nach Sprint 14 geschnitten:
  - vollständige Einwilligungszentrale mit Historie
  - eigener Ziel-Flow für `SUMMARY_ONLY` und `LEARNING_ONLY`
  - weitergehender Safety-Layer für künftige Nachrichten-/Empfehlungsfunktionen
  - strukturierter Fachpersonen-View

## Arbeitsmodus
- Führender Agent: `Codex`
- Parallelisierung ist für Sprint 14 ausdrücklich erlaubt, wenn Arbeitspakete sauber trennbar sind.
- Bei paralleler Arbeit werden Zuständigkeiten, letzte Dailies, Cross-Reviews und offene Challenges hier im Sprintprotokoll mitgeführt.

## Parallele Arbeitspakete
- `James` (Backend): Privacy-/Datenschutz-Endpunkte, Export-Snapshot, Löschanfrage, Audit-Log, kleiner DB-Schnitt
- `Mencius` (Frontend): Datenschutz-&-Freigaben-Block in Settings, Consent-Hinweise in UI, defensive Anbindung der neuen Endpunkte
- `Codex` (Lead): Schnittdefinition, Sprintprotokoll, Integration, Cross-Review, Abschlussprüfung
- `Volta` (Architektur): Consent-/Invite-Slice challengen, Rollen-/Scope-Schnitt sauber halten
- `Huygens` (UI/UX): Invite-, Share- und Consent-Kommunikation gegenprüfen
- zusätzliche Pflichtrollen für den weiteren Sprintverlauf: Test/QA, DevOps/Runtime, medizinische Fachperspektive (Arzt/Diabetologe/Diabetesberatung)

## Sprintkadenz
- Sprint 14 läuft standardmäßig über `3` Zyklen.
- Wenn ein sauberer Abschluss anders nicht sinnvoll möglich ist, ist ein optionaler `4.` Zyklus erlaubt.
- Jeder Zyklus braucht eine Daily, einen Challenge-Loop und einen Eintrag in `SPRINT14.md`.
- Sprintreview enthält verpflichtend Rückmeldungen aus Key-User-, UI/UX- und Test-/QA-Perspektive.
- Jeder Zyklus wird hier mit Stand, Daily und Challenge-Loop dokumentiert.

## Letztes Daily
- 2026-04-15 13:05 CEST
- gemeinsamer Fokus: kein Großumbau des Rollenmodells, sondern ein belastbares erstes Fundament für Freigabe, Widerruf und DSGVO-Basis
- offene Challenge: bestehende `ProfileLink`-/`ShareLink`-Strukturen sinnvoll nutzen, ohne halbfertige neue Rollen einzuführen
- 2026-04-15 15:20 CEST
- aktuelle Arbeit: Frontend-Datenschutzhub in Settings/Observer/Share/Login wird ausgearbeitet, parallelisiert und defensiv an vorhandene Backend-Flächen angepasst
- täglicher Challenge-Punkt: Export, Löschanfrage und Widerruf müssen auch ohne finale Backend-API verständlich und nicht kaputt bedienbar bleiben
- 2026-04-15 15:40 CEST
- Frontend-Slice umgesetzt und Build/Test verifiziert (`npm run build`, `npm test`)
- Cross-Check: Consent-Hinweise und Freigabe-Hub sind jetzt in Settings, Login, Observer und Share sichtbar; Backend-Artefakte bleiben bewusst getrennt
- Worktree-Hinweis: nur Frontend- und Sprintprotokoll-Änderungen sind Teil dieses Slices; parallele Backend-Artefakte wurden bewusst nicht angefasst
- 2026-04-15 16:40 CEST
- Backend- und Frontend-Track zusammengeführt; Cross-Review hat die falschen Privacy-Endpunkte und den lokalen Fallback im Frontend gefunden und auf echte Backend-Endpunkte nachgeschärft
- technischer Stand grün: `mvn test`, `npm run build`, `npm test`, `bash -n scripts/start-local-stack.sh scripts/stop-local-stack.sh`
- neuer Challenge-Punkt fuer die nächsten Zyklen: gemeinsamer Runtime-Check auf laufender Instanz und Login-Pfad muss am Sprintende agentenübergreifend abgenommen werden
- 2026-04-15 17:05 CEST
- Runtime-Blocker konkretisiert: Keycloak schlug auf wiederverwendeten Postgres-Volumes fehl, weil die Datenbank `keycloak` nicht automatisch neu angelegt wurde; zusätzlich verfälschten Restprozesse auf `3000/8080` die Startprüfung
- Cross-Review-Fund: der erste Privacy-Slice brauchte noch Fallbacks für Profile ohne Settings, einen Reset des profilübergreifend persistierten Privacy-Zustands und eine ehrlichere Observer-Kommunikation ohne implizites Schreibversprechen
- Nachschärfung in Arbeit: gehärtete Start-/Stop-Skripte mit Smoke-Login, Settings-Fallbacks im Backend, Store-Reset und read-only Observer-Kommunikation
- 2026-04-15 21:27 CEST
- Abschlussprüfung erfolgreich: `./scripts/start-local-stack.sh` startet Postgres, RabbitMQ, Keycloak, Backend und Frontend reproduzierbar; `docker compose ps` zeigt gesunde Infra-Container, `curl` auf `/actuator/health`, `/login` und `/api/v1/profiles` ist grün
- Wichtiger Fix auf dem Weg dorthin: Backend und Frontend mussten per `nohup` wirklich vom Startskript entkoppelt werden, damit sie auch nach Script-Ende weiterlaufen; der Login-Smoke-Test bleibt jetzt Teil des Start-Checks
- Ergebnis: der aktuelle Sprint-14-Stand ist für diesen Slice technisch abnahmefähig und betriebsnah verifiziert
- 2026-04-15 23:20 CEST
- Zyklus-3-Fokus: Invite-/Consent-Modell nicht als komplett neues Auth-System, sondern als Erweiterung von `ProfileLink` mit Beziehungstyp, Access Scope und Zweckbindung
- Architektur-Challenge (Volta): Schule und Gast-Lernen dürfen keinesfalls versehentlich in den Live-Medizin-/Observer-Flow rutschen; `hasAccess` und `getWatching` muessen scope-basiert scharf bleiben
- UI/UX-Challenge (Huygens): Invite-UI muss konservativ formuliert werden; `CAREGIVER` darf keine Schreibrechte versprechen, solange Beobachtung weiter read-only bleibt
- Test-/QA-Fund: ein bestehender `NotificationServiceTest` war uhrzeitabhaengig und fiel nachts in Quiet Hours; Test auf neutrale Settings `0/0` gehaertet
- 2026-04-15 23:30 CEST
- Zyklus-3-Abschluss: `ProfileLink` traegt jetzt `relationshipKind`, `accessScope` und `purpose`; Pending-Invites sind sichtbar, Login-/Watching bleibt auf `LIVE_MEDICAL` beschraenkt und Schule/Gast-Lernen werden aus dem Observer-Flow ferngehalten
- Laufzeitcheck nach Codeaenderung erfolgreich: `./scripts/stop-local-stack.sh && ./scripts/start-local-stack.sh` grün, Backend-/Frontend-Health und Login-Smoke-Test weiterhin erfolgreich
- Dokumentation nachgezogen: `README.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `SPRINT14.md`, `AGENT_WORKFLOW.md`, `AGENTS.md`, `CLAUDE.md`, `BRANCHING.md`, `frontend/CLAUDE.md`, `frontend/AGENTS.md`
- 2026-04-15 23:35 CEST
- Optionaler Zyklus 4 geöffnet, weil der Sprintabschluss noch einen sauberen End-to-End-Ablauf brauchte: Safety-Texte nach medizinischem Review nachgeschärft, Sprint-Review/UAT-Dokumente angelegt und finaler Rebuild geplant
- Challenge-Schleife: UI/UX-, QA- und medizinische Perspektive fordern, dass Share, Assistant, Observer und Notfallkarte die Grenzen von Live-Daten, Zweckbindung und Notfalleskalation sichtbarer kommunizieren
- 2026-04-15 23:33 CEST
- Reproduzierbarer Abschlusslauf verifiziert: Stack bewusst gestoppt, `cd frontend && npm run build` auf sauberem `.next` erneut grün gezogen, danach `./scripts/start-local-stack.sh` erneut erfolgreich gestartet
- Abnahmebeleg: `docker compose ps` grün, Backend-Health `UP`, Frontend `/login` `200`, API-Bridge `/api/v1/profiles` `200`, Login-Smoke-Test erfolgreich
- Dauerhaftes Betriebslernen: Produktionsbuilds des Frontends nicht parallel zu einem laufenden lokalen Frontend-Prozess ausführen; bei `ENOTEMPTY ... .next/server` erst mit `./scripts/stop-local-stack.sh` sauber herunterfahren, dann bauen, dann neu starten
- Wenn wir mehrere Stränge parallel bearbeiten, werden sie bewusst als getrennte Subtasks geführt, regelmäßig in kurzen Dailies abgeglichen und vor Abschluss gegenseitig kritisch geprüft.
- `SPRINT14.md` ist dafür das gemeinsame Lagebild: aktueller Stand, Owner, letzte Daily, offene Risiken und Cross-Review-Ergebnisse gehören hier hinein.
- Jeder parallele Arbeitsstrang bekommt einen klaren Owner und mindestens einen Gegenprüfer.
- Dailies dienen als Challenge-Loop: Annahmen, Risiken, Grenzfälle und UI-/API-Brüche sollen dort aktiv hinterfragt werden.
- Cross-Reviews sind Abschlussbedingung, bevor ein paralleler Strang als erledigt gilt.

## Zyklenübersicht
- Zyklus 1: abgeschlossen — Arbeitsmodus, Agentenlogik, erster Privacy-/Freigabe-Hub, Cross-Review und technischer Green-Check
- Zyklus 2: abgeschlossen — Runtime-Härtung, Privacy-Nachschärfung, Smoke-Login und externer Stack-Check
- Zyklus 3: abgeschlossen — Consent-/Invite-Slice mit Beziehungstyp, Scope, Purpose, Pending-Invites und Login-/Observer-Schutz
- Zyklus 4: abgeschlossen — Safety-Nachschärfung, Sprint-Review/UAT, finaler Rebuild und reproduzierbarer Stack-Neustart

## Nächste Schritte
1. Sprint Review mit [SPRINT_REVIEW_SPRINT_14.md](/Users/tobi/Documents/Claude/Diabeteshelper/SPRINT_REVIEW_SPRINT_14.md) und [UAT_SPRINT_14.md](/Users/tobi/Documents/Claude/Diabeteshelper/UAT_SPRINT_14.md) durchführen
2. Folgepunkte in den nächsten Sprint überführen:
   - Consent-Historie / Rechtejournal
   - Ziel-Flows für `SUMMARY_ONLY` und `LEARNING_ONLY`
   - strukturierter Fachpersonen-View
   - Safety-Layer für spätere Nachrichten-/Empfehlungsfunktionen
3. erst nach Review/Abnahme committen und PR für Sprint 14 vorbereiten

## Offene Risiken / Entscheidungen
- Sprint 14 baut auf dem gemergten Sprint-13-Zielbild, aber PR #13 ist zum Start noch nicht in `main`
- Legacy-PWA und Full-Stack-Teile koexistieren; neue Rechte-/Einwilligungslogik muss sauber eingeordnet werden
- professionelle Rollen und Schule/Gastrollen sollen vorbereitet, aber nicht übereilt als halbfertige Vollfunktion ausgeliefert werden
- Solange es keinen explizit abgesicherten Observer-Schreibfluss gibt, bleibt die Beobachtungsansicht bewusst lesend; UI-Texte und Freigabehinweise dürfen nichts anderes suggerieren

## Letzter stabiler Git-Stand
- Strategie-Commit Sprint 14: `85f52bb`
- übernommener Sprint-13-Commit auf diesem Branch: `76af87c`
- Sprintlog-/Parallelisierungs-Commit: `0ef7eed`

## Sprintabschluss
- Status: Sprint 14 ist nach 4 Zyklen reviewbereit und technisch abnahmefähig
- Review-Artefakte:
  - `SPRINT_REVIEW_SPRINT_14.md`
  - `UAT_SPRINT_14.md`
- Reproduzierbarer Abschlussstand:
  - `cd backend && mvn test` grün
  - `npm test` grün
  - `cd frontend && npm run build` grün
  - `./scripts/start-local-stack.sh` grün
  - Frontend `/login`, Backend `/actuator/health` und `/api/v1/profiles` erfolgreich geprüft

## Retrospektive
- Zwischenstand:
  - Positiv: frühes Parallelisieren mit Cross-Review hat echte Laufzeit- und Sicherheitslücken sichtbar gemacht, bevor der Slice vorschnell als grün markiert wurde
  - Nachschärfen: lokale Startskripte müssen nicht nur Health, sondern auch echte Login-Pfade und Prozess-Lebensdauer prüfen
  - Dauerhafte Verbesserung: `SPRINT{N}.md` muss reproduzierbare Runtime-Blocker explizit benennen, nicht nur generisch als „Check offen“
  - Prozess-Lernen: `3` echte Zyklen mit optionalem Abschlusszyklus sind für dieses Projekt deutlich realistischer als starre `10` Zyklen; die Challenge-Tiefe kommt besser über klare Rollenbesetzung und Cross-Reviews als über künstliche Länge
