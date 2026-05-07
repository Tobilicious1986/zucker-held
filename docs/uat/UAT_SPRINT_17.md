# UAT — Sprint 17 Alltag im Umfeld

> Stand: 2026-05-07
> Status: Fachliche UAT-Szenarien lokal auf laufender Instanz abgeschlossen
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

Fachliche Nachprüfung 2026-05-07:
- Testdaten: lokale synthetische UAT-Profile `UAT Owner Malte 537076`, `UAT Fachperson 537076`, `UAT Partner 537076`, `UAT Schule Trainer 537076`, `UAT Oma Betreuung 537076`, `UAT Ablauf Watcher 537076`, `UAT Widerruf Watcher 537076`, `UAT Eltern Caregiver 537076`.
- Browser-UAT im In-App-Browser gegen `http://localhost:3000` und API-UAT gegen `http://127.0.0.1:8080`.
- Geprüft wurden echte Einladungen, Annahmen, Ablauf-Filter, Widerruf, Login-Routing, Consent-Ansichten, Guardian-Ping und CarbScan-Fallback.
- Ablauf-Szenarien wurden auf lokalen Testlinks gezielt per Postgres-Testdatenupdate abgelaufen gesetzt; danach wurden die echten Backend-Listen und UI-Ansichten geprüft.

## Supersprint-Nachhol-UAT

Diese Szenarien bleiben aus dem Supersprint offen und sollen vor oder während Sprint 17 nachgeholt werden.

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| SS-01 | Settings öffnen | Button `Meine Freigaben` führt nach `/consent` | ✅ bestanden — Browser: Settings zeigte `Meine Freigaben`, Klick führte nach `/consent` |
| SS-02 | Fachpersonen-Invite erstellen | Fachrolle und Zugriffsdauer sind auswählbar; Code wird erstellt | ✅ bestanden — Browser: Fachrolle und `Zugriffsdauer ab Annahme` sichtbar, Code `D7A7MKYP` erstellt |
| SS-03 | Fachpersonen-Invite annehmen | Link wird aktiv; Zugriff hat `expiresAt` ab Annahme | ✅ bestanden — API: Fachpersonen-Link angenommen, `expiresAt` auf 2026-05-10 gesetzt |
| SS-04 | Abgelaufener akzeptierter Link | Link erscheint nicht mehr in Login-/Watching-/Consent-Listen | ✅ bestanden — API: `all-watching` leer, Owner-Watcher-Liste ohne abgelaufenen Testlink |
| SS-05 | Abgelaufener Pending-Code | Pending Invite erscheint nicht mehr in offenen Einladungen | ✅ bestanden — API: abgelaufener Pending-Code nicht mehr in `pending-invites` sichtbar |
| SS-06 | SUMMARY_ONLY-Login | Routing nach `/summary/[ownerId]`, echter Owner-Name sichtbar, keine Einzelmessungen | ✅ bestanden — Browser: Login-Routing nach `/summary/p_1778143537101_n07cb`, Owner sichtbar, keine Einzelmessungen |
| SS-07 | LEARNING_ONLY-Login | Routing nach `/learning/[ownerId]`, keine Messwerte sichtbar | ✅ bestanden — Browser: Schule/Trainer-Login nach `/learning/p_1778143537101_n07cb`, keine Messwerte |
| SS-08 | Consent-History öffnen | `CONSENT_HISTORY_VIEWED` wird protokolliert und im Rechtejournal sichtbar | ✅ bestanden — Browser/API: Rechtejournal zeigt `CONSENT_HISTORY_VIEWED` |
| SS-09 | CarbScan ohne Provider-Key | Verständliche Nichtverfügbarkeit statt rohem Fehler | ✅ bestanden — Browser/API: `Kein KI-Provider konfiguriert` mit verständlichem Hinweis |

## Sprint-17-UAT-Szenarien

| # | Szenario | Erwartetes Ergebnis | Status |
|---|----------|---------------------|--------|
| S17-01 | Schule-/Trainer-Zugang öffnen | Kein Live-BZ und keine Eintragsliste sichtbar; Notfall-/Kontaktinfos sind verständlich | ✅ bestanden — Browser: Schule/Trainer-Lernzugang zeigt Kontakte, SOS und keine Live-/Eintragsliste |
| S17-02 | Großeltern-/Betreuungspfad öffnen | Drei klare Handlungsschritte und Elternkontakt sichtbar; keine Admin- oder Schreibfunktionen | ✅ bestanden — Browser: Großelternpfad zeigt drei Schritte, Elternkontakte und keine Admin-Funktion |
| S17-03 | Partner-/Geschwisterpfad öffnen | Alltagshilfe sichtbar, medizinische Vollansicht bleibt verborgen | ✅ bestanden — Browser: Partnerpfad routet in Summary-Ansicht ohne Live-Dashboard/Einzelmessungen |
| S17-04 | Alltagspaket Sport/Schule anzeigen | Paket enthält Kontakte, Hinweise, Zweck, Ablauf und klare Rolle | ✅ bestanden — Browser/API: `Sport/Schule` mit Kontakten, Zweck, Rolle und Ablauf sichtbar |
| S17-05 | Ping/OK/Hilfe-Kurzkommunikation | Nachricht enthält keine konkrete Insulindosis und ist klar als Alltagshinweis markiert | ✅ bestanden — API: `ALL_CLEAR` geliefert, Dosierungsnachricht `2 IE Insulin` mit HTTP 400 blockiert |
| S17-06 | Kritischer Wert im Umfeld-Kontext | UI verweist auf SOS-/Elternkontakt statt auf Chat-Diskussion | ✅ bestanden — Browser: Hypo/Hyper/Keton-Hinweise verweisen auf Notruf/Elternkontakt statt Chat-Diskussion |
| S17-07 | Consent-/Freigabeübersicht für Eltern | Aktive Schule-/Trainer-/Betreuungspfade sind mit Zweck und Ablauf sichtbar | ✅ bestanden — Browser: Consent zeigt Schule/Trainer, Großeltern und Partner/Geschwister mit Zweck und Scope |
| S17-08 | Widerruf einer Umfeld-Freigabe | Nach Widerruf verschwindet Zugriff aus Login-/Watching-/Consent-Listen | ✅ bestanden — API/Browser: widerrufener UAT-Link aus Watcher- und Consent-Listen verschwunden |

## Abnahmehinweise

- Build-Erfolg ersetzt kein UAT.
- Simulierte Persona-Demos gelten nicht als bestandene UAT-Szenarien.
- Medizinische Grenzwerte und Dosierungsregeln dürfen im UAT nicht geändert werden.
