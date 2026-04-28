# Sprint 17 — Alltag im Umfeld

> Status: geplant, noch nicht gestartet
> Branch-Empfehlung: `codex/sprint-17-alltag-umfeld`
> Planning-Quelle: `docs/reviews/BACKLOG_REFINEMENT_SPRINT17.md`
> Key-User-Basis: simulierte Persona-/Proxy-Interviews, keine realen externen Interviews

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
- klare Entscheidung, ob Runtime-UAT ausführbar ist
- `TRU-02b` Akzeptanzkriterien final
- keine UAT-✅ ohne echte Durchführung

### Zyklus 2 — Alltagspfade MVP

Ziel:
- Schule-/Trainer- und Großeltern-/Partner-Pfade konzeptionell und technisch schneiden.
- Alltagspaket Sport/Schule als ersten Demo-Slice umsetzen.

Erwartete Ergebnisse:
- eingeschränkte Rollen bleiben ohne Live-Medizinzugriff
- Eltern/Carer sehen aktive Übergaben und Zwecke

### Zyklus 3 — Kurzkommunikation und Abschlussprüfung

Ziel:
- sichere Kurzkommunikation finalisieren.
- UI-/UX-Review, Architektur-Review und Test-/UAT-Vorbereitung abschließen.

Erwartete Ergebnisse:
- Ping/OK/Hilfe-Flows ohne Dosierungsanweisungen
- Sprintreview mit dokumentierten offenen Runtime-/UAT-Risiken

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

