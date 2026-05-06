# UAT — Sprint 17 Alltag im Umfeld

> Stand: 2026-05-06
> Status: Runtime-Smoke ausführbar, fachliche UAT-Szenarien noch offen
> Testintegrität: Kein Szenario darf ✅ erhalten, bevor es auf einer laufenden Instanz wirklich geprüft wurde.

## Runtime-Voraussetzung

Für UAT wird eine laufende lokale Instanz benötigt:
- Docker / Docker Compose
- Backend
- Frontend
- Login-Smoke-Test

Falls `./scripts/start-local-stack.sh` nicht lauffähig ist, bleiben alle Szenarien `⏳` oder `❌ nicht getestet`.

Prüfung 2026-04-28:
- Befehl: `./scripts/start-local-stack.sh`
- Ergebnis: `docker: command not found`
- Folge: keine UAT-Szenarien wurden ausgeführt oder bestanden markiert.

Nachprüfung 2026-05-06:
- Docker Desktop lokal verfügbar gemacht; Rosetta-Startblocker durch Deaktivierung der Docker-Desktop-Rosetta-Option behoben.
- `./scripts/start-local-stack.sh` startet die Infrastruktur und besteht Health-, Login- und Login-Smoke-Test.
- Browser-Smoke: `/login` rendert mit Titel `Zucker-Held Local`; API-Bridge liefert das Smoke-Profil `Stack Smoke`.
- Die folgenden fachlichen UAT-Szenarien wurden noch nicht vollständig durchgespielt und bleiben deshalb ohne ✅.

## Supersprint-Nachhol-UAT

Diese Szenarien bleiben aus dem Supersprint offen und sollen vor oder während Sprint 17 nachgeholt werden.

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| SS-01 | Settings öffnen | Button `Meine Freigaben` führt nach `/consent` | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-02 | Fachpersonen-Invite erstellen | Fachrolle und Zugriffsdauer sind auswählbar; Code wird erstellt | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-03 | Fachpersonen-Invite annehmen | Link wird aktiv; Zugriff hat `expiresAt` ab Annahme | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-04 | Abgelaufener akzeptierter Link | Link erscheint nicht mehr in Login-/Watching-/Consent-Listen | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-05 | Abgelaufener Pending-Code | Pending Invite erscheint nicht mehr in offenen Einladungen | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-06 | SUMMARY_ONLY-Login | Routing nach `/summary/[ownerId]`, echter Owner-Name sichtbar, keine Einzelmessungen | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-07 | LEARNING_ONLY-Login | Routing nach `/learning/[ownerId]`, keine Messwerte sichtbar | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-08 | Consent-History öffnen | `CONSENT_HISTORY_VIEWED` wird protokolliert und im Rechtejournal sichtbar | ⏳ ausstehend — Runtime jetzt verfügbar |
| SS-09 | CarbScan ohne Provider-Key | Verständliche Nichtverfügbarkeit statt rohem Fehler | ⏳ ausstehend — Runtime jetzt verfügbar |

## Sprint-17-UAT-Szenarien

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| S17-01 | Schule-/Trainer-Zugang öffnen | Kein Live-BZ und keine Eintragsliste sichtbar; Notfall-/Kontaktinfos sind verständlich | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-02 | Großeltern-/Betreuungspfad öffnen | Drei klare Handlungsschritte und Elternkontakt sichtbar; keine Admin- oder Schreibfunktionen | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-03 | Partner-/Geschwisterpfad öffnen | Alltagshilfe sichtbar, medizinische Vollansicht bleibt verborgen | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-04 | Alltagspaket Sport/Schule anzeigen | Paket enthält Kontakte, Hinweise, Zweck, Ablauf und klare Rolle | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-05 | Ping/OK/Hilfe-Kurzkommunikation | Nachricht enthält keine konkrete Insulindosis und ist klar als Alltagshinweis markiert | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-06 | Kritischer Wert im Umfeld-Kontext | UI verweist auf SOS-/Elternkontakt statt auf Chat-Diskussion | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-07 | Consent-/Freigabeübersicht für Eltern | Aktive Schule-/Trainer-/Betreuungspfade sind mit Zweck und Ablauf sichtbar | ⏳ ausstehend — Runtime jetzt verfügbar |
| S17-08 | Widerruf einer Umfeld-Freigabe | Nach Widerruf verschwindet Zugriff aus Login-/Watching-/Consent-Listen | ⏳ ausstehend — Runtime jetzt verfügbar |

## Abnahmehinweise

- Build-Erfolg ersetzt kein UAT.
- Simulierte Persona-Demos gelten nicht als bestandene UAT-Szenarien.
- Medizinische Grenzwerte und Dosierungsregeln dürfen im UAT nicht geändert werden.
