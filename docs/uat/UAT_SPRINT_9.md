# UAT Sprint 9

Stand: 2026-04-14

## Ziel

Dieses UAT-Paket dient der Freigabe von Sprint 9 mit Fokus auf:

- GUI-Überarbeitung und visuelle Konsistenz
- Share-/Observer-/Guardian-Ping-Flows
- Settings- und KI-Interaktion
- Persona-basierte Oberfläche und Lesbarkeit

## Vorbereitungen

### Infrastruktur

- Docker-Services:
  - `docker compose up -d postgres rabbitmq`
- Backend:
  - `http://127.0.0.1:8080`
- Frontend:
  - `http://127.0.0.1:3100`

### Technischer Health Check

- `GET http://127.0.0.1:8080/actuator/health`
  - Erwartung: `200 {"status":"UP"}`
- `GET http://127.0.0.1:3100/login`
  - Erwartung: `200 OK`

### Technische Verifikation vor UAT

- `frontend npm run build`
- `npm test`
- `backend mvn test`

Erwartung:

- alles grün, bevor die Persona-UAT startet

## UAT-Szenarien

### UAT-01 · Login und Profilwahl wirken modern und klar

- Persona:
  - Malte
  - Jonas
  - Anna
- Schritte:
  - Login-Seite öffnen
  - zwischen eigenem Profil, Beobachtungsbereich und Einladungscode-Einstieg orientieren
- Erwartung:
  - klare Trennung der drei Bereiche
  - PIN-Eingabe hochwertig und nicht technisch-fragil
  - kein Bereich wirkt wie Altbestand

### UAT-02 · Dashboard vermittelt Fokus statt visueller Unruhe

- Persona:
  - alle
- Schritte:
  - Dashboard öffnen
  - aktuellen Wert, Datenqualität, Insights und Schnellaktionen prüfen
- Erwartung:
  - aktueller BZ ist sofort dominant sichtbar
  - Datenqualität ist als Hilfemodul verständlich
  - Schnellaktionen sind klar als Primäraktionen lesbar
  - keine überladene Konkurrenz zwischen Modulen

### UAT-03 · Settings speichern und Vertrauen in den Speichervorgang

- Persona:
  - Sarah
  - Anna
- Schritte:
  - BZ-Min/Max ändern
  - Theme ändern
  - Guardian Ping aktivieren/deaktivieren
  - Ruhezeiten anpassen
- Erwartung:
  - Einstellungen speichern erfolgreich
  - Nutzer versteht klar, dass die Änderung übernommen wurde
  - nach Reload ist der Wert konsistent sichtbar

### UAT-04 · Invite erstellen, akzeptieren und Observer-Login

- Persona:
  - Sarah
  - Oma / Betreuung
- Schritte:
  - Einladungslink im Settings-Screen erzeugen
  - Code auf zweitem Profil einlösen
  - Beobachtungsprofil öffnen
- Erwartung:
  - Code wird zuverlässig erstellt
  - Beobachterzugriff erscheint nachvollziehbar im Login
  - Rollentexte sind verständlich

### UAT-05 · Observer-Flow sicher und korrekt

- Persona:
  - Betreuung
  - Sarah
- Schritte:
  - Beobachtungsansicht öffnen
  - bei `caregiver/admin` Schnellaktionen prüfen
  - Eintrag testen
- Erwartung:
  - entweder Einträge landen sicher im beobachteten Profil
  - oder die UI ist bewusst read-only
- Hinweis:
  - Dieser Punkt ist aktuell der wichtigste Freigabeblocker.

### UAT-06 · Guardian Ping mit Zustellfeedback

- Persona:
  - Malte
  - Sarah
- Schritte:
  - Ping vom Dashboard auslösen
- Erwartung:
  - Bestätigung mit Anzahl der Empfänger
  - wenn vorhanden: Namen der Empfänger sichtbar im Feedback

### UAT-07 · KI-Assistent: stabil oder sauber deaktiviert

- Persona:
  - Jonas
  - Anna
- Schritte:
  - Chat-Modus öffnen
  - KH-Schätzung auslösen
  - optional persönlichen Kontext speichern
- Erwartung:
  - kein harter Fehler
  - bei nicht verfügbarem Provider: klarer kontrollierter Hinweis
  - Quellen-/Kontext-Herkunft verständlich

### UAT-08 · Arzt-Link als Kurzbericht

- Persona:
  - Anna
  - Dr. Krause
- Schritte:
  - Arzt-Link erzeugen
  - öffentliche Seite öffnen
  - Druckansicht prüfen
- Erwartung:
  - Bericht wirkt kompakt und professionell
  - aktuelle Lage, Kennzahlen und letzte Einträge sind schnell erfassbar
  - Druckansicht ist sauber

### UAT-09 · Mini-Share ist klar nur lesend

- Persona:
  - Schule
  - Trainer
  - Oma / Betreuung
- Schritte:
  - Mini-Link erzeugen
  - Share-Seite öffnen
- Erwartung:
  - keine missverständlichen Handlungs-CTAs
  - Fokus auf Status, letzte Werte, Notfallhinweis
  - Lesemodus ist sprachlich und visuell eindeutig

### UAT-10 · Dark Mode und Altersgruppen wirken konsistent

- Persona:
  - Jonas
  - Anna
  - Malte
- Schritte:
  - Theme hell/dunkel/system wechseln
  - Profile `child_young`, `child_teen`, `adult` vergleichen
- Erwartung:
  - Dark Mode fühlt sich bewusst gestaltet an
  - `child_young` ist größer und freundlicher
  - `child_teen` ist moderner und weniger verspielt
  - `adult` ist ruhiger und professioneller

### UAT-11 · Sekundärseiten fallen gestalterisch nicht aus dem System

- Persona:
  - alle
- Schritte:
  - `BZ`, `Insulin`, `Meal`, `Activity`, `History` öffnen
- Erwartung:
  - kein abrupter Stilbruch zu älteren Screens
  - Buttons, Flächen und Header fühlen sich wie ein gemeinsames System an

## Persona-Fokus für die Review-Runde

### Malte (8 Jahre)

- Primäraktionen groß genug?
- Notfallpfad klar genug?
- Sichtbare Motivation / Erfolgsmomente?

### Sarah (Elternteil)

- Rollen- und Freigabe-Logik verständlich?
- Sicherheit und Verantwortung klar priorisiert?
- Settings vertrauenswürdig genug?

### Jonas (16 Jahre)

- Modern genug?
- Dark Mode cool statt kindlich?
- KI und Insights nicht zu verspielt?

### Anna (Erwachsene)

- ruhige Informationshierarchie?
- genug Professionalität im Dashboard?
- Settings, Share und Verlauf effizient genug?

### Dr. Krause

- Bericht schnell scanbar?
- Druckansicht brauchbar?
- medizinische Kurzfassung ausreichend kompakt?

## Aktuelle Review-Prioritäten

Vor Vollfreigabe besonders prüfen:

1. Observer-Schreibfluss
2. Settings-Speichergefühl und Reload-Konsistenz
3. vollständige visuelle Vereinheitlichung der Sekundärseiten
4. Assistent ohne Roh-Markup und mit sauberer Herkunftskennzeichnung
