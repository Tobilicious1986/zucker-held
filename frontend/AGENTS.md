<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Für Frontend-Arbeit gelten zusätzlich die Root-Regeln aus `../CLAUDE.md`, `../AGENTS.md` und `../BRANCHING.md`.
Die agentenübergreifende Sprint- und Daily-Logik steht ergänzend in `../AGENT_WORKFLOW.md`.
Wenn mehrere Frontend-Arbeitspakete parallel laufen, sind Dailies, Cross-Reviews und die laufende Protokollierung in `../SPRINT{N}.md` verpflichtend.
Diese Dailies sind ein Challenge-Loop: Annahmen, UI-Brüche, Accessibility-Risiken und Mobile-Fallen werden vor Abschluss aktiv von einem zweiten Agenten hinterfragt.
`../SPRINT{N}.md` ist das gemeinsame Lagebild für parallele Frontend-Stränge, letzte Zwischenstände und offene Blocker.
Auch reine Frontend-Sprints folgen verpflichtend der Sprintkadenz mit `10` Zyklen, `10` Dailies, Sprintabschluss und Retrospektive.
