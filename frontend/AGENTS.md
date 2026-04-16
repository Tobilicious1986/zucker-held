<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Für Frontend-Arbeit gelten zusätzlich die Root-Regeln aus `../CLAUDE.md`, `../AGENTS.md` und `../BRANCHING.md`.
Die agentenübergreifende Sprint- und Daily-Logik steht ergänzend in `../AGENT_WORKFLOW.md`.
Wenn mehrere Frontend-Arbeitspakete parallel laufen, sind Dailies, Cross-Reviews und die laufende Protokollierung in `../SPRINT{N}.md` verpflichtend.
Diese Dailies sind ein Challenge-Loop: Annahmen, UI-Brüche, Accessibility-Risiken und Mobile-Fallen werden vor Abschluss aktiv von einem zweiten Agenten hinterfragt.
`../SPRINT{N}.md` ist das gemeinsame Lagebild für parallele Frontend-Stränge, letzte Zwischenstände und offene Blocker.
Auch reine Frontend-Sprints folgen verpflichtend der Sprintkadenz mit `3` Zyklen, optionalem 4. Abschlusszyklus, Sprintabschluss und Retrospektive.
Auch in Frontend-Sprints sollen nach Möglichkeit mindestens `5` Rollen im Agententeam mitdenken: Entwicklung, Architektur, UI/UX, Test/QA und DevOps/Runtime; bei Bedarf zusätzlich Key-User, Stakeholder und medizinische Fachperspektive.

## Testintegrität — ABSOLUTES VERBOT von fiktiven Testergebnissen

**Tests, UAT-Szenarien, Checklisten und Statusangaben dürfen ausschließlich dann als erfolgreich, bestanden oder ✅ markiert werden, wenn sie tatsächlich ausgeführt wurden und das Ergebnis real nachweisbar ist.**

- Ein Frontend-Build (`npm run build`) ohne Laufzeitprüfung zählt nicht als Funktionstest — er prüft nur TypeScript-Kompilierung.
- UAT-Szenarien in `UAT_SPRINT_{N}.md` dürfen nur ✅ erhalten, wenn das Szenario manuell im Browser oder per automatisiertem Test wirklich durchgespielt wurde.
- Routing, API-Calls, UI-Rendering und Zugriffsschutz gelten nicht als getestet, solange kein laufender Server geprüft wurde.
- Simulierte oder vorweggenommene Abhaklisten sind verboten. Jeder ✅ muss auf einer real durchgeführten Aktion basieren.
- Nicht durchgeführte Tests erhalten den Status `⏳ ausstehend` oder `❌ nicht getestet`.
- Nicht testbare Teile müssen mit Begründung und Nachholplan in `../SPRINT{N}.md` dokumentiert werden.
- Diese Regel hat die gleiche Verbindlichkeit wie die Branching-Regeln und gilt ohne Ausnahme.
