Für Frontend-Arbeit gelten weiterhin die Root-Regeln aus `../CLAUDE.md` und `../AGENTS.md`.
Die agentenübergreifende Sprint- und Daily-Logik steht ergänzend in `../AGENT_WORKFLOW.md`.

Die verbindlichen Branch- und Git-Regeln stehen zentral in `../BRANCHING.md` und dürfen hier nicht separat oder widersprüchlich neu definiert werden.

Für Frontend-Arbeit gilt zusätzlich verpflichtend:
- Änderungen an UI, Navigation, Verhalten oder App-Shell müssen immer gegen `../README.md`, `../ARCHITECTURE.md`, `../BACKLOG.md` und bei Bedarf `../COOKBOOK.md` geprüft und dort mit aktualisiert werden.
- Für jeden aktiven Sprint muss die laufende Datei `../SPRINT{N}.md` mitgeführt werden, damit Frontend-Fortschritt, offene Punkte und der letzte stabile Stand jederzeit sichtbar bleiben.
- Größere Frontend-Änderungen gelten erst als fertig, wenn auch die Architektur-/Doku-Sicht nachgezogen wurde.
- Vor Sprint-Abschluss oder PR muss bei größeren Frontend-Umbauten zusätzlich eine Architekten-Perspektive auf die Änderung schauen.
- Wenn Frontend-Arbeit parallel mit mehreren Agenten läuft, müssen Zuständigkeiten klar getrennt, Ergebnisse gegenseitig gegengeprüft und die Synchronisationen/Dailies in `../SPRINT{N}.md` protokolliert werden.
- Diese Dailies sind auch ein Challenge-Fenster: Annahmen, UI-Brüche, Accessibility-Risiken und Mobile-Fallen sollen aktiv von einem zweiten Agenten hinterfragt werden.
- `../SPRINT{N}.md` ist dabei das gemeinsame Lagebild für parallele Frontend-Stränge, Cross-Reviews und den letzten stabilen Stand.
- Auch reine Frontend-Sprints folgen verpflichtend der Sprintkadenz mit `3` Zyklen, optionalem 4. Abschlusszyklus, Sprintabschluss und Retrospektive.
- Auch in Frontend-Sprints sollen nach Möglichkeit mindestens `5` Rollen im Agententeam mitdenken: Entwicklung, Architektur, UI/UX, Test/QA und DevOps/Runtime; bei Bedarf zusätzlich Key-User, Stakeholder und medizinische Fachperspektive.

## Testintegrität — ABSOLUTES VERBOT von fiktiven Testergebnissen

**Tests, UAT-Szenarien, Checklisten und Statusangaben dürfen ausschließlich dann als erfolgreich, bestanden oder ✅ markiert werden, wenn sie tatsächlich ausgeführt wurden und das Ergebnis real nachweisbar ist.**

- `npm run build` zählt nicht als Laufzeitprüfung — er prüft nur TypeScript-Kompilierung, nicht Routing, API-Calls oder UI-Rendering.
- UAT-Szenarien erhalten ✅ nur nach echtem manuellem oder automatisiertem Test im Browser/Preview.
- Nicht durchgeführte Tests erhalten `⏳ ausstehend` oder `❌ nicht getestet` — niemals ein vorweggenommenes ✅.
- Nicht testbare Abschnitte müssen mit Begründung und Nachholplan in `../SPRINT{N}.md` stehen.
- Diese Regel gilt ohne Ausnahme und hat dieselbe Verbindlichkeit wie die Branching-Regeln.
