# Zucker-Held — Produktstrategie

> Stand: 2026-04-15  
> Fokus: DACH Familien-first, T1D-first, Empfehlung-zuerst

## North Star
Zucker-Held soll die App sein, die nach einer frischen Diabetes-Diagnose sofort empfohlen wird, weil sie nicht nur dokumentiert, sondern Familien, Begleitungen und Fachpersonen sicher durch den Alltag führt.

Der strategische Anspruch ist:
- beste Begleit-App für frisch diagnostizierte Familien im deutschsprachigen Alltag
- verlässliche Plattform für Lernen, Safety und Kommunikation
- später klinisch anschlussfähig für Empfehlung, Übergabe und mögliche Verordnung

## Zielsegmente
- **Primär:** frisch diagnostizierte T1D-Kinder/Jugendliche und ihre Familien
- **Sekundär:** Erwachsene mit T1D und deren Partner/Begleitpersonen
- **Tertiär:** Diabetesberater, Ärzte, Pflege, Schule/Trainer als freigegebene Begleiter

Nicht Ziel der kurzfristigen Roadmap:
- sofortige Öffnung auf alle Diabetesformen
- Kliniksoftware oder Praxisverwaltung
- reine Community- oder Coaching-Plattform ohne starken Alltagskern

## Synthese aus Persona- und Stakeholder-Perspektive

### Kind (8 Jahre)
Fehlt heute vor allem:
- weniger Text, mehr klare Sofort-Hilfe
- sichtbare Sicherheit, wenn etwas kritisch wird
- Erfolgserlebnisse, Fortschritt und einfache Sprache

### Jugendliche
Fehlt heute vor allem:
- mehr Autonomie und Privatsphäre
- weniger kindliche Anmutung
- Unterstützung, die hilft ohne zu bevormunden

### Eltern / Partner / Geschwister / Großeltern
Fehlt heute vor allem:
- klare Rollen und Grenzen
- mehr Schulung für Begleitungen
- sichere, einfache Übergaben an Schule, Familie und Sport
- sichtbare Einwilligungen und Widerrufe

### Diabetologe / Diabetesberater
Fehlt heute vor allem:
- strukturierte Kurzberichte
- fachlich lesbare Übergaben
- klarer Rollen- und Haftungsrahmen
- nachvollziehbar kuratierte Lern- und Hilfetexte

### Pflege / Stationsarzt / Schulungsteam / Klinikleitung
Fehlt heute vor allem:
- Diagnose-Startpfad für die ersten Tage
- klare Empfehlungspakete für Entlassung und Ambulanz
- verlässliche Datenschutz- und Freigabelogik
- ein Produkt, das Familien ohne lange Einweisung sofort nutzen können

## Produktregeln
- Niemand startet langfristig im selben generischen Flow.
- Die App trennt zwischen `Betroffener`, `Begleitung`, `Fachperson` und `Lernen/Notfallhilfe`.
- Live-Datenzugriff ist niemals implizit; Lern- und Notfallinhalte schon.
- Medizinisch sensible Inhalte brauchen fachliche Reviewfähigkeit.
- Klinik-Empfehlung wird zuerst als Vertrauens- und Versorgungsziel gebaut, nicht als vorschnelle DiGA-Behauptung.

## Vier Einstiegspfade (Zielbild)
1. **Ich habe Diabetes**  
   Voller Self-Management-Flow, Diagnosestart, Alltag, Freigaben

2. **Ich begleite jemanden**  
   Rollenbasierter Einstieg für Eltern, Partner, Geschwister, Großeltern, enge Betreuung

3. **Ich bin Fachperson**  
   Arzt, Diabetesberater, Pflege, Klinik — immer nur freigegeben und zweckgebunden

4. **Ich will lernen / Notfallhilfe**  
   Schule, Freunde, Familie, Trainer, Lehrkräfte — kein Live-Zugriff, aber sichere Hilfen

## Was zur Marktführerschaft noch fehlt

### 1. Diagnose-Start
- 14-Tage-Onboarding statt reinem App-Start
- klare Tagesziele für die erste Zeit nach Diagnose
- entlassungsfähiger Einstieg aus Klinik/Ambulanz

### 2. Lernakademie
- rollenspezifische Lernpfade statt statischer Wissensseiten
- kurze Checks zum Verstehen
- Inhalte für Schule, Sport, Nacht, Ketone, Reisen, Krankheitstage

### 3. Care Network
- Einwilligungen, Rollen, Zweckbindung, Laufzeit
- Familienkonto plus begrenzte Begleitrollen
- Schule/Trainer/Gastmodus ohne Live-Daten

### 4. Klinik-Readiness
- fachliche Kurzberichte
- zeitlich begrenzte professionelle Einladungen
- saubere Termin- und Übergabepakete
- Interoperabilitäts-Roadmap statt später Notlösung

### 5. Vertrauen & DSGVO
- sichtbare Rechte auf Export, Löschung, Widerruf
- Privacy-by-default je Rolle
- dokumentierte klinische Review- und Architekturreviews

### 6. Massentauglichkeit
- Mobile-Politur und Accessibility
- schnelle Aktivierung von Familiennetzwerken
- klare Positionierung gegenüber reinen Logbuch-Apps

## Externe Signale
- **WETID-MyDia:** guter Benchmark für Food, Barcode, Tagebuch, Mehrgeräte-Sync und modernes Ernährungsmanagement
- **NICE NG18 / Familien- und Carer-Perspektive:** strukturierte Unterstützung von Kindern, Jugendlichen, Familien und Carern ist zentral
- **Diabetes UK / Carer Support:** Begleitungen brauchen eigene Unterstützung, nicht nur Zugriff
- **BfArM DiGA-Leitfaden:** Vertrauen, Datenschutz, Interoperabilität und Nutzungsqualität müssen früh mitgedacht werden
- **LibreLinkUp / Glooko:** Caregiver- und Clinic-Collaboration sind eigene Produktachsen, nicht nur Zusatzfunktionen

## Verbindung zum Backlog
Die strategischen Umsetzungsachsen sind im Backlog als neue Epics abgebildet:
- `EPIC A` Diagnose-Start & Lernakademie
- `EPIC B` Care Network & Rechte
- `EPIC C` Klinik-Readiness
- `EPIC D` Sicherheit, Vertrauen, DSGVO
- `EPIC E` Massentauglichkeit & Wachstum

Die empfohlenen nächsten Phasen sind:
- Sprint 14: Einladung, Einwilligung, DSGVO, Safety
- Sprint 15: Diagnosemodus & Lernakademie v1
- Sprint 16: Care Team & Klinik-Readiness
- Sprint 17: Alltag im Umfeld
- Sprint 18: Skalierung & Marktführung
