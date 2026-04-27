# Sprint Review Sprint 8

Stand: 2026-04-14

## Scope des Reviews

Geprüft wurden die live laufende Anwendung und die live erreichbaren Endpunkte auf:

- Sprint 8: Review, Doku, Signalqualität
- noch sichtbare Kernfeatures aus Sprint 4 bis 6
- Relevanz für die Key User:
  - Elternteil
  - Kind (8 Jahre)
  - Jugendlicher
  - Erwachsener
  - Arzt / Begleitperson

Die Prüfung erfolgte gegen die gestartete Anwendung unter:

- Backend: `http://127.0.0.1:8080`
- Frontend: `http://127.0.0.1:3002`

## Review-Ergebnis nach Persona

### Malte (8 Jahre)

Positiv:

- Login-Einstieg ist erreichbar
- Guardian Ping reagiert stabil und bricht nicht hart
- Notfallkarten-Route ist erreichbar

Einschränkungen:

- Betreuer-/Eltern-Flow konnte nicht Ende-zu-Ende freigegeben werden, weil Invite-Erstellung mit `500` scheitert
- Gamification konnte in der Headless-Umgebung nicht visuell final bestätigt werden

Status: `teilweise freigabefähig`

### Sarah (Elternteil / Begleitperson)

Positiv:

- Rollen-/Link-Endpunkte sind vorhanden
- Guardian Ping liefert kontrollierte Antwort
- Gesundheitszustand des Systems ist insgesamt stabil

Einschränkungen:

- Einladungsflow ist aktuell blockiert
- Settings-Änderungen sind aktuell blockiert

Status: `nicht freigabefähig`

### Jonas (16 Jahre)

Positiv:

- Login- und Profilmodell für Jugendprofil ist vorhanden
- Insights und Datenqualitäts-Hinweise sind live verfügbar
- Muster liefern Zeitfenster statt nur generischer Texte

Einschränkungen:

- visuelle Teen-UX konnte nicht browserseitig final bestätigt werden
- Settings-Interaktion ist blockiert

Status: `teilweise freigabefähig`

### Anna (Erwachsene Nutzerin)

Positiv:

- Metrics liefern plausible Kennzahlen
- Datenqualität zeigt veraltete Werte und Messlücken sauber an
- Arzt-Share funktioniert Ende-zu-Ende
- Audit-Log zeichnet relevante Aktionen auf
- Adaptive-Bolus-Endpunkt antwortet stabil

Einschränkungen:

- adaptiver Modus konnte nicht aktiviert werden, weil Settings-Schreiben blockiert ist
- KI-Chat ist live nicht stabil

Status: `weitgehend freigabefähig mit Blockern`

### Dr. Krause (Arzt)

Positiv:

- öffentlicher Arzt-Link funktioniert
- Kennzahlen und letzte Ereignisse werden kompakt geliefert
- Share ist für Review-Gespräche bereits brauchbar

Einschränkungen:

- keine druckbare Arzt-Kurzansicht in diesem Sprintreview
- UI-seitige visuelle Abnahme der Public-Share-Seite im Browser noch offen

Status: `freigabefähig mit Wunsch nach Ausbau`

## Durchgeführte Live-Prüfungen

Bestanden:

- Backend Health `UP`
- Frontend Login-Route `200`
- Profilanlage
- Login mit PIN
- Admin-Elevation
- Settings lesen
- Insights Metrics
- Insights Patterns mit Zeitfenster
- Data Quality
- Share-Link-Erstellung
- öffentliche Share-Antwort
- Audit-Log
- Adaptive-Bolus-Endpunkt
- Notfallkarten-Route

Nicht bestanden:

- Settings speichern
- Familien-/Betreuer-Einladung
- KI-Chat

Teilweise bestanden:

- Guardian Ping
  - technisch stabil
  - wegen Invite-Blocker nicht mit echten Empfängern abgenommen

## Blocker

### BR-01 · Settings speichern nicht möglich

- Symptom:
  - `PUT /api/v1/settings` liefert `403 FORBIDDEN`
- Auswirkung:
  - Daily Summary, Theme, Quiet Hours, Adaptive Bolus und Kontakte sind nicht produktiv änderbar
- Schwere:
  - hoch

### BR-02 · Familien-/Betreuer-Einladung bricht mit 500 ab

- Symptom:
  - `POST /api/v1/profiles/{id}/invite` liefert `500 INTERNAL_ERROR`
- Auswirkung:
  - Eltern-/Beobachter-Flow nicht freigabefähig
- Schwere:
  - hoch

### BR-03 · KI-Chat bricht live mit 500 ab

- Symptom:
  - `POST /api/v1/ai/chat` liefert `500 INTERNAL_ERROR`
- Auswirkung:
  - KI-Assistent nicht freigabefähig
- Schwere:
  - mittel bis hoch

## Anmerkungen aus dem Review

- Signalqualität ist fachlich ein guter Sprintkern und bereits sichtbar wertstiftend.
- Arzt-Share ist inhaltlich brauchbar und einer der stärksten freigegebenen Flows.
- Die wichtigsten offenen Punkte liegen nicht in der Analyse, sondern in den Schreib- und Rollenflüssen.
- Für die nächste Freigaberunde sollte ein kurzer visueller Browser-UAT ergänzt werden, sobald die Blocker behoben sind.

## Freigabeempfehlung

Empfehlung: `bedingt freigeben`

Bedingungen:

- Insights, Datenqualität, Share und Audit können freigegeben werden
- Settings-Schreibzugriff muss vor Vollfreigabe repariert werden
- Familien-/Invite-Flow muss vor Vollfreigabe repariert werden
- KI-Chat muss entweder stabilisiert oder im UI klar als nicht aktiv markiert werden

## Nächste Schritte

1. `PUT /api/v1/settings` reparieren und erneut UAT fahren.
2. Invite-/Watcher-Flow reparieren und Guardian Ping End-to-End prüfen.
3. KI-Chat entweder stabilisieren oder im Sprint sauber abgrenzen.
4. Danach kurze manuelle Browser-Abnahme:
   - Gamification
   - Notfall-Karte Druck
   - Theme-Wechsel
   - Observer-Flow
   - CSV-Export

