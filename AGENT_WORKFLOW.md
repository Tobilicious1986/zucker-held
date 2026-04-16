# Agent Workflow — Claude, Codex und Spezialisten

## Zweck
Dieses Dokument definiert die gemeinsame Arbeitslogik fuer `Claude`, `Codex` und alle parallel eingesetzten Spezialisten- oder Sub-Agents.

Es gilt KI-uebergreifend und ergaenzt `BRANCHING.md`, `CLAUDE.md`, `AGENTS.md` sowie die laufende Sprint-Datei `SPRINT{N}.md`.

## Grundprinzip
- Es gibt immer einen fuehrenden Agenten.
- Der fuehrende Agent verantwortet Scope, Priorisierung, Zusammenfuehrung, Cross-Review, Sprintlog und Abschluss.
- Weitere Agenten duerfen parallel arbeiten, wenn die Arbeitspakete sauber trennbar sind.
- Jeder parallele Strang braucht einen klaren Owner und mindestens einen Gegenpruefer.
- Standard fuer echte Sprintarbeit ist ein Team aus **mindestens 5 Agentenrollen**, auch wenn nicht alle permanent implementieren:
  - fuehrender Entwicklungsagent
  - Architektur-/Systemagent
  - UI/UX-Agent
  - Test-/QA-Agent
  - DevOps-/Runtime-Agent
- Je nach Sprintthema sollen zusaetzlich Fachrollen zugeschaltet werden, z. B.:
  - Security
  - medizinische Fachperspektive
  - Arzt / Diabetologe / Diabetesberatung
  - Key-User- oder Stakeholder-Perspektive

## Sprintlogik
- Jeder Sprint durchlaeuft standardmaessig **`3` Zyklen**.
- Wenn ein Sprint fuer einen sauberen Abschluss mehr Raum braucht, ist **ein optionaler Zyklus `4`** erlaubt.
- Jeder Zyklus hat mindestens:
  - Ziel fuer den Zyklus
  - Umsetzung
  - Daily/Synchronisation
  - Challenge-Loop durch einen zweiten Agenten oder Spezialisten
  - Eintrag in `SPRINT{N}.md`
- Damit hat jeder Sprint verpflichtend mindestens `3` Dailies, mit optionalem vierten Daily.
- Nach dem letzten regulaeren Zyklus folgen verpflichtend:
  - Sprintabschluss / Review / Abnahmevorbereitung
  - Retrospektive mit konkreten Verbesserungen fuer den naechsten Sprint
- Sprintreviews muessen immer Rueckmeldungen von **Key-Usern**, **UI/UX-Perspektive** und **Test/QA** enthalten.

## Dailies und Challenge-Loop
- Dailies sind keine reinen Statusmeldungen.
- In jedem Daily muessen Annahmen, Risiken, UX-Brueche, Security-Fragen, Architekturfolgen oder Testluecken aktiv hinterfragt werden.
- Ergebnisse aus Dailies werden in `SPRINT{N}.md` dokumentiert.
- Wenn ein Agent alleine implementiert, muss fuer Daily und Challenge trotzdem mindestens ein zweiter Agent oder Spezialisten-Agent hinzugezogen werden.
- Wenn moeglich, wird in jedem Sprintzyklus mindestens eine echte Nutzenden- oder Key-User-Perspektive hinzugezogen oder simuliert gegengeprueft.
- Testdaten und Testumgebungen gehoeren zur Sprintlogik dazu: neue sensible Flows sollen nicht nur gedanklich, sondern mit belastbaren Demo-/Testdaten nachvollziehbar sein.

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
- Sprintreview und Abnahme sollen nach Moeglichkeit auf der **laufenden Instanz** stattfinden, nicht nur per Code-Review.

## Betriebs-Skripte
- Fuer lokale Start-/Stop-Ablaufe sollen wenn moeglich zentrale Skripte verwendet werden.
- Standard in diesem Repository:
  - `scripts/start-local-stack.sh`
  - `scripts/stop-local-stack.sh`
- Nutzung, Ergebnisse und Restprobleme gehoeren in `SPRINT{N}.md`, wenn sie sprintrelevant sind.

## Testintegritaet — ABSOLUTES VERBOT von fiktiven Testergebnissen

**Tests, UAT-Szenarien, Checklisten und Statusangaben duerfen ausschliesslich dann als erfolgreich, bestanden oder als ✅ markiert werden, wenn sie tatsaechlich ausgefuehrt wurden und das Ergebnis real nachweisbar ist.**

- Unit-Tests gelten als bestanden, wenn der Testrunner (`mvn test`, `npm test` o.ae.) sie tatsaechlich ausgefuehrt und gruen gemeldet hat.
- UAT-Szenarien duerfen nur dann mit ✅ versehen werden, wenn sie manuell oder automatisiert wirklich durchgespielt wurden.
- Frontend-Verhalten (Routing, API-Calls, UI-Rendering) gilt nicht als getestet, nur weil der Build sauber durchlaeuft — der Build prueft nur Kompilierung, nicht Laufzeitverhalten.
- Simulierte Reviews, hypothetische Cross-Reviews oder vorweggenommene Abhaklisten sind verboten. Jeder ✅ muss auf einer real durchgefuehrten Aktion basieren.
- Wenn ein Test oder UAT-Szenario noch nicht durchgefuehrt wurde, lautet der Status `⏳ ausstehend` oder `❌ nicht getestet` — niemals ein vorweggenommenes ✅.
- Wenn Teile eines Sprints nicht testbar sind, muss das mit Begruendung und Nachholplan in `SPRINT{N}.md` vermerkt werden.
- Dieses Verbot gilt fuer alle Agenten ohne Ausnahme und hat die gleiche Verbindlichkeit wie die Branching-Regeln.
