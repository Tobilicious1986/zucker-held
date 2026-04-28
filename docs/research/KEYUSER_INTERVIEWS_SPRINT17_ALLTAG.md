# Simulierte Key-User-Interviews — Sprint 17 Alltag im Umfeld

> Stand: 2026-04-27
> Methode: simulierte Persona-/Proxy-Interviews auf Basis von `docs/project/PRODUCT_STRATEGY.md`, Backlog, Sprint-14-16-Ergebnissen und Supersprint-Doku.
> Wichtig: Dies sind keine real durchgeführten externen Interviews. Findings sind als Produktannahmen zu behandeln und später mit echten Nutzenden zu validieren.

## Ziel

Sprint 17 soll den Alltag außerhalb der Kernfamilie stärken: Schule, Sport, Großeltern, Geschwister, Partner und kurze sichere Kommunikation.

## Kernset 5

| Persona | Rolle im Alltag | Interview-Fokus |
|---------|-----------------|-----------------|
| Sarah | Elternteil / Carer | Verantwortung teilen, Übergaben, Entlastung |
| Malte / Jonas | Kind bzw. Jugendlicher mit T1D | Autonomie, Schule/Sport, Peinlichkeit, schnelle Hilfe |
| Oma | gelegentliche Betreuung | klare Grenzen, Notfallhilfe, keine medizinische Überforderung |
| Lehrkraft / Trainer | Schule/Sport | Übergabe, Klassenfahrt, Training, 3-Klick-Notfallhilfe |
| Diabetesberatung / Arzt | Fachperspektive | Safety, Haftung, keine Dosierungsanweisungen |

## Demo-Grundlage

In der simulierten Demo wurden diese bestehenden Produktflächen bewertet:
- Login mit beobachteten Profilen und Access Scopes
- `/consent` und Settings-Freigaben
- `/observer`, `/summary/[ownerId]`, `/learning/[ownerId]`
- Notfall-Karte und SOS-/Learning-Inhalte
- Eltern-Ping-Grundlage und Guardian-Ping-Service
- CarbTracker/KH-Rechner und AI-Fehlerzustände

Die Bewertung ist eine produktfachliche Simulation, kein realer Laufzeit-UAT.

## Interview 1 — Eltern/Carer

**Beobachtung in der Demo**
- Consent und Professional-Invite sind verständlicher geworden.
- Für Schule, Sport und Oma fehlt aber noch eine geführte Übergabe: Wer darf was sehen, wie lange, und was sollen diese Personen konkret tun?
- Eltern-Ping ist hilfreich, aber noch nicht als klarer Alltagskanal erkennbar.

**Zentrale Aussagen**
- "Ich will morgens sehen, ob Schule, Oma oder Trainer für heute vorbereitet sind."
- "Ich möchte nicht jedes Mal alles erklären müssen."
- "Wenn ich eine Freigabe gebe, muss klar sein, dass die Person keine medizinischen Entscheidungen treffen soll."

**Tickets**
- `CARE-01` Verantwortungsübersicht: aktive Übergaben, Empfänger, Zweck, Ablauf.
- `DAY-01` Alltagspakete für Schule/Sport/Übernachtung.
- `MSG-01A` sichere Kurzkommunikation mit Ping und strukturierten Hinweisen.

## Interview 2 — Kind/Jugendlicher

**Beobachtung in der Demo**
- `learning` ist sicher eingeschränkt, aber noch nicht stark genug als unauffällige Hilfe für Schule/Sport positioniert.
- Jugendliche brauchen mehr Kontrolle darüber, was andere sehen und wann Hilfe sichtbar wird.

**Zentrale Aussagen**
- "In der Schule soll es nicht peinlich aussehen."
- "Ich will selbst entscheiden, ob ich nur kurz ein OK sende."
- "Trainer brauchen klare Hilfe, aber nicht meine ganzen Werte."

**Tickets**
- `NET-04` Schule-/Trainer-Modus mit ruhiger, nicht-kindlicher Darstellung.
- `NET-05` Partner-/Geschwister-Pfad mit begrenzter Alltagshilfe.
- `MSG-01A` OK-/Brauche-Hilfe-Ping statt Freitext-Dosierung.

## Interview 3 — Oma / Betreuung

**Beobachtung in der Demo**
- Vollständige medizinische Flows sind für gelegentliche Betreuung zu schwer.
- `LEARNING_ONLY` ist ein guter Sicherheitsanker, braucht aber konkrete "Was mache ich jetzt?"-Karten.

**Zentrale Aussagen**
- "Ich brauche drei einfache Schritte, nicht viele Zahlen."
- "Ich möchte wissen, wann ich die Eltern anrufen soll."
- "Ich will nichts falsch machen können."

**Tickets**
- `NET-05` Großeltern-/Betreuungsmodus mit klaren Grenzen.
- `DAY-01` Notfall- und Tageskarten für konkrete Situationen.
- `TRU-02b` Safety-Texte für Nicht-Fachpersonen.

## Interview 4 — Schule / Trainer

**Beobachtung in der Demo**
- Schule/Gast-Lernen ohne Live-Zugriff ist richtig, aber der operative Schulalltag fehlt noch.
- Klassenfahrt, Sport und Krankheitstage brauchen vorbereitete Pakete statt generischer App-Navigation.

**Zentrale Aussagen**
- "Ich brauche eine Karte für den Tag, nicht die ganze App."
- "Beim Sport muss klar sein, wen ich anrufe und was ich vermeiden soll."
- "Für Klassenfahrt brauche ich vorher eine Freigabe und eine Checkliste."

**Tickets**
- `NET-04` Schule-/Trainer-Modus MVP.
- `DAY-01` Alltagspaket Sport/Schule als erster Slice.
- `OPS-17-01` Runtime-UAT vorbereiten, damit diese Flows wirklich demonstrierbar werden.

## Interview 5 — Diabetesberatung / Arzt

**Beobachtung in der Demo**
- Professional-Invite und Clinical View sind als Basis gut.
- Für Sprint 17 ist aber wichtiger, dass Alltagspersonen keine Dosierungsanweisungen bekommen oder versenden.

**Zentrale Aussagen**
- "Kommunikation darf nicht wie ärztliche Beratung aussehen."
- "Nicht-Fachpersonen sollen keine Insulindosen schicken."
- "Schule und Sport brauchen klare Eskalationsregeln."

**Tickets**
- `TRU-02b` Safety-Grenzen für Nachrichten und Vorschläge.
- `MSG-01A` strukturierte Kommunikation ohne konkrete IE-Werte.
- `NET-04` Rollenschnitt Schule/Trainer ohne Live-Medizinzugriff.

## Synthese

### Neue bzw. geschärfte Tickets

| ID | Titel | Kernaussage |
|----|-------|-------------|
| `OPS-17-01` | Runtime-/Docker-Abnahmefähigkeit | Ohne laufende Instanz bleiben Alltagsszenarien unbewiesen |
| `UAT-SS-01` | Supersprint-UAT nachholen | Consent-/Invite-/AI-Flows real prüfen |
| `NET-04` | Schule-/Trainer-Modus MVP | Keine Live-Daten, dafür klare Notfall- und Kontaktlogik |
| `NET-05` | Begleitpfade für Oma/Geschwister/Partner | Alltagshilfe ohne Admin-/Fachpersonenrechte |
| `MSG-01A` | Sichere Kurzkommunikation MVP | Ping, OK, Hilfe gebraucht, strukturierte Hinweise |
| `DAY-01` | Alltagspaket Sport/Schule | Checkliste, Kontakte, Notfallkarte, Freigabe |
| `CARE-01` | Carer-Verantwortungsübersicht | Wer ist vorbereitet, wer sieht was, was läuft ab |
| `TRU-02b` | Safety-Grenzen Kommunikation | Keine Dosierungsanweisungen, klare SOS-Eskalation |

### Priorisierungslogik

1. Runtime/UAT zuerst sichtbar halten, weil ohne laufende Instanz keine Alltagsszenarien abgenommen werden können.
2. Schule/Trainer und Großeltern sind höher priorisiert als Klinik/Diagnose, weil der Nutzer Sprint 17 ausdrücklich auf Alltag im Umfeld fokussiert hat.
3. Vollständiger Gruppenchat bleibt später, weil Safety, Haftung und Verschlüsselung zu groß für einen ersten Alltagsslice sind.

