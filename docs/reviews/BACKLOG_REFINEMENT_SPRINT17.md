# Backlog Refinement — Sprint 17 Alltag im Umfeld

> Stand: 2026-04-27
> Status: abgeschlossen für Planning, noch nicht implementiert
> Grundlage: simulierte Key-User-Interviews in `docs/research/KEYUSER_INTERVIEWS_SPRINT17_ALLTAG.md`

## Ziel des Refinements

Das Backlog nach dem Supersprint S14-S16 auf einen aktuellen, priorisierten Stand bringen und Sprint 17 als nächsten regulären Sprint vorbereiten.

## Ergebnis

Sprint 17 fokussiert **Alltag im Umfeld**:
- Schule, Trainer und Tagesbetreuung sicher einbinden
- Großeltern, Geschwister und Partner als begrenzte Begleitrollen schneiden
- Familienkommunikation als sichere Kurzkommunikation beginnen
- Runtime-/UAT-Lücke als Abnahmerisiko sichtbar halten

## Priorisierte Tickets

### P0 — Muss vor Sprintabschluss belegbar sein

| ID | Ticket | Akzeptanz |
|----|--------|-----------|
| `OPS-17-01` | Docker-/Runtime-Voraussetzungen klären | Lokaler Stack kann gestartet werden oder Blocker ist konkret dokumentiert |
| `UAT-SS-01` | Supersprint-UAT nachholen | UAT-Szenarien bleiben ⏳/❌ bis reale Durchführung erfolgt |
| `QA-17-01` | UAT-Belegstruktur | Sprint-17-UAT enthält Szenarien ohne vorweggenommene ✅ |

### P1 — Sprint-17-Kern

| ID | Ticket | Akzeptanz |
|----|--------|-----------|
| `NET-04` | Schule-/Trainer-Modus MVP | Eingeschränkte Rolle ohne Live-Medizinzugriff; klare Notfall- und Kontaktansicht |
| `NET-05` | Großeltern-/Geschwister-/Partner-Pfade | Unterschiedliche Begleitarten sind sichtbar getrennt und nicht administrativ |
| `MSG-01A` | Sichere Kurzkommunikation MVP | Ping/OK/Hilfe gebraucht möglich; keine konkreten Insulindosen oder ärztlichen Anweisungen |
| `DAY-01` | Alltagspaket Sport/Schule | Ein teilbares Paket enthält Kontakte, Notfallhinweise und Situationstext |
| `CARE-01` | Verantwortungsübersicht | Eltern sehen aktive Übergaben, Zwecke und Ablaufzeiten |
| `TRU-02b` | Safety-Grenzen Kommunikation | UI-Texte und Regeln verhindern Dosierungsanweisungen durch Nicht-Fachpersonen |

### P2 — Nach Sprint 17

| ID | Ticket | Grund für Verschiebung |
|----|--------|------------------------|
| `CLN-03` | Visit Pack | Klinikfokus, nicht Alltag-im-Umfeld |
| `EDU-01` | Diagnose-Startpfad | eigener großer Lern-/Onboarding-Sprint |
| `CLN-05` | FHIR/ePA/Interop-Roadmap | Architektur-/Interop-Slice, nicht Alltagsscope |
| `MSG-01B` | Vollständiger verschlüsselter Chat | zu groß und safetykritisch für Sprint-17-MVP |

## Sprint-17-Schnitt

Empfohlener Umsetzungsrahmen für den nächsten Schritt:
1. Runtime-/UAT-Basis herstellen oder Blocker sauber festhalten.
2. Bestehende `ProfileLink`-Scopes nutzen, kein neues Rechte-Domänenmodell einführen.
3. Schule/Trainer und Oma/Betreuung zuerst als eingeschränkte Ansichten schneiden.
4. Kommunikation nur als strukturierte Kurzkommunikation planen.
5. Alltagspaket Sport/Schule als erste konkrete Demo bauen.

## Abhängigkeiten

- `NET-04`, `NET-05` und `DAY-01` bauen auf bestehenden Access Scopes auf: `LEARNING_ONLY`, `SUMMARY_ONLY`, `LIVE_MEDICAL`.
- `MSG-01A` darf nicht vor `TRU-02b` implementiert werden.
- Runtime-UAT bleibt Abnahmerisiko, bis Docker/Docker Compose verfügbar ist.

## Risiken

| Risiko | Umgang |
|--------|--------|
| Simulierte Interviews werden als echte Evidenz missverstanden | Alle Dokumente kennzeichnen die Methode ausdrücklich als Persona-/Proxy-Interview |
| Kommunikation wird zu medizinischer Empfehlung | `MSG-01A` auf Ping/OK/Hilfe/strukturierte Hinweise begrenzen |
| Schule bekommt zu viele Daten | `NET-04` ohne Live-Medizinzugriff planen |
| Sprint 17 wird zu breit | CLN-03, EDU-01 und vollständiger Chat explizit ausschließen |

## Refinement-Fazit

Sprint 17 sollte kein Klinik- oder Diagnose-Sprint werden. Der höchste Produktwert liegt jetzt darin, Zucker-Held im echten Alltag um das Kind herum nutzbar und sicher zu machen.

