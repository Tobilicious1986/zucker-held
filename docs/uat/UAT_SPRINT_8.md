# UAT Sprint 8

Stand: 2026-04-14

## Ziel

Dieses UAT-Paket deckt Sprint 8 sowie die noch sichtbaren Kernfunktionen aus Sprint 4 bis 6 gegen die laufende Anwendung ab. Die Prüfung wurde bewusst gegen die gestartete App und die Live-API durchgeführt, nicht durch Code-Review.

## Vorbereitungen

### Infrastruktur

- Docker-Services starten:
  - `docker compose up -d postgres rabbitmq`
- Backend muss auf `http://127.0.0.1:8080` erreichbar sein
- Frontend muss auf `http://127.0.0.1:3002` erreichbar sein

### Gesundheitscheck

- Backend:
  - `GET http://127.0.0.1:8080/actuator/health`
  - Erwartung: `200 {"status":"UP"}`
- Frontend:
  - `GET http://127.0.0.1:3002/login`
  - Erwartung: `200 OK`

### UAT-Profile

Für den Review wurden diese Live-Profile angelegt:

- `Malte UAT`
  - Typ: `kind`
  - Rolle: `admin`
  - Altersgruppe: `child_young`
- `Sarah UAT`
  - Typ: `erwachsen`
  - Rolle: `patient`
- `Jonas UAT`
  - Typ: `kind`
  - Rolle: `admin`
  - Altersgruppe: `child_teen`
- `Anna UAT`
  - Typ: `erwachsen`
  - Rolle: `admin`

### UAT-Daten

Für `Anna UAT` wurden Live-Einträge erzeugt:

- mehrere hohe BZ-Werte
- ein niedriger BZ-Wert
- eine Aktivität `Basketball`

Ziel der Testdaten:

- Insights/Metriken prüfen
- Muster-Erkennung prüfen
- Datenqualitäts-Hinweise prüfen
- Share-/Arztansicht mit Inhalt prüfen

## Durchgeführte UATs

### UAT-01 · Login-Seite lädt

- Persona: alle
- Schritt:
  - `GET /login`
- Erwartung:
  - Login-Route liefert HTML
  - Profilbereich und Einladungscode-Einstieg sind vorhanden
- Ergebnis: `PASS`

### UAT-02 · Profile können angelegt und per PIN angemeldet werden

- Persona: Kind, Jugendlicher, Erwachsener
- Schritte:
  - Profile über `POST /api/v1/profiles` anlegen
  - Login über `POST /api/v1/auth/login`
- Erwartung:
  - Profile werden angelegt
  - Token und Profildaten werden zurückgegeben
- Ergebnis: `PASS`

### UAT-03 · Admin-Elevation funktioniert

- Persona: Eltern/Admin, Erwachsener Admin
- Schritte:
  - `POST /api/v1/auth/elevate` mit gültiger PIN
- Erwartung:
  - neues elevated Token wird ausgegeben
- Ergebnis: `PASS`

### UAT-04 · Settings lesen funktioniert

- Persona: Eltern/Admin, Erwachsener
- Schritte:
  - `GET /api/v1/settings`
- Erwartung:
  - vollständige Settings-Antwort mit Daily Summary, Quiet Hours, Theme, Guardian Ping, Adaptive Bolus
- Ergebnis: `PASS`

### UAT-05 · Settings ändern funktioniert

- Persona: Eltern/Admin, Erwachsener
- Schritte:
  - `PUT /api/v1/settings`
  - geprüft mit normalem Token und mit elevated Token
- Erwartung:
  - Settings werden gespeichert
- Ergebnis: `FAIL`
- Ist-Verhalten:
  - `403 FORBIDDEN`, auch mit elevated Token
- Bewertung:
  - Freigabeblocker für Settings-Änderungen im UI

### UAT-06 · Familien-/Betreuer-Einladung funktioniert

- Persona: Elternteil, Begleitperson
- Schritte:
  - `POST /api/v1/profiles/{id}/invite`
- Erwartung:
  - Einladungscode wird erstellt
- Ergebnis: `FAIL`
- Ist-Verhalten:
  - `500 INTERNAL_ERROR`
- Bewertung:
  - Freigabeblocker für Eltern-/Begleitpersonen-Flow

### UAT-07 · Guardian Ping reagiert kontrolliert

- Persona: Kind, Eltern
- Schritte:
  - `POST /api/v1/profiles/{id}/guardian-ping`
- Erwartung:
  - Ping liefert verständliches Ergebnis
- Ergebnis: `PASS mit Einschränkung`
- Ist-Verhalten:
  - `200 {"recipients":0}`
- Bewertung:
  - System reagiert stabil
  - End-to-End mit echten Betreuern konnte wegen Invite-Blocker nicht validiert werden

### UAT-08 · Insights-Metriken liefern sinnvolle Werte

- Persona: Erwachsener, Arzt
- Schritte:
  - `GET /api/v1/insights/metrics?days=14`
- Erwartung:
  - TIR, Durchschnitt, GMI, CV werden berechnet
- Ergebnis: `PASS`
- Beobachtung:
  - `totalReadings: 6`
  - `avgBz: 190.3`
  - `tirPercent: 16.7`
  - `gmi: 7.9`
  - `cvPercent: 28.0`

### UAT-09 · Muster-Erkennung liefert Zeitfenster

- Persona: Jugendlicher, Erwachsener
- Schritte:
  - `GET /api/v1/insights/patterns?days=14`
- Erwartung:
  - Hinweise enthalten `timeWindowLabel`
- Ergebnis: `PASS`
- Beobachtung:
  - Live-Rückgabe enthielt `timeWindowLabel: "zwischen dokumentierten BZ-Messungen"`

### UAT-10 · Datenqualität zeigt Signalprobleme sichtbar

- Persona: Erwachsener, Arzt
- Schritte:
  - `GET /api/v1/insights/data-quality?days=14`
- Erwartung:
  - veralteter letzter Wert und Messlücken werden klar gemeldet
- Ergebnis: `PASS`
- Beobachtung:
  - `staleGlucose: true`
  - `measurementGapCount: 3`
  - Issues wurden verständlich geliefert

### UAT-11 · Share-Link für Arztansicht funktioniert

- Persona: Erwachsener, Arzt
- Schritte:
  - `POST /api/v1/share-links`
  - `GET /api/v1/public/share/{token}`
- Erwartung:
  - Link wird erzeugt
  - öffentliche Antwort enthält Kennzahlen, letzte Werte und kompakte Ereignisse
- Ergebnis: `PASS`

### UAT-12 · Audit-Log zeichnet Share-Aktion auf

- Persona: Erwachsener, Admin
- Schritte:
  - `GET /api/v1/audit-logs?size=10`
- Erwartung:
  - erzeugte Share-Aktion ist sichtbar
- Ergebnis: `PASS`

### UAT-13 · Adaptiver Bolus-Endpunkt antwortet stabil

- Persona: Erwachsener
- Schritte:
  - `GET /api/v1/insulin/adaptive-suggestion?bz=215&kh=45`
- Erwartung:
  - Endpunkt liefert verständliche Empfehlung oder nachvollziehbaren Fallback
- Ergebnis: `PASS mit Einschränkung`
- Beobachtung:
  - Rückgabe stabil
  - Hinweis meldet deaktivierten adaptiven Modus
  - wegen Settings-Blocker konnte kein aktivierter Flow validiert werden

### UAT-14 · KI-Chat-Endpunkt antwortet stabil

- Persona: Erwachsener
- Schritte:
  - `POST /api/v1/ai/chat`
- Erwartung:
  - kontrollierte Antwort oder sauberer Fehler
- Ergebnis: `FAIL`
- Ist-Verhalten:
  - `500 INTERNAL_ERROR`
- Bewertung:
  - nicht freigabefähig als Live-Feature ohne weitere Absicherung

### UAT-15 · Frontend-Routen für Share und Notfallkarte sind erreichbar

- Persona: Arzt, Eltern, Betreuung
- Schritte:
  - `GET /share/{token}`
  - `GET /emergency-card`
- Erwartung:
  - Routen liefern HTML und hydrierbare Oberfläche
- Ergebnis: `PASS`
- Hinweis:
  - Drucklayout und finale visuelle Klickstrecke müssen im Browser manuell abgenommen werden

## Offene manuelle Klickabnahme

Diese Punkte konnten in der aktuellen Headless-Umgebung nicht vollständig visuell abgenommen werden und sollten im Browser noch einmal kurz per Hand bestätigt werden:

- Gamification sichtbar für `child_young` und `child_teen`, nicht für `adult`
- Druckansicht der Notfall-Karte
- tatsächliche Toggle-Interaktion im Settings-Screen
- Observer-/Begleitpersonen-Flow nach Fix des Invite-Fehlers
- Theme-Wechsel im UI
- CSV-Export-Download im Browser
- Mahlzeit-Favoriten inklusive Persistenz nach Reload

## UAT-Fazit

Freigabefähige Kernbereiche:

- Login und Profilanlage
- Insights/Metriken
- Muster mit Zeitfenstern
- Datenqualität
- Share-Link und Arztansicht
- Audit-Log
- Guardian-Ping-Verhalten ohne Empfänger

Blocker vor finaler fachlicher Freigabe:

- Settings können live nicht gespeichert werden (`403`)
- Familien-/Betreuer-Einladung schlägt mit `500` fehl
- KI-Chat schlägt live mit `500` fehl

