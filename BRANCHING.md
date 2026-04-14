# Branch-Konzept für Codex und Claude

## Zweck
Diese Datei definiert die verbindlichen Git- und Branch-Regeln für `Codex` und `Claude` in diesem Repository.

Diese Regeln sind verpflichtend und gehen bei Branch-, Merge- und Push-Entscheidungen vor spontanen Ad-hoc-Workflows. Abweichungen sind nur erlaubt, wenn der Nutzer sie ausdrücklich anweist.

## Grundprinzip
- `main` ist der einzige kanonische Zielbranch.
- `main` ist für `Codex` und `Claude` read-only.
- Direkte Commits auf `main` sind verboten.
- Direkte Pushes auf `main` sind verboten.
- Änderungen werden immer auf einem isolierten Arbeitsbranch erstellt.
- Der Standardweg nach `main` ist ein Pull Request.
- Für den finalen Merge nach `main` wird bevorzugt `Squash` oder `Rebase` verwendet.
- Ungeprüfte Merge-Commit-Ketten aus Arbeitsbranches sollen nicht in `main` landen.

## Branch-Erstellung
- Jeder neue Arbeitsauftrag startet von aktuellem `main`.
- Vor der Arbeit ist `origin/main` zu prüfen und der Arbeitsbranch davon abzuleiten.
- `Codex` arbeitet auf Branches im Schema `codex/<kurzer-zweck>`.
- `Claude` arbeitet auf Branches im Schema `claude/<kurzer-zweck>`.
- Der Branch-Name soll kurz, eindeutig und thematisch sein.
- Pro Aufgabe oder Sprint wird genau ein führender Arbeitsbranch verwendet.

## Zusammenarbeit zwischen Agenten
- Kein Agent arbeitet ungefragt auf dem Branch des anderen Agenten weiter.
- Ein Wechsel auf den Branch des anderen Agenten ist nur erlaubt, wenn der Nutzer das ausdrücklich verlangt.
- Kein Agent erstellt ungefragt neue Integrations-, Release- oder Sammelbranches.
- Temporäre Integrationsbranches sind nur erlaubt, wenn der Nutzer ausdrücklich eine Branch-Konsolidierung oder ein Release-Bündel beauftragt.

## Pflicht-Checks vor Arbeitsbeginn
Vor jeder Git-Arbeit müssen `Codex` und `Claude` diese Punkte prüfen:
- aktueller Branch
- sauberer oder bewusst schmutziger Worktree
- aktueller Stand von `origin/main`
- ob bereits ein führender Arbeitsbranch für die Aufgabe existiert

Wenn der Worktree unerwartet schmutzig ist, darf der Agent nicht blind weiterarbeiten. Er muss den Zustand zuerst einordnen und mit den bestehenden Änderungen kompatibel arbeiten.

## Pflicht-Checks vor Commit und Push
Vor jedem Commit und vor jedem Push müssen `Codex` und `Claude` prüfen:
- keine Build-Artefakte
- keine `node_modules`
- keine versehentlichen lokalen Tooling-Dateien
- keine Dubletten wie `* 2.*`, `* 3.*`, `* 4.*`
- keine versehentlichen Integrationsreste oder Sammelartefakte
- nur fachlich gewollte Änderungen im Diff

Wenn solche Artefakte vorhanden sind, müssen sie vor dem Push bereinigt oder in `_deleted/` verschoben werden, sofern sie nicht bewusst versioniert werden sollen.

## PR-Regeln
- Der Standardweg nach `main` ist immer ein Pull Request.
- Ein Arbeitsbranch wird erst nach Review oder bewusster Freigabe nach `main` übernommen.
- Der PR muss den führenden Arbeitsbranch klar benennen.
- Der PR darf keine versehentlichen Artefakte, Dubletten oder lokale Hilfsdateien enthalten.
- Falls mehrere Branches dieselbe Arbeit enthalten, muss vor dem PR ein führender Branch festgelegt werden.

## Recovery bei falschem Branch oder falschem PR
Wenn ein falscher Branch oder ein falscher PR verwendet wurde, gilt immer derselbe Ablauf:
1. Nicht panisch weiterarbeiten.
2. Den führenden Branch mit dem fachlich richtigen Stand identifizieren.
3. Einen sauberen Zielbranch festlegen.
4. Ab diesem Punkt nur noch den führenden Branch weiterführen.
5. Alte Integrations-, Test- oder Fehlbranches nach der Stabilisierung löschen oder archivieren.
6. Die Branch-Landschaft lokal und remote bereinigen.

## Nach erfolgreichem Merge nach `main`
- Arbeitsbranch löschen oder bewusst als kurzfristigen Fallback behalten.
- Veraltete Remote-Referenzen mit `prune` bereinigen.
- Lokale Alt-Branches aufräumen.
- Prüfen, dass `main` lokal und remote auf dem erwarteten Stand ist.

## Verbindlichkeit
- Diese Datei ist für `Codex` und `Claude` verpflichtend.
- Bei Konflikten zwischen spontanem Workflow und dieser Datei gilt diese Datei.
- Abweichungen sind nur mit expliziter Nutzeranweisung erlaubt.
