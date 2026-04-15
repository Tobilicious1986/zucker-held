Für Frontend-Arbeit gelten weiterhin die Root-Regeln aus `../CLAUDE.md` und `../AGENTS.md`.

Die verbindlichen Branch- und Git-Regeln stehen zentral in `../BRANCHING.md` und dürfen hier nicht separat oder widersprüchlich neu definiert werden.

Für Frontend-Arbeit gilt zusätzlich verpflichtend:
- Änderungen an UI, Navigation, Verhalten oder App-Shell müssen immer gegen `../README.md`, `../ARCHITECTURE.md`, `../BACKLOG.md` und bei Bedarf `../COOKBOOK.md` geprüft und dort mit aktualisiert werden.
- Für jeden aktiven Sprint muss die laufende Datei `../SPRINT{N}.md` mitgeführt werden, damit Frontend-Fortschritt, offene Punkte und der letzte stabile Stand jederzeit sichtbar bleiben.
- Größere Frontend-Änderungen gelten erst als fertig, wenn auch die Architektur-/Doku-Sicht nachgezogen wurde.
- Vor Sprint-Abschluss oder PR muss bei größeren Frontend-Umbauten zusätzlich eine Architekten-Perspektive auf die Änderung schauen.
- Wenn Frontend-Arbeit parallel mit mehreren Agenten läuft, müssen Zuständigkeiten klar getrennt, Ergebnisse gegenseitig gegengeprüft und die Synchronisationen/Dailies in `../SPRINT{N}.md` protokolliert werden.
