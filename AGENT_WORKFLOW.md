# Agent Workflow — Claude, Codex und Spezialisten

## Zweck
Dieses Dokument definiert die gemeinsame Arbeitslogik fuer `Claude`, `Codex` und alle parallel eingesetzten Spezialisten- oder Sub-Agents.

Es gilt KI-uebergreifend und ergaenzt `BRANCHING.md`, `CLAUDE.md`, `AGENTS.md` sowie die laufende Sprint-Datei `SPRINT{N}.md`.

## Grundprinzip
- Es gibt immer einen fuehrenden Agenten.
- Der fuehrende Agent verantwortet Scope, Priorisierung, Zusammenfuehrung, Cross-Review, Sprintlog und Abschluss.
- Weitere Agenten duerfen parallel arbeiten, wenn die Arbeitspakete sauber trennbar sind.
- Jeder parallele Strang braucht einen klaren Owner und mindestens einen Gegenpruefer.

## Sprintlogik
- Jeder Sprint durchlaeuft verpflichtend `10` Zyklen.
- Jeder Zyklus hat mindestens:
  - Ziel fuer den Zyklus
  - Umsetzung
  - Daily/Synchronisation
  - Challenge-Loop durch einen zweiten Agenten oder Spezialisten
  - Eintrag in `SPRINT{N}.md`
- Damit hat jeder Sprint verpflichtend `10` Dailies.
- Nach Zyklus `10` folgen verpflichtend:
  - Sprintabschluss / Review / Abnahmevorbereitung
  - Retrospektive mit konkreten Verbesserungen fuer den naechsten Sprint

## Dailies und Challenge-Loop
- Dailies sind keine reinen Statusmeldungen.
- In jedem Daily muessen Annahmen, Risiken, UX-Brueche, Security-Fragen, Architekturfolgen oder Testluecken aktiv hinterfragt werden.
- Ergebnisse aus Dailies werden in `SPRINT{N}.md` dokumentiert.
- Wenn ein Agent alleine implementiert, muss fuer Daily und Challenge trotzdem mindestens ein zweiter Agent oder Spezialisten-Agent hinzugezogen werden.

## Cross-Reviews
- Parallele Arbeit gilt erst als fertig, wenn die beteiligten Agenten sich gegenseitig kontrolliert und challengt haben.
- Cross-Reviews muessen in `SPRINT{N}.md` sichtbar sein:
  - wer hat was gebaut
  - wer hat gegengeprueft
  - welche Risiken wurden gefunden
  - welche Nachschaerfungen wurden gemacht

## Lernen aus Retros
- Jede Retrospektive muss mindestens festhalten:
  - Was hat gut funktioniert?
  - Was hat uns verlangsamt oder Risiken erzeugt?
  - Welche Regeln, Checks oder Doku muessen angepasst werden?
  - Welche Verbesserungen gehen verbindlich in den naechsten Sprint ueber?
- Wenn aus einer Retro dauerhafte Regeln entstehen, muessen die betroffenen Doku-Dateien aktualisiert werden.
- `SPRINT{N}.md` ist das Kurzzeitgedaechtnis des Sprints, die Retrospektive ist das Lernsystem fuer spaetere Sprints.

## Commits unter Agentennamen
- Agenten duerfen eigene Commits unter ihrem Namen vorbereiten.
- Standard fuer agentenspezifische Commits ist ein klarer Commit-Titel wie:
  - `agent(James): backend privacy hub foundation`
  - `agent(Mencius): frontend consent hub ui`
- Alternativ koennen Agentennamen im Commit-Text oder via `Co-authored-by` sichtbar gemacht werden.
- Der fuehrende Agent bleibt trotz agentenspezifischer Commits fuer den Gesamtzustand verantwortlich.

## Laufende Instanz als Abschlusskriterium
- Wenn es technisch moeglich ist, pruefen die Agenten am Sprintende gemeinsam die laufende Instanz.
- Mindestziel fuer einen betriebsnahen Abschluss:
  - Docker laeuft
  - Backend laeuft
  - Frontend laeuft
  - Anmeldung / Login funktioniert
- Wenn moeglich, soll mindestens ein Agent den technischen Start pruefen und ein anderer Agent die UI-/Login-Pfade challengen.

## Betriebs-Skripte
- Fuer lokale Start-/Stop-Ablaufe sollen wenn moeglich zentrale Skripte verwendet werden.
- Standard in diesem Repository:
  - `scripts/start-local-stack.sh`
  - `scripts/stop-local-stack.sh`
- Nutzung, Ergebnisse und Restprobleme gehoeren in `SPRINT{N}.md`, wenn sie sprintrelevant sind.
