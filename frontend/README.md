# Frontend

Dieses Verzeichnis enthält das Next.js-Frontend von Zucker-Held.

## Start
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Hinweise
- Die allgemeine Produkt- und Betriebsdoku steht im Root und unter `../docs/project/`:
  - `../README.md`
  - `../docs/project/ARCHITECTURE.md`
  - `../docs/project/COOKBOOK.md`
  - `../docs/project/REVIEW.md`
- Branch- und Git-Regeln stehen in `../docs/agents/BRANCHING.md`.
- Der Turbopack-Root ist explizit in `next.config.ts` gesetzt, damit Workspace-/Lockfile-Konflikte den Build nicht verfälschen.
- Der Food-Flow liegt primär in:
  - `src/app/(app)/calc/page.tsx`
  - `src/app/(app)/meal/page.tsx`
  - `src/lib/food-utils.ts`
- Externe Food-Abfragen laufen nicht direkt im Browser, sondern same-origin über die Next-Rewrites auf `/api/*`.
