# UAT — Sprint 17 Alltag im Umfeld

> Stand: 2026-04-27
> Status: geplant, nicht ausgeführt
> Testintegrität: Kein Szenario darf ✅ erhalten, bevor es auf einer laufenden Instanz wirklich geprüft wurde.

## Runtime-Voraussetzung

Für UAT wird eine laufende lokale Instanz benötigt:
- Docker / Docker Compose
- Backend
- Frontend
- Login-Smoke-Test

Falls `./scripts/start-local-stack.sh` nicht lauffähig ist, bleiben alle Szenarien `⏳` oder `❌ nicht getestet`.

## Supersprint-Nachhol-UAT

Diese Szenarien bleiben aus dem Supersprint offen und sollen vor oder während Sprint 17 nachgeholt werden.

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| SS-01 | Settings öffnen | Button `Meine Freigaben` führt nach `/consent` | ⏳ |
| SS-02 | Fachpersonen-Invite erstellen | Fachrolle und Zugriffsdauer sind auswählbar; Code wird erstellt | ⏳ |
| SS-03 | Fachpersonen-Invite annehmen | Link wird aktiv; Zugriff hat `expiresAt` ab Annahme | ⏳ |
| SS-04 | Abgelaufener akzeptierter Link | Link erscheint nicht mehr in Login-/Watching-/Consent-Listen | ⏳ |
| SS-05 | Abgelaufener Pending-Code | Pending Invite erscheint nicht mehr in offenen Einladungen | ⏳ |
| SS-06 | SUMMARY_ONLY-Login | Routing nach `/summary/[ownerId]`, echter Owner-Name sichtbar, keine Einzelmessungen | ⏳ |
| SS-07 | LEARNING_ONLY-Login | Routing nach `/learning/[ownerId]`, keine Messwerte sichtbar | ⏳ |
| SS-08 | Consent-History öffnen | `CONSENT_HISTORY_VIEWED` wird protokolliert und im Rechtejournal sichtbar | ⏳ |
| SS-09 | CarbScan ohne Provider-Key | Verständliche Nichtverfügbarkeit statt rohem Fehler | ⏳ |

## Sprint-17-UAT-Szenarien

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| S17-01 | Schule-/Trainer-Zugang öffnen | Kein Live-BZ und keine Eintragsliste sichtbar; Notfall-/Kontaktinfos sind verständlich | ⏳ |
| S17-02 | Großeltern-/Betreuungspfad öffnen | Drei klare Handlungsschritte und Elternkontakt sichtbar; keine Admin- oder Schreibfunktionen | ⏳ |
| S17-03 | Partner-/Geschwisterpfad öffnen | Alltagshilfe sichtbar, medizinische Vollansicht bleibt verborgen | ⏳ |
| S17-04 | Alltagspaket Sport/Schule anzeigen | Paket enthält Kontakte, Hinweise, Zweck, Ablauf und klare Rolle | ⏳ |
| S17-05 | Ping/OK/Hilfe-Kurzkommunikation | Nachricht enthält keine konkrete Insulindosis und ist klar als Alltagshinweis markiert | ⏳ |
| S17-06 | Kritischer Wert im Umfeld-Kontext | UI verweist auf SOS-/Elternkontakt statt auf Chat-Diskussion | ⏳ |
| S17-07 | Consent-/Freigabeübersicht für Eltern | Aktive Schule-/Trainer-/Betreuungspfade sind mit Zweck und Ablauf sichtbar | ⏳ |
| S17-08 | Widerruf einer Umfeld-Freigabe | Nach Widerruf verschwindet Zugriff aus Login-/Watching-/Consent-Listen | ⏳ |

## Abnahmehinweise

- Build-Erfolg ersetzt kein UAT.
- Simulierte Persona-Demos gelten nicht als bestandene UAT-Szenarien.
- Medizinische Grenzwerte und Dosierungsregeln dürfen im UAT nicht geändert werden.

