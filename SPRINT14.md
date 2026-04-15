# Sprint 14 — Einladung, Einwilligung, DSGVO, Safety

> Status: gestartet  
> Branch: `codex/sprint-14-einladung-dsgvo-safety`  
> Startdatum: 2026-04-15

## Zielbild
Sprint 14 baut das Fundament für:
- Haushalts-/Begleitmodell mit klarer Rollentrennung
- Einwilligungen und Freigaben mit Zweck, Sichtbarkeit und Laufzeit
- DSGVO-Basisfunktionen (Export, Löschung, Widerruf)
- Safety-Regeln für Nachrichten, Hinweise und Notfallpfade

## Ausgangslage beim Sprint-Start
- Sprint-14-Branch wurde regelkonform als `codex/...` neu angelegt.
- Die strategische Roadmap und das Nutzendenkonzept wurden in `BACKLOG.md`, `README.md`, `ARCHITECTURE.md` und `PRODUCT_STRATEGY.md` verankert.
- Der finale Sprint-13-Stand wurde auf diesen Branch übernommen, damit Sprint 14 nicht auf veraltetem `main` startet.

## Bereits erledigt
- Strategische Produkt-Richtung für Familien-first, T1D-first und Klinik-Empfehlung dokumentiert
- neue Epics `EDU`, `NET`, `CLN`, `TRU`, `GTM` ins Backlog aufgenommen
- `PRODUCT_STRATEGY.md` als separates Leitdokument angelegt
- Sprint-13-Basis in den Sprint-14-Branch übernommen
- Pflicht zur laufenden Sprint-Dokumentation in die Anweisungsdokumente aufgenommen
- Pflicht zur koordinierten Parallelisierung mit Dailies, Cross-Reviews und Challenge-Loop in die Anweisungsdokumente aufgenommen

## In Arbeit
- Analyse der vorhandenen Invite-, Share-, Rollen- und Settings-Strukturen
- Identifikation des ersten umsetzbaren Sprint-14-Slices für Einwilligung, Rollen und DSGVO

## Arbeitsmodus
- Führender Agent: `Codex`
- Parallelisierung ist für Sprint 14 ausdrücklich erlaubt, wenn Arbeitspakete sauber trennbar sind.
- Bei paralleler Arbeit werden Zuständigkeiten, letzte Dailies, Cross-Reviews und offene Challenges hier im Sprintprotokoll mitgeführt.

## Nächste Schritte
1. vorhandene Backend-/Frontend-Flächen für `ProfileLink`, `Share`, `Settings`, `Auth`, `Export` und Löschen zusammentragen
2. erstes Sprint-14-Fundament schneiden:
   - Rollen-/Beziehungskonzept in der bestehenden Domäne
   - Einwilligungs-/Freigabeobjekt
   - sichtbare Widerrufs- und DSGVO-Basis
3. Umsetzung in kleinen, abnahmefähigen Schritten mit laufender Protokollpflege

## Offene Risiken / Entscheidungen
- Sprint 14 baut auf dem gemergten Sprint-13-Zielbild, aber PR #13 ist zum Start noch nicht in `main`
- Legacy-PWA und Full-Stack-Teile koexistieren; neue Rechte-/Einwilligungslogik muss sauber eingeordnet werden
- professionelle Rollen und Schule/Gastrollen sollen vorbereitet, aber nicht übereilt als halbfertige Vollfunktion ausgeliefert werden

## Letzter stabiler Git-Stand
- Strategie-Commit Sprint 14: `85f52bb`
- übernommener Sprint-13-Commit auf diesem Branch: `76af87c`
